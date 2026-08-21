// Standalone-team emails (src/app/actions/team.ts), not tournament teams —
// see tournament/index.ts for tournament_team roster emails.
import { resend, FROM, BASE_URL, layout, ctaButton, detail, detailTable } from "../_shared";

// ── Team joined ───────────────────────────────────────────────────────────────

export async function sendTeamJoinedEmail(to: string, data: {
  userName: string;
  teamName: string;
  sport: string;
  location: string;
  captainName: string;
  teamId: string;
}) {
  const html = layout(`
    <p style="margin:0 0 6px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#e21d12;">Team confirmed</p>
    <h1 style="margin:0 0 24px;font-size:26px;font-weight:900;color:#18181b;line-height:1.2;">Welcome to the team, ${data.userName}!</h1>
    <p style="margin:0 0 28px;font-size:15px;color:#52525b;line-height:1.6;">You've joined <strong>${data.teamName}</strong>. Your teammates are looking forward to playing with you.</p>

    ${detailTable(
      detail("👥", "Team", data.teamName),
      detail("🏅", "Sport", data.sport),
      detail("📍", "Location", data.location),
      detail("🎖", "Captain", data.captainName),
    )}

    <center>${ctaButton(`${BASE_URL}/teams/${data.teamId}`, "View team →")}</center>
  `);

  await resend.emails.send({ from: FROM, to, subject: `You've joined ${data.teamName}!`, html });
}
