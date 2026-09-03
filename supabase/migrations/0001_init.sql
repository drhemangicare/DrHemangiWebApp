-- ============================================================================
-- Dr Hemangi — Gynaecology, Fertility & Aesthetic Wellness
-- Initial schema. Run this in the Supabase SQL editor (or via `supabase db push`).
-- All application access goes through Next.js API routes using the SERVICE
-- ROLE key on the server, so Row Level Security is left DENY-BY-DEFAULT
-- (service role bypasses RLS). This keeps the data model simple while still
-- being safe if the anon/public key is ever used directly.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- STAFF (admin accounts). Doctor logs in via Supabase Auth (email+password);
-- this table just marks which auth users are allowed into /admin.
-- ----------------------------------------------------------------------------
create table if not exists staff (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default 'Dr Hemangi',
  role text not null default 'admin' check (role in ('admin')),
  created_at timestamptz not null default now()
);
alter table staff enable row level security;

-- ----------------------------------------------------------------------------
-- CATEGORIES — consultation types the doctor offers (all ONLINE only).
-- Price/duration are fully admin-editable.
-- ----------------------------------------------------------------------------
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  icon text not null default 'stethoscope', -- key into the frontend icon set
  price numeric(10,2) not null check (price >= 0),
  duration_minutes int not null default 30 check (duration_minutes > 0),
  is_active boolean not null default true,
  sort_order int not null default 0,
  -- When true, booking this category is blocked unless the patient's phone
  -- or email already has a prior paid booking (see /api/bookings). Lets the
  -- admin mark categories like "Follow-up Consult" as returning-patients-only.
  existing_patients_only boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table categories enable row level security;

-- ----------------------------------------------------------------------------
-- DISCOUNTS — one active discount per category (or category_id null = all
-- categories). Auto-expires either by date window or by number of patients
-- who have used it (patient_limit). used_count increments on successful
-- payment; the API checks both bounds before applying.
-- ----------------------------------------------------------------------------
create table if not exists discounts (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete cascade, -- null = applies to all categories
  label text not null,
  discount_type text not null check (discount_type in ('percent','flat')),
  amount numeric(10,2) not null check (amount > 0),
  limit_type text not null check (limit_type in ('patient_count','date_range','unlimited')),
  patient_limit int, -- used when limit_type = 'patient_count'
  used_count int not null default 0,
  starts_at timestamptz not null default now(),
  ends_at timestamptz, -- used when limit_type = 'date_range'
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table discounts enable row level security;

-- ----------------------------------------------------------------------------
-- WORKING HOURS — recurring weekly availability for online consults.
-- ----------------------------------------------------------------------------
create table if not exists working_hours (
  id uuid primary key default gen_random_uuid(),
  weekday int not null check (weekday between 0 and 6), -- 0 = Sunday
  start_time time not null,
  end_time time not null,
  slot_duration_minutes int not null default 30,
  is_active boolean not null default true
);
alter table working_hours enable row level security;

-- ----------------------------------------------------------------------------
-- BLOCKED SLOTS — leave days / partial-day blocks that override working hours.
-- ----------------------------------------------------------------------------
create table if not exists blocked_slots (
  id uuid primary key default gen_random_uuid(),
  block_date date not null,
  start_time time, -- null + whole_day = full day off
  end_time time,
  whole_day boolean not null default true,
  reason text,
  created_at timestamptz not null default now()
);
alter table blocked_slots enable row level security;

-- ----------------------------------------------------------------------------
-- BOOKINGS
-- ----------------------------------------------------------------------------
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  reference_code text not null unique, -- e.g. DH-7F3K9Q, shown to patient
  category_id uuid not null references categories(id),
  patient_name text not null,
  patient_email text not null,
  patient_phone text not null,
  patient_age int,
  reason text default '', -- "reason for visit / symptoms" free text from patient
  scheduled_date date not null,
  scheduled_time time not null,
  duration_minutes int not null default 30,
  status text not null default 'pending_payment'
    check (status in ('pending_payment','confirmed','completed','cancelled','rescheduled','no_show')),
  price_original numeric(10,2) not null,
  discount_id uuid references discounts(id),
  discount_amount numeric(10,2) not null default 0,
  price_final numeric(10,2) not null,
  razorpay_order_id text,
  razorpay_payment_id text,
  payment_status text not null default 'pending' check (payment_status in ('pending','paid','failed','refunded')),
  meet_link text,
  calendar_event_id text,
  doctor_notes text default '',
  reschedule_reason text,
  reschedule_count int not null default 0,
  lookup_email_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_bookings_date on bookings(scheduled_date);
create index if not exists idx_bookings_status on bookings(status);
create index if not exists idx_bookings_reference on bookings(reference_code);
create index if not exists idx_bookings_category on bookings(category_id);
alter table bookings enable row level security;

-- ----------------------------------------------------------------------------
-- BOOKING DOCUMENTS — reports / images uploaded by patient or doctor.
-- Files live in Supabase Storage bucket "booking-documents"; this row is
-- metadata + storage path only (keeps DB small, storage does the heavy lifting).
-- ----------------------------------------------------------------------------
create table if not exists booking_documents (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  file_type text not null,
  file_size_bytes int not null,
  uploaded_by text not null check (uploaded_by in ('patient','doctor')),
  created_at timestamptz not null default now()
);
create index if not exists idx_docs_booking on booking_documents(booking_id);
alter table booking_documents enable row level security;

-- ----------------------------------------------------------------------------
-- OTP codes for the "no-account" booking lookup flow (email verification).
-- ----------------------------------------------------------------------------
create table if not exists booking_otps (
  id uuid primary key default gen_random_uuid(),
  reference_code text not null,
  email text not null,
  otp_code text not null,
  purpose text not null default 'lookup',
  expires_at timestamptz not null,
  verified boolean not null default false,
  attempts int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_otp_ref on booking_otps(reference_code, email);
alter table booking_otps enable row level security;

-- ----------------------------------------------------------------------------
-- SITE SETTINGS — singleton row for admin-editable content: clinic address /
-- timing placeholders (patient never books clinic visits, this is display-only
-- + a Google Maps link), doctor photo, Google Calendar OAuth token.
-- ----------------------------------------------------------------------------
create table if not exists site_settings (
  id int primary key default 1 check (id = 1),
  clinic_address text not null default 'Address coming soon — Dr Hemangi''s Clinic',
  clinic_timing text not null default 'Timings coming soon',
  clinic_map_link text not null default '',
  doctor_photo_path text not null default '',
  doctor_bio text not null default '',
  years_experience int not null default 5,
  deliveries_count int not null default 7000,
  google_refresh_token text,
  google_connected_email text,
  updated_at timestamptz not null default now()
);
insert into site_settings (id) values (1) on conflict (id) do nothing;
alter table site_settings enable row level security;

-- ----------------------------------------------------------------------------
-- Keep updated_at fresh
-- ----------------------------------------------------------------------------
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_categories_updated on categories;
create trigger trg_categories_updated before update on categories
  for each row execute function set_updated_at();

drop trigger if exists trg_discounts_updated on discounts;
create trigger trg_discounts_updated before update on discounts
  for each row execute function set_updated_at();

drop trigger if exists trg_bookings_updated on bookings;
create trigger trg_bookings_updated before update on bookings
  for each row execute function set_updated_at();

drop trigger if exists trg_settings_updated on site_settings;
create trigger trg_settings_updated before update on site_settings
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- Seed starter categories (admin can edit/delete these from the dashboard)
-- ----------------------------------------------------------------------------
insert into categories (slug, name, description, icon, price, duration_minutes, sort_order, existing_patients_only) values
  ('general-obgyn', 'General Gynaecology Consult', 'Routine gynaecological concerns, checkups & second opinions.', 'stethoscope', 700, 30, 1, false),
  ('fertility-iui-ivf', 'Fertility Consult (IUI/IVF)', 'Infertility evaluation and treatment planning.', 'ribbon', 1200, 45, 2, false),
  ('pregnancy-checkup', 'Pregnancy / Antenatal Consult', 'Routine antenatal follow-up and pregnancy guidance.', 'baby', 800, 30, 3, false),
  ('pcos-hormonal', 'PCOS & Hormonal Health', 'PCOS, irregular cycles and hormonal imbalance management.', 'wave', 700, 30, 4, false),
  ('aesthetic-wellness', 'Aesthetic Wellness Consult', 'Intimate & aesthetic wellness consultation.', 'sparkle', 900, 30, 5, false),
  ('follow-up', 'Follow-up Consult', 'Follow-up for existing patients only.', 'calendar-heart', 400, 20, 6, true)
on conflict (slug) do nothing;

-- Seed default working hours: Mon–Sat, 10:00–14:00 and 17:00–20:00, 30 min slots
insert into working_hours (weekday, start_time, end_time, slot_duration_minutes)
select w, t.s::time, t.e::time, 30
from generate_series(1,6) as w
cross join (values ('10:00','14:00'), ('17:00','20:00')) as t(s,e)
on conflict do nothing;
