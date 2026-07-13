-- Run this AFTER 001_init.sql, and only once you've migrated any rows you
-- care about out of the old per-role profile tables.
-- Safe to run even if these tables were never created (IF EXISTS guards).

DROP TABLE IF EXISTS retailer_profiles;
DROP TABLE IF EXISTS wholesaler_profiles;
