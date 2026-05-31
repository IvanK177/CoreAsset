-- ============================================================
-- Migration: Add ticket photos and resolution columns
--             and set up supabase storage bucket for attachments
-- ============================================================

-- 1. Add columns to incidents table
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS photo_urls TEXT[] DEFAULT '{}'::TEXT[];
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS resolution TEXT;

-- 2. Create the ticket-attachments bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('ticket-attachments', 'ticket-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Enable RLS on storage.objects if it's not already enabled (standard in Supabase)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 4. Drop old policies if they exist (using specific names to avoid collision)
DROP POLICY IF EXISTS "Allow authenticated uploads on ticket-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated select on ticket-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow public select on ticket-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete on ticket-attachments" ON storage.objects;

-- 5. Create storage policies with specific names
CREATE POLICY "Allow authenticated uploads on ticket-attachments" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'ticket-attachments');

CREATE POLICY "Allow public select on ticket-attachments" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'ticket-attachments');

CREATE POLICY "Allow authenticated delete on ticket-attachments" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'ticket-attachments');
