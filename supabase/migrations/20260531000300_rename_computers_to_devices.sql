-- ============================================================
-- Migration: rename_computers_to_devices
-- Description:
--   1. Renames computers to devices, updates constraints and indexes.
--   2. Adds device_type ENUM column.
--   3. Renames computer_licenses to device_licenses, updates keys and triggers.
--   4. Renames incidents.computer_id to device_id.
--   5. Re-creates Row Level Security select policies for new tables.
-- ============================================================

-- 1. Rename table computers to devices
ALTER TABLE public.computers RENAME TO devices;

-- Rename constraints on devices
ALTER TABLE public.devices RENAME CONSTRAINT computers_pkey TO devices_pkey;
ALTER TABLE public.devices RENAME CONSTRAINT computers_inventory_number_key TO devices_inventory_number_key;
ALTER TABLE public.devices RENAME CONSTRAINT computers_serial_number_key TO devices_serial_number_key;
ALTER TABLE public.devices RENAME CONSTRAINT computers_employee_id_fkey TO devices_employee_id_fkey;
ALTER TABLE public.devices RENAME CONSTRAINT computers_template_id_fkey TO devices_template_id_fkey;

-- Rename indexes on devices
ALTER INDEX public.idx_computers_employee_id RENAME TO idx_devices_employee_id;
ALTER INDEX public.idx_computers_template_id RENAME TO idx_devices_template_id;

-- 2. Create device_type ENUM
CREATE TYPE public.device_type AS ENUM ('pc', 'monitor', 'keyboard', 'mouse', 'printer', 'other');

-- 3. Add device_type column to devices
ALTER TABLE public.devices ADD COLUMN device_type public.device_type NOT NULL DEFAULT 'pc';

-- 4. Rename computer_licenses table to device_licenses
ALTER TABLE public.computer_licenses RENAME TO device_licenses;

-- Rename columns on device_licenses
ALTER TABLE public.device_licenses RENAME COLUMN computer_id TO device_id;

-- Rename constraints on device_licenses
ALTER TABLE public.device_licenses RENAME CONSTRAINT computer_licenses_pkey TO device_licenses_pkey;
ALTER TABLE public.device_licenses RENAME CONSTRAINT computer_licenses_computer_id_fkey TO device_licenses_device_id_fkey;
ALTER TABLE public.device_licenses RENAME CONSTRAINT computer_licenses_license_id_fkey TO device_licenses_license_id_fkey;
ALTER TABLE public.device_licenses RENAME CONSTRAINT computer_licenses_computer_id_license_id_key TO device_licenses_device_id_license_id_key;

-- 5. Rename column computer_id to device_id in incidents
ALTER TABLE public.incidents RENAME COLUMN computer_id TO device_id;

-- Rename constraint on incidents
ALTER TABLE public.incidents RENAME CONSTRAINT incidents_computer_id_fkey TO incidents_device_id_fkey;

-- 6. Row Level Security policies
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "computers_select" ON public.devices;
CREATE POLICY "devices_select" ON public.devices
  FOR SELECT TO authenticated USING (
    public.get_role_security_definer(auth.uid()) IN ('admin', 'it_specialist') 
    OR employee_id = auth.uid()
  );

ALTER TABLE public.device_licenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "computer_licenses_select" ON public.device_licenses;
CREATE POLICY "device_licenses_select" ON public.device_licenses
  FOR SELECT TO authenticated USING (
    public.get_role_security_definer(auth.uid()) IN ('admin', 'it_specialist')
  );

-- 7. Trigger seats logic for device_licenses
DROP TRIGGER IF EXISTS trg_computer_licenses_seats ON public.device_licenses;

CREATE OR REPLACE FUNCTION public.trg_fn_device_licenses_seats()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.licenses
    SET used_seats = used_seats + 1
    WHERE id = NEW.license_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.licenses
    SET used_seats = used_seats - 1
    WHERE id = OLD.license_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.license_id IS DISTINCT FROM NEW.license_id THEN
      UPDATE public.licenses SET used_seats = used_seats - 1 WHERE id = OLD.license_id;
      UPDATE public.licenses SET used_seats = used_seats + 1 WHERE id = NEW.license_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION public.trg_fn_device_licenses_seats() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.trg_fn_device_licenses_seats() FROM anon, authenticated, public;

CREATE TRIGGER trg_device_licenses_seats
  AFTER INSERT OR UPDATE OR DELETE ON public.device_licenses
  FOR EACH ROW EXECUTE FUNCTION public.trg_fn_device_licenses_seats();

-- Clean up old trigger function
DROP FUNCTION IF EXISTS public.trg_fn_computer_licenses_seats();
