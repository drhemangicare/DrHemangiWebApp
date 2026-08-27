-- ---------------------------------------------------------------------------
-- 0005 — in-person visits on/off, and a support address for patients
--
-- Two new settings, both editable from Admin → Settings so Dr Hemangi can
-- change them without a deploy.
--
-- clinic_visit_enabled
--   Whether the site offers in-person visits at all. When false, every piece
--   of "come to the clinic" content is hidden: the clinic section on the home
--   and contact pages, and the in-person card in the booking flow. Defaults to
--   TRUE so the site behaves exactly as it does today until she turns it off.
--
--   Note this does not make in-clinic bookable online — it never has been.
--   It controls whether the option is *presented* to patients, which is what
--   matters when the clinic is closed, moving, or fully booked in person.
--
-- support_email
--   Where patients send questions and problem reports. Kept in the database
--   rather than hard-coded so it can be redirected without a code change; the
--   application falls back to hello@drhemangi.in if it is ever left blank.
-- ---------------------------------------------------------------------------

alter table site_settings
  add column if not exists clinic_visit_enabled boolean not null default true;

alter table site_settings
  add column if not exists support_email text not null default 'hello@drhemangi.in';

-- Existing installs have a row already; make sure it carries the new defaults
-- rather than nulls if the columns were somehow added without them.
update site_settings
   set clinic_visit_enabled = coalesce(clinic_visit_enabled, true),
       support_email        = coalesce(nullif(support_email, ''), 'hello@drhemangi.in')
 where id = 1;
