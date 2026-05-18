import { resend, FROM, BASE_URL, layout, ctaButton, detail, detailTable } from "./_shared";

// ── Welcome (new sign-up) ────────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, data: { userName: string }) {
  const html = layout(`
    <p style="margin:0 0 6px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#e21d12;">Welcome to Playver</p>
    <h1 style="margin:0 0 24px;font-size:26px;font-weight:900;color:#18181b;line-height:1.2;">Hey ${data.userName}, let's play! 🏅</h1>
    <p style="margin:0 0 16px;font-size:15px;color:#52525b;line-height:1.6;">Your Playver account is ready. Here's what you can do:</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr><td style="padding:8px 0;font-size:14px;color:#3f3f46;">🏟&nbsp;&nbsp;<strong>Join events</strong> — find pickup games, tournaments, and open gyms near you.</td></tr>
      <tr><td style="padding:8px 0;font-size:14px;color:#3f3f46;">👥&nbsp;&nbsp;<strong>Join a team</strong> — team up with other athletes in your sport.</td></tr>
      <tr><td style="padding:8px 0;font-size:14px;color:#3f3f46;">📅&nbsp;&nbsp;<strong>Get reminders</strong> — we'll ping you 24 h and 2 h before every event you join.</td></tr>
    </table>

    <center>${ctaButton(`${BASE_URL}/events`, "Browse events →")}</center>
  `);

  await resend.emails.send({ from: FROM, to, subject: `Welcome to Playver, ${data.userName}!`, html });
}

// ── Role changed (by admin) ───────────────────────────────────────────────────

function formatRole(role: string) {
  return role === "super_admin" ? "Super Admin" : role.charAt(0).toUpperCase() + role.slice(1);
}

export async function sendRoleChangedEmail(to: string, data: {
  userName: string;
  oldRole: string;
  newRole: string;
}) {
  const newLabel = formatRole(data.newRole);
  const oldLabel = formatRole(data.oldRole);
  const isPromotion = data.newRole === "organizer" || data.newRole === "super_admin";

  const html = layout(`
    <p style="margin:0 0 6px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#e21d12;">Account update</p>
    <h1 style="margin:0 0 24px;font-size:26px;font-weight:900;color:#18181b;line-height:1.2;">Your role has been updated${isPromotion ? " 🎉" : ""}.</h1>
    <p style="margin:0 0 28px;font-size:15px;color:#52525b;line-height:1.6;">Hi ${data.userName}, a Playver administrator has updated your account role.</p>

    ${detailTable(
      detail("📋", "Previous role", oldLabel),
      detail("✅", "New role", newLabel),
    )}

    ${isPromotion ? `<p style="margin:24px 0 0;font-size:14px;color:#52525b;line-height:1.6;">As an <strong>${newLabel}</strong>, you now have access to additional features on Playver.</p>` : ""}

    <center>${ctaButton(`${BASE_URL}/dashboard`, "Go to dashboard →")}</center>
  `);

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Your Playver role has been updated to ${newLabel}`,
    html,
  });
}
