"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { pool, withTransaction } from "@/lib/db";
import {
  sendTournamentMemberInviteEmail,
  sendJoinRequestNotificationEmail,
  sendTournamentTeamRegisteredEmail,
  sendTournamentTeamPaymentReceiptEmail,
} from "@/lib/emails";
import { ensureTournamentTables } from "@/lib/tournament-tables";
import { assertCanManageTournament } from "@/app/actions/game";

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
  linkedTeamId: string | null;
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
    `SELECT tt.*, u.name as "captainName", tt."linkedTeamId"
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
    linkedTeamId: t.linkedTeamId ?? null,
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

export type LinkedTeamJoinRequest = {
  id: string;
  tournamentTeamId: string;
  userId: string;
  userName: string;
  userImage: string | null;
  status: "pending";
  createdAt: string;
  tournamentTitle: string;
};

// Pending join requests across all of this (regular) team's tournament registrations
// that the current session user captains — so requests can be reviewed from the
// team's own page, not just from inside each tournament.
export async function getPendingJoinRequestsForLinkedTeam(linkedTeamId: string): Promise<LinkedTeamJoinRequest[]> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return [];
  await ensureTournamentTables();

  const res = await pool.query(
    `SELECT tjr.id, tjr."teamId", tjr."userId", tjr.status, tjr."createdAt",
            u.name as "userName", u.image as "userImage",
            e.title as "tournamentTitle"
     FROM "tournament_join_request" tjr
     JOIN "user" u ON u.id = tjr."userId"
     JOIN "tournament_team" tt ON tt.id = tjr."teamId"
     JOIN "event" e ON e.id = tt."tournamentId"
     WHERE tt."linkedTeamId" = $1 AND tt."captainId" = $2 AND tjr.status = 'pending'
     ORDER BY tjr."createdAt" ASC`,
    [linkedTeamId, session.user.id]
  );

  return res.rows.map((r: {
    id: string; teamId: string; userId: string; userName: string;
    userImage: string | null; status: string; createdAt: Date; tournamentTitle: string;
  }) => ({
    id: r.id,
    tournamentTeamId: r.teamId,
    userId: r.userId,
    userName: r.userName,
    userImage: r.userImage,
    status: r.status as "pending",
    createdAt: new Date(r.createdAt).toISOString(),
    tournamentTitle: r.tournamentTitle,
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

export type JoinableTournamentRegistration = {
  tournamentTeamId: string;
  tournamentId: string;
  tournamentTitle: string;
};

// Open tournament registrations for this (regular) team that the current session
// user could request to join right now — used to surface "Request to Join" on the
// team's own page, not just inside the tournament's Teams tab.
export async function getJoinableTournamentRegistrations(linkedTeamId: string): Promise<JoinableTournamentRegistration[]> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return [];
  await ensureTournamentTables();

  const rows = await pool.query(
    `SELECT tt.id, tt."tournamentId", tt."playerCount", tt."captainId", e.title
     FROM "tournament_team" tt
     JOIN "event" e ON e.id = tt."tournamentId"
     WHERE tt."linkedTeamId" = $1 AND tt."recruitmentStatus" = 'open' AND e."endDateTime" >= NOW()`,
    [linkedTeamId]
  );

  const results: JoinableTournamentRegistration[] = [];
  for (const row of rows.rows as { id: string; tournamentId: string; playerCount: number; captainId: string; title: string }[]) {
    if (row.captainId === session.user.id) continue;

    const existingTeam = await pool.query(
      `SELECT tt2.id FROM "tournament_team" tt2
       LEFT JOIN "tournament_team_member" ttm ON ttm."teamId" = tt2.id AND ttm."userId" = $1
       WHERE tt2."tournamentId" = $2 AND (tt2."captainId" = $1 OR ttm."userId" = $1)`,
      [session.user.id, row.tournamentId]
    );
    if (existingTeam.rows.length > 0) continue;

    const memberCount = await pool.query(
      `SELECT COUNT(*) FROM "tournament_team_member" WHERE "teamId" = $1 AND "confirmationStatus" != 'declined'`,
      [row.id]
    );
    if (Number(memberCount.rows[0].count) + 1 >= row.playerCount) continue;

    results.push({ tournamentTeamId: row.id, tournamentId: row.tournamentId, tournamentTitle: row.title });
  }
  return results;
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

async function ensureTeamMemberTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "team_member" (
      "id"       text PRIMARY KEY,
      "teamId"   text NOT NULL REFERENCES "team"("id") ON DELETE CASCADE,
      "userId"   text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
      "joinedAt" timestamp NOT NULL DEFAULT NOW()
    )
  `);
}

async function checkCanRegister(tournamentId: string, userId: string) {
  const tournamentRes = await pool.query(
    `SELECT id, status, "endDateTime", price, capacity, sport, location FROM "event" WHERE id = $1 AND "eventType" = 'Tournament'`,
    [tournamentId]
  );
  if (!tournamentRes.rows[0]) return { error: "Tournament not found" as string };
  const tournament = tournamentRes.rows[0];
  if (tournament.status === "cancelled") return { error: "This tournament has been cancelled" as string };
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

    // Create a persistent team profile on /teams
    await ensureTeamMemberTable();
    const linkedTeamId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO "team" (id, name, sport, location, bio, "captainPhone", "logoUrl", "coverImageUrl", "captainId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, NULL, NULL, NULL, NULL, $5, NOW(), NOW())`,
      [linkedTeamId, teamName, check.tournament.sport, check.tournament.location, session.user.id]
    );
    await pool.query(
      `INSERT INTO "team_member" (id, "teamId", "userId") VALUES ($1, $2, $3)`,
      [crypto.randomUUID(), linkedTeamId, session.user.id]
    );

    await pool.query(
      `INSERT INTO "tournament_team"
         (id, "tournamentId", "captainId", name, status, "recruitmentStatus", "inviteCode", "paymentDeadline", "playerCount", "linkedTeamId", "isImportedTeam")
       VALUES ($1, $2, $3, $4, $5, 'closed', $6, $7, $8, $9, false)`,
      [teamId, tournamentId, session.user.id, teamName, status, inviteCode, paymentDeadline, playerCount, linkedTeamId]
    );

    // Send registration confirmation email to captain
    const [captainRow, tournamentRow] = await Promise.all([
      pool.query(`SELECT name, email FROM "user" WHERE id = $1`, [session.user.id]),
      pool.query(`SELECT title, sport, location, "startDateTime" FROM "event" WHERE id = $1`, [tournamentId]),
    ]);
    const captain = captainRow.rows[0];
    const tournament = tournamentRow.rows[0];
    if (captain?.email && tournament) {
      sendTournamentTeamRegisteredEmail(captain.email, {
        captainName: captain.name ?? "Captain",
        teamName,
        tournamentTitle: tournament.title,
        sport: tournament.sport,
        location: tournament.location,
        startDateTime: new Date(tournament.startDateTime).toISOString(),
        tournamentId,
        isPaid,
      }).catch(() => {});
    }

    revalidatePath(`/events/${tournamentId}`);
    revalidatePath(`/dashboard/tournaments`);
    revalidatePath("/teams");
    revalidatePath("/dashboard/teams");
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
         (id, "tournamentId", "captainId", name, status, "recruitmentStatus", "inviteCode", "paymentDeadline", "playerCount", "linkedTeamId", "isImportedTeam")
       VALUES ($1, $2, $3, $4, $5, 'closed', $6, $7, $8, $9, true)`,
      [teamId, tournamentId, session.user.id, teamName, status, inviteCode, paymentDeadline, playerCount, existingTeamId]
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

    revalidatePath(`/events/${tournamentId}`);
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

    revalidatePath(`/events/${row.tournamentId}`);
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

    revalidatePath(`/events/${row.tournamentId}`);
    return { tournamentId: row.tournamentId, teamName: row.teamName };
  } catch (e) {
    console.error("[declineTournamentMembership]", e);
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function renameTournamentTeam(teamId: string, newName: string): Promise<{ error?: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { error: "Unauthorized" };
    const name = newName.trim();
    if (!name) return { error: "Team name cannot be empty" };
    if (name.length > 60) return { error: "Team name is too long" };
    await ensureTournamentTables();

    const res = await pool.query(
      `SELECT "captainId", "tournamentId", "linkedTeamId", "isImportedTeam" FROM "tournament_team" WHERE id = $1`,
      [teamId]
    );
    if (!res.rows[0]) return { error: "Team not found" };
    if (res.rows[0].captainId !== session.user.id) return { error: "Forbidden" };

    await pool.query(`UPDATE "tournament_team" SET name = $1 WHERE id = $2`, [name, teamId]);

    if (res.rows[0].linkedTeamId && !res.rows[0].isImportedTeam) {
      await pool.query(`UPDATE "team" SET name = $1, "updatedAt" = NOW() WHERE id = $2`, [name, res.rows[0].linkedTeamId]);
    }

    revalidatePath(`/events/${res.rows[0].tournamentId}`);
    revalidatePath("/teams");
    return {};
  } catch (e) {
    console.error("[renameTournamentTeam]", e);
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

    revalidatePath(`/events/${res.rows[0].tournamentId}`);
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

    revalidatePath(`/events/${team.tournamentId}`);
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
      `SELECT tjr.*, tt."captainId", tt."tournamentId", tt."playerCount", tt."linkedTeamId", tt."isImportedTeam"
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

      if (req.linkedTeamId && !req.isImportedTeam) {
        await ensureTeamMemberTable();
        await pool.query(
          `INSERT INTO "team_member" (id, "teamId", "userId") VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
          [crypto.randomUUID(), req.linkedTeamId, req.userId]
        );
        revalidatePath("/teams");
        revalidatePath("/dashboard/teams");
      }
    }

    await pool.query(
      `UPDATE "tournament_join_request" SET status = $1 WHERE id = $2`,
      [accept ? "accepted" : "rejected", requestId]
    );

    revalidatePath(`/events/${req.tournamentId}`);
    if (req.linkedTeamId) revalidatePath(`/teams/${req.linkedTeamId}`);
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

    if (team.linkedTeamId && !team.isImportedTeam) {
      await ensureTeamMemberTable();
      await pool.query(
        `INSERT INTO "team_member" (id, "teamId", "userId") VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [crypto.randomUUID(), team.linkedTeamId, session.user.id]
      );
      revalidatePath("/teams");
      revalidatePath("/dashboard/teams");
    }

    revalidatePath(`/events/${team.tournamentId}`);
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
      `SELECT "captainId", "tournamentId", "linkedTeamId", "isImportedTeam" FROM "tournament_team" WHERE id = $1`,
      [teamId]
    );
    if (!teamRes.rows[0]) return { error: "Team not found" };
    if (teamRes.rows[0].captainId !== session.user.id) return { error: "Forbidden" };

    await pool.query(
      `DELETE FROM "tournament_team_member" WHERE "teamId" = $1 AND "userId" = $2`,
      [teamId, memberId]
    );

    if (teamRes.rows[0].linkedTeamId && !teamRes.rows[0].isImportedTeam) {
      await pool.query(
        `DELETE FROM "team_member" WHERE "teamId" = $1 AND "userId" = $2`,
        [teamRes.rows[0].linkedTeamId, memberId]
      );
      revalidatePath("/teams");
    }

    revalidatePath(`/events/${teamRes.rows[0].tournamentId}`);
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
      `SELECT "tournamentId", "linkedTeamId", "isImportedTeam" FROM "tournament_team" WHERE id = $1`,
      [teamId]
    );

    await pool.query(
      `DELETE FROM "tournament_team_member" WHERE "teamId" = $1 AND "userId" = $2`,
      [teamId, session.user.id]
    );

    if (teamRes.rows[0]) {
      if (teamRes.rows[0].linkedTeamId && !teamRes.rows[0].isImportedTeam) {
        await pool.query(
          `DELETE FROM "team_member" WHERE "teamId" = $1 AND "userId" = $2`,
          [teamRes.rows[0].linkedTeamId, session.user.id]
        );
        revalidatePath("/teams");
        revalidatePath("/dashboard/teams");
      }
      revalidatePath(`/events/${teamRes.rows[0].tournamentId}`);
    }
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
      `SELECT "captainId", "tournamentId", "linkedTeamId", "isImportedTeam" FROM "tournament_team" WHERE id = $1`,
      [teamId]
    );
    if (!teamRes.rows[0]) return { error: "Team not found" };
    if (teamRes.rows[0].captainId !== session.user.id) {
      await assertCanManageTournament(teamRes.rows[0].tournamentId, session.user.id);
    }

    await pool.query(`DELETE FROM "tournament_team" WHERE id = $1`, [teamId]);

    if (teamRes.rows[0].linkedTeamId && !teamRes.rows[0].isImportedTeam) {
      await pool.query(`DELETE FROM "team" WHERE id = $1`, [teamRes.rows[0].linkedTeamId]);
      revalidatePath("/teams");
      revalidatePath("/dashboard/teams");
    }

    revalidatePath(`/events/${teamRes.rows[0].tournamentId}`);
    revalidatePath(`/dashboard/tournaments`);
    return {};
  } catch (e) {
    console.error("[disbandTournamentTeam]", e);
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

class InsufficientFundsError extends Error {}

export async function payForTeamWithWallet(teamId: string): Promise<{ error?: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { error: "Unauthorized" };
    await ensureTournamentTables();

    const result = await pool.query(
      `SELECT tt.id, tt.name, tt."captainId", tt.status, e.title, e.sport, e.location, e.price, e.status as "tournamentStatus",
              e.id as "tournamentId", e."organizerId", e."startDateTime", e."endDateTime"
       FROM "tournament_team" tt
       JOIN "event" e ON e.id = tt."tournamentId"
       WHERE tt.id = $1`,
      [teamId]
    );
    const team = result.rows[0];
    if (!team) return { error: "Team not found" };
    if (team.captainId !== session.user.id) return { error: "Forbidden" };
    if (team.tournamentStatus === "cancelled") return { error: "This tournament has been cancelled" };
    if (!team.price) return { error: "Tournament is free" };
    if (new Date(team.endDateTime) < new Date()) return { error: "Tournament has ended" };
    if (team.captainId === team.organizerId) return { error: "You can't pay to join your own tournament" };

    const price = Number(team.price);
    const payerId = team.captainId as string;
    const organizerId = team.organizerId as string;

    let alreadyActive = false;
    try {
      await withTransaction(async (client) => {
        const activateRes = await client.query(
          `UPDATE "tournament_team" SET status = 'active', "paymentDeadline" = NULL
           WHERE id = $1 AND status = 'pending' RETURNING "tournamentId"`,
          [teamId]
        );
        if (activateRes.rowCount === 0) {
          alreadyActive = true;
          return;
        }

        // Fixed (sorted) lock order across the two user rows, regardless of who's
        // paying whom, so concurrent transfers between the same pair can't deadlock.
        const orderedIds = [payerId, organizerId].sort();
        let payerBalanceAfter = 0;
        for (const id of orderedIds) {
          if (id === payerId) {
            const debit = await client.query(
              `UPDATE "user" SET "walletBalance" = "walletBalance" - $1 WHERE id = $2 AND "walletBalance" >= $1 RETURNING "walletBalance"`,
              [price, payerId]
            );
            if (debit.rowCount === 0) throw new InsufficientFundsError();
            payerBalanceAfter = Number(debit.rows[0].walletBalance);
          } else {
            await client.query(`UPDATE "user" SET "walletBalance" = "walletBalance" + $1 WHERE id = $2`, [price, organizerId]);
          }
        }
        const organizerBalanceRes = await client.query(`SELECT "walletBalance" FROM "user" WHERE id = $1`, [organizerId]);

        await client.query(
          `INSERT INTO "wallet_transaction" (id, "userId", type, amount, "balanceAfter", "teamId")
           VALUES ($1, $2, 'event_payment_sent', $3, $4, $5)`,
          [crypto.randomUUID(), payerId, -price, payerBalanceAfter, teamId]
        );
        await client.query(
          `INSERT INTO "wallet_transaction" (id, "userId", type, amount, "balanceAfter", "teamId")
           VALUES ($1, $2, 'event_payment_received', $3, $4, $5)`,
          [crypto.randomUUID(), organizerId, price, organizerBalanceRes.rows[0].walletBalance, teamId]
        );

        await client.query(
          `INSERT INTO "tournament_team_payment" (id, "teamId", "userId", amount) VALUES ($1, $2, $3, $4)`,
          [crypto.randomUUID(), teamId, payerId, price]
        );
      });
    } catch (e) {
      if (e instanceof InsufficientFundsError) return { error: "Insufficient wallet balance" };
      throw e;
    }

    if (alreadyActive) return {};

    const captainRow = await pool.query(`SELECT name, email FROM "user" WHERE id = $1`, [payerId]);
    const captain = captainRow.rows[0];
    if (captain?.email) {
      sendTournamentTeamPaymentReceiptEmail(captain.email, {
        captainName: captain.name ?? "Captain",
        teamName: team.name,
        tournamentTitle: team.title,
        sport: team.sport,
        location: team.location,
        startDateTime: new Date(team.startDateTime).toISOString(),
        tournamentId: team.tournamentId,
        amountCents: price,
        currency: "cad",
      }).catch(() => {});
    }

    revalidatePath(`/events/${team.tournamentId}`);
    revalidatePath("/dashboard/tournaments");
    return {};
  } catch (e) {
    console.error("[payForTeamWithWallet]", e);
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}
