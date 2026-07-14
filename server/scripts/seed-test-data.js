// Populates 5 retailers + 5 wholesalers (mix of verified/unverified) spread
// across a few nearby cities, plus inventory listings for each wholesaler,
// so search/distance-sorting/verification-filtering/chat can all be
// exercised with real data. Idempotent: safe to run more than once.
//
// Usage: DATABASE_URL="postgresql://..." node scripts/seed-test-data.js

const bcrypt = require("bcrypt");
const { Pool } = require("pg");

const { DATABASE_URL } = process.env;
const TEST_PASSWORD = "TestPass123!";

if (!DATABASE_URL) {
  console.error("Set DATABASE_URL before running this script.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 8000,
});

const RETAILERS = [
  { email: "sunrise.pharmacy@test.medilink.com", businessName: "Sunrise Pharmacy", contactName: "Anita Rao", city: "Delhi", state: "Delhi", lat: 28.62, lng: 77.21 },
  { email: "wellness.chemist@test.medilink.com", businessName: "Wellness Chemist", contactName: "Rohit Sharma", city: "Delhi", state: "Delhi", lat: 28.65, lng: 77.23 },
  { email: "citycare.pharmacy@test.medilink.com", businessName: "City Care Pharmacy", contactName: "Priya Nair", city: "Delhi", state: "Delhi", lat: 28.58, lng: 77.19 },
  { email: "healthfirst.medicos@test.medilink.com", businessName: "HealthFirst Medicos", contactName: "Sanjay Gupta", city: "Gurgaon", state: "Haryana", lat: 28.45, lng: 77.03 },
  { email: "apollo.corner@test.medilink.com", businessName: "Apollo Corner Store", contactName: "Meena Iyer", city: "Noida", state: "Uttar Pradesh", lat: 28.57, lng: 77.32 },
];

const WHOLESALERS = [
  { email: "medsupply.distributors@test.medilink.com", businessName: "MedSupply Distributors", contactName: "Vikram Singh", city: "Delhi", state: "Delhi", lat: 28.63, lng: 77.22, verified: true, deliveryAvailable: true, deliveryRadiusKm: 20 },
  { email: "pharmacore.wholesale@test.medilink.com", businessName: "PharmaCore Wholesale", contactName: "Neha Kapoor", city: "Delhi", state: "Delhi", lat: 28.6, lng: 77.18, verified: true, deliveryAvailable: true, deliveryRadiusKm: 30 },
  { email: "nationaldrug.house@test.medilink.com", businessName: "National Drug House", contactName: "Arjun Malhotra", city: "Gurgaon", state: "Haryana", lat: 28.47, lng: 77.05, verified: false, deliveryAvailable: false, deliveryRadiusKm: 0 },
  { email: "metromedi.traders@test.medilink.com", businessName: "Metro Medi Traders", contactName: "Divya Menon", city: "Noida", state: "Uttar Pradesh", lat: 28.56, lng: 77.3, verified: true, deliveryAvailable: true, deliveryRadiusKm: 25 },
  { email: "capitalpharma.supplies@test.medilink.com", businessName: "Capital Pharma Supplies", contactName: "Karan Bhatia", city: "Delhi", state: "Delhi", lat: 28.7, lng: 77.15, verified: false, deliveryAvailable: true, deliveryRadiusKm: 15 },
];

async function upsertUser(client, { email, role }) {
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);
  const result = await client.query(
    `INSERT INTO users (email, password_hash, role)
     VALUES ($1, $2, $3)
     ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
     RETURNING id`,
    [email, passwordHash, role]
  );
  return result.rows[0].id;
}

async function upsertProfile(client, userId, p, extra) {
  await client.query(
    `INSERT INTO business_profiles (
       user_id, business_name, contact_name, drug_license, phone, address, city, state,
       latitude, longitude, delivery_available, delivery_radius_km
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     ON CONFLICT (user_id) DO UPDATE SET
       business_name = EXCLUDED.business_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude`,
    [
      userId,
      p.businessName,
      p.contactName,
      `TEST-LIC-${userId.slice(0, 8)}`,
      "9000000000",
      `12 ${p.city} Main Road`,
      p.city,
      p.state,
      p.lat,
      p.lng,
      extra?.deliveryAvailable || false,
      extra?.deliveryRadiusKm || 0,
    ]
  );
}

(async () => {
  let client;
  try {
    client = await pool.connect();

    const medicines = await client.query("SELECT id FROM medicines");
    if (medicines.rows.length === 0) {
      console.error("No medicines found — run 004_medicines.sql first.");
      process.exit(1);
    }
    const medicineIds = medicines.rows.map((r) => r.id);

    console.log("Seeding retailers...");
    for (const r of RETAILERS) {
      const userId = await upsertUser(client, { email: r.email, role: "RETAILER" });
      await upsertProfile(client, userId, r);
      await client.query("UPDATE users SET verified = TRUE WHERE id = $1", [userId]);
    }

    console.log("Seeding wholesalers + inventory...");
    for (const w of WHOLESALERS) {
      const userId = await upsertUser(client, { email: w.email, role: "WHOLESALER" });
      await upsertProfile(client, userId, w, w);
      await client.query("UPDATE users SET verified = $1 WHERE id = $2", [w.verified, userId]);

      const stockCount = 4 + Math.floor(Math.random() * 3);
      const shuffled = [...medicineIds].sort(() => Math.random() - 0.5).slice(0, stockCount);
      for (const medicineId of shuffled) {
        const price = (20 + Math.random() * 180).toFixed(2);
        const quantity = 10 + Math.floor(Math.random() * 190);
        await client.query(
          `INSERT INTO inventory (wholesaler_id, medicine_id, price, quantity, last_updated)
           VALUES ($1, $2, $3, $4, NOW())
           ON CONFLICT (wholesaler_id, medicine_id)
           DO UPDATE SET price = EXCLUDED.price, quantity = EXCLUDED.quantity, last_updated = NOW()`,
          [userId, medicineId, price, quantity]
        );
      }
    }

    console.log(`\nDone. All test accounts use the password: ${TEST_PASSWORD}`);
    console.log("Retailers:", RETAILERS.map((r) => r.email).join(", "));
    console.log("Wholesalers:", WHOLESALERS.map((w) => w.email).join(", "));
  } catch (err) {
    console.error("FAILED:", err.message);
    console.error(err);
    process.exitCode = 1;
  } finally {
    if (client) client.release();
    await pool.end();
  }
})();
