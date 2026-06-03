-- ============================================================
-- CoreAsset — Consolidated Database Schema
-- ============================================================

-- 1. Custom Types (Enums)
CREATE TYPE public.user_role AS ENUM (
  'admin',
  'employee',
  'it_specialist',
  'facilities',
  'developer'
);

CREATE TYPE public.device_type AS ENUM (
  'pc',
  'monitor',
  'keyboard',
  'mouse',
  'printer',
  'other'
);

CREATE TYPE public.computer_status AS ENUM (
  'active',
  'repair',
  'decommissioned',
  'storage'
);

CREATE TYPE public.incident_priority AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

CREATE TYPE public.incident_status AS ENUM (
  'open',
  'in_progress',
  'resolved',
  'cancelled'
);

CREATE TYPE public.incident_type AS ENUM (
  'hardware',
  'software',
  'network',
  'other'
);

CREATE TYPE public.license_type AS ENUM (
  'perpetual',
  'subscription'
);

-- 2. Helper Functions
CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_role()
 RETURNS text
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role'),
    'admin'
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_role_security_definer(user_id uuid)
 RETURNS user_role
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT role FROM public.employees WHERE id = user_id;
$function$;

CREATE OR REPLACE FUNCTION public.is_it_specialist(user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.employees
    WHERE id = user_id AND role = 'it_specialist'::public.user_role AND is_active = true
  );
$function$;

-- 3. Tables
CREATE TABLE public.employees (
  id UUID PRIMARY KEY,
  full_name TEXT NOT NULL,
  position TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  room TEXT,
  phone TEXT,
  telegram TEXT,
  role public.user_role NOT NULL DEFAULT 'employee'::public.user_role,
  is_active BOOLEAN DEFAULT true,
  avatar_url TEXT,
  building TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.computer_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  computer_type TEXT,
  hardware JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_number TEXT NOT NULL UNIQUE,
  serial_number TEXT UNIQUE,
  computer_type TEXT,
  room TEXT,
  lifecycle_status public.computer_status DEFAULT 'storage'::public.computer_status,
  hardware JSONB DEFAULT '{}'::jsonb,
  template_id UUID REFERENCES public.computer_templates(id) ON DELETE SET NULL,
  employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  device_type public.device_type NOT NULL DEFAULT 'pc'::public.device_type,
  photo_urls TEXT[] DEFAULT '{}'::text[]
);

CREATE TABLE public.licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  software_name TEXT NOT NULL,
  version TEXT,
  vendor TEXT,
  license_type public.license_type DEFAULT 'perpetual'::public.license_type,
  license_key TEXT,
  total_seats INTEGER NOT NULL DEFAULT 1,
  used_seats INTEGER NOT NULL DEFAULT 0,
  price_per_unit NUMERIC DEFAULT 0,
  expires_at DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT licenses_used_seats_limit CHECK (used_seats <= total_seats)
);

CREATE TABLE public.device_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  license_id UUID NOT NULL REFERENCES public.licenses(id) ON DELETE CASCADE,
  installed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (device_id, license_id)
);

CREATE TABLE public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  incident_type public.incident_type DEFAULT 'other'::public.incident_type,
  priority public.incident_priority DEFAULT 'medium'::public.incident_priority,
  status public.incident_status DEFAULT 'open'::public.incident_status,
  device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
  employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now(),
  photo_urls TEXT[] DEFAULT '{}'::text[],
  resolution TEXT,
  resolution_photo_urls TEXT[] DEFAULT '{}'::text[]
);

CREATE TABLE public.room_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open'::text,
  author_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  priority TEXT NOT NULL DEFAULT 'medium'::text,
  photo_urls TEXT[] DEFAULT '{}'::text[],
  resolution TEXT,
  resolution_photo_urls TEXT[] DEFAULT '{}'::text[],
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.incident_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  photo_urls TEXT[] DEFAULT '{}'::text[],
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.support_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open'::text,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_devices_room ON public.devices(room);
CREATE INDEX IF NOT EXISTS idx_devices_employee_id ON public.devices(employee_id);
CREATE INDEX IF NOT EXISTS idx_device_licenses_device_id ON public.device_licenses(device_id);
CREATE INDEX IF NOT EXISTS idx_device_licenses_license_id ON public.device_licenses(license_id);
CREATE INDEX IF NOT EXISTS idx_incidents_employee_id ON public.incidents(employee_id);
CREATE INDEX IF NOT EXISTS idx_incidents_assigned_to ON public.incidents(assigned_to);
CREATE INDEX IF NOT EXISTS idx_room_requests_author_id ON public.room_requests(author_id);
CREATE INDEX IF NOT EXISTS idx_incident_messages_incident_id ON public.incident_messages(incident_id);

-- 5. Triggers
CREATE OR REPLACE FUNCTION public.trg_fn_device_licenses_seats()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.licenses
    SET used_seats = used_seats + 1
    WHERE id = NEW.license_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.licenses
    SET used_seats = used_seats - 1
    WHERE id = OLD.license_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.license_id IS DISTINCT FROM NEW.license_id THEN
      UPDATE public.licenses SET used_seats = used_seats - 1 WHERE id = OLD.license_id;
      UPDATE public.licenses SET used_seats = used_seats + 1 WHERE id = NEW.license_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$function$;

CREATE TRIGGER trg_device_licenses_seats
  AFTER INSERT OR UPDATE OR DELETE ON public.device_licenses
  FOR EACH ROW EXECUTE FUNCTION public.trg_fn_device_licenses_seats();

CREATE TRIGGER trg_devices_updated_at
  BEFORE UPDATE ON public.devices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_incidents_updated_at
  BEFORE UPDATE ON public.incidents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. Row Level Security (RLS) Configuration
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.computer_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;

-- Employees Policies
CREATE POLICY employees_select ON public.employees
  FOR SELECT TO authenticated USING (true);

-- Computer Templates Policies
CREATE POLICY computer_templates_select ON public.computer_templates
  FOR SELECT TO authenticated USING (public.get_role_security_definer(auth.uid()) IN ('admin'::public.user_role, 'it_specialist'::public.user_role));

-- Devices Policies
CREATE POLICY devices_select ON public.devices
  FOR SELECT TO authenticated USING (
    public.get_role_security_definer(auth.uid()) IN ('admin'::public.user_role, 'it_specialist'::public.user_role)
    OR employee_id = auth.uid()
  );

-- Licenses Policies
CREATE POLICY licenses_select ON public.licenses
  FOR SELECT TO authenticated USING (public.get_role_security_definer(auth.uid()) IN ('admin'::public.user_role, 'it_specialist'::public.user_role));

-- Device Licenses Policies
CREATE POLICY device_licenses_select ON public.device_licenses
  FOR SELECT TO authenticated USING (public.get_role_security_definer(auth.uid()) IN ('admin'::public.user_role, 'it_specialist'::public.user_role));

-- Incidents Policies
CREATE POLICY incidents_select ON public.incidents
  FOR SELECT TO authenticated USING (
    public.get_role_security_definer(auth.uid()) IN ('admin'::public.user_role, 'it_specialist'::public.user_role)
    OR employee_id = auth.uid()
  );

-- Room Requests Policies
CREATE POLICY room_requests_select ON public.room_requests
  FOR SELECT TO authenticated USING (true);

CREATE POLICY room_requests_insert ON public.room_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

CREATE POLICY room_requests_update ON public.room_requests
  FOR UPDATE TO authenticated
  USING (public.get_role_security_definer(auth.uid()) IN ('admin'::public.user_role, 'facilities'::public.user_role) OR author_id = auth.uid())
  WITH CHECK (public.get_role_security_definer(auth.uid()) IN ('admin'::public.user_role, 'facilities'::public.user_role) OR author_id = auth.uid());

-- Incident Messages Policies
CREATE POLICY incident_messages_select ON public.incident_messages
  FOR SELECT TO public
  USING (
    public.get_role_security_definer(auth.uid()) IN ('admin'::public.user_role, 'it_specialist'::public.user_role)
    OR EXISTS (
      SELECT 1 FROM public.incidents i
      WHERE i.id = incident_messages.incident_id
      AND (i.employee_id = auth.uid() OR i.assigned_to = auth.uid())
    )
  );

CREATE POLICY incident_messages_insert ON public.incident_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    (
      public.get_role_security_definer(auth.uid()) = 'admin'::public.user_role
      OR EXISTS (
        SELECT 1 FROM public.incidents i
        WHERE i.id = incident_messages.incident_id
        AND (i.employee_id = auth.uid() OR i.assigned_to = auth.uid())
      )
    )
    AND sender_id = auth.uid()
  );

-- Support Requests Policies
CREATE POLICY support_requests_select ON public.support_requests
  FOR SELECT TO authenticated USING (
    public.get_role_security_definer(auth.uid()) IN ('admin'::public.user_role, 'developer'::public.user_role)
    OR author_id = auth.uid()
  );

CREATE POLICY support_requests_insert ON public.support_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

CREATE POLICY support_requests_update ON public.support_requests
  FOR UPDATE TO authenticated
  USING (public.get_role_security_definer(auth.uid()) IN ('admin'::public.user_role, 'developer'::public.user_role))
  WITH CHECK (public.get_role_security_definer(auth.uid()) IN ('admin'::public.user_role, 'developer'::public.user_role));

-- 7. Realtime Enablement
-- Note: Recreate publications safely if tables already exist
ALTER PUBLICATION supabase_realtime ADD TABLE public.devices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.licenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.employees;
ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.incident_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_requests;

-- 8. Storage Configuration (Bucket and Policies)
INSERT INTO storage.buckets (id, name, public)
VALUES ('ticket-attachments', 'ticket-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Enable public read on storage.buckets for resolving metadata
CREATE POLICY "Allow public read on buckets" ON storage.buckets
  FOR SELECT TO public USING (true);

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated uploads on ticket-attachments" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'ticket-attachments');

CREATE POLICY "Allow public select on ticket-attachments" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'ticket-attachments');

CREATE POLICY "Allow authenticated updates on ticket-attachments" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'ticket-attachments') WITH CHECK (bucket_id = 'ticket-attachments');

CREATE POLICY "Allow authenticated delete on ticket-attachments" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'ticket-attachments');
