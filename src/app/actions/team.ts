"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";

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

  revalidatePath("/teams");
  revalidatePath("/dashboard/teams");
  return { id };
}

export async function getTeams() {
  const result = await pool.query(
    `SELECT t.*, u.name as "captainName"
     FROM "team" t
     JOIN "user" u ON t."captainId" = u.id
     ORDER BY t."createdAt" DESC`
  );
  return result.rows;
}

export async function getMyTeams() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return [];
  const result = await pool.query(
    `SELECT t.*, u.name as "captainName"
     FROM "team" t
     JOIN "user" u ON t."captainId" = u.id
     WHERE t."captainId" = $1
     ORDER BY t."createdAt" DESC`,
    [session.user.id]
  );
  return result.rows;
}

export async function getJoinedTeams() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return [];
  const result = await pool.query(
    `SELECT t.*, u.name as "captainName"
     FROM "team" t
     JOIN "user" u ON t."captainId" = u.id
     JOIN "team_member" tm ON tm."teamId" = t.id
     WHERE tm."userId" = $1
     ORDER BY tm."joinedAt" DESC`,
    [session.user.id]
  );
  return result.rows;
}

export async function joinTeam(teamId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const existing = await pool.query(
    `SELECT id FROM "team_member" WHERE "teamId" = $1 AND "userId" = $2`,
    [teamId, session.user.id]
  );
  if (existing.rows.length > 0) throw new Error("Already a member");

  const captain = await pool.query(
    `SELECT id FROM "team" WHERE id = $1 AND "captainId" = $2`,
    [teamId, session.user.id]
  );
  if (captain.rows.length > 0) throw new Error("You are the captain");

  await pool.query(
    `INSERT INTO "team_member" (id, "teamId", "userId") VALUES ($1, $2, $3)`,
    [crypto.randomUUID(), teamId, session.user.id]
  );

  revalidatePath("/teams");
  revalidatePath("/dashboard/teams");
}

export async function leaveTeam(teamId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  await pool.query(
    `DELETE FROM "team_member" WHERE "teamId" = $1 AND "userId" = $2`,
    [teamId, session.user.id]
  );

  revalidatePath("/teams");
  revalidatePath("/dashboard/teams");
}

export async function getMembershipMap(teamIds: string[]): Promise<Set<string>> {
  if (teamIds.length === 0) return new Set();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new Set();
  const result = await pool.query(
    `SELECT "teamId" FROM "team_member" WHERE "teamId" = ANY($1) AND "userId" = $2`,
    [teamIds, session.user.id]
  );
  return new Set(result.rows.map((r: { teamId: string }) => r.teamId));
}
