-- ============================================================
-- Migration: Add 'facilities' to user_role ENUM and
--             create the room_requests table
-- ============================================================

-- 1. Add 'facilities' role to the user_role ENUM
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'facilities';

-- 2. Create room_requests table
CREATE TABLE IF NOT EXISTS public.room_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room TEXT NOT NULL,
  type TEXT NOT NULL, -- 'ремонт', 'оснащение'
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open', -- 'open', 'in_progress', 'resolved'
  author_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Add explicit constraint name for foreign key (so we can use it in TS select joins)
ALTER TABLE public.room_requests DROP CONSTRAINT IF EXISTS room_requests_author_id_fkey;
ALTER TABLE public.room_requests
  ADD CONSTRAINT room_requests_author_id_fkey
  FOREIGN KEY (author_id) REFERENCES public.employees(id)
  ON DELETE CASCADE;

-- 4. Enable Row Level Security
ALTER TABLE public.room_requests ENABLE ROW LEVEL SECURITY;

-- 5. Define SELECT policy: all authenticated users can read room requests
DROP POLICY IF EXISTS "room_requests_select" ON public.room_requests;
CREATE POLICY "room_requests_select" ON public.room_requests
  FOR SELECT TO authenticated USING (true);

-- 6. Define INSERT policy: users can insert their own room requests
DROP POLICY IF EXISTS "room_requests_insert" ON public.room_requests;
CREATE POLICY "room_requests_insert" ON public.room_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

-- 7. Define UPDATE policy: admin, facilities personnel, or authors can update
DROP POLICY IF EXISTS "room_requests_update" ON public.room_requests;
CREATE POLICY "room_requests_update" ON public.room_requests
  FOR UPDATE TO authenticated USING (
    public.get_role_security_definer(auth.uid()) IN ('admin', 'facilities')
    OR author_id = auth.uid()
  ) WITH CHECK (
    public.get_role_security_definer(auth.uid()) IN ('admin', 'facilities')
    OR author_id = auth.uid()
  );
