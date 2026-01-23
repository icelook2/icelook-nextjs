-- ============================================================================
-- ICELOOK INITIAL SCHEMA
-- ============================================================================
-- Solo creator model where:
-- - One user creates a beauty page and becomes its creator
-- - The creator manages services, schedule, and appointments
-- - Only authenticated users can book appointments
-- ============================================================================

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================================
-- 1. PROFILES
-- User profiles synced from auth.users
-- ============================================================================

CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text,
  full_name text,
  phone text,
  avatar_url text,
  preferred_locale text CHECK (preferred_locale IN ('en', 'uk') OR preferred_locale IS NULL),
  visit_preferences jsonb DEFAULT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON COLUMN profiles.preferred_locale IS 'User preferred language: en or uk. NULL = browser default';
COMMENT ON COLUMN profiles.visit_preferences IS 'User visit preferences (communication style, accessibility, allergies)';

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Shared updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 2. BEAUTY PAGE TYPES
-- ============================================================================

CREATE TABLE public.beauty_page_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.beauty_page_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read beauty page types" ON public.beauty_page_types FOR SELECT USING (true);

INSERT INTO public.beauty_page_types (name, slug) VALUES
  ('Barbershop', 'barbershop'),
  ('Hair Salon', 'hair_salon'),
  ('Nail Salon', 'nail_salon'),
  ('Spa', 'spa'),
  ('Beauty Studio', 'beauty_studio');

-- ============================================================================
-- 3. BEAUTY PAGES
-- ============================================================================

CREATE TABLE public.beauty_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  type_id uuid NOT NULL REFERENCES public.beauty_page_types(id) ON DELETE RESTRICT,
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Visual identity
  logo_url text,
  description text,

  -- Creator profile
  display_name text,
  avatar_url text,
  bio text,

  -- Contact
  address text,
  city text,
  postal_code text,
  country_code text DEFAULT 'UA',
  phone text,
  email text,
  website_url text,
  instagram_url text,
  facebook_url text,

  -- Settings
  currency text NOT NULL DEFAULT 'UAH',
  timezone text NOT NULL DEFAULT 'Europe/Kyiv',
  auto_confirm_bookings boolean NOT NULL DEFAULT false,
  min_booking_notice_hours int NOT NULL DEFAULT 0,
  max_days_ahead int NOT NULL DEFAULT 90,
  cancellation_notice_hours int NOT NULL DEFAULT 24,

  -- Status
  is_active boolean NOT NULL DEFAULT true,
  is_verified boolean NOT NULL DEFAULT false,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX beauty_pages_owner_id_idx ON public.beauty_pages(owner_id);
CREATE INDEX beauty_pages_slug_idx ON public.beauty_pages(slug);
CREATE INDEX beauty_pages_type_id_idx ON public.beauty_pages(type_id);
CREATE INDEX idx_beauty_pages_slug_trgm ON public.beauty_pages USING gin (slug gin_trgm_ops);
CREATE INDEX idx_beauty_pages_name_trgm ON public.beauty_pages USING gin (name gin_trgm_ops);
CREATE INDEX idx_beauty_pages_display_name_trgm ON public.beauty_pages USING gin (display_name gin_trgm_ops);

ALTER TABLE public.beauty_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active beauty pages" ON public.beauty_pages FOR SELECT USING (is_active = true);
CREATE POLICY "Owners can read their own beauty pages" ON public.beauty_pages FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can create their own beauty pages" ON public.beauty_pages FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update their own beauty pages" ON public.beauty_pages FOR UPDATE USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can delete their own beauty pages" ON public.beauty_pages FOR DELETE USING (auth.uid() = owner_id);

CREATE TRIGGER on_beauty_pages_updated
  BEFORE UPDATE ON public.beauty_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. SERVICE GROUPS
-- ============================================================================

CREATE TABLE public.service_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  beauty_page_id uuid NOT NULL REFERENCES public.beauty_pages(id) ON DELETE CASCADE,
  name text NOT NULL,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX service_groups_beauty_page_id_idx ON public.service_groups(beauty_page_id);

ALTER TABLE public.service_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read service groups of active beauty pages" ON public.service_groups FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.beauty_pages WHERE beauty_pages.id = service_groups.beauty_page_id AND beauty_pages.is_active = true));

CREATE POLICY "Owners can read their own service groups" ON public.service_groups FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.beauty_pages WHERE beauty_pages.id = service_groups.beauty_page_id AND beauty_pages.owner_id = auth.uid()));

CREATE POLICY "Owners can create service groups" ON public.service_groups FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.beauty_pages WHERE beauty_pages.id = service_groups.beauty_page_id AND beauty_pages.owner_id = auth.uid()));

CREATE POLICY "Owners can update service groups" ON public.service_groups FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.beauty_pages WHERE beauty_pages.id = service_groups.beauty_page_id AND beauty_pages.owner_id = auth.uid()));

CREATE POLICY "Owners can delete service groups" ON public.service_groups FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.beauty_pages WHERE beauty_pages.id = service_groups.beauty_page_id AND beauty_pages.owner_id = auth.uid()));

CREATE TRIGGER on_service_groups_updated
  BEFORE UPDATE ON public.service_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. SERVICES
-- ============================================================================

CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_group_id uuid NOT NULL REFERENCES public.service_groups(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price_cents int NOT NULL CHECK (price_cents >= 0),
  duration_minutes int NOT NULL CHECK (duration_minutes > 0),
  display_order int NOT NULL DEFAULT 0,
  is_hidden boolean NOT NULL DEFAULT false,
  available_from_time time,
  available_to_time time,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX services_service_group_id_idx ON public.services(service_group_id);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read services of active beauty pages" ON public.services FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.service_groups
    JOIN public.beauty_pages ON beauty_pages.id = service_groups.beauty_page_id
    WHERE service_groups.id = services.service_group_id AND beauty_pages.is_active = true
  ));

CREATE POLICY "Owners can read their own services" ON public.services FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.service_groups
    JOIN public.beauty_pages ON beauty_pages.id = service_groups.beauty_page_id
    WHERE service_groups.id = services.service_group_id AND beauty_pages.owner_id = auth.uid()
  ));

CREATE POLICY "Owners can create services" ON public.services FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.service_groups
    JOIN public.beauty_pages ON beauty_pages.id = service_groups.beauty_page_id
    WHERE service_groups.id = services.service_group_id AND beauty_pages.owner_id = auth.uid()
  ));

CREATE POLICY "Owners can update services" ON public.services FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.service_groups
    JOIN public.beauty_pages ON beauty_pages.id = service_groups.beauty_page_id
    WHERE service_groups.id = services.service_group_id AND beauty_pages.owner_id = auth.uid()
  ));

CREATE POLICY "Owners can delete services" ON public.services FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.service_groups
    JOIN public.beauty_pages ON beauty_pages.id = service_groups.beauty_page_id
    WHERE service_groups.id = services.service_group_id AND beauty_pages.owner_id = auth.uid()
  ));

CREATE TRIGGER on_services_updated
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. WORKING DAYS
-- ============================================================================

CREATE TABLE public.working_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  beauty_page_id uuid NOT NULL REFERENCES public.beauty_pages(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT working_days_time_check CHECK (start_time < end_time),
  UNIQUE (beauty_page_id, date)
);

CREATE INDEX working_days_beauty_page_id_idx ON public.working_days(beauty_page_id);
CREATE INDEX working_days_date_idx ON public.working_days(date);
CREATE INDEX working_days_beauty_page_date_idx ON public.working_days(beauty_page_id, date);

ALTER TABLE public.working_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view working days of active beauty pages" ON public.working_days FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.beauty_pages WHERE beauty_pages.id = working_days.beauty_page_id AND beauty_pages.is_active = true));

CREATE POLICY "Owners can view their working days" ON public.working_days FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.beauty_pages WHERE beauty_pages.id = working_days.beauty_page_id AND beauty_pages.owner_id = auth.uid()));

CREATE POLICY "Owners can create working days" ON public.working_days FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.beauty_pages WHERE beauty_pages.id = working_days.beauty_page_id AND beauty_pages.owner_id = auth.uid()));

CREATE POLICY "Owners can update working days" ON public.working_days FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.beauty_pages WHERE beauty_pages.id = working_days.beauty_page_id AND beauty_pages.owner_id = auth.uid()));

CREATE POLICY "Owners can delete working days" ON public.working_days FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.beauty_pages WHERE beauty_pages.id = working_days.beauty_page_id AND beauty_pages.owner_id = auth.uid()));

CREATE TRIGGER on_working_days_updated
  BEFORE UPDATE ON public.working_days
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. WORKING DAY BREAKS
-- ============================================================================

CREATE TABLE public.working_day_breaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  working_day_id uuid NOT NULL REFERENCES public.working_days(id) ON DELETE CASCADE,
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT working_day_breaks_time_check CHECK (start_time < end_time)
);

CREATE INDEX working_day_breaks_working_day_id_idx ON public.working_day_breaks(working_day_id);

ALTER TABLE public.working_day_breaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view breaks of active beauty pages" ON public.working_day_breaks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.working_days wd
    JOIN public.beauty_pages bp ON bp.id = wd.beauty_page_id
    WHERE wd.id = working_day_id AND bp.is_active = true
  ));

CREATE POLICY "Owners can view their breaks" ON public.working_day_breaks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.working_days wd
    JOIN public.beauty_pages bp ON bp.id = wd.beauty_page_id
    WHERE wd.id = working_day_id AND bp.owner_id = auth.uid()
  ));

CREATE POLICY "Owners can create breaks" ON public.working_day_breaks FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.working_days wd
    JOIN public.beauty_pages bp ON bp.id = wd.beauty_page_id
    WHERE wd.id = working_day_id AND bp.owner_id = auth.uid()
  ));

CREATE POLICY "Owners can update breaks" ON public.working_day_breaks FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.working_days wd
    JOIN public.beauty_pages bp ON bp.id = wd.beauty_page_id
    WHERE wd.id = working_day_id AND bp.owner_id = auth.uid()
  ));

CREATE POLICY "Owners can delete breaks" ON public.working_day_breaks FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.working_days wd
    JOIN public.beauty_pages bp ON bp.id = wd.beauty_page_id
    WHERE wd.id = working_day_id AND bp.owner_id = auth.uid()
  ));

-- ============================================================================
-- 8. APPOINTMENTS
-- ============================================================================

CREATE TYPE public.appointment_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');

CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  beauty_page_id uuid NOT NULL REFERENCES public.beauty_pages(id) ON DELETE CASCADE,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Snapshot data (for historical accuracy)
  creator_display_name text NOT NULL,
  service_name text NOT NULL,
  service_price_cents int NOT NULL,
  service_currency text NOT NULL DEFAULT 'UAH',
  service_duration_minutes int NOT NULL,

  -- Client info snapshot (from profile at booking time)
  client_name text NOT NULL,
  client_phone text,
  client_email text,

  -- Timing
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  timezone text NOT NULL DEFAULT 'Europe/Kyiv',

  -- Status
  status public.appointment_status NOT NULL DEFAULT 'pending',
  client_notes text,
  creator_notes text,
  visit_preferences jsonb DEFAULT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  cancelled_at timestamptz,

  CONSTRAINT appointments_time_check CHECK (start_time < end_time)
);

CREATE INDEX appointments_beauty_page_id_idx ON public.appointments(beauty_page_id);
CREATE INDEX appointments_service_id_idx ON public.appointments(service_id);
CREATE INDEX appointments_client_id_idx ON public.appointments(client_id);
CREATE INDEX appointments_date_idx ON public.appointments(date);
CREATE INDEX appointments_beauty_page_date_idx ON public.appointments(beauty_page_id, date);
CREATE INDEX appointments_status_idx ON public.appointments(status);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own appointments" ON public.appointments FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "Authenticated users can create appointments" ON public.appointments FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND client_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.beauty_pages WHERE beauty_pages.id = appointments.beauty_page_id AND beauty_pages.is_active = true)
  );

CREATE POLICY "Owners can view their appointments" ON public.appointments FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.beauty_pages WHERE beauty_pages.id = appointments.beauty_page_id AND beauty_pages.owner_id = auth.uid()));

CREATE POLICY "Owners can update their appointments" ON public.appointments FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.beauty_pages WHERE beauty_pages.id = appointments.beauty_page_id AND beauty_pages.owner_id = auth.uid()));

CREATE POLICY "Owners can delete their appointments" ON public.appointments FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.beauty_pages WHERE beauty_pages.id = appointments.beauty_page_id AND beauty_pages.owner_id = auth.uid()));

CREATE TRIGGER on_appointments_updated
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 9. APPOINTMENT SERVICES
-- ============================================================================

CREATE TABLE public.appointment_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  service_name text NOT NULL,
  price_cents integer NOT NULL,
  duration_minutes integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX appointment_services_appointment_id_idx ON public.appointment_services(appointment_id);
CREATE INDEX appointment_services_service_id_idx ON public.appointment_services(service_id);

ALTER TABLE public.appointment_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view appointment services for their appointments" ON public.appointment_services FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.id = appointment_services.appointment_id
    AND (a.client_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.beauty_pages bp WHERE bp.id = a.beauty_page_id AND bp.owner_id = auth.uid()
    ))
  ));

CREATE POLICY "Beauty page owners can manage appointment services" ON public.appointment_services FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.appointments a
    JOIN public.beauty_pages bp ON bp.id = a.beauty_page_id
    WHERE a.id = appointment_services.appointment_id AND bp.owner_id = auth.uid()
  ));

CREATE POLICY "Anyone can create appointment services" ON public.appointment_services FOR INSERT WITH CHECK (true);

-- ============================================================================
-- 10. BUSINESS HOURS (weekly schedule)
-- ============================================================================

CREATE TABLE public.business_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  beauty_page_id uuid NOT NULL REFERENCES public.beauty_pages(id) ON DELETE CASCADE,
  day_of_week int NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  is_open boolean NOT NULL DEFAULT true,
  open_time time,
  close_time time,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (beauty_page_id, day_of_week),
  CONSTRAINT business_hours_time_check CHECK ((is_open = false) OR (open_time IS NOT NULL AND close_time IS NOT NULL AND open_time < close_time))
);

CREATE INDEX business_hours_beauty_page_id_idx ON public.business_hours(beauty_page_id);

ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read business hours" ON public.business_hours FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.beauty_pages WHERE beauty_pages.id = business_hours.beauty_page_id AND beauty_pages.is_active = true));

CREATE POLICY "Owners can read their business hours" ON public.business_hours FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.beauty_pages WHERE beauty_pages.id = business_hours.beauty_page_id AND beauty_pages.owner_id = auth.uid()));

CREATE POLICY "Owners can create business hours" ON public.business_hours FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.beauty_pages WHERE beauty_pages.id = business_hours.beauty_page_id AND beauty_pages.owner_id = auth.uid()));

CREATE POLICY "Owners can update business hours" ON public.business_hours FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.beauty_pages WHERE beauty_pages.id = business_hours.beauty_page_id AND beauty_pages.owner_id = auth.uid()));

CREATE POLICY "Owners can delete business hours" ON public.business_hours FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.beauty_pages WHERE beauty_pages.id = business_hours.beauty_page_id AND beauty_pages.owner_id = auth.uid()));

CREATE TRIGGER on_business_hours_updated
  BEFORE UPDATE ON public.business_hours
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 11. CANCELLATION POLICIES
-- ============================================================================

CREATE TABLE public.cancellation_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  beauty_page_id uuid NOT NULL UNIQUE REFERENCES public.beauty_pages(id) ON DELETE CASCADE,
  allow_cancellation boolean NOT NULL DEFAULT true,
  cancellation_notice_hours int NOT NULL DEFAULT 24,
  cancellation_fee_percentage int NOT NULL DEFAULT 0 CHECK (cancellation_fee_percentage >= 0 AND cancellation_fee_percentage <= 100),
  policy_text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX cancellation_policies_beauty_page_id_idx ON public.cancellation_policies(beauty_page_id);

ALTER TABLE public.cancellation_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cancellation policies" ON public.cancellation_policies FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.beauty_pages WHERE beauty_pages.id = cancellation_policies.beauty_page_id AND beauty_pages.is_active = true));

CREATE POLICY "Owners can read their cancellation policy" ON public.cancellation_policies FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.beauty_pages WHERE beauty_pages.id = cancellation_policies.beauty_page_id AND beauty_pages.owner_id = auth.uid()));

CREATE POLICY "Owners can create cancellation policy" ON public.cancellation_policies FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.beauty_pages WHERE beauty_pages.id = cancellation_policies.beauty_page_id AND beauty_pages.owner_id = auth.uid()));

CREATE POLICY "Owners can update cancellation policy" ON public.cancellation_policies FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.beauty_pages WHERE beauty_pages.id = cancellation_policies.beauty_page_id AND beauty_pages.owner_id = auth.uid()));

CREATE POLICY "Owners can delete cancellation policy" ON public.cancellation_policies FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.beauty_pages WHERE beauty_pages.id = cancellation_policies.beauty_page_id AND beauty_pages.owner_id = auth.uid()));

CREATE TRIGGER on_cancellation_policies_updated
  BEFORE UPDATE ON public.cancellation_policies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 12. BEAUTY PAGE CLIENTS (junction table)
-- Replaces: blocked_clients, client_notes, client_no_shows
-- ============================================================================

CREATE TABLE public.beauty_page_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  beauty_page_id uuid NOT NULL REFERENCES public.beauty_pages(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Blocking (NULL = not blocked)
  blocked_at timestamptz,
  blocked_until timestamptz,

  -- No-show tracking
  no_show_count integer NOT NULL DEFAULT 0,

  -- Creator's private notes
  notes text,

  created_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE(beauty_page_id, client_id)
);

CREATE INDEX beauty_page_clients_beauty_page_id_idx ON public.beauty_page_clients(beauty_page_id);
CREATE INDEX beauty_page_clients_client_id_idx ON public.beauty_page_clients(client_id);
CREATE INDEX beauty_page_clients_blocked_idx ON public.beauty_page_clients(beauty_page_id) WHERE blocked_at IS NOT NULL;

ALTER TABLE public.beauty_page_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their clients" ON public.beauty_page_clients FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.beauty_pages WHERE beauty_pages.id = beauty_page_clients.beauty_page_id AND beauty_pages.owner_id = auth.uid()));

CREATE POLICY "Owners can manage their clients" ON public.beauty_page_clients FOR ALL
  USING (EXISTS (SELECT 1 FROM public.beauty_pages WHERE beauty_pages.id = beauty_page_clients.beauty_page_id AND beauty_pages.owner_id = auth.uid()));

-- Clients can check if they are blocked (for booking flow)
CREATE POLICY "Clients can check their own status" ON public.beauty_page_clients FOR SELECT
  USING (client_id = auth.uid());

-- ============================================================================
-- 13. TRIGGER: Ensure client relationship on appointment
-- ============================================================================

CREATE OR REPLACE FUNCTION public.ensure_client_relationship()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.beauty_page_clients (beauty_page_id, client_id)
  VALUES (NEW.beauty_page_id, NEW.client_id)
  ON CONFLICT (beauty_page_id, client_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_appointment_created
  AFTER INSERT ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.ensure_client_relationship();

-- ============================================================================
-- 14. TRIGGER: Update no-show count
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_no_show_count()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'no_show' AND (OLD.status IS NULL OR OLD.status != 'no_show') THEN
    UPDATE public.beauty_page_clients
    SET no_show_count = no_show_count + 1
    WHERE beauty_page_id = NEW.beauty_page_id AND client_id = NEW.client_id;
  ELSIF OLD.status = 'no_show' AND NEW.status != 'no_show' THEN
    UPDATE public.beauty_page_clients
    SET no_show_count = GREATEST(0, no_show_count - 1)
    WHERE beauty_page_id = NEW.beauty_page_id AND client_id = NEW.client_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_appointment_status_change
  AFTER UPDATE OF status ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_no_show_count();

-- ============================================================================
-- 15. RPC: Search Beauty Pages
-- ============================================================================

CREATE OR REPLACE FUNCTION public.search_beauty_pages(
  search_query text,
  result_limit int DEFAULT 5,
  result_offset int DEFAULT 0,
  viewer_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  slug text,
  name text,
  display_name text,
  logo_url text,
  city text,
  is_verified boolean,
  type_name text,
  similarity_score real
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT
    bp.id, bp.slug, bp.name, bp.display_name, bp.logo_url, bp.city, bp.is_verified,
    bpt.name AS type_name,
    GREATEST(
      similarity(lower(bp.slug), lower(search_query)),
      similarity(lower(bp.name), lower(search_query)),
      COALESCE(similarity(lower(bp.display_name), lower(search_query)), 0)
    ) AS similarity_score
  FROM public.beauty_pages bp
  LEFT JOIN public.beauty_page_types bpt ON bpt.id = bp.type_id
  WHERE bp.is_active = true
    AND (bp.slug % search_query OR bp.name % search_query OR bp.display_name % search_query)
    AND (
      viewer_id IS NULL
      OR NOT EXISTS (
        SELECT 1 FROM public.beauty_page_clients bpc
        WHERE bpc.beauty_page_id = bp.id
        AND bpc.client_id = viewer_id
        AND bpc.blocked_at IS NOT NULL
        AND (bpc.blocked_until IS NULL OR bpc.blocked_until > now())
      )
    )
  ORDER BY similarity_score DESC, bp.is_verified DESC, bp.name
  LIMIT result_limit OFFSET result_offset;
END;
$$;

-- ============================================================================
-- 16. RPC: Get Beauty Page For Viewer
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_beauty_page_for_viewer(
  p_nickname text,
  p_viewer_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_beauty_page record;
  v_beauty_page_id uuid;
  v_is_blocked boolean := false;
  v_today date;
  v_future_date date;
  v_result jsonb;
BEGIN
  SELECT bp.id, bp.name, bp.slug, bp.owner_id, bp.logo_url, bp.description,
    bp.is_active, bp.is_verified, bp.timezone,
    bp.display_name AS creator_display_name, bp.avatar_url AS creator_avatar_url, bp.bio AS creator_bio,
    bp.address, bp.city, bp.postal_code, bp.country_code, bp.phone, bp.email,
    bp.website_url, bp.instagram_url, bp.facebook_url,
    bpt.id AS type_id, bpt.name AS type_name, bpt.slug AS type_slug
  INTO v_beauty_page
  FROM public.beauty_pages bp
  LEFT JOIN public.beauty_page_types bpt ON bpt.id = bp.type_id
  WHERE bp.slug = p_nickname AND bp.is_active = true;

  IF v_beauty_page IS NULL THEN RETURN NULL; END IF;

  v_beauty_page_id := v_beauty_page.id;

  IF p_viewer_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.beauty_page_clients bpc
      WHERE bpc.beauty_page_id = v_beauty_page_id
      AND bpc.client_id = p_viewer_id
      AND bpc.blocked_at IS NOT NULL
      AND (bpc.blocked_until IS NULL OR bpc.blocked_until > now())
    ) INTO v_is_blocked;

    IF v_is_blocked THEN RETURN jsonb_build_object('banned', true); END IF;
  END IF;

  v_today := current_date;
  v_future_date := current_date + interval '30 days';

  SELECT jsonb_build_object(
    'banned', false,
    'info', jsonb_build_object(
      'id', v_beauty_page.id, 'name', v_beauty_page.name, 'slug', v_beauty_page.slug,
      'owner_id', v_beauty_page.owner_id, 'logo_url', v_beauty_page.logo_url,
      'description', v_beauty_page.description, 'is_active', v_beauty_page.is_active,
      'is_verified', v_beauty_page.is_verified,
      'creator_display_name', v_beauty_page.creator_display_name,
      'creator_avatar_url', v_beauty_page.creator_avatar_url,
      'creator_bio', v_beauty_page.creator_bio,
      'address', v_beauty_page.address, 'city', v_beauty_page.city,
      'postal_code', v_beauty_page.postal_code, 'country_code', v_beauty_page.country_code,
      'phone', v_beauty_page.phone, 'email', v_beauty_page.email,
      'website_url', v_beauty_page.website_url,
      'instagram_url', v_beauty_page.instagram_url,
      'facebook_url', v_beauty_page.facebook_url,
      'type', CASE WHEN v_beauty_page.type_id IS NOT NULL THEN
        jsonb_build_object('id', v_beauty_page.type_id, 'name', v_beauty_page.type_name, 'slug', v_beauty_page.type_slug)
      ELSE NULL END
    ),
    'timezone', COALESCE(v_beauty_page.timezone, 'Europe/Kyiv'),
    'workingDays', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('date', wd.date, 'startTime', wd.start_time, 'endTime', wd.end_time) ORDER BY wd.date), '[]'::jsonb)
      FROM public.working_days wd
      WHERE wd.beauty_page_id = v_beauty_page_id AND wd.date >= v_today AND wd.date <= v_future_date
    ),
    'serviceGroups', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', sg.id, 'name', sg.name, 'display_order', sg.display_order,
        'services', (
          SELECT COALESCE(jsonb_agg(jsonb_build_object(
            'id', s.id, 'name', s.name, 'description', s.description,
            'display_order', s.display_order, 'price_cents', s.price_cents,
            'duration_minutes', s.duration_minutes,
            'available_from_time', s.available_from_time, 'available_to_time', s.available_to_time
          ) ORDER BY s.display_order), '[]'::jsonb)
          FROM public.services s
          WHERE s.service_group_id = sg.id AND s.is_hidden = false
        )
      ) ORDER BY sg.display_order), '[]'::jsonb)
      FROM public.service_groups sg WHERE sg.beauty_page_id = v_beauty_page_id
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ============================================================================
-- 17. RPC: Get Beauty Page Clients (paginated)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_beauty_page_clients(
  p_beauty_page_id uuid,
  p_search text DEFAULT NULL,
  p_limit int DEFAULT 10,
  p_offset int DEFAULT 0,
  p_include_blocked boolean DEFAULT false
)
RETURNS TABLE (
  client_id uuid,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  notes text,
  blocked_at timestamptz,
  blocked_until timestamptz,
  no_show_count integer,
  total_visits bigint,
  total_spent_cents bigint,
  first_visit_at date,
  last_visit_at date,
  created_at timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT
    bpc.client_id,
    p.full_name,
    p.email,
    p.phone,
    p.avatar_url,
    bpc.notes,
    bpc.blocked_at,
    bpc.blocked_until,
    bpc.no_show_count,
    COUNT(a.id) FILTER (WHERE a.status = 'completed')::bigint AS total_visits,
    COALESCE(SUM(a.service_price_cents) FILTER (WHERE a.status = 'completed'), 0)::bigint AS total_spent_cents,
    MIN(a.date) FILTER (WHERE a.status = 'completed') AS first_visit_at,
    MAX(a.date) FILTER (WHERE a.status = 'completed') AS last_visit_at,
    bpc.created_at
  FROM public.beauty_page_clients bpc
  JOIN public.profiles p ON p.id = bpc.client_id
  LEFT JOIN public.appointments a ON a.client_id = bpc.client_id AND a.beauty_page_id = bpc.beauty_page_id
  WHERE bpc.beauty_page_id = p_beauty_page_id
    AND (
      p_include_blocked = true
      OR bpc.blocked_at IS NULL
      OR (bpc.blocked_until IS NOT NULL AND bpc.blocked_until <= now())
    )
    AND (
      p_search IS NULL
      OR p.full_name ILIKE '%' || p_search || '%'
      OR p.email ILIKE '%' || p_search || '%'
      OR p.phone ILIKE '%' || p_search || '%'
    )
  GROUP BY bpc.id, p.id
  ORDER BY p.full_name
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- ============================================================================
-- 18. RPC: Get Blocked Clients
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_blocked_clients(p_beauty_page_id uuid)
RETURNS TABLE (
  client_id uuid,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  blocked_at timestamptz,
  blocked_until timestamptz,
  no_show_count integer,
  notes text
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT
    bpc.client_id,
    p.full_name,
    p.email,
    p.phone,
    p.avatar_url,
    bpc.blocked_at,
    bpc.blocked_until,
    bpc.no_show_count,
    bpc.notes
  FROM public.beauty_page_clients bpc
  JOIN public.profiles p ON p.id = bpc.client_id
  WHERE bpc.beauty_page_id = p_beauty_page_id
    AND bpc.blocked_at IS NOT NULL
    AND (bpc.blocked_until IS NULL OR bpc.blocked_until > now())
  ORDER BY bpc.blocked_at DESC;
END;
$$;

-- ============================================================================
-- 19. RPC: Block/Unblock Client
-- ============================================================================

CREATE OR REPLACE FUNCTION public.block_client(
  p_beauty_page_id uuid,
  p_client_id uuid,
  p_blocked_until timestamptz DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.beauty_page_clients
  SET blocked_at = now(), blocked_until = p_blocked_until
  WHERE beauty_page_id = p_beauty_page_id AND client_id = p_client_id;

  IF NOT FOUND THEN
    INSERT INTO public.beauty_page_clients (beauty_page_id, client_id, blocked_at, blocked_until)
    VALUES (p_beauty_page_id, p_client_id, now(), p_blocked_until);
  END IF;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.unblock_client(p_beauty_page_id uuid, p_client_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.beauty_page_clients
  SET blocked_at = NULL, blocked_until = NULL
  WHERE beauty_page_id = p_beauty_page_id AND client_id = p_client_id;
  RETURN FOUND;
END;
$$;

-- ============================================================================
-- 20. RPC: Check if user is blocked
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_client_blocked(p_beauty_page_id uuid, p_client_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.beauty_page_clients
    WHERE beauty_page_id = p_beauty_page_id
    AND client_id = p_client_id
    AND blocked_at IS NOT NULL
    AND (blocked_until IS NULL OR blocked_until > now())
  );
$$;

-- ============================================================================
-- 21. RPC: Update client notes
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_client_notes(
  p_beauty_page_id uuid,
  p_client_id uuid,
  p_notes text
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.beauty_page_clients
  SET notes = p_notes
  WHERE beauty_page_id = p_beauty_page_id AND client_id = p_client_id;

  IF NOT FOUND THEN
    INSERT INTO public.beauty_page_clients (beauty_page_id, client_id, notes)
    VALUES (p_beauty_page_id, p_client_id, p_notes);
  END IF;

  RETURN true;
END;
$$;
