-- ============================================================
-- Migration: allow_public_read_buckets
-- Description:
--   Creates a SELECT policy on storage.buckets to allow public read access (necessary for resolving public object metadata and avoiding 404 on public bucket assets).
-- ============================================================

CREATE POLICY "Allow public read on buckets" ON storage.buckets
  FOR SELECT TO public USING (true);
