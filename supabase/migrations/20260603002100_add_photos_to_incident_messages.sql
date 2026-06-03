-- Migration: add_photos_to_incident_messages
-- Description: Adds photo_urls array column to public.incident_messages table.

ALTER TABLE public.incident_messages
ADD COLUMN IF NOT EXISTS photo_urls TEXT[] DEFAULT '{}'::TEXT[];
