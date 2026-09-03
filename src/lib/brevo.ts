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
  /* Brevo takes attachments as base64 in the same JSON body. Their documented
     ceiling is 10MB across all attachments; a prescription PDF is a few KB, so
     no chunking or hosting is needed. */
  attachments?: { name: string; content: Buffer }[];
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
      ...(opts.attachments?.length
        ? { attachment: opts.attachments.map((a) => ({ name: a.name, content: a.content.toString("base64") })) }
        : {}),
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

/**
 * The prescription & advice email.
 *
 * This one carries clinical instructions, so it is written differently from
 * the booking mails:
 *   · Every field goes through `esc()` like the rest, and the medicine table
 *     is built from validated rows — a prescription is the LAST place a stray
 *     tag should be able to reach a patient's inbox.
 *   · The doctor's name, qualifications and registration number are printed
 *     under the document, because that is what makes it a prescription rather
 *     than an email with drug names in it.
 *   · It carries an explicit safety line. A patient reading this on a phone at
 *     2am needs to know what to do if something feels wrong, and that this
 *     mailbox is not monitored for emergencies.
 *   · `replyTo` is the clinic's support address so a question about the
 *     prescription reaches a human instead of bouncing off a no-reply sender.
 */
export async function sendPrescriptionEmail(opts: {
  to: string;
  patientName: string;
  referenceCode: string;
  consultDateLabel: string;
  diagnosis: string;
  medicines: { name: string; dose: string; frequency: string; duration: string; notes: string }[];
  advice: string;
  followUpLabel: string | null;
  doctorName: string;
  qualifications: string | null;
  registrationNo: string | null;
  supportEmail: string;
  /** The same prescription as a printable A4 attachment. */
  pdf?: { name: string; content: Buffer } | null;
}) {
  const cell = "padding:9px 10px;font-size:13px;color:#2E1020;vertical-align:top";
  const head = "padding:8px 10px;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#8D6B79;text-align:left;font-weight:600";

  const medsHtml = opts.medicines.length
    ? `<table style="width:100%;border-collapse:collapse;margin:6px 0 18px;border:1px solid #F0E3DF;border-radius:10px;overflow:hidden">
         <tr style="background:#FAF2EF">
           <th style="${head}">Medicine</th><th style="${head}">Dose</th>
           <th style="${head}">When</th><th style="${head}">How long</th>
         </tr>
         ${opts.medicines
           .map(
             (m, i) => `<tr style="${i % 2 ? "background:#FDFAF9" : ""};border-top:1px solid #F3E8E5">
             <td style="${cell};font-weight:600">${esc(m.name)}</td>
             <td style="${cell}">${esc(m.dose) || "—"}</td>
             <td style="${cell}">${esc(m.frequency) || "—"}</td>
             <td style="${cell}">${esc(m.duration) || "—"}</td>
           </tr>${
             m.notes
               ? `<tr style="${i % 2 ? "background:#FDFAF9" : ""}"><td colspan="4" style="padding:0 10px 9px;font-size:12px;color:#6B3450">${esc(m.notes)}</td></tr>`
               : ""
           }`
           )
           .join("")}
       </table>`
    : "";

  const block = (label: string, body: string) =>
    body
      ? `<div style="margin:18px 0">
           <div style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#8D6B79;font-weight:600;margin-bottom:6px">${esc(label)}</div>
           <div style="font-size:13px;line-height:1.75;color:#2E1020;white-space:pre-wrap">${esc(body)}</div>
         </div>`
      : "";

  const html = emailShell(
    "Your prescription & advice",
    `<p style="font-size:14px;line-height:1.7;color:#6B3450">Hi ${esc(opts.patientName)}, here is your prescription following your consultation on ${esc(opts.consultDateLabel)}.</p>

     ${block("Diagnosis", opts.diagnosis)}

     ${opts.medicines.length ? `<div style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#8D6B79;font-weight:600;margin:18px 0 0">Medicines</div>${medsHtml}` : ""}

     ${block("Advice", opts.advice)}

     ${
       opts.followUpLabel
         ? `<div style="margin:18px 0;padding:14px 16px;border-radius:12px;background:rgba(201,168,124,.12);border:1px solid rgba(201,168,124,.32)">
              <div style="font-size:12px;color:#8A6A34;font-weight:600">Follow-up</div>
              <div style="font-size:14px;color:#2E1020;margin-top:3px">${esc(opts.followUpLabel)}</div>
            </div>`
         : ""
     }

     <div style="margin-top:26px;padding-top:16px;border-top:1px solid #F0E3DF">
       <div style="font-size:13px;font-weight:600;color:#2E1020">${esc(opts.doctorName)}</div>
       ${opts.qualifications ? `<div style="font-size:12px;color:#6B3450;margin-top:2px">${esc(opts.qualifications)}</div>` : ""}
       ${opts.registrationNo ? `<div style="font-size:11px;color:#8D6B79;margin-top:3px">Reg. No. ${esc(opts.registrationNo)}</div>` : ""}
       <div style="font-size:11px;color:#A98C98;margin-top:6px">Consultation reference ${esc(opts.referenceCode)}</div>
     </div>

     <div style="margin-top:18px;padding:14px 16px;border-radius:12px;background:rgba(200,72,72,.06);border:1px solid rgba(200,72,72,.2)">
       <div style="font-size:12px;font-weight:600;color:#9B2C2C;margin-bottom:4px">Please read</div>
       <div style="font-size:12px;line-height:1.7;color:#6B3450">
         Take these medicines exactly as written above. Tell the clinic before starting them if you are pregnant,
         breastfeeding, or already taking other medication, and stop and seek help if you develop a rash, swelling,
         breathlessness or any reaction that worries you.
         <b>This inbox is not monitored for emergencies</b> — for anything urgent, contact your nearest emergency
         department. Questions about this prescription: ${esc(opts.supportEmail)}.
       </div>
     </div>`
  );

  return sendEmail({
    to: [{ email: opts.to, name: opts.patientName }],
    subject: hdr(`Your prescription from Dr Hemangi · ${opts.consultDateLabel}`),
    html,
    replyTo: opts.supportEmail,
    attachments: opts.pdf ? [opts.pdf] : undefined,
  });
}
