-- ============================================================
-- Migration: Add 'it_specialist' to user_role ENUM and
--             add 'assigned_to' column to incidents table
-- ============================================================

-- 1. Add 'it_specialist' value to the user_role ENUM
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'it_specialist';

-- 2. Add 'assigned_to' column to incidents (references the IT specialist employee)
ALTER TABLE public.incidents
  ADD COLUMN IF NOT EXISTS assigned_to UUID DEFAULT NULL;

-- 3. Add foreign key constraint for assigned_to → employees.id
ALTER TABLE public.incidents
  DROP CONSTRAINT IF EXISTS incidents_assigned_to_fkey;

ALTER TABLE public.incidents
  ADD CONSTRAINT incidents_assigned_to_fkey
  FOREIGN KEY (assigned_to) REFERENCES public.employees(id)
  ON DELETE SET NULL;

-- ============================================================
-- RLS Policies for it_specialist role
-- ============================================================

-- 4. Allow it_specialist to SELECT incidents
CREATE POLICY "it_specialist_can_view_incidents" ON public.incidents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.id = (
        SELECT auth.uid()::uuid
      )
      AND e.role = 'it_specialist'
      AND e.is_active = true
    )
  );

-- 5. Allow it_specialist to UPDATE incidents (status, assigned_to, resolved_at)
CREATE POLICY "it_specialist_can_update_incidents" ON public.incidents
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.id = (
        SELECT auth.uid()::uuid
      )
      AND e.role = 'it_specialist'
      AND e.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.id = (
        SELECT auth.uid()::uuid
      )
      AND e.role = 'it_specialist'
      AND e.is_active = true
    )
  );

-- 6. Allow it_specialist to SELECT employees (read-only, for ticket author info)
CREATE POLICY "it_specialist_can_view_employees" ON public.employees
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.id = (
        SELECT auth.uid()::uuid
      )
      AND e.role = 'it_specialist'
      AND e.is_active = true
    )
  );

-- 7. Allow it_specialist to SELECT computers (read-only, for ticket equipment info)
CREATE POLICY "it_specialist_can_view_computers" ON public.computers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.id = (
        SELECT auth.uid()::uuid
      )
      AND e.role = 'it_specialist'
      AND e.is_active = true
    )
  );