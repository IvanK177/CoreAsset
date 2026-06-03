-- Migration: add_storage_update_policy
-- Description: Adds UPDATE policy to storage.objects for authenticated users on the ticket-attachments bucket.

CREATE POLICY "Allow authenticated updates on ticket-attachments" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'ticket-attachments') WITH CHECK (bucket_id = 'ticket-attachments');
