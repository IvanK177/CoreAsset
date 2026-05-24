-- ============================================================
-- Fix RLS policies: allow all authenticated users full CRUD access
-- on computers, employees, software, license_pools, incidents,
-- software_installations, and workplaces.
--
-- Run this in Supabase Dashboard SQL Editor:
--   https://supabase.com/dashboard/project/tmivtbessykjksntdcwl/sql/new
-- ============================================================

-- 1. Ensure RLS is enabled on all tables
ALTER TABLE computers ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE software ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE software_installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE workplaces ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive policies that check get_user_role()
--    (these default to 'readonly' when app_metadata has no role, blocking all writes)

-- computers
DROP POLICY IF EXISTS computers_select ON computers;
DROP POLICY IF EXISTS computers_insert ON computers;
DROP POLICY IF EXISTS computers_update ON computers;
DROP POLICY IF EXISTS computers_delete ON computers;

-- employees
DROP POLICY IF EXISTS employees_select ON employees;
DROP POLICY IF EXISTS employees_insert ON employees;
DROP POLICY IF EXISTS employees_update ON employees;
DROP POLICY IF EXISTS employees_delete ON employees;

-- software
DROP POLICY IF EXISTS software_select ON software;
DROP POLICY IF EXISTS software_insert ON software;
DROP POLICY IF EXISTS software_update ON software;
DROP POLICY IF EXISTS software_delete ON software;

-- license_pools
DROP POLICY IF EXISTS license_pools_select ON license_pools;
DROP POLICY IF EXISTS license_pools_insert ON license_pools;
DROP POLICY IF EXISTS license_pools_update ON license_pools;
DROP POLICY IF EXISTS license_pools_delete ON license_pools;

-- incidents
DROP POLICY IF EXISTS incidents_select ON incidents;
DROP POLICY IF EXISTS incidents_insert ON incidents;
DROP POLICY IF EXISTS incidents_update ON incidents;
DROP POLICY IF EXISTS incidents_delete ON incidents;

-- software_installations
DROP POLICY IF EXISTS software_installations_select ON software_installations;
DROP POLICY IF EXISTS software_installations_insert ON software_installations;
DROP POLICY IF EXISTS software_installations_update ON software_installations;
DROP POLICY IF EXISTS software_installations_delete ON software_installations;

-- workplaces
DROP POLICY IF EXISTS workplaces_select ON workplaces;
DROP POLICY IF EXISTS workplaces_insert ON workplaces;
DROP POLICY IF EXISTS workplaces_update ON workplaces;
DROP POLICY IF EXISTS workplaces_delete ON workplaces;

-- 3. Create new policies: all authenticated users get full CRUD access
--    (this is an internal admin panel — any logged-in user is authorized)

-- computers
CREATE POLICY "Allow authenticated users to read computers" ON computers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert computers" ON computers
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update computers" ON computers
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users to delete computers" ON computers
  FOR DELETE TO authenticated USING (true);

-- employees
CREATE POLICY "Allow authenticated users to read employees" ON employees
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert employees" ON employees
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update employees" ON employees
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users to delete employees" ON employees
  FOR DELETE TO authenticated USING (true);

-- software
CREATE POLICY "Allow authenticated users to read software" ON software
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert software" ON software
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update software" ON software
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users to delete software" ON software
  FOR DELETE TO authenticated USING (true);

-- license_pools
CREATE POLICY "Allow authenticated users to read license_pools" ON license_pools
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert license_pools" ON license_pools
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update license_pools" ON license_pools
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users to delete license_pools" ON license_pools
  FOR DELETE TO authenticated USING (true);

-- incidents
CREATE POLICY "Allow authenticated users to read incidents" ON incidents
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert incidents" ON incidents
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update incidents" ON incidents
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users to delete incidents" ON incidents
  FOR DELETE TO authenticated USING (true);

-- software_installations
CREATE POLICY "Allow authenticated users to read software_installations" ON software_installations
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert software_installations" ON software_installations
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update software_installations" ON software_installations
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users to delete software_installations" ON software_installations
  FOR DELETE TO authenticated USING (true);

-- workplaces
CREATE POLICY "Allow authenticated users to read workplaces" ON workplaces
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert workplaces" ON workplaces
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update workplaces" ON workplaces
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users to delete workplaces" ON workplaces
  FOR DELETE TO authenticated USING (true);