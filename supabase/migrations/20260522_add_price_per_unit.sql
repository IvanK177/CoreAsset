-- Add price_per_unit column to license_pools for financial calculations
ALTER TABLE license_pools ADD COLUMN IF NOT EXISTS price_per_unit numeric(10,2) DEFAULT 0 NOT NULL;