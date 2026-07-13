-- MediLink initial schema
-- Run this in the Supabase SQL editor (or `psql "$DATABASE_URL" -f 001_init.sql`).
--
-- Replaces the earlier separate retailer_profiles / wholesaler_profiles idea with a
-- single business_profiles table. Retailer vs wholesaler is already known from
-- users.role, so we don't duplicate that as a second discriminator column --
-- columns only one side uses (delivery_available, delivery_radius_km) are just
-- left at their default for the other role.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,

    role TEXT NOT NULL CHECK (role IN ('RETAILER', 'WHOLESALER', 'ADMIN')),

    verified BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS business_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- shared fields
    business_name TEXT NOT NULL,      -- store name (retailer) / company name (wholesaler)
    contact_name TEXT,                -- owner name (retailer) / warehouse contact (wholesaler)
    drug_license TEXT UNIQUE NOT NULL,
    gst_number TEXT,
    phone TEXT NOT NULL,

    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT,
    latitude DECIMAL,
    longitude DECIMAL,

    business_hours TEXT,

    -- wholesaler-only; stay at defaults for retailers
    delivery_available BOOLEAN DEFAULT FALSE,
    delivery_radius_km INTEGER DEFAULT 0,

    average_rating DECIMAL DEFAULT 0,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_profiles_user_id ON business_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_business_profiles_location ON business_profiles(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
