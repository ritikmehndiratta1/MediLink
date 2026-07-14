// Public signup only allows RETAILER/WHOLESALER by design, so admin accounts
// are created out-of-band with this script. Run wherever DATABASE_URL is
// reachable (not from a sandboxed session) with your own chosen credentials:
//
//   ADMIN_EMAIL="you@example.com" ADMIN_PASSWORD="choose-a-strong-password" \
//     DATABASE_URL="postgresql://..." node scripts/create-admin.js

const bcrypt = require("bcrypt");
const { Pool } = require("pg");

const { ADMIN_EMAIL, ADMIN_PASSWORD, DATABASE_URL } = process.env;

if (!DATABASE_URL || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("Set DATABASE_URL, ADMIN_EMAIL and ADMIN_PASSWORD before running this script.");
  process.exit(1);
}

if (ADMIN_PASSWORD.length < 8) {
  console.error("ADMIN_PASSWORD must be at least 8 characters.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 8000,
});

(async () => {
  let client;
  try {
    client = await pool.connect();
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    const result = await client.query(
      `INSERT INTO users (email, password_hash, role, verified)
       VALUES ($1, $2, 'ADMIN', TRUE)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'ADMIN', verified = TRUE
       RETURNING id, email, role`,
      [ADMIN_EMAIL, passwordHash]
    );

    console.log("Admin account ready:", result.rows[0]);
    console.log("Log in at /login with the email and password you set.");
  } catch (err) {
    console.error("FAILED:", err.message);
    process.exitCode = 1;
  } finally {
    if (client) client.release();
    await pool.end();
  }
})();
