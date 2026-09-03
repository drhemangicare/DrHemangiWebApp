-- ============================================================================
-- Online consultation: ON / OFF
--
-- Lets the clinic run the site purely as a professional/informational website,
-- with no online booking at all, and switch booking back on later without
-- recreating anything.
--
-- Deliberately a SETTING, not a deletion:
--   · Existing bookings, categories, discounts and availability stay exactly
--     as they are and remain manageable in the admin while it is off.
--   · Turning it back on restores the booking flow with all its data intact.
--   · Nothing about the schema changes, so there is no migration to undo.
--
-- Default TRUE so an existing deployment behaves exactly as it does today the
-- moment this migration runs.
-- ============================================================================

alter table site_settings
  add column if not exists online_consultation_enabled boolean not null default true;

comment on column site_settings.online_consultation_enabled is
  'When false the public site hides all booking UI and /book and /bookings return 404. Admin management is unaffected.';
