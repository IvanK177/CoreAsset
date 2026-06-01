-- Migration: Add photos and resolutions to devices, room_requests, and incidents
-- Date: 2026-06-01

-- 1. Add photo_urls to devices table
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS photo_urls TEXT[] DEFAULT '{}'::TEXT[];

-- 2. Add photo_urls, resolution, and resolution_photo_urls to room_requests table
ALTER TABLE public.room_requests ADD COLUMN IF NOT EXISTS photo_urls TEXT[] DEFAULT '{}'::TEXT[];
ALTER TABLE public.room_requests ADD COLUMN IF NOT EXISTS resolution TEXT;
ALTER TABLE public.room_requests ADD COLUMN IF NOT EXISTS resolution_photo_urls TEXT[] DEFAULT '{}'::TEXT[];

-- 3. Add resolution_photo_urls to incidents table
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS resolution_photo_urls TEXT[] DEFAULT '{}'::TEXT[];
