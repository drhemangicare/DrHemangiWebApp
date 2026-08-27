-- Lets the admin mark a category as "existing patients only" (e.g. the
-- Follow-up Consult category, which is priced/timed for returning patients).
-- Booking creation enforces this server-side by checking whether the
-- patient's phone or email has a prior paid booking — not just a soft label.
alter table categories add column if not exists existing_patients_only boolean not null default false;

update categories set existing_patients_only = true where slug = 'follow-up';
