-- ============================================================
-- Migration: fix_audit_security_and_triggers
-- Description:
--   1. Replaces blanket public RLS policies with strict role-based checks.
--   2. Automates licenses.used_seats counting via database triggers.
--   3. Adds CHECK constraint on licenses to enforce total_seats limit.
-- ============================================================

-- 1. Create security definer helper to query user roles without RLS recursion
CREATE OR REPLACE FUNCTION public.get_role_security_definer(user_id uuid)
RETURNS public.user_role AS $$
  SELECT role FROM public.employees WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- Set search_path and restrict execute access
ALTER FUNCTION public.get_role_security_definer(uuid) SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.get_role_security_definer(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_role_security_definer(uuid) TO authenticated;

-- 2. Drop existing permissive blanket policies
DROP POLICY IF EXISTS "Dev Access Employees" ON public.employees;
DROP POLICY IF EXISTS "Dev Access Templates" ON public.computer_templates;
DROP POLICY IF EXISTS "Dev Access Computers" ON public.computers;
DROP POLICY IF EXISTS "Dev Access Licenses" ON public.licenses;
DROP POLICY IF EXISTS "Dev Access Comp_Lic" ON public.computer_licenses;
DROP POLICY IF EXISTS "Dev Access Incidents" ON public.incidents;

DROP POLICY IF EXISTS "it_specialist_can_view_employees" ON public.employees;
DROP POLICY IF EXISTS "it_specialist_can_view_computers" ON public.computers;
DROP POLICY IF EXISTS "it_specialist_can_view_incidents" ON public.incidents;
DROP POLICY IF EXISTS "it_specialist_can_update_incidents" ON public.incidents;

-- 3. Create secure role-based RLS SELECT policies
-- Table: employees (all authenticated users can read contacts)
CREATE POLICY "employees_select" ON public.employees
  FOR SELECT TO authenticated USING (true);

-- Table: computer_templates (only admin and it_specialist can read templates)
CREATE POLICY "computer_templates_select" ON public.computer_templates
  FOR SELECT TO authenticated USING (
    public.get_role_security_definer(auth.uid()) IN ('admin', 'it_specialist')
  );

-- Table: computers (admin/specialist read all, employee reads own assigned computer)
CREATE POLICY "computers_select" ON public.computers
  FOR SELECT TO authenticated USING (
    public.get_role_security_definer(auth.uid()) IN ('admin', 'it_specialist') 
    OR employee_id = auth.uid()
  );

-- Table: licenses (only admin and it_specialist can read software licenses)
CREATE POLICY "licenses_select" ON public.licenses
  FOR SELECT TO authenticated USING (
    public.get_role_security_definer(auth.uid()) IN ('admin', 'it_specialist')
  );

-- Table: computer_licenses (only admin and it_specialist can read links)
CREATE POLICY "computer_licenses_select" ON public.computer_licenses
  FOR SELECT TO authenticated USING (
    public.get_role_security_definer(auth.uid()) IN ('admin', 'it_specialist')
  );

-- Table: incidents (admin/specialist read all, employee reads own reported tickets)
CREATE POLICY "incidents_select" ON public.incidents
  FOR SELECT TO authenticated USING (
    public.get_role_security_definer(auth.uid()) IN ('admin', 'it_specialist') 
    OR employee_id = auth.uid()
  );

-- 4. Add CHECK constraint on licenses to enforce total_seats limit
ALTER TABLE public.licenses DROP CONSTRAINT IF EXISTS licenses_used_seats_limit;
ALTER TABLE public.licenses ADD CONSTRAINT licenses_used_seats_limit CHECK (used_seats <= total_seats);

-- 5. Create trigger function and trigger for used_seats tracking on computer_licenses
CREATE OR REPLACE FUNCTION public.trg_fn_computer_licenses_seats()
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

-- Set search_path and restrict RPC execute access
ALTER FUNCTION public.trg_fn_computer_licenses_seats() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.trg_fn_computer_licenses_seats() FROM anon, authenticated, public;

DROP TRIGGER IF EXISTS trg_computer_licenses_seats ON public.computer_licenses;
CREATE TRIGGER trg_computer_licenses_seats
  AFTER INSERT OR UPDATE OR DELETE ON public.computer_licenses
  FOR EACH ROW EXECUTE FUNCTION public.trg_fn_computer_licenses_seats();
