-- Add employee_id to incidents table for associating incidents with employees
-- This allows automatic employee assignment when creating tickets from a computer card
ALTER TABLE public.incidents ADD COLUMN employee_id uuid NULL REFERENCES public.employees(id) ON DELETE SET NULL;