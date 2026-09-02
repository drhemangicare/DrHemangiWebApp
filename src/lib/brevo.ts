import { env, requireEnv } from "@/lib/env";

// Thin wrapper around Brevo's transactional email REST API (no SDK
// dependency needed — it's one JSON POST). Brevo's free plan covers 300
// emails/day (~9,000/month), which is why it's the sole notification
// channel for this clinic (see SETUP.md for the reasoning).
async function sendEmail(opts: {
  to: { email: string; name?: string }[];
  subject: string;
  html: string;
  replyTo?: string;
}) {
  const apiKey = requireEnv("brevoApiKey");
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: { email: env.brevoSenderEmail, name: env.brevoSenderName },
      to: opts.to,
      subject: opts.subject,
      htmlContent: opts.html,
      ...(opts.replyTo ? { replyTo: { email: opts.replyTo } } : {}),
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Brevo send failed (${res.status}): ${text}`);
  }
  return res.json().catch(() => ({}));
}

function emailShell(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#FDF6F3;font-family:'Segoe UI',Arial,sans-serif;color:#2A1520">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px">
    <div style="text-align:center;margin-bottom:24px">
      <div style="display:inline-block;width:44px;height:44px;border-radius:13px;background:linear-gradient(140deg,#4A1F35,#6B3450);line-height:44px;color:#F2C9C4;font-family:Georgia,serif;font-size:20px">H</div>
      <div style="font-family:Georgia,serif;font-size:17px;color:#2E1020;margin-top:8px">Dr Hemangi</div>
      <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#A98C98">Gynaecology · Fertility · Surgery</div>
    </div>
    <div style="background:#ffffff;border-radius:18px;padding:28px;box-shadow:0 8px 30px rgba(74,31,53,.08)">
      <h1 style="font-family:Georgia,serif;font-weight:400;font-size:22px;color:#2E1020;margin:0 0 16px">${esc(title)}</h1>
      ${bodyHtml}
    </div>
    <div style="text-align:center;margin-top:24px;font-size:11px;color:#A98C98">This is an automated message from Dr Hemangi Clinic. For medical emergencies, contact your nearest emergency department.</div>
  </div>
  </body></html>`;
}

/**
 * Everything interpolated into an email body below is patient-supplied and
 * unvalidated beyond a minimum length. Without escaping, a booking made with
 * name `<a href="https://evil">View report</a>` delivers a working phishing
 * link inside the clinic's own branded email to the doctor.
 */
/** Subjects are headers, not HTML: strip anything that could inject one. */
function hdr(v: string): string {
  return v.replace(/[\r\n]+/g, " ").slice(0, 200);
}

function esc(v: unknown): string {
  return String(v ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string)
  );
}

export async function sendOtpEmail(to: string, otp: string) {
  const html = emailShell(
    "Your one-time verification code",
    `<p style="font-size:14px;line-height:1.7;color:#6B3450">Use this code to view your bookings with Dr Hemangi. It expires in 10 minutes.</p>
     <div style="text-align:center;margin:24px 0"><span style="display:inline-block;padding:14px 28px;border-radius:12px;background:#FAE5E1;font-family:ui-monospace,monospace;font-size:28px;letter-spacing:6px;color:#4A1F35;font-weight:600">${otp}</span></div>
     <p style="font-size:12px;color:#A98C98">If you didn't request this, you can safely ignore this email.</p>`
  );
  return sendEmail({ to: [{ email: to }], subject: `${otp} is your verification code`, html });
}

export async function sendBookingConfirmationEmail(opts: {
  to: string;
  patientName: string;
  referenceCode: string;
  categoryName: string;
  dateLabel: string;
  timeLabel: string;
  durationMinutes: number;
  priceFinal: number;
  meetLink?: string | null;
}) {
  const html = emailShell(
    "You're booked in ✓",
    `<p style="font-size:14px;line-height:1.7;color:#6B3450">Hi ${esc(opts.patientName)}, your video consultation with Dr Hemangi is confirmed.</p>
     <table style="width:100%;border-collapse:collapse;margin:18px 0;font-size:13px">
       <tr><td style="padding:8px 0;color:#8D6B79">Reference</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#2E1020">${esc(opts.referenceCode)}</td></tr>
       <tr style="border-top:1px dashed #eee"><td style="padding:8px 0;color:#8D6B79">Service</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#2E1020">${esc(opts.categoryName)}</td></tr>
       <tr style="border-top:1px dashed #eee"><td style="padding:8px 0;color:#8D6B79">Date</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#2E1020">${esc(opts.dateLabel)}</td></tr>
       <tr style="border-top:1px dashed #eee"><td style="padding:8px 0;color:#8D6B79">Time (IST)</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#2E1020">${esc(opts.timeLabel)} · ${opts.durationMinutes} min</td></tr>
       <tr style="border-top:1px dashed #eee"><td style="padding:8px 0;color:#8D6B79">Amount paid</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#2E1020">₹${opts.priceFinal}</td></tr>
     </table>
     ${
       opts.meetLink
         ? `<div style="margin-top:18px;padding:16px;border-radius:12px;background:rgba(66,133,244,.07);border:1px solid rgba(66,133,244,.2)">
       <div style="font-size:13px;font-weight:600;color:#2E1020;margin-bottom:6px">Google Meet link</div>
       <a href="${esc(opts.meetLink)}" style="font-size:13px;color:#4A1F35;word-break:break-all">${esc(opts.meetLink)}</a>
     </div>`
         : ""
     }
     <p style="font-size:12px;color:#A98C98;margin-top:18px">Manage this booking (reschedule, cancel, add reports) anytime from "My bookings" on the clinic website using this email address.</p>`
  );
  return sendEmail({ to: [{ email: opts.to, name: opts.patientName }], subject: hdr(`Confirmed: ${opts.categoryName} on ${opts.dateLabel}`), html });
}

export async function sendRescheduleEmail(opts: {
  to: string;
  patientName: string;
  referenceCode: string;
  categoryName: string;
  dateLabel: string;
  timeLabel: string;
  meetLink?: string | null;
}) {
  const html = emailShell(
    "Your consultation was rescheduled",
    `<p style="font-size:14px;line-height:1.7;color:#6B3450">Hi ${esc(opts.patientName)}, your booking <b>${esc(opts.referenceCode)}</b> (${esc(opts.categoryName)}) has a new time.</p>
     <div style="text-align:center;margin:20px 0"><span style="display:inline-block;padding:12px 22px;border-radius:12px;background:#FAE5E1;font-size:16px;color:#4A1F35;font-weight:600">${esc(opts.dateLabel)} · ${esc(opts.timeLabel)} IST</span></div>
     ${opts.meetLink ? `<p style="font-size:13px"><a href="${esc(opts.meetLink)}" style="color:#4A1F35">${esc(opts.meetLink)}</a></p>` : ""}`
  );
  return sendEmail({ to: [{ email: opts.to, name: opts.patientName }], subject: hdr(`Rescheduled: ${opts.categoryName}`), html });
}

export async function sendCancellationEmail(opts: {
  to: string;
  patientName: string;
  referenceCode: string;
  categoryName: string;
}) {
  const html = emailShell(
    "Consultation cancelled",
    `<p style="font-size:14px;line-height:1.7;color:#6B3450">Hi ${esc(opts.patientName)}, your booking <b>${esc(opts.referenceCode)}</b> (${esc(opts.categoryName)}) has been cancelled. If you'd like to book again, you're welcome back anytime.</p>`
  );
  return sendEmail({ to: [{ email: opts.to, name: opts.patientName }], subject: hdr(`Cancelled: ${opts.categoryName}`), html });
}

export async function sendClinicNewBookingAlert(opts: {
  referenceCode: string;
  patientName: string;
  patientPhone: string;
  categoryName: string;
  dateLabel: string;
  timeLabel: string;
  reason: string;
}) {
  if (!env.clinicNotifyEmail) return; // optional
  const html = emailShell(
    "New booking received",
    `<p style="font-size:14px;line-height:1.7;color:#6B3450"><b>${esc(opts.patientName)}</b> (${esc(opts.patientPhone)}) booked ${esc(opts.categoryName)} on ${esc(opts.dateLabel)} at ${esc(opts.timeLabel)} IST. Reference ${esc(opts.referenceCode)}.</p>
     <p style="font-size:13px;color:#6B3450;white-space:pre-wrap">${esc(opts.reason) || "(no notes provided)"}</p>`
  );
  return sendEmail({ to: [{ email: env.clinicNotifyEmail }], subject: hdr(`New booking · ${opts.patientName} · ${opts.dateLabel}`), html });
}
