import { resend, FROM, layout, ctaButton, detail, detailTable } from "./_shared";

function formatOrgRole(role: string) {
  return role
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatExpiry(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export async function sendOrganizationInviteEmail(to: string, data: {
  organizationName: string;
  inviterName: string;
  role: string;
  acceptUrl: string;
  expiresAt: string;
}) {
  const html = layout(`
    <p style="margin:0 0 6px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#e21d12;">Organization invitation</p>
    <h1 style="margin:0 0 24px;font-size:26px;font-weight:900;color:#18181b;line-height:1.2;">${data.inviterName} invited you to join ${data.organizationName}</h1>
    <p style="margin:0 0 28px;font-size:15px;color:#52525b;line-height:1.6;">You've been invited to join <strong>${data.organizationName}</strong> on Playver as a team member.</p>

    ${detailTable(
      detail("🏢", "Organization", data.organizationName),
      detail("🎖️", "Role", formatOrgRole(data.role)),
    )}

    <center>${ctaButton(data.acceptUrl, "Accept invitation →")}</center>
    <p style="margin:24px 0 0;font-size:13px;color:#a1a1aa;line-height:1.6;">This invitation expires on ${formatExpiry(data.expiresAt)}. If you weren't expecting this, you can safely ignore this email.</p>
  `);

  await resend.emails.send({
    from: FROM,
    to,
    subject: `${data.inviterName} invited you to join ${data.organizationName} on Playver`,
    html,
  });
}
