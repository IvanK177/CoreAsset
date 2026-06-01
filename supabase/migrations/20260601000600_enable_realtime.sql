-- ============================================================
-- Migration: Enable Realtime for core tables
-- ============================================================

-- Enable Realtime by adding tables to supabase_realtime publication safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'devices'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.devices;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'licenses'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.licenses;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'employees'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.employees;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'incidents'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'room_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.room_requests;
  END IF;
END $$;
