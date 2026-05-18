import { resend, FROM, BASE_URL, layout, ctaButton, detail, detailTable } from "../_shared";

// ── New participant joined ────────────────────────────────────────────────────

export async function sendNewParticipantEmail(to: string, data: {
  organizerName: string;
  participantName: string;
  eventTitle: string;
  eventId: string;
  participantCount: number;
  capacity: number | null;
}) {
  const spotsLabel = data.capacity
    ? `${data.participantCount} / ${data.capacity} spots filled`
    : `${data.participantCount} registered`;

  const html = layout(`
    <p style="margin:0 0 6px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#e21d12;">New registration</p>
    <h1 style="margin:0 0 24px;font-size:26px;font-weight:900;color:#18181b;line-height:1.2;">Someone just joined your event!</h1>
    <p style="margin:0 0 28px;font-size:15px;color:#52525b;line-height:1.6;"><strong>${data.participantName}</strong> has registered for <strong>${data.eventTitle}</strong>.</p>

    ${detailTable(
      detail("👤", "Participant", data.participantName),
      detail("🏟", "Event", data.eventTitle),
      detail("📊", "Registrations", spotsLabel),
    )}

    <center>${ctaButton(`${BASE_URL}/events/${data.eventId}`, "View participants →")}</center>
  `);

  await resend.emails.send({
    from: FROM,
    to,
    subject: `New registration: ${data.participantName} joined ${data.eventTitle}`,
    html,
  });
}

// ── Event is now full ────────────────────────────────────────────────────────

export async function sendEventFullEmail(to: string, data: {
  organizerName: string;
  eventTitle: string;
  eventId: string;
  capacity: number;
}) {
  const html = layout(`
    <p style="margin:0 0 6px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#e21d12;">🎉 Event full</p>
    <h1 style="margin:0 0 24px;font-size:26px;font-weight:900;color:#18181b;line-height:1.2;">Your event is fully booked!</h1>
    <p style="margin:0 0 28px;font-size:15px;color:#52525b;line-height:1.6;"><strong>${data.eventTitle}</strong> has reached its capacity of <strong>${data.capacity} participants</strong>. No new registrations will be accepted.</p>

    <center>${ctaButton(`${BASE_URL}/events/${data.eventId}`, "View event →")}</center>
  `);

  await resend.emails.send({ from: FROM, to, subject: `${data.eventTitle} is now full!`, html });
}
