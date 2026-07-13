// Standalone connectivity test — run this wherever DATABASE_URL is actually
// reachable (your machine, or Render's shell), NOT from a sandboxed session.
//
// Usage:
//   DATABASE_URL="postgresql://..." node scripts/test-db-connection.js
//
// Inserts one dummy retailer and one dummy wholesaler (with their business
// profiles) so you can check the Supabase table editor afterwards. Prints
// the real connection error if it fails, instead of hanging.

const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  console.error("Set DATABASE_URL before running this script.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 8000,
});

const stamp = Date.now();

async function insertDummy(client, role, overrides) {
  const email = `dummy-${role.toLowerCase()}-${stamp}@example.com`;

  const userResult = await client.query(
    `INSERT INTO users (email, password_hash, role)
     VALUES ($1, 'dummy-hash-not-a-real-password', $2)
     RETURNING id, email, role`,
    [email, role]
  );
  const user = userResult.rows[0];

  await client.query(
    `INSERT INTO business_profiles (
       user_id, business_name, contact_name, drug_license, gst_number, phone,
       address, city, state, pincode, delivery_available, delivery_radius_km
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      user.id,
      overrides.businessName,
      overrides.contactName,
      `DUMMY-LIC-${stamp}-${role}`,
      null,
      "9999999999",
      "123 Test Street",
      "Test City",
      "Test State",
      "000000",
      overrides.deliveryAvailable,
      overrides.deliveryRadiusKm,
    ]
  );

  return user;
}

(async () => {
  console.log("Connecting to database...");

  let client;
  try {
    client = await pool.connect();
    console.log("Connected. Inserting dummy retailer + wholesaler...");
    await client.query("BEGIN");

    const retailer = await insertDummy(client, "RETAILER", {
      businessName: "Dummy Test Pharmacy",
      contactName: "Test Owner",
      deliveryAvailable: false,
      deliveryRadiusKm: 0,
    });
    const wholesaler = await insertDummy(client, "WHOLESALER", {
      businessName: "Dummy Test Wholesale Co",
      contactName: "Test Contact",
      deliveryAvailable: true,
      deliveryRadiusKm: 25,
    });

    await client.query("COMMIT");

    console.log("SUCCESS. Created:");
    console.log(" retailer:", retailer.email, retailer.id);
    console.log(" wholesaler:", wholesaler.email, wholesaler.id);
    console.log("\nCheck the Supabase table editor for these rows in `users` and `business_profiles`.");
    console.log("Delete them afterwards, e.g.:");
    console.log(`  DELETE FROM users WHERE email LIKE 'dummy-%-${stamp}@example.com';`);
  } catch (err) {
    if (client) await client.query("ROLLBACK").catch(() => {});
    console.error("FAILED:", err.message);
    console.error(err);
    process.exitCode = 1;
  } finally {
    if (client) client.release();
    await pool.end();
  }
})();
