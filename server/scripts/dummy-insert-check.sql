-- Run this directly in the Supabase SQL editor to sanity-check that the
-- schema exists and accepts inserts, completely independent of Render/Node.
-- If this fails, the problem is in Supabase itself (missing migration,
-- wrong project, etc). If this succeeds but the app still doesn't work,
-- the problem is in Render's connection to Supabase (env vars, network).

BEGIN;

WITH new_retailer AS (
  INSERT INTO users (email, password_hash, role)
  VALUES ('dummy-retailer-sqlcheck@example.com', 'dummy-hash-not-a-real-password', 'RETAILER')
  RETURNING id
)
INSERT INTO business_profiles (
  user_id, business_name, contact_name, drug_license, phone, address, city, state
)
SELECT id, 'Dummy Test Pharmacy', 'Test Owner', 'DUMMY-LIC-SQLCHECK-RETAILER', '9999999999', '123 Test Street', 'Test City', 'Test State'
FROM new_retailer;

WITH new_wholesaler AS (
  INSERT INTO users (email, password_hash, role)
  VALUES ('dummy-wholesaler-sqlcheck@example.com', 'dummy-hash-not-a-real-password', 'WHOLESALER')
  RETURNING id
)
INSERT INTO business_profiles (
  user_id, business_name, contact_name, drug_license, phone, address, city, state,
  delivery_available, delivery_radius_km
)
SELECT id, 'Dummy Test Wholesale Co', 'Test Contact', 'DUMMY-LIC-SQLCHECK-WHOLESALER', '9999999999', '123 Test Street', 'Test City', 'Test State', TRUE, 25
FROM new_wholesaler;

COMMIT;

-- Verify:
SELECT u.email, u.role, b.business_name, b.city
FROM users u JOIN business_profiles b ON b.user_id = u.id
WHERE u.email LIKE 'dummy-%-sqlcheck@example.com';

-- Clean up afterwards:
-- DELETE FROM users WHERE email LIKE 'dummy-%-sqlcheck@example.com';
