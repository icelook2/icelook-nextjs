-- ============================================================================
-- ICELOOK INITIAL SCHEMA - SOLO CREATOR MODEL
-- ============================================================================
-- This schema supports a solo creator model where:
-- - One user creates a beauty page and becomes its creator
-- - The creator manages services, schedule, and appointments
-- - No team management (admins, specialists, invitations)
-- ============================================================================

-- ============================================================================
-- 1. PROFILES TABLE
-- Stores additional user information synced from auth.users
-- ============================================================================

create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  preferred_locale text check (preferred_locale in ('en', 'uk') or preferred_locale is null),
  visit_preferences jsonb default null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on column profiles.preferred_locale is
  'User preferred language: en (English) or uk (Ukrainian). NULL means use browser default.';

comment on column profiles.visit_preferences is
  'User visit preferences (communication style, accessibility needs, allergies)';

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- Function to automatically create a profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Function to update the updated_at timestamp (reused by multiple tables)
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at
  before update on profiles
  for each row
  execute function update_updated_at_column();

-- ============================================================================
-- 2. BEAUTY PAGE TYPES
-- Predefined types of beauty pages (barbershop, salon, etc.)
-- ============================================================================

create table public.beauty_page_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

alter table public.beauty_page_types enable row level security;

create policy "Anyone can read beauty page types"
  on public.beauty_page_types
  for select
  using (true);

-- Seed initial beauty page types
insert into public.beauty_page_types (name, slug) values
  ('Barbershop', 'barbershop'),
  ('Hair Salon', 'hair_salon'),
  ('Nail Salon', 'nail_salon'),
  ('Spa', 'spa'),
  ('Beauty Studio', 'beauty_studio');

-- ============================================================================
-- 3. BEAUTY PAGES
-- Main table for beauty businesses (solo creator model)
-- The owner_id IS the creator who provides all services
-- ============================================================================

create table public.beauty_pages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  type_id uuid not null references public.beauty_page_types(id) on delete restrict,
  owner_id uuid not null references public.profiles(id) on delete cascade,

  -- Visual identity
  logo_url text,
  description text,

  -- Creator profile (displayed on beauty page)
  display_name text,
  avatar_url text,
  bio text,

  -- Contact information
  address text,
  city text,
  postal_code text,
  country_code text default 'UA',
  phone text,
  email text,
  website_url text,
  instagram_url text,
  facebook_url text,

  -- Currency and timezone
  currency text not null default 'UAH',
  timezone text not null default 'Europe/Kyiv',

  -- Booking settings
  auto_confirm_bookings boolean not null default false,
  min_booking_notice_hours int not null default 0,
  max_days_ahead int not null default 90,
  cancellation_notice_hours int not null default 24,

  -- Status
  is_active boolean not null default true,
  is_verified boolean not null default false,

  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index beauty_pages_owner_id_idx on public.beauty_pages(owner_id);
create index beauty_pages_slug_idx on public.beauty_pages(slug);
create index beauty_pages_type_id_idx on public.beauty_pages(type_id);

alter table public.beauty_pages enable row level security;

-- Anyone can read active beauty pages
create policy "Anyone can read active beauty pages"
  on public.beauty_pages
  for select
  using (is_active = true);

-- Owners can read their own beauty pages (even if inactive)
create policy "Owners can read their own beauty pages"
  on public.beauty_pages
  for select
  using (auth.uid() = owner_id);

-- Users can create their own beauty pages
create policy "Users can create their own beauty pages"
  on public.beauty_pages
  for insert
  with check (auth.uid() = owner_id);

-- Owners can update their own beauty pages
create policy "Owners can update their own beauty pages"
  on public.beauty_pages
  for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Owners can delete their own beauty pages
create policy "Owners can delete their own beauty pages"
  on public.beauty_pages
  for delete
  using (auth.uid() = owner_id);

create trigger on_beauty_pages_updated
  before update on public.beauty_pages
  for each row
  execute function update_updated_at_column();

-- ============================================================================
-- 4. SERVICE GROUPS
-- Categories for organizing services
-- ============================================================================

create table public.service_groups (
  id uuid primary key default gen_random_uuid(),
  beauty_page_id uuid not null references public.beauty_pages(id) on delete cascade,
  name text not null,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index service_groups_beauty_page_id_idx on public.service_groups(beauty_page_id);

alter table public.service_groups enable row level security;

-- Anyone can read service groups of active beauty pages
create policy "Anyone can read service groups of active beauty pages"
  on public.service_groups
  for select
  using (
    exists (
      select 1 from public.beauty_pages
      where beauty_pages.id = service_groups.beauty_page_id
      and beauty_pages.is_active = true
    )
  );

-- Owners can read their own service groups
create policy "Owners can read their own service groups"
  on public.service_groups
  for select
  using (
    exists (
      select 1 from public.beauty_pages
      where beauty_pages.id = service_groups.beauty_page_id
      and beauty_pages.owner_id = auth.uid()
    )
  );

-- Owners can create service groups
create policy "Owners can create service groups"
  on public.service_groups
  for insert
  with check (
    exists (
      select 1 from public.beauty_pages
      where beauty_pages.id = service_groups.beauty_page_id
      and beauty_pages.owner_id = auth.uid()
    )
  );

-- Owners can update service groups
create policy "Owners can update service groups"
  on public.service_groups
  for update
  using (
    exists (
      select 1 from public.beauty_pages
      where beauty_pages.id = service_groups.beauty_page_id
      and beauty_pages.owner_id = auth.uid()
    )
  );

-- Owners can delete service groups
create policy "Owners can delete service groups"
  on public.service_groups
  for delete
  using (
    exists (
      select 1 from public.beauty_pages
      where beauty_pages.id = service_groups.beauty_page_id
      and beauty_pages.owner_id = auth.uid()
    )
  );

create trigger on_service_groups_updated
  before update on public.service_groups
  for each row
  execute function update_updated_at_column();

-- ============================================================================
-- 5. SERVICES
-- Individual services with price and duration (no specialist assignment)
-- ============================================================================

create table public.services (
  id uuid primary key default gen_random_uuid(),
  service_group_id uuid not null references public.service_groups(id) on delete cascade,
  name text not null,
  price_cents int not null check (price_cents >= 0),
  duration_minutes int not null check (duration_minutes > 0),
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index services_service_group_id_idx on public.services(service_group_id);

alter table public.services enable row level security;

-- Anyone can read services of active beauty pages
create policy "Anyone can read services of active beauty pages"
  on public.services
  for select
  using (
    exists (
      select 1 from public.service_groups
      join public.beauty_pages on beauty_pages.id = service_groups.beauty_page_id
      where service_groups.id = services.service_group_id
      and beauty_pages.is_active = true
    )
  );

-- Owners can read their own services
create policy "Owners can read their own services"
  on public.services
  for select
  using (
    exists (
      select 1 from public.service_groups
      join public.beauty_pages on beauty_pages.id = service_groups.beauty_page_id
      where service_groups.id = services.service_group_id
      and beauty_pages.owner_id = auth.uid()
    )
  );

-- Owners can create services
create policy "Owners can create services"
  on public.services
  for insert
  with check (
    exists (
      select 1 from public.service_groups
      join public.beauty_pages on beauty_pages.id = service_groups.beauty_page_id
      where service_groups.id = services.service_group_id
      and beauty_pages.owner_id = auth.uid()
    )
  );

-- Owners can update services
create policy "Owners can update services"
  on public.services
  for update
  using (
    exists (
      select 1 from public.service_groups
      join public.beauty_pages on beauty_pages.id = service_groups.beauty_page_id
      where service_groups.id = services.service_group_id
      and beauty_pages.owner_id = auth.uid()
    )
  );

-- Owners can delete services
create policy "Owners can delete services"
  on public.services
  for delete
  using (
    exists (
      select 1 from public.service_groups
      join public.beauty_pages on beauty_pages.id = service_groups.beauty_page_id
      where service_groups.id = services.service_group_id
      and beauty_pages.owner_id = auth.uid()
    )
  );

create trigger on_services_updated
  before update on public.services
  for each row
  execute function update_updated_at_column();

-- ============================================================================
-- 6. WORKING DAYS
-- Creator's working hours for specific dates (linked to beauty_page)
-- ============================================================================

create table public.working_days (
  id uuid primary key default gen_random_uuid(),
  beauty_page_id uuid not null references public.beauty_pages(id) on delete cascade,
  date date not null,
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint working_days_time_check check (start_time < end_time),
  unique (beauty_page_id, date)
);

create index working_days_beauty_page_id_idx on public.working_days(beauty_page_id);
create index working_days_date_idx on public.working_days(date);
create index working_days_beauty_page_date_idx on public.working_days(beauty_page_id, date);

alter table public.working_days enable row level security;

-- Anyone can view working days of active beauty pages
create policy "Anyone can view working days of active beauty pages"
  on public.working_days
  for select
  using (
    exists (
      select 1 from public.beauty_pages
      where beauty_pages.id = working_days.beauty_page_id
      and beauty_pages.is_active = true
    )
  );

-- Owners can manage their working days
create policy "Owners can view their working days"
  on public.working_days
  for select
  using (
    exists (
      select 1 from public.beauty_pages
      where beauty_pages.id = working_days.beauty_page_id
      and beauty_pages.owner_id = auth.uid()
    )
  );

create policy "Owners can create working days"
  on public.working_days
  for insert
  with check (
    exists (
      select 1 from public.beauty_pages
      where beauty_pages.id = working_days.beauty_page_id
      and beauty_pages.owner_id = auth.uid()
    )
  );

create policy "Owners can update working days"
  on public.working_days
  for update
  using (
    exists (
      select 1 from public.beauty_pages
      where beauty_pages.id = working_days.beauty_page_id
      and beauty_pages.owner_id = auth.uid()
    )
  );

create policy "Owners can delete working days"
  on public.working_days
  for delete
  using (
    exists (
      select 1 from public.beauty_pages
      where beauty_pages.id = working_days.beauty_page_id
      and beauty_pages.owner_id = auth.uid()
    )
  );

create trigger on_working_days_updated
  before update on public.working_days
  for each row
  execute function update_updated_at_column();

-- ============================================================================
-- 7. WORKING DAY BREAKS
-- Breaks within working days
-- ============================================================================

create table public.working_day_breaks (
  id uuid primary key default gen_random_uuid(),
  working_day_id uuid not null references public.working_days(id) on delete cascade,
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),

  constraint working_day_breaks_time_check check (start_time < end_time)
);

create index working_day_breaks_working_day_id_idx on public.working_day_breaks(working_day_id);

alter table public.working_day_breaks enable row level security;

-- Helper function to get beauty_page_id from working_day_id
create or replace function public.get_beauty_page_id_from_working_day(wd_id uuid)
returns uuid
language sql
security definer
stable
as $$
  select beauty_page_id from public.working_days where id = wd_id;
$$;

-- Anyone can view breaks of active beauty pages
create policy "Anyone can view breaks of active beauty pages"
  on public.working_day_breaks
  for select
  using (
    exists (
      select 1 from public.working_days wd
      join public.beauty_pages bp on bp.id = wd.beauty_page_id
      where wd.id = working_day_id
      and bp.is_active = true
    )
  );

-- Owners can manage their breaks
create policy "Owners can view their breaks"
  on public.working_day_breaks
  for select
  using (
    exists (
      select 1 from public.working_days wd
      join public.beauty_pages bp on bp.id = wd.beauty_page_id
      where wd.id = working_day_id
      and bp.owner_id = auth.uid()
    )
  );

create policy "Owners can create breaks"
  on public.working_day_breaks
  for insert
  with check (
    exists (
      select 1 from public.working_days wd
      join public.beauty_pages bp on bp.id = wd.beauty_page_id
      where wd.id = working_day_id
      and bp.owner_id = auth.uid()
    )
  );

create policy "Owners can update breaks"
  on public.working_day_breaks
  for update
  using (
    exists (
      select 1 from public.working_days wd
      join public.beauty_pages bp on bp.id = wd.beauty_page_id
      where wd.id = working_day_id
      and bp.owner_id = auth.uid()
    )
  );

create policy "Owners can delete breaks"
  on public.working_day_breaks
  for delete
  using (
    exists (
      select 1 from public.working_days wd
      join public.beauty_pages bp on bp.id = wd.beauty_page_id
      where wd.id = working_day_id
      and bp.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- 8. APPOINTMENTS
-- Booked appointments (linked to beauty_page, not specialist)
-- ============================================================================

create type public.appointment_status as enum (
  'pending',
  'confirmed',
  'completed',
  'cancelled',
  'no_show'
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),

  -- References
  beauty_page_id uuid not null references public.beauty_pages(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  client_id uuid references public.profiles(id) on delete set null,

  -- Denormalized snapshot data (for historical accuracy)
  creator_display_name text not null,
  service_name text not null,
  service_price_cents int not null,
  service_currency text not null default 'UAH',
  service_duration_minutes int not null,

  -- Client info (can be guest without account)
  client_name text not null,
  client_phone text not null,
  client_email text,

  -- Appointment timing
  date date not null,
  start_time time not null,
  end_time time not null,
  timezone text not null default 'Europe/Kyiv',

  -- Status and notes
  status public.appointment_status not null default 'pending',
  client_notes text,
  creator_notes text,

  -- Visit preferences snapshot (captured at booking time)
  visit_preferences jsonb default null,

  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cancelled_at timestamptz,

  constraint appointments_time_check check (start_time < end_time)
);

comment on column appointments.visit_preferences is
  'Snapshot of client visit preferences at booking time';

create index appointments_beauty_page_id_idx on public.appointments(beauty_page_id);
create index appointments_service_id_idx on public.appointments(service_id);
create index appointments_client_id_idx on public.appointments(client_id);
create index appointments_date_idx on public.appointments(date);
create index appointments_beauty_page_date_idx on public.appointments(beauty_page_id, date);
create index appointments_status_idx on public.appointments(status);

alter table public.appointments enable row level security;

-- Clients can view their own appointments
create policy "Clients can view own appointments"
  on public.appointments
  for select
  using (client_id = auth.uid());

-- Anyone can create appointments (for guest booking)
create policy "Anyone can create appointments"
  on public.appointments
  for insert
  with check (
    exists (
      select 1 from public.beauty_pages
      where beauty_pages.id = appointments.beauty_page_id
      and beauty_pages.is_active = true
    )
  );

-- Owners can manage their appointments
create policy "Owners can view their appointments"
  on public.appointments
  for select
  using (
    exists (
      select 1 from public.beauty_pages
      where beauty_pages.id = appointments.beauty_page_id
      and beauty_pages.owner_id = auth.uid()
    )
  );

create policy "Owners can update their appointments"
  on public.appointments
  for update
  using (
    exists (
      select 1 from public.beauty_pages
      where beauty_pages.id = appointments.beauty_page_id
      and beauty_pages.owner_id = auth.uid()
    )
  );

create policy "Owners can delete their appointments"
  on public.appointments
  for delete
  using (
    exists (
      select 1 from public.beauty_pages
      where beauty_pages.id = appointments.beauty_page_id
      and beauty_pages.owner_id = auth.uid()
    )
  );

create trigger on_appointments_updated
  before update on public.appointments
  for each row
  execute function update_updated_at_column();

-- ============================================================================
-- 8b. APPOINTMENT SERVICES
-- Individual services for each appointment (snapshot at booking time)
-- ============================================================================

create table public.appointment_services (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,

  -- Snapshot at booking time (immutable history)
  service_name text not null,
  price_cents integer not null,
  duration_minutes integer not null,

  created_at timestamptz not null default now()
);

create index appointment_services_appointment_id_idx on public.appointment_services(appointment_id);
create index appointment_services_service_id_idx on public.appointment_services(service_id);

alter table public.appointment_services enable row level security;

-- Users can view appointment services for their appointments
create policy "Users can view appointment services for their appointments"
  on public.appointment_services for select
  using (
    exists (
      select 1 from public.appointments a
      where a.id = appointment_services.appointment_id
      and (
        a.client_id = auth.uid()
        or exists (
          select 1 from public.beauty_pages bp
          where bp.id = a.beauty_page_id and bp.owner_id = auth.uid()
        )
      )
    )
  );

-- Beauty page owners can manage appointment services
create policy "Beauty page owners can manage appointment services"
  on public.appointment_services for all
  using (
    exists (
      select 1 from public.appointments a
      join public.beauty_pages bp on bp.id = a.beauty_page_id
      where a.id = appointment_services.appointment_id
      and bp.owner_id = auth.uid()
    )
  );

-- Anyone can create appointment services for new appointments
create policy "Anyone can create appointment services for new appointments"
  on public.appointment_services for insert
  with check (true);

-- ============================================================================
-- 9. CANCELLATION POLICIES
-- Configurable cancellation rules per beauty page
-- ============================================================================

create table public.cancellation_policies (
  id uuid primary key default gen_random_uuid(),
  beauty_page_id uuid not null unique references public.beauty_pages(id) on delete cascade,
  allow_cancellation boolean not null default true,
  cancellation_notice_hours int not null default 24,
  cancellation_fee_percentage int not null default 0 check (cancellation_fee_percentage >= 0 and cancellation_fee_percentage <= 100),
  policy_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index cancellation_policies_beauty_page_id_idx on public.cancellation_policies(beauty_page_id);

alter table public.cancellation_policies enable row level security;

-- Anyone can read cancellation policies of active beauty pages
create policy "Anyone can read cancellation policies"
  on public.cancellation_policies
  for select
  using (
    exists (
      select 1 from public.beauty_pages
      where beauty_pages.id = cancellation_policies.beauty_page_id
      and beauty_pages.is_active = true
    )
  );

-- Owners can manage their cancellation policy
create policy "Owners can read their cancellation policy"
  on public.cancellation_policies
  for select
  using (
    exists (
      select 1 from public.beauty_pages
      where beauty_pages.id = cancellation_policies.beauty_page_id
      and beauty_pages.owner_id = auth.uid()
    )
  );

create policy "Owners can create cancellation policy"
  on public.cancellation_policies
  for insert
  with check (
    exists (
      select 1 from public.beauty_pages
      where beauty_pages.id = cancellation_policies.beauty_page_id
      and beauty_pages.owner_id = auth.uid()
    )
  );

create policy "Owners can update cancellation policy"
  on public.cancellation_policies
  for update
  using (
    exists (
      select 1 from public.beauty_pages
      where beauty_pages.id = cancellation_policies.beauty_page_id
      and beauty_pages.owner_id = auth.uid()
    )
  );

create policy "Owners can delete cancellation policy"
  on public.cancellation_policies
  for delete
  using (
    exists (
      select 1 from public.beauty_pages
      where beauty_pages.id = cancellation_policies.beauty_page_id
      and beauty_pages.owner_id = auth.uid()
    )
  );

create trigger on_cancellation_policies_updated
  before update on public.cancellation_policies
  for each row
  execute function update_updated_at_column();

-- ============================================================================
-- 10. BUSINESS HOURS (weekly recurring schedule)
-- Default weekly schedule for beauty pages
-- ============================================================================

create table public.business_hours (
  id uuid primary key default gen_random_uuid(),
  beauty_page_id uuid not null references public.beauty_pages(id) on delete cascade,
  day_of_week int not null check (day_of_week >= 0 and day_of_week <= 6), -- 0=Sunday, 6=Saturday
  is_open boolean not null default true,
  open_time time,
  close_time time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (beauty_page_id, day_of_week),
  constraint business_hours_time_check check (
    (is_open = false) or (open_time is not null and close_time is not null and open_time < close_time)
  )
);

create index business_hours_beauty_page_id_idx on public.business_hours(beauty_page_id);

alter table public.business_hours enable row level security;

-- Anyone can read business hours of active beauty pages
create policy "Anyone can read business hours"
  on public.business_hours
  for select
  using (
    exists (
      select 1 from public.beauty_pages
      where beauty_pages.id = business_hours.beauty_page_id
      and beauty_pages.is_active = true
    )
  );

-- Owners can manage their business hours
create policy "Owners can read their business hours"
  on public.business_hours
  for select
  using (
    exists (
      select 1 from public.beauty_pages
      where beauty_pages.id = business_hours.beauty_page_id
      and beauty_pages.owner_id = auth.uid()
    )
  );

create policy "Owners can create business hours"
  on public.business_hours
  for insert
  with check (
    exists (
      select 1 from public.beauty_pages
      where beauty_pages.id = business_hours.beauty_page_id
      and beauty_pages.owner_id = auth.uid()
    )
  );

create policy "Owners can update business hours"
  on public.business_hours
  for update
  using (
    exists (
      select 1 from public.beauty_pages
      where beauty_pages.id = business_hours.beauty_page_id
      and beauty_pages.owner_id = auth.uid()
    )
  );

create policy "Owners can delete business hours"
  on public.business_hours
  for delete
  using (
    exists (
      select 1 from public.beauty_pages
      where beauty_pages.id = business_hours.beauty_page_id
      and beauty_pages.owner_id = auth.uid()
    )
  );

create trigger on_business_hours_updated
  before update on public.business_hours
  for each row
  execute function update_updated_at_column();
