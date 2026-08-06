import { resend, FROM, BASE_URL, layout, ctaButton, detail, detailTable } from "../_shared";

const fmt = (iso: string) =>
  new Intl.DateTimeFormat("en", { dateStyle: "long", timeStyle: "short" }).format(new Date(iso));

// ── Registration confirmed (free event) ──────────────────────────────────────

export async function sendEventJoinedEmail(to: string, data: {
  userName: string;
  eventTitle: string;
  sport: string;
  location: string;
  startDateTime: string;
  eventId: string;
}) {
  const html = layout(`
    <p style="margin:0 0 6px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#e21d12;">Registration confirmed</p>
    <h1 style="margin:0 0 24px;font-size:26px;font-weight:900;color:#18181b;line-height:1.2;">You're in, ${data.userName}!</h1>
    <p style="margin:0 0 28px;font-size:15px;color:#52525b;line-height:1.6;">You've successfully registered for <strong>${data.eventTitle}</strong>. Get ready to play!</p>

    ${detailTable(
      detail("🏟", "Event", data.eventTitle),
      detail("🏅", "Sport", data.sport),
      detail("📍", "Location", data.location),
      detail("📅", "Date", fmt(data.startDateTime)),
    )}

    <center>${ctaButton(`${BASE_URL}/events/${data.eventId}`, "View event →")}</center>
  `);

  await resend.emails.send({ from: FROM, to, subject: `You're registered for ${data.eventTitle}!`, html });
}

// ── Payment confirmed (paid event) ───────────────────────────────────────────

export async function sendPaymentReceiptEmail(to: string, data: {
  userName: string;
  eventTitle: string;
  sport: string;
  location: string;
  startDateTime: string;
  eventId: string;
  amountCents: number;
  currency: string;
}) {
  const amount = new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: data.currency.toUpperCase(),
  }).format(data.amountCents / 100);

  const html = layout(`
    <p style="margin:0 0 6px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#e21d12;">Payment confirmed</p>
    <h1 style="margin:0 0 24px;font-size:26px;font-weight:900;color:#18181b;line-height:1.2;">You're in, ${data.userName}!</h1>
    <p style="margin:0 0 28px;font-size:15px;color:#52525b;line-height:1.6;">Your payment was successful and your spot for <strong>${data.eventTitle}</strong> is confirmed.</p>

    ${detailTable(
      detail("🏟", "Event", data.eventTitle),
      detail("🏅", "Sport", data.sport),
      detail("📍", "Location", data.location),
      detail("📅", "Date", fmt(data.startDateTime)),
      detail("💳", "Amount paid", amount),
    )}

    <center>${ctaButton(`${BASE_URL}/events/${data.eventId}`, "View event →")}</center>
  `);

  await resend.emails.send({ from: FROM, to, subject: `Payment confirmed — ${data.eventTitle}`, html });
}

// ── Upcoming event reminder (7d / 2d / morning) ──────────────────────────────

export async function sendUpcomingEventEmail(to: string, data: {
  userName: string;
  eventTitle: string;
  sport: string;
  location: string;
  startDateTime: string;
  eventId: string;
  hoursUntil: number;
  reminderLabel: "7d" | "2d" | "morning";
}) {
  const configs = {
    "7d":      { urgency: "📅 Coming up next week", when: "in 7 days",   body: `Just a heads-up — <strong>${data.eventTitle}</strong> is one week away. Make sure you're ready!`, subject: `📅 One week away: ${data.eventTitle}` },
    "2d":      { urgency: "📅 Almost time",          when: "in 2 days",   body: `<strong>${data.eventTitle}</strong> is just 2 days away. Start getting ready!`, subject: `📅 2 days away: ${data.eventTitle}` },
    "morning": { urgency: "⚡ Today's the day",      when: "today",       body: `<strong>${data.eventTitle}</strong> is happening today. See you out there!`, subject: `⚡ Today: ${data.eventTitle}` },
  };
  const { urgency, when, body, subject } = configs[data.reminderLabel];

  const html = layout(`
    <p style="margin:0 0 6px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#e21d12;">${urgency}</p>
    <h1 style="margin:0 0 24px;font-size:26px;font-weight:900;color:#18181b;line-height:1.2;">Your event is ${when}, ${data.userName}!</h1>
    <p style="margin:0 0 28px;font-size:15px;color:#52525b;line-height:1.6;">${body}</p>

    ${detailTable(
      detail("🏟", "Event", data.eventTitle),
      detail("🏅", "Sport", data.sport),
      detail("📍", "Location", data.location),
      detail("📅", "Date", fmt(data.startDateTime)),
    )}

    <center>${ctaButton(`${BASE_URL}/events/${data.eventId}`, "View event →")}</center>
  `);

  await resend.emails.send({ from: FROM, to, subject, html });
}

// ── Event cancelled (by organizer / admin) ───────────────────────────────────

export async function sendEventCancelledEmail(to: string, data: {
  userName: string;
  eventTitle: string;
  sport: string;
  location: string;
  startDateTime: string;
  refund?: { amountCents: number; currency: string } | "pending_review";
}) {
  const refundNote =
    data.refund === "pending_review"
      ? `<p style="margin:0 0 28px;font-size:15px;color:#52525b;line-height:1.6;">Your payment is being reviewed by our team and will be refunded shortly.</p>`
      : data.refund
      ? `<p style="margin:0 0 28px;font-size:15px;color:#52525b;line-height:1.6;">Your payment of <strong>${(data.refund.amountCents / 100).toFixed(2)} ${data.refund.currency.toUpperCase()}</strong> has been refunded to your Playver wallet.</p>`
      : "";

  const html = layout(`
    <p style="margin:0 0 6px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#e21d12;">Event cancelled</p>
    <h1 style="margin:0 0 24px;font-size:26px;font-weight:900;color:#18181b;line-height:1.2;">Sorry, ${data.userName} — this event has been cancelled.</h1>
    <p style="margin:0 0 28px;font-size:15px;color:#52525b;line-height:1.6;">The event you registered for has been cancelled by the organizer. We hope to see you at a future event!</p>
    ${refundNote}

    ${detailTable(
      detail("🏟", "Event", data.eventTitle),
      detail("🏅", "Sport", data.sport),
      detail("📍", "Location", data.location),
      detail("📅", "Was scheduled", fmt(data.startDateTime)),
    )}

    <center>${ctaButton(`${BASE_URL}/events`, "Browse other events →")}</center>
  `);

  await resend.emails.send({ from: FROM, to, subject: `Cancelled: ${data.eventTitle}`, html });
}

// ── Event postponed (by organizer / admin) ───────────────────────────────────

export async function sendEventPostponedEmail(to: string, data: {
  userName: string;
  eventTitle: string;
  sport: string;
  location: string;
  oldStartDateTime: string;
  newStartDateTime: string;
  eventId: string;
}) {
  const html = layout(`
    <p style="margin:0 0 6px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#e21d12;">Event rescheduled</p>
    <h1 style="margin:0 0 24px;font-size:26px;font-weight:900;color:#18181b;line-height:1.2;">Heads up, ${data.userName} — this event has a new date.</h1>
    <p style="margin:0 0 28px;font-size:15px;color:#52525b;line-height:1.6;">The organizer has rescheduled <strong>${data.eventTitle}</strong>. You're still registered — no action needed.</p>

    ${detailTable(
      detail("🏟", "Event", data.eventTitle),
      detail("🏅", "Sport", data.sport),
      detail("📍", "Location", data.location),
      detail("📅", "Was scheduled", fmt(data.oldStartDateTime)),
      detail("🆕", "New date", fmt(data.newStartDateTime)),
    )}

    <center>${ctaButton(`${BASE_URL}/events/${data.eventId}`, "View event →")}</center>
  `);

  await resend.emails.send({ from: FROM, to, subject: `Rescheduled: ${data.eventTitle}`, html });
}

// ── Removed from event (by admin) ────────────────────────────────────────────

export async function sendRemovedFromEventEmail(to: string, data: {
  userName: string;
  eventTitle: string;
  sport: string;
  location: string;
  startDateTime: string;
}) {
  const html = layout(`
    <p style="margin:0 0 6px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#e21d12;">Registration update</p>
    <h1 style="margin:0 0 24px;font-size:26px;font-weight:900;color:#18181b;line-height:1.2;">You've been removed from an event.</h1>
    <p style="margin:0 0 28px;font-size:15px;color:#52525b;line-height:1.6;">Hi ${data.userName}, an administrator has removed you from the following event. If you think this is a mistake, please reach out to the organizer.</p>

    ${detailTable(
      detail("🏟", "Event", data.eventTitle),
      detail("🏅", "Sport", data.sport),
      detail("📍", "Location", data.location),
      detail("📅", "Date", fmt(data.startDateTime)),
    )}

    <center>${ctaButton(`${BASE_URL}/events`, "Browse other events →")}</center>
  `);

  await resend.emails.send({ from: FROM, to, subject: `You've been removed from ${data.eventTitle}`, html });
}
