-- ============================================================
-- Migration: add_avatar_url_to_employees
-- Description: Adds avatar_url column to public.employees table
-- ============================================================

ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT NULL;
