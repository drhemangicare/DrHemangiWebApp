-- ============================================================================
-- Security hardening
--
-- Addresses findings from the pre-launch security review:
--   1. RLS was enabled on 9 tables but ZERO policies existed. That is a
--      deny-all posture, which is what we want — but it was implicit and
--      undocumented, so the first person to add a policy "to make something
--      work" could silently open patient records to the anon key. The
--      explicit deny policies below make the intent unmissable.
--   2. No unique constraint on a booking slot, so two concurrent POSTs could
--      both pass the availability check and both take payment.
--   3. OTP codes were stored in plaintext, never expired, never purged, and
--      were replayable after a successful verification.
--   4. No storage for rate limiting or OAuth state.
-- ============================================================================

-- ── 1. Make the deny-all posture explicit ───────────────────────────────────
-- Every table is reached exclusively through the service-role key inside API
-- route handlers, which bypasses RLS by design. Nothing should ever be
-- readable with the anon/publishable key. These policies encode that.
do $$
declare t text;
begin
  foreach t in array array[
    'categories','bookings','booking_documents','booking_otps',
    'working_hours','blocked_slots','discounts','site_settings','staff'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "deny_all_anon" on %I', t);
    -- `to public using (false)` blocks anon and authenticated alike; the
    -- service role is exempt from RLS and is unaffected.
    execute format('create policy "deny_all_anon" on %I for all to public using (false) with check (false)', t);
  end loop;
end $$;

-- ── 2. One booking per slot, enforced by the database ───────────────────────
-- The application checks availability and then inserts in a separate
-- statement; without this, two requests interleaving between those two steps
-- both succeed. Cancelled bookings are excluded so a freed slot is rebookable.
create unique index if not exists bookings_one_per_slot
  on bookings (scheduled_date, scheduled_time)
  where status in ('pending_payment', 'confirmed', 'rescheduled');

-- ── 3. OTP hygiene ──────────────────────────────────────────────────────────
alter table booking_otps add column if not exists consumed_at timestamptz;
create index if not exists booking_otps_lookup on booking_otps (email, purpose, created_at desc);

-- Purge expired/consumed codes. Call from a scheduled job, or opportunistically
-- from the lookup route.
create or replace function purge_expired_otps() returns void
language sql security definer set search_path = public as $$
  delete from booking_otps
   where created_at < now() - interval '24 hours';
$$;

-- ── 4. Rate limiting ────────────────────────────────────────────────────────
create table if not exists rate_limits (
  id bigserial primary key,
  key_hash text not null,
  bucket text not null,
  window_start timestamptz not null,
  count integer not null default 0,
  unique (key_hash, window_start)
);
alter table rate_limits enable row level security;
drop policy if exists "deny_all_anon" on rate_limits;
create policy "deny_all_anon" on rate_limits for all to public using (false) with check (false);

-- Atomic increment: read-then-write from the app would race under load and
-- undercount exactly when the limiter matters most.
create or replace function bump_rate_limit(p_key_hash text, p_window_start timestamptz, p_bucket text)
returns integer
language plpgsql security definer set search_path = public as $$
declare new_count integer;
begin
  insert into rate_limits (key_hash, bucket, window_start, count)
       values (p_key_hash, p_bucket, p_window_start, 1)
  on conflict (key_hash, window_start)
    do update set count = rate_limits.count + 1
    returning count into new_count;
  return new_count;
end $$;

create or replace function purge_old_rate_limits() returns void
language sql security definer set search_path = public as $$
  delete from rate_limits where window_start < now() - interval '1 day';
$$;

-- ── 5. Single-use OAuth state for the Google Calendar connect flow ──────────
-- The callback that stores the clinic's Google refresh token had no CSRF
-- protection at all. State nonces are stored hashed and deleted on use.
create table if not exists oauth_states (
  id uuid primary key default gen_random_uuid(),
  nonce text not null unique,
  admin_id uuid not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
alter table oauth_states enable row level security;
drop policy if exists "deny_all_anon" on oauth_states;
create policy "deny_all_anon" on oauth_states for all to public using (false) with check (false);
