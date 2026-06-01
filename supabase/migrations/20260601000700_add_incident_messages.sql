-- ============================================================
-- Migration: Create public.incident_messages table and setup RLS
-- ============================================================

-- 1. Create incident_messages table
CREATE TABLE IF NOT EXISTS public.incident_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Add explicit foreign key constraints with cascade delete
ALTER TABLE public.incident_messages DROP CONSTRAINT IF EXISTS incident_messages_incident_id_fkey;
ALTER TABLE public.incident_messages
  ADD CONSTRAINT incident_messages_incident_id_fkey
  FOREIGN KEY (incident_id) REFERENCES public.incidents(id)
  ON DELETE CASCADE;

ALTER TABLE public.incident_messages DROP CONSTRAINT IF EXISTS incident_messages_sender_id_fkey;
ALTER TABLE public.incident_messages
  ADD CONSTRAINT incident_messages_sender_id_fkey
  FOREIGN KEY (sender_id) REFERENCES public.employees(id)
  ON DELETE CASCADE;

-- 3. Enable Row Level Security
ALTER TABLE public.incident_messages ENABLE ROW LEVEL SECURITY;

-- 4. Define SELECT policy
DROP POLICY IF EXISTS "incident_messages_select" ON public.incident_messages;
CREATE POLICY "incident_messages_select" ON public.incident_messages
  FOR SELECT TO authenticated
  USING (
    public.get_role_security_definer(auth.uid()) = 'admin'::public.user_role
    OR EXISTS (
      SELECT 1 FROM public.incidents i
      WHERE i.id = incident_messages.incident_id
      AND (
        i.employee_id = auth.uid()
        OR i.assigned_to = auth.uid()
      )
    )
  );

-- 5. Define INSERT policy
DROP POLICY IF EXISTS "incident_messages_insert" ON public.incident_messages;
CREATE POLICY "incident_messages_insert" ON public.incident_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    (
      public.get_role_security_definer(auth.uid()) = 'admin'::public.user_role
      OR EXISTS (
        SELECT 1 FROM public.incidents i
        WHERE i.id = incident_messages.incident_id
        AND (
          i.employee_id = auth.uid()
          OR i.assigned_to = auth.uid()
        )
      )
    )
    AND sender_id = auth.uid()
  );

-- 6. Enable Supabase Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.incident_messages;
