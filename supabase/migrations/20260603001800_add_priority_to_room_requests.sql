-- Migration: add_priority_to_room_requests
-- Description: Adds priority column to room_requests table with a default of 'medium' and check constraint.

ALTER TABLE public.room_requests
ADD COLUMN priority TEXT NOT NULL DEFAULT 'medium'
CONSTRAINT check_room_requests_priority CHECK (priority IN ('low', 'medium', 'high', 'critical'));
