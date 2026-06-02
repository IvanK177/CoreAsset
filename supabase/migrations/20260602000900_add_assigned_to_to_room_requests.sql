-- ============================================================
-- Migration: add_assigned_to_to_room_requests
-- Description: Adds assigned_to column and foreign key constraint to room_requests table
-- ============================================================

ALTER TABLE public.room_requests ADD COLUMN IF NOT EXISTS assigned_to UUID DEFAULT NULL;

ALTER TABLE public.room_requests DROP CONSTRAINT IF EXISTS room_requests_assigned_to_fkey;

ALTER TABLE public.room_requests
  ADD CONSTRAINT room_requests_assigned_to_fkey
  FOREIGN KEY (assigned_to) REFERENCES public.employees(id)
  ON DELETE SET NULL;
