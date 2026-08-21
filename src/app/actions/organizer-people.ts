"use server";

// An organization's staff roster and email invitations (7-day expiry, see
// hasExpired() in src/lib/organizer-invitations.ts). Role promotion/demotion
// goes through canAssignRole() (src/lib/organizer-permissions.ts) so a STAFF
// member with MANAGE_PEOPLE can't grant themselves or others admin.

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { pool, withTransaction } from "@/lib/db";
import { requireOrganizationPermission } from "./organization";
import { canAssignRole, type OrgRole } from "@/lib/organizer-permissions";
import { hasExpired } from "@/lib/organizer-invitations";
import { sendOrganizationInviteEmail } from "@/lib/emails";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://playver.ca";
const INVITATION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type MemberRow = {
  membershipId: string;
  userId: string;
  name: string;
  email: string;
  image: string | null;
  role: OrgRole;
  joinedAt: string;
};

export type InvitationRow = {
  id: string;
  email: string;
  role: OrgRole;
  status: "pending" | "expired";
  invitedAt: string;
  expiresAt: string;
  invitedByName: string | null;
};

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  return session;
}

// Flips any pending invitation whose expiresAt has passed to 'expired' before
// it's read or acted on — expiry is enforced lazily, there's no cron job.
async function expireStaleInvitations(organizationId: string): Promise<void> {
  await pool.query(
    `UPDATE "organization_invitation" SET status = 'expired', "updatedAt" = NOW()
     WHERE "organizationId" = $1 AND status = 'pending' AND "expiresAt" <= NOW()`,
    [organizationId]
  );
}

export async function getOrganizationPeople(): Promise<{
  members: MemberRow[];
  invitations: InvitationRow[];
}> {
  const { organization } = await requireOrganizationPermission("MANAGE_PEOPLE");

  await expireStaleInvitations(organization.id);

  const membersResult = await pool.query(
    `SELECT om.id AS "membershipId", u.id AS "userId", u.name, u.email, u.image, om.role, om."createdAt" AS "joinedAt"
     FROM "organization_membership" om
     JOIN "user" u ON u.id = om."userId"
     WHERE om."organizationId" = $1 AND om.status = 'active'
     ORDER BY om."createdAt" ASC`,
    [organization.id]
  );

  const invitationsResult = await pool.query(
    `SELECT oi.id, oi.email, oi.role, oi.status, oi."invitedAt", oi."expiresAt", inviter.name AS "invitedByName"
     FROM "organization_invitation" oi
     LEFT JOIN "user" inviter ON inviter.id = oi."invitedBy"
     WHERE oi."organizationId" = $1 AND oi.status IN ('pending', 'expired')
     ORDER BY oi."invitedAt" DESC`,
    [organization.id]
  );

  return {
    members: membersResult.rows.map((row) => ({
      ...row,
      joinedAt: new Date(row.joinedAt).toISOString(),
    })) as MemberRow[],
    invitations: invitationsResult.rows.map((row) => ({
      ...row,
      invitedAt: new Date(row.invitedAt).toISOString(),
      expiresAt: new Date(row.expiresAt).toISOString(),
    })) as InvitationRow[],
  };
}

export async function inviteOrganizationMember(
  email: string,
  role: OrgRole
): Promise<{ error?: string; invitationId?: string }> {
  const { userId, organization, role: assignerRole } = await requireOrganizationPermission("MANAGE_PEOPLE");

  const normalizedEmail = email.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(normalizedEmail)) return { error: "Enter a valid email address" };
  if (!canAssignRole(assignerRole, role)) return { error: "Forbidden" };

  await expireStaleInvitations(organization.id);

  const existingMember = await pool.query(
    `SELECT 1 FROM "organization_membership" om
     JOIN "user" u ON u.id = om."userId"
     WHERE om."organizationId" = $1 AND om.status = 'active' AND lower(u.email) = $2`,
    [organization.id, normalizedEmail]
  );
  if (existingMember.rows.length > 0) return { error: "This person is already a member" };

  const existingInvite = await pool.query(
    `SELECT 1 FROM "organization_invitation"
     WHERE "organizationId" = $1 AND lower(email) = $2 AND status = 'pending'`,
    [organization.id, normalizedEmail]
  );
  if (existingInvite.rows.length > 0) return { error: "An invitation is already pending for this email" };

  const invitationId = crypto.randomUUID();
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + INVITATION_LIFETIME_MS);

  await pool.query(
    `INSERT INTO "organization_invitation"
       (id, "organizationId", email, role, token, "invitedBy", "invitedAt", "expiresAt", status)
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, 'pending')`,
    [invitationId, organization.id, normalizedEmail, role, token, userId, expiresAt]
  );

  const session = await requireSession();
  sendOrganizationInviteEmail(normalizedEmail, {
    organizationName: organization.name,
    inviterName: session.user.name,
    role,
    acceptUrl: `${BASE_URL}/invite/${token}`,
    expiresAt: expiresAt.toISOString(),
  }).catch(() => {});

  return { invitationId };
}

// Batches the create-organization wizard's Admins step (several rows filled
// in at once) through the same single-invite path as the People page, so
// validation/dedupe/email-sending logic isn't duplicated. Continues past
// individual failures (e.g. a duplicate email in the batch) and reports them
// per-row rather than aborting the whole batch.
export async function inviteOrganizationMembers(
  entries: { email: string; role: OrgRole }[]
): Promise<{ errors: { email: string; error: string }[] }> {
  const errors: { email: string; error: string }[] = [];
  for (const entry of entries) {
    const trimmed = entry.email.trim();
    if (!trimmed) continue;
    const result = await inviteOrganizationMember(trimmed, entry.role);
    if (result.error) errors.push({ email: trimmed, error: result.error });
  }
  return { errors };
}

export async function resendOrganizationInvitation(invitationId: string): Promise<{ error?: string }> {
  const { organization, role: assignerRole } = await requireOrganizationPermission("MANAGE_PEOPLE");

  const invite = await pool.query(
    `SELECT email, role, token FROM "organization_invitation"
     WHERE id = $1 AND "organizationId" = $2 AND status IN ('pending', 'expired')`,
    [invitationId, organization.id]
  );
  const row = invite.rows[0];
  if (!row) return { error: "Invitation not found" };
  if (!canAssignRole(assignerRole, row.role)) return { error: "Forbidden" };

  const expiresAt = new Date(Date.now() + INVITATION_LIFETIME_MS);
  await pool.query(
    `UPDATE "organization_invitation" SET status = 'pending', "expiresAt" = $1, "updatedAt" = NOW()
     WHERE id = $2 AND "organizationId" = $3`,
    [expiresAt, invitationId, organization.id]
  );

  const session = await requireSession();
  sendOrganizationInviteEmail(row.email, {
    organizationName: organization.name,
    inviterName: session.user.name,
    role: row.role,
    acceptUrl: `${BASE_URL}/invite/${row.token}`,
    expiresAt: expiresAt.toISOString(),
  }).catch(() => {});

  return {};
}

export async function cancelOrganizationInvitation(invitationId: string): Promise<{ error?: string }> {
  const { organization } = await requireOrganizationPermission("MANAGE_PEOPLE");

  const result = await pool.query(
    `UPDATE "organization_invitation" SET status = 'cancelled', "updatedAt" = NOW()
     WHERE id = $1 AND "organizationId" = $2 AND status IN ('pending', 'expired')`,
    [invitationId, organization.id]
  );
  if (result.rowCount === 0) return { error: "Invitation not found" };
  return {};
}

async function assertNotLastOwner(organizationId: string, membershipId: string, currentRole: OrgRole): Promise<string | null> {
  if (currentRole !== "OWNER") return null;
  const ownerCount = await pool.query(
    `SELECT count(*)::int AS count FROM "organization_membership"
     WHERE "organizationId" = $1 AND role = 'OWNER' AND status = 'active'`,
    [organizationId]
  );
  if (ownerCount.rows[0]?.count <= 1) return "The organization must have at least one owner";
  return null;
}

export async function changeOrganizationMemberRole(
  membershipId: string,
  newRole: OrgRole
): Promise<{ error?: string }> {
  const { organization, role: assignerRole } = await requireOrganizationPermission("MANAGE_PEOPLE");

  const target = await pool.query(
    `SELECT role FROM "organization_membership"
     WHERE id = $1 AND "organizationId" = $2 AND status = 'active'`,
    [membershipId, organization.id]
  );
  const currentRole = target.rows[0]?.role as OrgRole | undefined;
  if (!currentRole) return { error: "Member not found" };
  if (!canAssignRole(assignerRole, newRole) || !canAssignRole(assignerRole, currentRole)) {
    return { error: "Forbidden" };
  }

  const ownerError = await assertNotLastOwner(organization.id, membershipId, currentRole);
  if (ownerError && newRole !== "OWNER") return { error: ownerError };

  await pool.query(
    `UPDATE "organization_membership" SET role = $1, "updatedAt" = NOW()
     WHERE id = $2 AND "organizationId" = $3`,
    [newRole, membershipId, organization.id]
  );
  return {};
}

export async function removeOrganizationMember(membershipId: string): Promise<{ error?: string }> {
  const { organization, role: assignerRole } = await requireOrganizationPermission("MANAGE_PEOPLE");

  const target = await pool.query(
    `SELECT role FROM "organization_membership"
     WHERE id = $1 AND "organizationId" = $2 AND status = 'active'`,
    [membershipId, organization.id]
  );
  const currentRole = target.rows[0]?.role as OrgRole | undefined;
  if (!currentRole) return { error: "Member not found" };
  if (!canAssignRole(assignerRole, currentRole)) return { error: "Forbidden" };

  const ownerError = await assertNotLastOwner(organization.id, membershipId, currentRole);
  if (ownerError) return { error: ownerError };

  await pool.query(
    `UPDATE "organization_membership" SET status = 'removed', "updatedAt" = NOW()
     WHERE id = $1 AND "organizationId" = $2`,
    [membershipId, organization.id]
  );
  return {};
}

type InvitationLookupError = "invalid" | "cancelled" | "accepted" | "expired";

export type InvitationDetails = {
  organizationId: string;
  organizationName: string;
  email: string;
  role: OrgRole;
};

export async function getInvitationByToken(
  token: string
): Promise<{ invitation: InvitationDetails } | { error: InvitationLookupError }> {
  const result = await pool.query(
    `SELECT oi."organizationId", o.name AS "organizationName", oi.email, oi.role, oi.status, oi."expiresAt"
     FROM "organization_invitation" oi
     JOIN "organization" o ON o.id = oi."organizationId"
     WHERE oi.token = $1`,
    [token]
  );
  const row = result.rows[0];
  if (!row) return { error: "invalid" };

  if (row.status === "pending" && hasExpired(row.expiresAt)) {
    await pool.query(
      `UPDATE "organization_invitation" SET status = 'expired', "updatedAt" = NOW() WHERE token = $1`,
      [token]
    );
    return { error: "expired" };
  }
  if (row.status !== "pending") return { error: row.status as InvitationLookupError };

  return {
    invitation: {
      organizationId: row.organizationId,
      organizationName: row.organizationName,
      email: row.email,
      role: row.role,
    },
  };
}

export async function acceptOrganizationInvitation(
  token: string
): Promise<{ error?: string; organizationId?: string }> {
  const session = await requireSession();

  const lookup = await getInvitationByToken(token);
  if ("error" in lookup) return { error: lookup.error };

  if (lookup.invitation.email.toLowerCase() !== session.user.email.toLowerCase()) {
    return { error: "email_mismatch" };
  }

  await withTransaction(async (client) => {
    await client.query(
      `INSERT INTO "organization_membership" (id, "organizationId", "userId", role, status, "acceptedAt")
       VALUES ($1, $2, $3, $4, 'active', NOW())
       ON CONFLICT ("organizationId", "userId") DO UPDATE
       SET role = EXCLUDED.role, status = 'active', "acceptedAt" = NOW(), "updatedAt" = NOW()`,
      [crypto.randomUUID(), lookup.invitation.organizationId, session.user.id, lookup.invitation.role]
    );
    await client.query(
      `UPDATE "organization_invitation" SET status = 'accepted', "acceptedAt" = NOW(), "updatedAt" = NOW()
       WHERE token = $1`,
      [token]
    );
  });

  return { organizationId: lookup.invitation.organizationId };
}
