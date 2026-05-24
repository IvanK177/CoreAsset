-- Add title column to incidents table for short problem description
ALTER TABLE public.incidents ADD COLUMN title text NULL;

-- Backfill: set title from first line of description for existing incidents
UPDATE public.incidents SET title = split_part(description, '\n', 1) WHERE title IS NULL AND description IS NOT NULL;

-- Make title required for new incidents (keep nullable for backward compat with existing data)
-- We'll handle validation at the application level