"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";

let teamMembersTablePromise: Promise<void> | null = null;

async function ensureTeamMembersTable() {
  teamMembersTablePromise ??= pool.query(
    `CREATE TABLE IF NOT EXISTS "team_member" (
      "id"        text PRIMARY KEY,
      "teamId"    text NOT NULL REFERENCES "team"("id") ON DELETE CASCADE,
      "userId"    text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
      "joinedAt"  timestamp NOT NULL DEFAULT NOW(),
      UNIQUE("teamId", "userId")
    )`
  ).then(() => undefined);
  await teamMembersTablePromise;
}

type TeamRow = {
  id: string;
  name: string;
  sport: string;
  location: string;
  bio: string | null;
  captainPhone: string | null;
  logoUrl: string | null;
  captainId: string;
  captainName: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  memberCount: string | number;
};

function serializeTeam(row: TeamRow) {
  return {
    ...row,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
    memberCount: Number(row.memberCount ?? 0),
  };
}

export type TeamItem = ReturnType<typeof serializeTeam>;
export type TeamMember = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  joinedAt: string;
};

export async function createTeam(data: {
  name: string;
  sport: string;
  location: string;
  bio?: string;
  captainPhone?: string;
  logoUrl?: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const id = crypto.randomUUID();
  await pool.query(
    `INSERT INTO "team" (id, name, sport, location, bio, "captainPhone", "logoUrl", "captainId", "createdAt", "updatedAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())`,
    [id, data.name, data.sport, data.location, data.bio ?? null, data.captainPhone ?? null, data.logoUrl ?? null, session.user.id]
  );

  await ensureTeamMembersTable();
  await pool.query(
    `INSERT INTO "team_member" (id, "teamId", "userId") VALUES ($1, $2, $3)`,
    [crypto.randomUUID(), id, session.user.id]
  );

  revalidatePath("/teams");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/teams");
  return { id };
}

export async function getTeams() {
  await ensureTeamMembersTable();
  const result = await pool.query(
    `SELECT t.*, u.name as "captainName", COUNT(tm.id) as "memberCount"
     FROM "team" t
     JOIN "user" u ON t."captainId" = u.id
     LEFT JOIN "team_member" tm ON tm."teamId" = t.id
     GROUP BY t.id, u.name
     ORDER BY t."createdAt" DESC`
  );
  return result.rows.map(serializeTeam);
}

export async function getTeamById(teamId: string) {
  await ensureTeamMembersTable();
  const result = await pool.query(
    `SELECT t.*, u.name as "captainName", COUNT(tm.id) as "memberCount"
     FROM "team" t
     JOIN "user" u ON t."captainId" = u.id
     LEFT JOIN "team_member" tm ON tm."teamId" = t.id
     WHERE t.id = $1
     GROUP BY t.id, u.name`,
    [teamId]
  );
  return result.rows[0] ? serializeTeam(result.rows[0]) : null;
}

export async function getMyTeams() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return [];
  await ensureTeamMembersTable();
  const result = await pool.query(
    `SELECT t.*, u.name as "captainName", COUNT(tm.id) as "memberCount"
     FROM "team" t
     JOIN "user" u ON t."captainId" = u.id
     LEFT JOIN "team_member" tm ON tm."teamId" = t.id
     WHERE t."captainId" = $1
     GROUP BY t.id, u.name
     ORDER BY t."createdAt" DESC`,
    [session.user.id]
  );
  return result.rows.map(serializeTeam);
}

export async function getJoinedTeams() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return [];
  await ensureTeamMembersTable();
  const result = await pool.query(
    `SELECT t.*, u.name as "captainName", COUNT(all_tm.id) as "memberCount"
     FROM "team" t
     JOIN "user" u ON t."captainId" = u.id
     JOIN "team_member" tm ON tm."teamId" = t.id
     LEFT JOIN "team_member" all_tm ON all_tm."teamId" = t.id
     WHERE tm."userId" = $1 AND t."captainId" != $1
     GROUP BY t.id, u.name, tm."joinedAt"
     ORDER BY tm."joinedAt" DESC`,
    [session.user.id]
  );
  return result.rows.map(serializeTeam);
}

export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  await ensureTeamMembersTable();
  const result = await pool.query(
    `SELECT u.id, u.name, u.email, u.image, tm."joinedAt"
     FROM "team_member" tm
     JOIN "user" u ON u.id = tm."userId"
     WHERE tm."teamId" = $1
     ORDER BY tm."joinedAt" ASC`,
    [teamId]
  );
  return result.rows.map((row: TeamMember & { joinedAt: Date | string }) => ({
    ...row,
    joinedAt: new Date(row.joinedAt).toISOString(),
  }));
}

export async function joinTeam(teamId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  await ensureTeamMembersTable();

  const existing = await pool.query(
    `SELECT id FROM "team_member" WHERE "teamId" = $1 AND "userId" = $2`,
    [teamId, session.user.id]
  );
  if (existing.rows.length > 0) throw new Error("Already a member");

  await pool.query(
    `INSERT INTO "team_member" (id, "teamId", "userId") VALUES ($1, $2, $3)`,
    [crypto.randomUUID(), teamId, session.user.id]
  );

  revalidatePath("/teams");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/teams");
}

export async function leaveTeam(teamId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  await ensureTeamMembersTable();

  await pool.query(
    `DELETE FROM "team_member" WHERE "teamId" = $1 AND "userId" = $2`,
    [teamId, session.user.id]
  );

  revalidatePath("/teams");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/teams");
}

export async function getMembershipMap(teamIds: string[]): Promise<Set<string>> {
  if (teamIds.length === 0) return new Set();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new Set();
  await ensureTeamMembersTable();
  const result = await pool.query(
    `SELECT "teamId" FROM "team_member" WHERE "teamId" = ANY($1) AND "userId" = $2`,
    [teamIds, session.user.id]
  );
  return new Set(result.rows.map((r: { teamId: string }) => r.teamId));
}
