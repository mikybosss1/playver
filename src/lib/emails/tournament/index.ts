import { resend, FROM, BASE_URL, layout, ctaButton, detail, detailTable } from "../_shared";

const fmt = (iso: string) =>
  new Intl.DateTimeFormat("en", { dateStyle: "long", timeStyle: "short" }).format(new Date(iso));

export async function sendTournamentMemberInviteEmail(to: string, data: {
  memberName: string;
  captainName: string;
  teamName: string;
  tournamentTitle: string;
  sport: string;
  location: string;
  startDateTime: string;
  confirmUrl: string;
  declineUrl: string;
}) {
  const html = layout(`
    <p style="margin:0 0 6px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#e21d12;">Tournament Invite</p>
    <h1 style="margin:0 0 16px;font-size:26px;font-weight:900;color:#18181b;line-height:1.2;">You've been added to a team, ${data.memberName}!</h1>
    <p style="margin:0 0 28px;font-size:15px;color:#52525b;line-height:1.6;">
      <strong>${data.captainName}</strong> has registered your team <strong>${data.teamName}</strong> for <strong>${data.tournamentTitle}</strong>.
      Will you be there? Confirm your spot or let your captain know you can't make it.
    </p>

    ${detailTable(
      detail("🏆", "Tournament", data.tournamentTitle),
      detail("🏅", "Sport", data.sport),
      detail("📍", "Location", data.location),
      detail("📅", "Date", fmt(data.startDateTime)),
      detail("👥", "Team", data.teamName),
    )}

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
      <tr>
        <td style="padding-right:8px;">
          <a href="${data.confirmUrl}" style="display:block;padding:14px 0;background:#22c55e;color:#fff;font-weight:700;font-size:14px;border-radius:10px;text-decoration:none;text-align:center;">
            ✓ Yes, I'll be there
          </a>
        </td>
        <td style="padding-left:8px;">
          <a href="${data.declineUrl}" style="display:block;padding:14px 0;background:#f4f4f5;color:#52525b;font-weight:700;font-size:14px;border-radius:10px;text-decoration:none;text-align:center;border:1px solid #e4e4e7;">
            ✗ Can't make it
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:24px 0 0;font-size:12px;color:#a1a1aa;text-align:center;">
      Your captain will be notified of your choice. You can always change your mind on the tournament page.
    </p>
  `);

  await resend.emails.send({
    from: FROM,
    to,
    subject: `${data.captainName} added you to ${data.teamName} for ${data.tournamentTitle}`,
    html,
  });
}

export async function sendJoinRequestNotificationEmail(to: string, data: {
  captainName: string;
  requesterName: string;
  teamName: string;
  tournamentTitle: string;
  tournamentId: string;
}) {
  const reviewUrl = `${BASE_URL}/events/${data.tournamentId}`;

  const html = layout(`
    <p style="margin:0 0 6px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#e21d12;">Join Request</p>
    <h1 style="margin:0 0 16px;font-size:26px;font-weight:900;color:#18181b;line-height:1.2;">Someone wants to join your team!</h1>
    <p style="margin:0 0 28px;font-size:15px;color:#52525b;line-height:1.6;">
      <strong>${data.requesterName}</strong> has requested to join <strong>${data.teamName}</strong> for <strong>${data.tournamentTitle}</strong>.
      Head to the tournament page to accept or decline their request.
    </p>

    ${detailTable(
      detail("👤", "Requester", data.requesterName),
      detail("🏆", "Tournament", data.tournamentTitle),
      detail("👥", "Your Team", data.teamName),
    )}

    ${ctaButton(reviewUrl, "Review Request")}

    <p style="margin:24px 0 0;font-size:12px;color:#a1a1aa;text-align:center;">
      You can accept or decline this request from the Teams tab on the tournament page.
    </p>
  `);

  await resend.emails.send({
    from: FROM,
    to,
    subject: `${data.requesterName} wants to join ${data.teamName}`,
    html,
  });
}
