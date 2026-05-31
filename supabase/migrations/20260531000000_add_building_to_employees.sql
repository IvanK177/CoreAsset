-- Add building column to public.employees
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS building text;
