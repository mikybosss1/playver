"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";
import { sendTournamentMemberInviteEmail, sendJoinRequestNotificationEmail } from "@/lib/emails";

let tournamentTablesReady: Promise<void> | null = null;

async function ensureTournamentTables() {
  tournamentTablesReady ??= (async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "tournament_team" (
        "id"                text PRIMARY KEY,
        "tournamentId"      text NOT NULL REFERENCES "event"("id") ON DELETE CASCADE,
        "captainId"         text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "name"              text NOT NULL,
        "status"            text NOT NULL DEFAULT 'active',
        "recruitmentStatus" text NOT NULL DEFAULT 'closed',
        "inviteCode"        text NOT NULL UNIQUE,
        "paymentDeadline"   timestamp,
        "playerCount"       integer NOT NULL DEFAULT 1,
        "createdAt"         timestamp NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "tournament_team_member" (
        "id"                 text PRIMARY KEY,
        "teamId"             text NOT NULL REFERENCES "tournament_team"("id") ON DELETE CASCADE,
        "userId"             text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "joinedAt"           timestamp NOT NULL DEFAULT NOW(),
        "confirmationStatus" text NOT NULL DEFAULT 'confirmed',
        "confirmationToken"  text UNIQUE
      )
    `);
    // Idempotent column additions for existing deployments
    await pool.query(`ALTER TABLE "tournament_team_member" ADD COLUMN IF NOT EXISTS "confirmationStatus" text NOT NULL DEFAULT 'confirmed'`);
    await pool.query(`ALTER TABLE "tournament_team_member" ADD COLUMN IF NOT EXISTS "confirmationToken" text`);
    await pool.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'tournament_team_member_teamId_userId_key'
        ) THEN
          ALTER TABLE "tournament_team_member"
            ADD CONSTRAINT "tournament_team_member_teamId_userId_key" UNIQUE ("teamId", "userId");
        END IF;
      END $$;
    `);
    await pool.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'tournament_team_member_confirmationToken_key'
        ) THEN
          ALTER TABLE "tournament_team_member"
            ADD CONSTRAINT "tournament_team_member_confirmationToken_key" UNIQUE ("confirmationToken");
        END IF;
      END $$;
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "tournament_join_request" (
        "id"        text PRIMARY KEY,
        "teamId"    text NOT NULL REFERENCES "tournament_team"("id") ON DELETE CASCADE,
        "userId"    text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "status"    text NOT NULL DEFAULT 'pending',
        "createdAt" timestamp NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'tournament_join_request_teamId_userId_key'
        ) THEN
          ALTER TABLE "tournament_join_request"
            ADD CONSTRAINT "tournament_join_request_teamId_userId_key" UNIQUE ("teamId", "userId");
        END IF;
      END $$;
    `);
  })();
  await tournamentTablesReady;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type TournamentTeamMember = {
  id: string;
  userId: string;
  name: string;
  email: string;
  image: string | null;
  joinedAt: string;
  confirmationStatus: "confirmed" | "pending" | "declined";
};

export type TournamentTeam = {
  id: string;
  tournamentId: string;
  captainId: string;
  captainName: string;
  name: string;
  status: "pending" | "active";
  recruitmentStatus: "open" | "closed";
  inviteCode: string;
  paymentDeadline: string | null;
  playerCount: number;
  createdAt: string;
  memberCount: number;
  members: TournamentTeamMember[];
};

export type TournamentJoinRequest = {
  id: string;
  teamId: string;
  userId: string;
  userName: string;
  userImage: string | null;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  createdAt: string;
};

export type MyTeamOption = {
  id: string;
  name: string;
  sport: string;
  memberCount: number;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function fetchTeamWithMembers(teamId: string): Promise<TournamentTeam | null> {
  const teamRes = await pool.query(
    `SELECT tt.*, u.name as "captainName"
     FROM "tournament_team" tt
     JOIN "user" u ON u.id = tt."captainId"
     WHERE tt.id = $1`,
    [teamId]
  );
  if (!teamRes.rows[0]) return null;
  const t = teamRes.rows[0];

  const membersRes = await pool.query(
    `SELECT ttm.id, ttm."userId", ttm."joinedAt", ttm."confirmationStatus",
            u.name, u.email, u.image
     FROM "tournament_team_member" ttm
     JOIN "user" u ON u.id = ttm."userId"
     WHERE ttm."teamId" = $1
     ORDER BY ttm."joinedAt" ASC`,
    [teamId]
  );

  const members: TournamentTeamMember[] = membersRes.rows.map((m: {
    id: string; userId: string; name: string; email: string;
    image: string | null; joinedAt: Date; confirmationStatus: string;
  }) => ({
    id: m.id,
    userId: m.userId,
    name: m.name,
    email: m.email,
    image: m.image,
    joinedAt: new Date(m.joinedAt).toISOString(),
    confirmationStatus: (m.confirmationStatus ?? "confirmed") as "confirmed" | "pending" | "declined",
  }));

  // memberCount = captain + confirmed/pending members (not declined)
  const activeMemberCount = members.filter(m => m.confirmationStatus !== "declined").length;

  return {
    id: t.id,
    tournamentId: t.tournamentId,
    captainId: t.captainId,
    captainName: t.captainName,
    name: t.name,
    status: t.status as "pending" | "active",
    recruitmentStatus: t.recruitmentStatus as "open" | "closed",
    inviteCode: t.inviteCode,
    paymentDeadline: t.paymentDeadline ? new Date(t.paymentDeadline).toISOString() : null,
    playerCount: t.playerCount,
    createdAt: new Date(t.createdAt).toISOString(),
    memberCount: activeMemberCount + 1, // +1 for captain
    members,
  };
}

// ─── Reads ───────────────────────────────────────────────────────────────────

export async function getTournamentTeams(tournamentId: string): Promise<TournamentTeam[]> {
  await ensureTournamentTables();

  const teamsRes = await pool.query(
    `SELECT tt.id FROM "tournament_team" tt
     WHERE tt."tournamentId" = $1
     ORDER BY tt."createdAt" ASC`,
    [tournamentId]
  );

  const teams = await Promise.all(
    teamsRes.rows.map((r: { id: string }) => fetchTeamWithMembers(r.id))
  );
  return teams.filter((t): t is TournamentTeam => t !== null);
}

export async function getMyTournamentTeam(tournamentId: string): Promise<TournamentTeam | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  await ensureTournamentTables();

  const res = await pool.query(
    `SELECT tt.id FROM "tournament_team" tt
     LEFT JOIN "tournament_team_member" ttm ON ttm."teamId" = tt.id
     WHERE tt."tournamentId" = $1 AND (tt."captainId" = $2 OR ttm."userId" = $2)
     LIMIT 1`,
    [tournamentId, session.user.id]
  );
  if (!res.rows[0]) return null;
  return fetchTeamWithMembers(res.rows[0].id);
}

export async function getTournamentTeamByInviteCode(
  inviteCode: string
): Promise<(TournamentTeam & { tournamentTitle: string }) | null> {
  await ensureTournamentTables();

  const res = await pool.query(
    `SELECT tt.id, e.title as "tournamentTitle"
     FROM "tournament_team" tt
     JOIN "event" e ON e.id = tt."tournamentId"
     WHERE tt."inviteCode" = $1`,
    [inviteCode]
  );
  if (!res.rows[0]) return null;

  const team = await fetchTeamWithMembers(res.rows[0].id);
  if (!team) return null;
  return { ...team, tournamentTitle: res.rows[0].tournamentTitle };
}

export async function getPendingJoinRequests(teamId: string): Promise<TournamentJoinRequest[]> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return [];
  await ensureTournamentTables();

  const res = await pool.query(
    `SELECT tjr.id, tjr."teamId", tjr."userId", tjr.status, tjr."createdAt",
            u.name as "userName", u.image as "userImage"
     FROM "tournament_join_request" tjr
     JOIN "user" u ON u.id = tjr."userId"
     JOIN "tournament_team" tt ON tt.id = tjr."teamId"
     WHERE tjr."teamId" = $1 AND tt."captainId" = $2 AND tjr.status = 'pending'
     ORDER BY tjr."createdAt" ASC`,
    [teamId, session.user.id]
  );

  return res.rows.map((r: {
    id: string; teamId: string; userId: string; userName: string;
    userImage: string | null; status: string; createdAt: Date;
  }) => ({
    id: r.id,
    teamId: r.teamId,
    userId: r.userId,
    userName: r.userName,
    userImage: r.userImage,
    status: r.status as "pending",
    createdAt: new Date(r.createdAt).toISOString(),
  }));
}

export async function getUserJoinRequestForTeam(teamId: string): Promise<TournamentJoinRequest | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  await ensureTournamentTables();

  const res = await pool.query(
    `SELECT tjr.id, tjr."teamId", tjr."userId", tjr.status, tjr."createdAt",
            u.name as "userName", u.image as "userImage"
     FROM "tournament_join_request" tjr
     JOIN "user" u ON u.id = tjr."userId"
     WHERE tjr."teamId" = $1 AND tjr."userId" = $2 AND tjr.status = 'pending'`,
    [teamId, session.user.id]
  );
  if (!res.rows[0]) return null;
  const r = res.rows[0];
  return {
    id: r.id,
    teamId: r.teamId,
    userId: r.userId,
    userName: r.userName,
    userImage: r.userImage,
    status: r.status as "pending",
    createdAt: new Date(r.createdAt).toISOString(),
  };
}

export async function getMyTeamOptions(): Promise<MyTeamOption[]> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return [];

  const res = await pool.query(
    `SELECT t.id, t.name, t.sport, COUNT(tm.id) as "memberCount"
     FROM "team" t
     LEFT JOIN "team_member" tm ON tm."teamId" = t.id
     WHERE t."captainId" = $1
     GROUP BY t.id
     ORDER BY t."createdAt" DESC`,
    [session.user.id]
  );

  return res.rows.map((r: { id: string; name: string; sport: string; memberCount: string }) => ({
    id: r.id,
    name: r.name,
    sport: r.sport,
    memberCount: Number(r.memberCount),
  }));
}

// ─── Writes ──────────────────────────────────────────────────────────────────

async function checkCanRegister(tournamentId: string, userId: string) {
  const tournamentRes = await pool.query(
    `SELECT id, "endDateTime", price, capacity FROM "event" WHERE id = $1 AND "eventType" = 'Tournament'`,
    [tournamentId]
  );
  if (!tournamentRes.rows[0]) return { error: "Tournament not found" as string };
  const tournament = tournamentRes.rows[0];
  if (new Date(tournament.endDateTime) < new Date()) return { error: "Tournament has ended" as string };

  const existingTeam = await pool.query(
    `SELECT tt.id FROM "tournament_team" tt
     LEFT JOIN "tournament_team_member" ttm ON ttm."teamId" = tt.id AND ttm."userId" = $1
     WHERE tt."tournamentId" = $2 AND (tt."captainId" = $1 OR ttm."userId" = $1)`,
    [userId, tournamentId]
  );
  if (existingTeam.rows.length > 0) return { error: "You are already in a team for this tournament" as string };

  if (tournament.capacity) {
    const teamCount = await pool.query(
      `SELECT COUNT(*) FROM "tournament_team" WHERE "tournamentId" = $1`,
      [tournamentId]
    );
    if (Number(teamCount.rows[0].count) >= Number(tournament.capacity)) {
      return { error: "Tournament is full" as string };
    }
  }

  return { tournament };
}

export async function createTournamentTeam(
  tournamentId: string,
  teamName: string,
  playerCount: number
): Promise<{ error?: string; teamId?: string; inviteCode?: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { error: "Unauthorized" };
    await ensureTournamentTables();

    const check = await checkCanRegister(tournamentId, session.user.id);
    if (check.error) return { error: check.error };

    const teamId = crypto.randomUUID();
    const inviteCode = crypto.randomUUID().replace(/-/g, "").substring(0, 12);
    const isPaid = Number(check.tournament.price) > 0;
    const status = isPaid ? "pending" : "active";
    const paymentDeadline = isPaid ? new Date(Date.now() + 48 * 60 * 60 * 1000) : null;

    await pool.query(
      `INSERT INTO "tournament_team"
         (id, "tournamentId", "captainId", name, status, "recruitmentStatus", "inviteCode", "paymentDeadline", "playerCount")
       VALUES ($1, $2, $3, $4, $5, 'closed', $6, $7, $8)`,
      [teamId, tournamentId, session.user.id, teamName, status, inviteCode, paymentDeadline, playerCount]
    );

    revalidatePath(`/tournaments/${tournamentId}`);
    revalidatePath(`/dashboard/tournaments`);
    return { teamId, inviteCode };
  } catch (e) {
    console.error("[createTournamentTeam]", e);
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function importExistingTeamForTournament(
  tournamentId: string,
  existingTeamId: string,
  teamName: string,
  playerCount: number
): Promise<{ error?: string; teamId?: string; inviteCode?: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { error: "Unauthorized" };
    await ensureTournamentTables();

    // Verify user is the captain of the existing team
    const teamRow = await pool.query(
      `SELECT id, name, sport, location FROM "team" WHERE id = $1 AND "captainId" = $2`,
      [existingTeamId, session.user.id]
    );
    if (!teamRow.rows[0]) return { error: "Team not found or you are not the captain" };

    const check = await checkCanRegister(tournamentId, session.user.id);
    if (check.error) return { error: check.error };

    const teamId = crypto.randomUUID();
    const inviteCode = crypto.randomUUID().replace(/-/g, "").substring(0, 12);
    const isPaid = Number(check.tournament.price) > 0;
    const status = isPaid ? "pending" : "active";
    const paymentDeadline = isPaid ? new Date(Date.now() + 48 * 60 * 60 * 1000) : null;

    await pool.query(
      `INSERT INTO "tournament_team"
         (id, "tournamentId", "captainId", name, status, "recruitmentStatus", "inviteCode", "paymentDeadline", "playerCount")
       VALUES ($1, $2, $3, $4, $5, 'closed', $6, $7, $8)`,
      [teamId, tournamentId, session.user.id, teamName, status, inviteCode, paymentDeadline, playerCount]
    );

    // Fetch existing team members (excluding the captain — they're already the tournament team captain)
    const membersRes = await pool.query(
      `SELECT u.id, u.name, u.email FROM "team_member" tm
       JOIN "user" u ON u.id = tm."userId"
       WHERE tm."teamId" = $1 AND tm."userId" != $2`,
      [existingTeamId, session.user.id]
    );

    // Fetch tournament info for email
    const tournamentRes = await pool.query(
      `SELECT title, sport, location, "startDateTime" FROM "event" WHERE id = $1`,
      [tournamentId]
    );
    const t = tournamentRes.rows[0];
    const captainRow = await pool.query(`SELECT name FROM "user" WHERE id = $1`, [session.user.id]);
    const captainName = captainRow.rows[0]?.name ?? "Your captain";
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://playver.ca";

    // Insert each member as pending and send confirmation email
    for (const member of membersRes.rows as { id: string; name: string; email: string }[]) {
      const confirmationToken = crypto.randomUUID();
      await pool.query(
        `INSERT INTO "tournament_team_member"
           (id, "teamId", "userId", "confirmationStatus", "confirmationToken")
         VALUES ($1, $2, $3, 'pending', $4)
         ON CONFLICT ("teamId", "userId") DO NOTHING`,
        [crypto.randomUUID(), teamId, member.id, confirmationToken]
      );

      if (member.email && t) {
        sendTournamentMemberInviteEmail(member.email, {
          memberName: member.name ?? "Athlete",
          captainName,
          teamName,
          tournamentTitle: t.title,
          sport: t.sport,
          location: t.location,
          startDateTime: new Date(t.startDateTime).toISOString(),
          confirmUrl: `${BASE_URL}/tournaments/${tournamentId}/confirm?token=${confirmationToken}&action=confirm`,
          declineUrl: `${BASE_URL}/tournaments/${tournamentId}/confirm?token=${confirmationToken}&action=decline`,
        }).catch(() => {});
      }
    }

    revalidatePath(`/tournaments/${tournamentId}`);
    revalidatePath(`/dashboard/tournaments`);
    return { teamId, inviteCode };
  } catch (e) {
    console.error("[importExistingTeamForTournament]", e);
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function confirmTournamentMembership(token: string): Promise<{ error?: string; tournamentId?: string; teamName?: string }> {
  try {
    await ensureTournamentTables();

    const res = await pool.query(
      `SELECT ttm.id, ttm."teamId", tt."tournamentId", tt.name as "teamName"
       FROM "tournament_team_member" ttm
       JOIN "tournament_team" tt ON tt.id = ttm."teamId"
       WHERE ttm."confirmationToken" = $1`,
      [token]
    );
    if (!res.rows[0]) return { error: "Invalid or expired link" };
    const row = res.rows[0];

    await pool.query(
      `UPDATE "tournament_team_member" SET "confirmationStatus" = 'confirmed', "confirmationToken" = NULL WHERE id = $1`,
      [row.id]
    );

    revalidatePath(`/tournaments/${row.tournamentId}`);
    return { tournamentId: row.tournamentId, teamName: row.teamName };
  } catch (e) {
    console.error("[confirmTournamentMembership]", e);
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function declineTournamentMembership(token: string): Promise<{ error?: string; tournamentId?: string; teamName?: string }> {
  try {
    await ensureTournamentTables();

    const res = await pool.query(
      `SELECT ttm.id, ttm."teamId", tt."tournamentId", tt.name as "teamName"
       FROM "tournament_team_member" ttm
       JOIN "tournament_team" tt ON tt.id = ttm."teamId"
       WHERE ttm."confirmationToken" = $1`,
      [token]
    );
    if (!res.rows[0]) return { error: "Invalid or expired link" };
    const row = res.rows[0];

    await pool.query(
      `UPDATE "tournament_team_member" SET "confirmationStatus" = 'declined', "confirmationToken" = NULL WHERE id = $1`,
      [row.id]
    );

    revalidatePath(`/tournaments/${row.tournamentId}`);
    return { tournamentId: row.tournamentId, teamName: row.teamName };
  } catch (e) {
    console.error("[declineTournamentMembership]", e);
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function toggleTeamRecruitment(teamId: string): Promise<{ error?: string; newStatus?: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { error: "Unauthorized" };
    await ensureTournamentTables();

    const res = await pool.query(
      `SELECT "captainId", "recruitmentStatus", "tournamentId" FROM "tournament_team" WHERE id = $1`,
      [teamId]
    );
    if (!res.rows[0]) return { error: "Team not found" };
    if (res.rows[0].captainId !== session.user.id) return { error: "Forbidden" };

    const newStatus = res.rows[0].recruitmentStatus === "open" ? "closed" : "open";
    await pool.query(`UPDATE "tournament_team" SET "recruitmentStatus" = $1 WHERE id = $2`, [newStatus, teamId]);

    revalidatePath(`/tournaments/${res.rows[0].tournamentId}`);
    return { newStatus };
  } catch (e) {
    console.error("[toggleTeamRecruitment]", e);
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function requestToJoinTeam(teamId: string): Promise<{ error?: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { error: "Unauthorized" };
    await ensureTournamentTables();

    const teamRes = await pool.query(
      `SELECT tt.*, e."endDateTime", e.title AS "tournamentTitle"
       FROM "tournament_team" tt
       JOIN "event" e ON e.id = tt."tournamentId"
       WHERE tt.id = $1`,
      [teamId]
    );
    if (!teamRes.rows[0]) return { error: "Team not found" };
    const team = teamRes.rows[0];
    if (new Date(team.endDateTime) < new Date()) return { error: "Tournament has ended" };
    if (team.captainId === session.user.id) return { error: "You are the captain of this team" };
    if (team.recruitmentStatus !== "open") return { error: "Team is not accepting requests" };

    const existingTeam = await pool.query(
      `SELECT tt.id FROM "tournament_team" tt
       LEFT JOIN "tournament_team_member" ttm ON ttm."teamId" = tt.id AND ttm."userId" = $1
       WHERE tt."tournamentId" = $2 AND (tt."captainId" = $1 OR ttm."userId" = $1)`,
      [session.user.id, team.tournamentId]
    );
    if (existingTeam.rows.length > 0) return { error: "You are already in a team for this tournament" };

    await pool.query(
      `INSERT INTO "tournament_join_request" (id, "teamId", "userId") VALUES ($1, $2, $3)
       ON CONFLICT ("teamId", "userId") DO UPDATE SET status = 'pending', "createdAt" = NOW()`,
      [crypto.randomUUID(), teamId, session.user.id]
    );

    const captainRes = await pool.query(
      `SELECT name, email FROM "user" WHERE id = $1`,
      [team.captainId]
    );
    const captain = captainRes.rows[0];
    if (captain?.email) {
      try {
        await sendJoinRequestNotificationEmail(captain.email, {
          captainName: captain.name ?? "Captain",
          requesterName: session.user.name ?? "Someone",
          teamName: team.name,
          tournamentTitle: team.tournamentTitle,
          tournamentId: team.tournamentId,
        });
      } catch (emailErr) {
        console.error("[requestToJoinTeam] email failed:", emailErr);
      }
    }

    revalidatePath(`/tournaments/${team.tournamentId}`);
    return {};
  } catch (e) {
    console.error("[requestToJoinTeam]", e);
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function respondToJoinRequest(requestId: string, accept: boolean): Promise<{ error?: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { error: "Unauthorized" };
    await ensureTournamentTables();

    const reqRes = await pool.query(
      `SELECT tjr.*, tt."captainId", tt."tournamentId", tt."playerCount"
       FROM "tournament_join_request" tjr
       JOIN "tournament_team" tt ON tt.id = tjr."teamId"
       WHERE tjr.id = $1`,
      [requestId]
    );
    if (!reqRes.rows[0]) return { error: "Request not found" };
    const req = reqRes.rows[0];
    if (req.captainId !== session.user.id) return { error: "Forbidden" };
    if (req.status !== "pending") return { error: "Request is no longer pending" };

    if (accept) {
      const memberCount = await pool.query(
        `SELECT COUNT(*) FROM "tournament_team_member" WHERE "teamId" = $1 AND "confirmationStatus" != 'declined'`,
        [req.teamId]
      );
      if (Number(memberCount.rows[0].count) + 1 >= req.playerCount) {
        return { error: "Team is full" };
      }
      await pool.query(
        `INSERT INTO "tournament_team_member" (id, "teamId", "userId", "confirmationStatus") VALUES ($1, $2, $3, 'confirmed')
         ON CONFLICT ("teamId", "userId") DO NOTHING`,
        [crypto.randomUUID(), req.teamId, req.userId]
      );
    }

    await pool.query(
      `UPDATE "tournament_join_request" SET status = $1 WHERE id = $2`,
      [accept ? "accepted" : "rejected", requestId]
    );

    revalidatePath(`/tournaments/${req.tournamentId}`);
    return {};
  } catch (e) {
    console.error("[respondToJoinRequest]", e);
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function cancelJoinRequest(requestId: string): Promise<{ error?: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { error: "Unauthorized" };
    await ensureTournamentTables();

    const res = await pool.query(
      `UPDATE "tournament_join_request" SET status = 'cancelled'
       WHERE id = $1 AND "userId" = $2 AND status = 'pending'
       RETURNING "teamId"`,
      [requestId, session.user.id]
    );
    if (!res.rows[0]) return { error: "Request not found or already acted on" };
    return {};
  } catch (e) {
    console.error("[cancelJoinRequest]", e);
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function joinTeamViaInvite(inviteCode: string): Promise<{ error?: string; tournamentId?: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { error: "Unauthorized" };
    await ensureTournamentTables();

    const teamRes = await pool.query(
      `SELECT tt.*, e."endDateTime" FROM "tournament_team" tt
       JOIN "event" e ON e.id = tt."tournamentId"
       WHERE tt."inviteCode" = $1`,
      [inviteCode]
    );
    if (!teamRes.rows[0]) return { error: "Invite link is invalid" };
    const team = teamRes.rows[0];
    if (new Date(team.endDateTime) < new Date()) return { error: "Tournament has ended" };
    if (team.captainId === session.user.id) return { error: "You are the captain of this team" };

    const existingTeam = await pool.query(
      `SELECT tt.id FROM "tournament_team" tt
       LEFT JOIN "tournament_team_member" ttm ON ttm."teamId" = tt.id AND ttm."userId" = $1
       WHERE tt."tournamentId" = $2 AND (tt."captainId" = $1 OR ttm."userId" = $1)`,
      [session.user.id, team.tournamentId]
    );
    if (existingTeam.rows.length > 0) return { error: "You are already in a team for this tournament" };

    const memberCount = await pool.query(
      `SELECT COUNT(*) FROM "tournament_team_member" WHERE "teamId" = $1 AND "confirmationStatus" != 'declined'`,
      [team.id]
    );
    if (Number(memberCount.rows[0].count) + 1 >= team.playerCount) {
      return { error: "Team is full" };
    }

    await pool.query(
      `INSERT INTO "tournament_team_member" (id, "teamId", "userId", "confirmationStatus") VALUES ($1, $2, $3, 'confirmed')
       ON CONFLICT ("teamId", "userId") DO NOTHING`,
      [crypto.randomUUID(), team.id, session.user.id]
    );

    revalidatePath(`/tournaments/${team.tournamentId}`);
    return { tournamentId: team.tournamentId };
  } catch (e) {
    console.error("[joinTeamViaInvite]", e);
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function removeTeamMember(teamId: string, memberId: string): Promise<{ error?: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { error: "Unauthorized" };
    await ensureTournamentTables();

    const teamRes = await pool.query(
      `SELECT "captainId", "tournamentId" FROM "tournament_team" WHERE id = $1`,
      [teamId]
    );
    if (!teamRes.rows[0]) return { error: "Team not found" };
    if (teamRes.rows[0].captainId !== session.user.id) return { error: "Forbidden" };

    await pool.query(
      `DELETE FROM "tournament_team_member" WHERE "teamId" = $1 AND "userId" = $2`,
      [teamId, memberId]
    );

    revalidatePath(`/tournaments/${teamRes.rows[0].tournamentId}`);
    return {};
  } catch (e) {
    console.error("[removeTeamMember]", e);
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function leaveTournamentTeam(teamId: string): Promise<{ error?: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { error: "Unauthorized" };
    await ensureTournamentTables();

    const teamRes = await pool.query(
      `SELECT "tournamentId" FROM "tournament_team" WHERE id = $1`,
      [teamId]
    );

    await pool.query(
      `DELETE FROM "tournament_team_member" WHERE "teamId" = $1 AND "userId" = $2`,
      [teamId, session.user.id]
    );

    if (teamRes.rows[0]) revalidatePath(`/tournaments/${teamRes.rows[0].tournamentId}`);
    return {};
  } catch (e) {
    console.error("[leaveTournamentTeam]", e);
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function disbandTournamentTeam(teamId: string): Promise<{ error?: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { error: "Unauthorized" };
    await ensureTournamentTables();

    const teamRes = await pool.query(
      `SELECT "captainId", "tournamentId" FROM "tournament_team" WHERE id = $1`,
      [teamId]
    );
    if (!teamRes.rows[0]) return { error: "Team not found" };
    if (teamRes.rows[0].captainId !== session.user.id) return { error: "Forbidden" };

    await pool.query(`DELETE FROM "tournament_team" WHERE id = $1`, [teamId]);

    revalidatePath(`/tournaments/${teamRes.rows[0].tournamentId}`);
    revalidatePath(`/dashboard/tournaments`);
    return {};
  } catch (e) {
    console.error("[disbandTournamentTeam]", e);
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function activateTournamentTeam(teamId: string): Promise<{ error?: string }> {
  try {
    await ensureTournamentTables();
    const res = await pool.query(
      `UPDATE "tournament_team" SET status = 'active', "paymentDeadline" = NULL
       WHERE id = $1
       RETURNING "tournamentId"`,
      [teamId]
    );
    if (res.rows[0]) revalidatePath(`/tournaments/${res.rows[0].tournamentId}`);
    return {};
  } catch (e) {
    console.error("[activateTournamentTeam]", e);
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}
