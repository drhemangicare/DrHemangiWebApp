-- ============================================================================
-- Prescriptions & advice
--
-- One prescription per consultation, written by the doctor from the booking
-- screen and emailed to the patient.
--
-- Design notes:
--   · Medicines are JSONB, not a child table. A prescription is written and
--     sent as ONE document — the lines are never queried, filtered or joined
--     independently, and a child table would only add a round trip to every
--     read and write. If reporting on individual drugs is ever needed, that is
--     the moment to normalise, not before.
--   · `sent_at` / `sent_to` record delivery separately from authoring, so a
--     saved-but-unsent draft is a distinct, visible state. A doctor half-way
--     through writing must never look like she has already sent it.
--   · The row is versionless and edited in place, but `revision` increments on
--     every send so a re-sent prescription is identifiable in the patient's
--     inbox and in support conversations.
--   · No RLS policies: every read and write goes through /api/admin/* routes
--     using the service role key, exactly like the rest of the admin surface.
--     RLS is enabled anyway so that a stray anon key can never read patient
--     clinical data.
-- ============================================================================

create table if not exists prescriptions (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,

  -- clinical content
  diagnosis      text,
  medicines      jsonb not null default '[]'::jsonb,
  advice         text,
  follow_up_date date,

  -- provenance & delivery
  created_by uuid references staff(id) on delete set null,
  revision   integer not null default 0,
  sent_at    timestamptz,
  sent_to    text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One prescription per booking. The composer upserts on this, so re-saving
-- edits the existing document instead of quietly creating a second one that
-- nothing would ever display.
create unique index if not exists prescriptions_booking_id_key
  on prescriptions (booking_id);

create index if not exists prescriptions_sent_at_idx
  on prescriptions (sent_at desc nulls last);

alter table prescriptions enable row level security;

-- Keep updated_at honest without the application having to remember.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists prescriptions_set_updated_at on prescriptions;
create trigger prescriptions_set_updated_at
  before update on prescriptions
  for each row execute function set_updated_at();

-- The doctor's registration number appears on every prescription she sends, so
-- it belongs with the other clinic settings rather than hard-coded in a
-- template. Nullable: the prescription still sends without it, minus that line.
alter table site_settings add column if not exists doctor_registration_no text;
alter table site_settings add column if not exists doctor_qualifications text;
