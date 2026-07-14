-- Medicine catalog + per-wholesaler inventory.
--
-- `medicines` is an admin-curated master list (brand + generic name,
-- manufacturer, dosage form, strength, pack size) so searches don't fragment
-- across spelling variants of the same drug. Wholesalers attach their own
-- stock/price/availability to an existing medicine via `inventory` rather
-- than creating free-text listings.

CREATE TABLE IF NOT EXISTS medicines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    brand_name TEXT,
    generic_name TEXT NOT NULL,
    manufacturer TEXT,
    dosage_form TEXT NOT NULL CHECK (dosage_form IN ('TABLET', 'SYRUP', 'INJECTION', 'CAPSULE', 'OINTMENT', 'DROPS', 'OTHER')),
    strength TEXT,
    pack_size TEXT,
    is_generic BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    wholesaler_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    medicine_id UUID NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,

    price DECIMAL,
    quantity INTEGER NOT NULL DEFAULT 0,

    last_updated TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE (wholesaler_id, medicine_id)
);

CREATE INDEX IF NOT EXISTS idx_medicines_generic_name ON medicines(generic_name);
CREATE INDEX IF NOT EXISTS idx_medicines_brand_name ON medicines(brand_name);
CREATE INDEX IF NOT EXISTS idx_inventory_medicine_id ON inventory(medicine_id);
CREATE INDEX IF NOT EXISTS idx_inventory_wholesaler_id ON inventory(wholesaler_id);

-- Seed a handful of common medicines so the catalog isn't empty out of the
-- box. Guarded on the table being empty (there's no natural unique key to
-- use as an ON CONFLICT target here) so re-running this migration is safe.
INSERT INTO medicines (brand_name, generic_name, manufacturer, dosage_form, strength, pack_size, is_generic)
SELECT * FROM (VALUES
    ('Crocin', 'Paracetamol', 'GSK', 'TABLET', '500mg', 'Strip of 15', FALSE),
    ('Dolo 650', 'Paracetamol', 'Micro Labs', 'TABLET', '650mg', 'Strip of 15', FALSE),
    ('Calpol', 'Paracetamol', 'GSK', 'SYRUP', '250mg/5ml', '60ml bottle', FALSE),
    (NULL, 'Paracetamol', NULL, 'TABLET', '500mg', 'Strip of 10', TRUE),
    ('Amoxil', 'Amoxicillin', 'GSK', 'CAPSULE', '500mg', 'Strip of 10', FALSE),
    (NULL, 'Amoxicillin', NULL, 'CAPSULE', '500mg', 'Strip of 10', TRUE),
    ('Cetrizine', 'Cetirizine', 'Cipla', 'TABLET', '10mg', 'Strip of 10', FALSE),
    ('Pantocid', 'Pantoprazole', 'Sun Pharma', 'TABLET', '40mg', 'Strip of 10', FALSE),
    ('Glycomet', 'Metformin', 'USV', 'TABLET', '500mg', 'Strip of 20', FALSE),
    ('Azithral', 'Azithromycin', 'Alembic', 'TABLET', '500mg', 'Strip of 5', FALSE),
    ('Combiflam', 'Ibuprofen + Paracetamol', 'Sanofi', 'TABLET', '400mg/325mg', 'Strip of 20', FALSE),
    (NULL, 'Oral Rehydration Salts', NULL, 'OTHER', 'WHO formula', 'Sachet', TRUE)
) AS seed(brand_name, generic_name, manufacturer, dosage_form, strength, pack_size, is_generic)
WHERE NOT EXISTS (SELECT 1 FROM medicines);
