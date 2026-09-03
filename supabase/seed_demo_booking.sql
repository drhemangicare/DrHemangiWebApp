-- ============================================================================
-- ONE DUMMY BOOKING, so the admin screens have something real to open.
--
-- Paste the whole file into Supabase → SQL Editor → Run.
-- Safe to run more than once: it updates the same demo row rather than
-- creating a second one.
--
-- ⚠️  CHANGE THE EMAIL below before you press "Send to patient" in the admin.
--     That button really does send mail through Brevo, so put an address you
--     own there — otherwise a stranger receives a prescription from the clinic.
-- ============================================================================


-- 1. Bookings must point at a real category. If the categories table is still
--    empty (fresh database), create one to hang the demo booking off. If you
--    already have categories, this inserts nothing and the booking uses your
--    first active one.
insert into categories (slug, name, description, icon, price, duration_minutes, sort_order)
select 'demo-consult', 'Demo Consultation',
       'Seeded row for testing the admin screens. Safe to delete.',
       'stethoscope', 500, 30, 99
where not exists (select 1 from categories where is_active);


-- 2. The booking itself.
--    'confirmed' + 'paid' is the state a real consultation is in by the time
--    the doctor writes a prescription for it, and today's date puts it at the
--    top of the admin list (which sorts by date descending).
insert into bookings (
  reference_code, category_id,
  patient_name, patient_email, patient_phone, patient_age, reason,
  scheduled_date, scheduled_time, duration_minutes,
  status, payment_status,
  price_original, discount_amount, price_final
)
select
  'DH-DEMO01',
  c.id,
  'Aarti Deshmukh',
  'vedant9478@gmail.com',        -- ← change me before sending anything
  '9876543210',
  29,
  'Irregular cycles for about five months, some weight gain and acne. Wanted to check whether this is PCOS.',
  current_date,
  '11:30'::time,
  c.duration_minutes,
  'confirmed',
  'paid',
  c.price, 0, c.price
from (
  select id, price, duration_minutes
  from categories
  where is_active
  order by sort_order, name
  limit 1
) c
on conflict (reference_code) do update
  set patient_name   = excluded.patient_name,
      patient_email  = excluded.patient_email,
      patient_phone  = excluded.patient_phone,
      patient_age    = excluded.patient_age,
      reason         = excluded.reason,
      scheduled_date = excluded.scheduled_date,
      scheduled_time = excluded.scheduled_time,
      status         = excluded.status,
      payment_status = excluded.payment_status,
      updated_at     = now()
returning id, reference_code, patient_name, patient_email,
          scheduled_date, scheduled_time, status;


-- ── to remove it again ──────────────────────────────────────────────────────
-- delete from bookings   where reference_code = 'DH-DEMO01';
-- delete from categories where slug = 'demo-consult';
--
-- Any prescription you wrote against it goes with the booking:
-- prescriptions.booking_id is ON DELETE CASCADE.
