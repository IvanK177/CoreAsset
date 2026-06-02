-- Migration: fix_employee_deletion_cascades
-- Description: Makes author/sender foreign keys nullable and replaces ON DELETE CASCADE with ON DELETE SET NULL to prevent data loss.

-- 1. Drop existing CASCADE foreign keys
ALTER TABLE public.incidents DROP CONSTRAINT IF EXISTS incidents_employee_id_fkey;
ALTER TABLE public.room_requests DROP CONSTRAINT IF EXISTS room_requests_author_id_fkey;
ALTER TABLE public.support_requests DROP CONSTRAINT IF EXISTS support_requests_author_id_fkey;
ALTER TABLE public.incident_messages DROP CONSTRAINT IF EXISTS incident_messages_sender_id_fkey;

-- 2. Make columns nullable
ALTER TABLE public.room_requests ALTER COLUMN author_id DROP NOT NULL;
ALTER TABLE public.support_requests ALTER COLUMN author_id DROP NOT NULL;
ALTER TABLE public.incident_messages ALTER COLUMN sender_id DROP NOT NULL;

-- 3. Add constraints back with ON DELETE SET NULL
ALTER TABLE public.incidents
  ADD CONSTRAINT incidents_employee_id_fkey
  FOREIGN KEY (employee_id) REFERENCES public.employees(id)
  ON DELETE SET NULL;

ALTER TABLE public.room_requests
  ADD CONSTRAINT room_requests_author_id_fkey
  FOREIGN KEY (author_id) REFERENCES public.employees(id)
  ON DELETE SET NULL;

ALTER TABLE public.support_requests
  ADD CONSTRAINT support_requests_author_id_fkey
  FOREIGN KEY (author_id) REFERENCES public.employees(id)
  ON DELETE SET NULL;

ALTER TABLE public.incident_messages
  ADD CONSTRAINT incident_messages_sender_id_fkey
  FOREIGN KEY (sender_id) REFERENCES public.employees(id)
  ON DELETE SET NULL;
