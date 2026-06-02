-- ============================================================
-- Migration: add_developer_role_and_support_requests
-- Description: Adds 'developer' to user_role enum and creates support_requests table with RLS
-- ============================================================

-- 1. Add 'developer' to the user_role ENUM
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'developer';

-- 2. Create support_requests table
CREATE TABLE IF NOT EXISTS public.support_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open', -- 'open', 'in_progress', 'resolved'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Add explicit constraint name for foreign key (so we can use it in TS select joins)
ALTER TABLE public.support_requests DROP CONSTRAINT IF EXISTS support_requests_author_id_fkey;
ALTER TABLE public.support_requests
  ADD CONSTRAINT support_requests_author_id_fkey
  FOREIGN KEY (author_id) REFERENCES public.employees(id)
  ON DELETE CASCADE;

-- 4. Enable Row Level Security
ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;

-- 5. Define SELECT policy: read allowed only for admins, developers or authors
DROP POLICY IF EXISTS "support_requests_select" ON public.support_requests;
CREATE POLICY "support_requests_select" ON public.support_requests
  FOR SELECT TO authenticated USING (
    public.get_role_security_definer(auth.uid()) IN ('admin', 'developer')
    OR author_id = auth.uid()
  );

-- 6. Define INSERT policy: users can insert their own support requests
DROP POLICY IF EXISTS "support_requests_insert" ON public.support_requests;
CREATE POLICY "support_requests_insert" ON public.support_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

-- 7. Define UPDATE policy: only admins or developers can update status
DROP POLICY IF EXISTS "support_requests_update" ON public.support_requests;
CREATE POLICY "support_requests_update" ON public.support_requests
  FOR UPDATE TO authenticated USING (
    public.get_role_security_definer(auth.uid()) IN ('admin', 'developer')
  ) WITH CHECK (
    public.get_role_security_definer(auth.uid()) IN ('admin', 'developer')
  );
