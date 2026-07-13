const bcrypt = require("bcrypt");
const pool = require("../config/db");
const { signToken } = require("../utils/jwt");
const { capture } = require("../config/posthog");

const SALT_ROUNDS = 10;

const REQUIRED_PROFILE_FIELDS = [
  "businessName",
  "drugLicense",
  "phone",
  "address",
  "city",
  "state",
];

function toUserResponse(user) {
  return { id: user.id, email: user.email, role: user.role, verified: user.verified };
}

async function signup(req, res) {
  const {
    email,
    password,
    role,
    businessName,
    contactName,
    drugLicense,
    gstNumber,
    phone,
    address,
    city,
    state,
    pincode,
    latitude,
    longitude,
    businessHours,
    deliveryAvailable,
    deliveryRadiusKm,
  } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ success: false, error: "email, password and role are required" });
  }

  if (!["RETAILER", "WHOLESALER"].includes(role)) {
    return res.status(400).json({ success: false, error: "role must be RETAILER or WHOLESALER" });
  }

  const missing = REQUIRED_PROFILE_FIELDS.filter((field) => !req.body[field]);
  if (missing.length > 0) {
    return res.status(400).json({ success: false, error: `Missing required fields: ${missing.join(", ")}` });
  }

  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, role)
       VALUES ($1, $2, $3)
       RETURNING id, email, role, verified`,
      [email, passwordHash, role]
    );
    const user = userResult.rows[0];

    await client.query(
      `INSERT INTO business_profiles (
         user_id, business_name, contact_name, drug_license, gst_number, phone,
         address, city, state, pincode, latitude, longitude, business_hours,
         delivery_available, delivery_radius_km
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        user.id,
        businessName,
        contactName || null,
        drugLicense,
        gstNumber || null,
        phone,
        address,
        city,
        state,
        pincode || null,
        latitude || null,
        longitude || null,
        businessHours || null,
        Boolean(deliveryAvailable),
        deliveryRadiusKm || 0,
      ]
    );

    await client.query("COMMIT");

    const token = signToken({ userId: user.id, role: user.role });

    capture({
      distinctId: user.id,
      event: "signup_completed",
      properties: { role: user.role, city, state },
    });

    return res.status(201).json({ success: true, token, user: toUserResponse(user) });
  } catch (err) {
    if (client) await client.query("ROLLBACK").catch(() => {});

    if (err.code === "23505") {
      const field = err.constraint?.includes("email") ? "email" : "drug license";
      return res.status(409).json({ success: false, error: `An account with this ${field} already exists` });
    }

    console.error(err);
    return res.status(500).json({ success: false, error: "Failed to create account. Please try again shortly." });
  } finally {
    if (client) client.release();
  }
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: "email and password are required" });
  }

  try {
    const result = await pool.query(
      "SELECT id, email, password_hash, role, verified FROM users WHERE email = $1",
      [email]
    );
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ success: false, error: "Incorrect email or password" });
    }

    const token = signToken({ userId: user.id, role: user.role });

    capture({
      distinctId: user.id,
      event: "login",
      properties: { role: user.role },
    });

    return res.json({ success: true, token, user: toUserResponse(user) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: "Failed to log in" });
  }
}

async function me(req, res) {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.role, u.verified, b.business_name, b.city, b.state, b.average_rating
       FROM users u
       LEFT JOIN business_profiles b ON b.user_id = u.id
       WHERE u.id = $1`,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    return res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: "Failed to fetch profile" });
  }
}

module.exports = { signup, login, me };
