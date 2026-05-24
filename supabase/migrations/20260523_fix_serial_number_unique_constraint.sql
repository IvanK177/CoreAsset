-- ============================================================
-- Fix: Change serial_number unique constraint to partial unique index
-- that excludes NULL values, allowing multiple computers without serial numbers.
--
-- The current UNIQUE constraint on serial_number treats NULLs as equal,
-- causing "duplicate key value violates unique constraint" errors
-- when inserting computers with empty/NULL serial_number.
--
-- Run this in Supabase Dashboard SQL Editor:
--   https://supabase.com/dashboard/project/tmivtbessykjksntdcwl/sql/new
-- ============================================================

-- 1. Drop the existing full unique constraint
ALTER TABLE computers DROP CONSTRAINT IF EXISTS computers_serial_number_key;

-- 2. Create a partial unique index that only enforces uniqueness for non-NULL values
-- (PostgreSQL treats NULLs as distinct in indexes, so multiple NULLs are allowed)
CREATE UNIQUE INDEX IF NOT EXISTS computers_serial_number_non_null_key
  ON computers (serial_number)
  WHERE serial_number IS NOT NULL;