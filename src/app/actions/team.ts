"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";

let teamMembersTablePromise: Promise<void> | null = null;

async function ensureTeamMembersTable() {
  teamMembersTablePromise ??= Promise.all([
    pool.query(
      `CREATE TABLE IF NOT EXISTS "team_member" (
        "id"        text PRIMARY KEY,
        "teamId"    text NOT NULL REFERENCES "team"("id") ON DELETE CASCADE,
        "userId"    text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "joinedAt"  timestamp NOT NULL DEFAULT NOW()
      )`
    ),
    pool.query(`ALTER TABLE "team" ADD COLUMN IF NOT EXISTS "coverImageUrl" text`),
    pool.query(`ALTER TABLE "team" ADD COLUMN IF NOT EXISTS "recruitmentOpen" boolean NOT NULL DEFAULT true`),
  ]).then(async () => {
    // Drop the old bad single-column constraint if it still exists (one-time migration)
    await pool.query(`
      ALTER TABLE "team_member"
        DROP CONSTRAINT IF EXISTS "team_member_teamId_key";
    `);
    // Add the correct composite constraint idempotently — safe across concurrent serverless instances
    await pool.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'team_member_teamId_userId_key'
        ) THEN
          ALTER TABLE "team_member"
            ADD CONSTRAINT "team_member_teamId_userId_key" UNIQUE ("teamId", "userId");
        END IF;
      END $$;
    `);
  });
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
  coverImageUrl: string | null;
  captainId: string;
  captainName: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  memberCount: string | number;
  recruitmentOpen: boolean;
};

function serializeTeam(row: TeamRow) {
  return {
    ...row,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
    memberCount: Number(row.memberCount ?? 0),
    recruitmentOpen: row.recruitmentOpen ?? true,
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
  coverImageUrl?: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const id = crypto.randomUUID();
  await pool.query(
    `INSERT INTO "team" (id, name, sport, location, bio, "captainPhone", "logoUrl", "coverImageUrl", "captainId", "createdAt", "updatedAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())`,
    [id, data.name, data.sport, data.location, data.bio ?? null, data.captainPhone ?? null, data.logoUrl ?? null, data.coverImageUrl ?? null, session.user.id]
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

export async function leaveTeam(teamId: string): Promise<{ error?: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { error: "Unauthorized" };
    await ensureTeamMembersTable();

    await pool.query(
      `DELETE FROM "team_member" WHERE "teamId" = $1 AND "userId" = $2`,
      [teamId, session.user.id]
    );

    revalidatePath("/teams");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/teams");
    return {};
  } catch (e) {
    console.error("[leaveTeam]", e);
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function removeTeamMember(teamId: string, memberId: string): Promise<{ error?: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { error: "Unauthorized" };
    await ensureTeamMembersTable();

    const teamRow = await pool.query(
      `SELECT "captainId" FROM "team" WHERE id = $1`,
      [teamId]
    );
    if (!teamRow.rows[0]) return { error: "Team not found" };
    if (teamRow.rows[0].captainId !== session.user.id) return { error: "Forbidden" };
    if (memberId === session.user.id) return { error: "Cannot remove yourself" };

    await pool.query(
      `DELETE FROM "team_member" WHERE "teamId" = $1 AND "userId" = $2`,
      [teamId, memberId]
    );

    revalidatePath(`/teams/${teamId}`);
    revalidatePath("/dashboard/teams");
    return {};
  } catch (e) {
    console.error("[removeTeamMember]", e);
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
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
