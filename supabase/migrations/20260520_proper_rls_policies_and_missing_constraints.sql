-- ============================================================
-- Migration: proper_rls_policies_and_missing_constraints
-- Replaces blanket auth_users_all policies with role-based RLS
-- Roles: admin (full CRUD), tech (read + create/update, limited delete), readonly (read only)
-- Also adds missing unique constraints, indexes, and used_seats trigger
-- ============================================================

-- Helper function in public schema to extract role from JWT
CREATE OR REPLACE FUNCTION public.get_user_role() RETURNS text AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role'),
    'readonly'
  );
$$ LANGUAGE sql STABLE;

-- Set search_path to prevent injection
ALTER FUNCTION public.get_user_role() SET search_path = public;

-- 1. Drop existing blanket policies
DROP POLICY IF EXISTS auth_users_all ON computers;
DROP POLICY IF EXISTS auth_users_all ON employees;
DROP POLICY IF EXISTS auth_users_all ON incidents;
DROP POLICY IF EXISTS auth_users_all ON license_pools;
DROP POLICY IF EXISTS auth_users_all ON software;
DROP POLICY IF EXISTS auth_users_all ON software_installations;
DROP POLICY IF EXISTS auth_users_all ON workplaces;

-- ============================================================
-- 2. RLS policies — computers
-- ============================================================
CREATE POLICY computers_select ON computers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY computers_insert ON computers
  FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() IN ('admin', 'tech'));
CREATE POLICY computers_update ON computers
  FOR UPDATE TO authenticated
  USING (public.get_user_role() IN ('admin', 'tech'))
  WITH CHECK (public.get_user_role() IN ('admin', 'tech'));
CREATE POLICY computers_delete ON computers
  FOR DELETE TO authenticated
  USING (public.get_user_role() = 'admin');

-- ============================================================
-- 3. RLS policies — employees
-- ============================================================
CREATE POLICY employees_select ON employees
  FOR SELECT TO authenticated USING (true);
CREATE POLICY employees_insert ON employees
  FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() IN ('admin', 'tech'));
CREATE POLICY employees_update ON employees
  FOR UPDATE TO authenticated
  USING (public.get_user_role() IN ('admin', 'tech'))
  WITH CHECK (public.get_user_role() IN ('admin', 'tech'));
CREATE POLICY employees_delete ON employees
  FOR DELETE TO authenticated
  USING (public.get_user_role() = 'admin');

-- ============================================================
-- 4. RLS policies — workplaces
-- ============================================================
CREATE POLICY workplaces_select ON workplaces
  FOR SELECT TO authenticated USING (true);
CREATE POLICY workplaces_insert ON workplaces
  FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() IN ('admin', 'tech'));
CREATE POLICY workplaces_update ON workplaces
  FOR UPDATE TO authenticated
  USING (public.get_user_role() IN ('admin', 'tech'))
  WITH CHECK (public.get_user_role() IN ('admin', 'tech'));
CREATE POLICY workplaces_delete ON workplaces
  FOR DELETE TO authenticated
  USING (public.get_user_role() = 'admin');

-- ============================================================
-- 5. RLS policies — software
-- ============================================================
CREATE POLICY software_select ON software
  FOR SELECT TO authenticated USING (true);
CREATE POLICY software_insert ON software
  FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() IN ('admin', 'tech'));
CREATE POLICY software_update ON software
  FOR UPDATE TO authenticated
  USING (public.get_user_role() IN ('admin', 'tech'))
  WITH CHECK (public.get_user_role() IN ('admin', 'tech'));
CREATE POLICY software_delete ON software
  FOR DELETE TO authenticated
  USING (public.get_user_role() = 'admin');

-- ============================================================
-- 6. RLS policies — license_pools
-- ============================================================
CREATE POLICY license_pools_select ON license_pools
  FOR SELECT TO authenticated USING (true);
CREATE POLICY license_pools_insert ON license_pools
  FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() IN ('admin', 'tech'));
CREATE POLICY license_pools_update ON license_pools
  FOR UPDATE TO authenticated
  USING (public.get_user_role() IN ('admin', 'tech'))
  WITH CHECK (public.get_user_role() IN ('admin', 'tech'));
CREATE POLICY license_pools_delete ON license_pools
  FOR DELETE TO authenticated
  USING (public.get_user_role() = 'admin');

-- ============================================================
-- 7. RLS policies — software_installations
-- ============================================================
CREATE POLICY software_installations_select ON software_installations
  FOR SELECT TO authenticated USING (true);
CREATE POLICY software_installations_insert ON software_installations
  FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() IN ('admin', 'tech'));
CREATE POLICY software_installations_update ON software_installations
  FOR UPDATE TO authenticated
  USING (public.get_user_role() IN ('admin', 'tech'))
  WITH CHECK (public.get_user_role() IN ('admin', 'tech'));
CREATE POLICY software_installations_delete ON software_installations
  FOR DELETE TO authenticated
  USING (public.get_user_role() IN ('admin', 'tech'));

-- ============================================================
-- 8. RLS policies — incidents
--    tech can delete only non-resolved; admin can delete all
-- ============================================================
CREATE POLICY incidents_select ON incidents
  FOR SELECT TO authenticated USING (true);
CREATE POLICY incidents_insert ON incidents
  FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() IN ('admin', 'tech'));
CREATE POLICY incidents_update ON incidents
  FOR UPDATE TO authenticated
  USING (public.get_user_role() IN ('admin', 'tech'))
  WITH CHECK (public.get_user_role() IN ('admin', 'tech'));
CREATE POLICY incidents_delete ON incidents
  FOR DELETE TO authenticated
  USING (
    CASE
      WHEN public.get_user_role() = 'admin' THEN true
      WHEN public.get_user_role() = 'tech' THEN status != 'resolved'
      ELSE false
    END
  );

-- ============================================================
-- 9. Missing unique constraints
-- ============================================================
ALTER TABLE computers ADD CONSTRAINT computers_serial_number_key UNIQUE (serial_number);
ALTER TABLE employees ADD CONSTRAINT employees_email_key UNIQUE (email);

-- ============================================================
-- 10. Missing index: computers(room)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_computers_room ON computers(room);

-- ============================================================
-- 11. CHECK constraint: used_seats must not exceed total_seats
-- ============================================================
ALTER TABLE license_pools ADD CONSTRAINT license_pools_used_seats_limit CHECK (used_seats <= total_seats);

-- ============================================================
-- 12. Trigger: auto-increment/decrement license_pools.used_seats
--     on software_installations INSERT / UPDATE / DELETE
-- ============================================================
CREATE OR REPLACE FUNCTION public.trg_fn_software_installations_seats()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.license_pool_id IS NOT NULL THEN
      UPDATE license_pools
        SET used_seats = used_seats + 1
        WHERE id = NEW.license_pool_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.license_pool_id IS NOT NULL THEN
      UPDATE license_pools
        SET used_seats = used_seats - 1
        WHERE id = OLD.license_pool_id;
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.license_pool_id IS DISTINCT FROM NEW.license_pool_id THEN
      IF OLD.license_pool_id IS NOT NULL THEN
        UPDATE license_pools
          SET used_seats = used_seats - 1
          WHERE id = OLD.license_pool_id;
      END IF;
      IF NEW.license_pool_id IS NOT NULL THEN
        UPDATE license_pools
          SET used_seats = used_seats + 1
          WHERE id = NEW.license_pool_id;
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set search_path and revoke RPC access
ALTER FUNCTION public.trg_fn_software_installations_seats() SET search_path = public;
ALTER FUNCTION public.set_updated_at() SET search_path = '';
REVOKE EXECUTE ON FUNCTION public.trg_fn_software_installations_seats() FROM anon, authenticated, public;

DROP TRIGGER IF EXISTS trg_software_installations_seats ON software_installations;
CREATE TRIGGER trg_software_installations_seats
  AFTER INSERT OR UPDATE OR DELETE ON software_installations
  FOR EACH ROW EXECUTE FUNCTION public.trg_fn_software_installations_seats();