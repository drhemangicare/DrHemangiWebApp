# Dr Hemangi Clinic — Setup Guide

This is a complete booking + admin system for the clinic: the public site you gave me (kept exactly as designed, just wired up to a real backend), online-only video-consultation booking with Razorpay payment, automatic Google Meet links, email confirmations via Brevo, a "no account needed" booking lookup for patients, and a full admin dashboard for Dr Hemangi to manage pricing, discounts, availability, bookings, notes, and see analytics.

Everything below is **free to start** — every service used has a free tier generous enough for a solo clinic, and you only pay if the practice grows into needing more (see "Costs" at the end).

## What you're getting

- **Public site** (`/`) — your original design, unchanged, now wired to real data: live pricing per category (admin-editable), real availability, real Razorpay checkout, real Google Meet links, real confirmation emails, and a "My bookings" page (email + one-time code, no password).
- **Admin dashboard** (`/admin`) — login-protected, for Dr Hemangi only:
  - **Overview** — revenue and bookings per category, daily revenue, status breakdown.
  - **Bookings** — search/filter every booking, view patient notes and uploaded reports/images, write doctor's notes (shown to the patient), reschedule, cancel, mark completed.
  - **Pricing** — add/edit/hide consultation categories and their price + duration.
  - **Discounts** — create a discount that auto-expires either after N patients use it (e.g. "next 50") or after a date (e.g. "2 weeks"), scoped to one category or all of them.
  - **Availability** — weekly working hours + one-off blocked dates (leave/holidays).
  - **Settings** — clinic address/timings/Google Maps link (placeholders for in-person visits — nothing here is bookable online, by design), doctor's photo upload, and the one-time "Connect Google Calendar" button.
- **Backend** — Next.js API routes on top of Supabase (Postgres + Auth + file storage), Razorpay for payment, Brevo for email, Google Calendar API for Meet links.

## Before you start

You'll need to create four free accounts. Budget about 30–45 minutes for all of it the first time.

1. **Supabase** — database, login, and file storage. https://supabase.com (free tier: 500 MB database, 1 GB file storage, 50,000 monthly active users — far more than a solo clinic needs).
2. **Brevo** — sends emails (confirmations, one-time codes, reschedule notices). https://brevo.com (free tier: 300 emails/day ≈ 9,000/month).
3. **Razorpay** — payment processing. https://razorpay.com (no monthly fee; Razorpay takes a small % per transaction, standard for any Indian payment gateway).
4. **Google Cloud** — lets the app create a Google Meet link automatically on Dr Hemangi's own Google Calendar. https://console.cloud.google.com (free — this only uses the Calendar API, not any paid Google service).

You'll also need somewhere to host the app. This guide uses **Vercel** (https://vercel.com), which has a free tier that comfortably covers this project.

---

## 1. Supabase — database, auth, storage

1. Go to https://supabase.com → New project. Pick any name/region (choose a region close to India, e.g. Singapore, for lower latency) and set a database password (save it somewhere safe, you won't need it day-to-day).
2. Once the project is ready, open **SQL Editor** and run the files in `supabase/migrations/` **in order**:
   - `0001_init.sql` — creates every table (categories, bookings, discounts, working hours, blocked dates, documents, OTP codes, site settings) and seeds six starter consultation categories plus default working hours (Mon–Sat, 10–2 and 5–8). Edit these later from Admin → Pricing / Availability.
   - `0002_storage.sql` — creates the two storage buckets: `booking-documents` (private — patient reports/images) and `site-assets` (public — the doctor's photo).
   - `0003_existing_patients_only.sql` — adds the "existing patients only" flag used by the Follow-up Consult category (see "Existing-patients-only categories" below).
3. Go to **Project Settings → API**. Copy three values into your `.env.local` (see step 6):
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key (click "Reveal") → `SUPABASE_SERVICE_ROLE_KEY` — **never share this key or put it in client-side code**, it bypasses all security rules. It's only used on the server.
4. **Create the doctor's admin login.** Go to **Authentication → Users → Add user** (create manually), enter Dr Hemangi's email and a password. Then go to **SQL Editor** and run:
   ```sql
   insert into staff (id, full_name)
   values ('<paste the user's UUID from the Users page>', 'Dr Hemangi');
   ```
   That's it — that email/password now logs into `/admin`. Add more staff the same way if needed later.

## 2. Brevo — email

1. Sign up at https://brevo.com (the free plan is automatic, no card needed).
2. Go to **Senders & IP → Senders**, add the email address you want patients to receive mail from (e.g. `care@drhemangiclinic.com`, or your own Gmail while testing), and verify it via the confirmation email Brevo sends.
3. Go to **SMTP & API → API Keys**, create a new key, copy it into `BREVO_API_KEY`.
4. Set `BREVO_SENDER_EMAIL` to the address you verified, and `BREVO_SENDER_NAME` to whatever you want patients to see (e.g. "Dr Hemangi Clinic").
5. Optional: set `CLINIC_NOTIFY_EMAIL` to Dr Hemangi's own inbox — she'll get a short email every time a new booking comes in, in addition to seeing it on the dashboard.

**Why Brevo and not SMS/WhatsApp:** I checked this before building — Brevo's free plan covers 300 emails/day (~9,000/month), which is effectively unlimited for a solo practice. There is no equivalent free, reliable SMS option in India (Fast2SMS/MSG91 etc. all charge per message, roughly 10–20 paise each with no meaningful free tier), and WhatsApp's Cloud API needs Meta Business verification (days of waiting) and still charges per message beyond a small free allowance. Email-only was the choice you picked when I asked, and it keeps this at ₹0/month for notifications. If the practice later wants WhatsApp too, `src/lib/brevo.ts` is the one file to extend — the booking flow already calls a single `sendBookingConfirmationEmail()`-style function per event, so adding a WhatsApp send alongside it is a small change, not a rebuild.

## 3. Razorpay — payments

1. Sign up at https://razorpay.com and complete their KYC (needed before you can accept **live** payments; you can build and test everything before KYC finishes using **Test Mode**).
2. In the dashboard, toggle to **Test Mode** first. Go to **Settings → API Keys → Generate Test Key**. Copy the Key ID and Key Secret into `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`.
3. Test the whole booking flow using Razorpay's test cards (any future expiry date, any CVV) — see https://razorpay.com/docs/payments/payments/test-card-upi-details/.
4. When ready to go live: switch to **Live Mode**, generate live keys, and swap them into your production environment variables (Vercel → Project Settings → Environment Variables).
5. **Optional but recommended — webhook fallback.** In **Settings → Webhooks**, add a webhook pointing at `https://yourdomain.com/api/payments/webhook`, subscribe to the `payment.captured` event, and copy the webhook secret into `RAZORPAY_WEBHOOK_SECRET`. This is a safety net: if a patient's browser closes right after paying (before the confirmation call finishes), the webhook still confirms the booking and sends the email. The app works without this too — it's just an extra layer of reliability.

## 4. Google Calendar — automatic Meet links

1. Go to https://console.cloud.google.com → create a new project (any name, e.g. "Dr Hemangi Clinic").
2. **APIs & Services → Library** → search "Google Calendar API" → Enable.
3. **APIs & Services → OAuth consent screen**:
   - User type: **External** (unless the clinic has Google Workspace, in which case Internal also works).
   - Fill in the app name, support email, developer contact email.
   - Scopes: add `.../auth/calendar.events`.
   - Test users: add Dr Hemangi's own Gmail address (the one whose calendar should get the Meet links). While the app is in "Testing" mode, only test users can connect — that's fine, only Dr Hemangi ever connects.
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: **Web application**.
   - Authorized redirect URI: `https://yourdomain.com/api/admin/auth/google/callback` (use `http://localhost:3000/api/admin/auth/google/callback` while developing locally).
   - Copy the **Client ID** and **Client Secret** into `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`. Set `GOOGLE_REDIRECT_URI` to the exact same URL you just registered.
5. Once the app is deployed with these values set, log into `/admin/settings` and click **Connect Google Calendar** — sign in as Dr Hemangi, approve access, done. Every confirmed booking from then on automatically creates a calendar event with a Meet link, and the link goes out in the confirmation email.
   - If Google Calendar isn't connected yet, bookings still work fine — the email just won't include a Meet link until you connect it. Nothing breaks.

## 5. Environment variables

Copy `.env.example` to `.env.local` and fill in everything you collected above:

```bash
cp .env.example .env.local
```

Also set:
- `LOOKUP_TOKEN_SECRET` — any long random string (used to sign the "My bookings" session tokens). Generate one with `openssl rand -hex 32`.
- `NEXT_PUBLIC_APP_URL` — `http://localhost:3000` locally, your real domain in production.

## 6. Run it locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` for the public site, `http://localhost:3000/admin/login` for the dashboard.

## 7. Deploy (Vercel, free tier)

1. Push this project to a GitHub repository.
2. Go to https://vercel.com → **New Project** → import the repo.
3. In **Environment Variables**, paste in everything from your `.env.local` (use your **live** Razorpay keys here, not test keys, once you're ready to accept real payments).
4. Deploy. Vercel gives you a `*.vercel.app` URL immediately; add your own domain later from Project Settings → Domains.
5. Go back and update `GOOGLE_REDIRECT_URI` (in both Vercel's env vars and the Google Cloud OAuth client) and the Razorpay webhook URL to use your real domain, then redeploy.

---

## Adding the doctor's photo

Go to **Admin → Settings → Doctor's photo → Upload photo**. That's the only step — it replaces the placeholder illustration on the homepage automatically (no code changes needed). A roughly square photo, at least 600×600px, works best; it's automatically compressed for fast loading.

## Adding the clinic address, timings & map link (for in-person visits)

As requested, **in-person clinic visits are not bookable on the website** — only online video consultations are. The site instead shows a placeholder "Visit the Clinic" section with the address, timings, and a "View in Google Maps" button. Fill these in from **Admin → Settings → Clinic details**:
- **Address** — free text, shown as-is.
- **Timings** — free text (e.g. "Mon–Sat · 10 AM – 2 PM, 5 PM – 8 PM").
- **Google Maps link** — open Google Maps, search the clinic, click Share → Copy link, paste it here. The "View in Google Maps" button only appears once this is filled in.

## Customization already built into the admin dashboard

- **Price per category** — Admin → Pricing. Add, edit, or hide any consultation type; changes apply to new bookings immediately.
- **Discounts with automatic expiry** — Admin → Discounts. Two expiry styles, exactly as you described:
  - *By patient count*: e.g. "20% off, first 50 patients" — the discount silently stops applying once the 50th paid booking uses it.
  - *By date*: e.g. "10% off, next 2 weeks" — stops applying automatically after the date you set.
  - Discounts can apply to one category or to everything.
- **Availability** — Admin → Availability. Set the weekly consulting hours (different hours per day if needed, e.g. shorter Saturdays) and block off specific dates for leave — blocked/booked time is automatically excluded from what patients can pick.
- **Existing-patients-only categories** — Admin → Pricing → edit a category → check "Existing patients only." The Follow-up Consult category has this on by default. It's enforced server-side, not just a label: at booking time, the app checks whether the patient's phone number or email has any prior *paid* booking with the clinic. If not, the booking is rejected with a message asking them to pick a different category — this can't be bypassed just by changing the "have you consulted before?" answer on the form, since that field is only informational.

## What patients can do without an account

- Book a video consultation: pick a service, date/time, fill in their details, optionally attach reports/images (PDF/JPG/PNG, up to 15 MB each), pay via Razorpay (UPI/cards/netbanking/wallets).
- Get a confirmation email with the reference code and Google Meet link.
- Come back anytime via **My bookings**, verify with a one-time emailed code, and see every past/upcoming booking, the doctor's notes, and their uploaded reports — plus reschedule (up to 6 hours before the slot), cancel, or add more reports.

## Storage & cost efficiency notes

- Uploaded images are automatically resized (max 2000px) and re-compressed before they're stored — a typical 5–8 MB phone photo becomes well under 500 KB with no real loss of legibility for document review. This matters a lot on Supabase's 1 GB free storage tier.
- PDFs are stored as-is.
- The `booking-documents` bucket is **private** — files are only ever accessed through short-lived signed URLs generated by the server (for the doctor in the admin dashboard, or the patient after verifying their email), never via a public link.
- The whole stack (Supabase free tier + Vercel free tier + Brevo free tier) costs **₹0/month** at a solo-clinic volume. The only recurring cost is Razorpay's standard per-transaction fee, which is unavoidable for any payment gateway.

## Known limitations (honest list)

- **Booking concurrency**: the system checks a slot is free right before reserving it, which is safe for the volume a single doctor sees, but two patients clicking "pay" in the exact same second for the exact same slot is a (very unlikely) edge case that isn't fully locked at the database level. If the clinic ever runs multiple doctors/high volume, this is the first thing to harden.
- **SMS/WhatsApp**: not included, per your choice — email only. See the Brevo section above for how to add it later without a rebuild.
- **Refunds**: cancellation emails the patient and frees the slot, but doesn't automatically process a Razorpay refund — that's a deliberate choice since refund policy (full vs. partial vs. none) needs a human decision; process refunds manually from the Razorpay dashboard when needed.
- **Multiple staff / roles**: the `staff` table supports multiple admin logins, but there's currently only one role ("admin") — no separate reduced-access roles.

## Project structure, if you want to make changes later

```
src/app/home.html          the public site's HTML/CSS/JS — your original design, functionally wired up
src/app/route.ts           serves home.html at "/"
src/app/admin/             the admin dashboard (React/Next.js pages)
src/app/api/                every backend endpoint (public + admin)
src/lib/                   shared logic: pricing, availability, email, calendar, payments
supabase/migrations/       the two SQL files that set up the whole database
```
