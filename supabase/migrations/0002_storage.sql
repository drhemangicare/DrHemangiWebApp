-- ============================================================================
-- Storage buckets
--   booking-documents : PRIVATE. Patient reports/images & doctor uploads.
--                        Only ever read/written by server routes using the
--                        service role key (signed URLs generated on demand).
--   site-assets       : PUBLIC. Doctor's photo + any small site images the
--                        admin uploads from the dashboard.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'booking-documents',
  'booking-documents',
  false,
  15728640, -- 15 MB per file cap keeps storage + egress cheap on the free tier
  array['image/jpeg','image/png','image/webp','image/heic','application/pdf']
)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-assets',
  'site-assets',
  true,
  5242880, -- 5 MB
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do nothing;

-- No public storage.objects policies are created here: all uploads/downloads
-- for booking-documents go through Next.js API routes using the service role
-- key, which bypasses RLS entirely. site-assets is a public bucket so reads
-- work with just the anon key; writes still go through the admin API route.
