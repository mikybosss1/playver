"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";
import { ensureGameTables } from "@/lib/game-tables";
import { ensureTournamentTables } from "@/lib/tournament-tables";

// ─── Types ───────────────────────────────────────────────────────────────────

export type GameStatus = "scheduled" | "final";

export type PlayerBoxScore = {
  userId: string;
  name: string;
  image: string | null;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
};

export type Game = {
  id: string;
  tournamentId: string;
  homeTeamId: string;
  homeTeamName: string;
  awayTeamId: string;
  awayTeamName: string;
  court: string | null;
  round: string | null;
  scheduledTime: string;
  status: GameStatus;
  homeScore: number | null;
  awayScore: number | null;
};

export type GameDetail = Game & {
  homeRoster: PlayerBoxScore[];
  awayRoster: PlayerBoxScore[];
};

export type AthleteGameHistoryItem = {
  gameId: string;
  tournamentId: string;
  tournamentTitle: string;
  scheduledTime: string;
  round: string | null;
  court: string | null;
  teamId: string;
  teamName: string;
  opponentTeamName: string;
  teamScore: number;
  opponentScore: number;
  won: boolean;
  myStats: { points: number; rebounds: number; assists: number; steals: number; blocks: number };
  homeTeamName: string;
  awayTeamName: string;
  homeRoster: PlayerBoxScore[];
  awayRoster: PlayerBoxScore[];
  isHome: boolean;
};

type GameRow = {
  id: string;
  tournamentId: string;
  homeTeamId: string;
  homeTeamName: string;
  awayTeamId: string;
  awayTeamName: string;
  court: string | null;
  round: string | null;
  scheduledTime: Date | string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

export async function assertCanManageTournament(tournamentId: string, userId: string) {
  const [eventRes, roleRes] = await Promise.all([
    pool.query(`SELECT "organizerId" FROM "event" WHERE id = $1`, [tournamentId]),
    pool.query(`SELECT role FROM "user" WHERE id = $1`, [userId]),
  ]);
  if (!eventRes.rows[0]) throw new Error("Tournament not found");
  const isOrganizer = eventRes.rows[0].organizerId === userId;
  const isSuperAdmin = roleRes.rows[0]?.role === "super_admin";
  if (!isOrganizer && !isSuperAdmin) throw new Error("Forbidden");
}

function mapGameRow(row: GameRow): Game {
  return {
    id: row.id,
    tournamentId: row.tournamentId,
    homeTeamId: row.homeTeamId,
    homeTeamName: row.homeTeamName,
    awayTeamId: row.awayTeamId,
    awayTeamName: row.awayTeamName,
    court: row.court,
    round: row.round,
    scheduledTime: new Date(row.scheduledTime).toISOString(),
    status: row.status as GameStatus,
    homeScore: row.homeScore,
    awayScore: row.awayScore,
  };
}

async function fetchTeamRoster(teamId: string): Promise<{ userId: string; name: string; image: string | null }[]> {
  const res = await pool.query(
    `SELECT u.id as "userId", u.name, u.image
     FROM "tournament_team" tt
     JOIN "user" u ON u.id = tt."captainId"
     WHERE tt.id = $1
     UNION
     SELECT u.id as "userId", u.name, u.image
     FROM "tournament_team_member" ttm
     JOIN "user" u ON u.id = ttm."userId"
     WHERE ttm."teamId" = $1 AND ttm."confirmationStatus" != 'declined'`,
    [teamId]
  );
  return res.rows;
}

async function buildBoxScore(teamId: string, gameId: string): Promise<PlayerBoxScore[]> {
  const [roster, statsRes] = await Promise.all([
    fetchTeamRoster(teamId),
    pool.query(
      `SELECT "userId", points, rebounds, assists, steals, blocks FROM "game_player_stat" WHERE "gameId" = $1 AND "teamId" = $2`,
      [gameId, teamId]
    ),
  ]);
  const statsByUser = new Map(
    statsRes.rows.map((r: { userId: string; points: number; rebounds: number; assists: number; steals: number; blocks: number }) => [r.userId, r])
  );
  return roster.map((p) => {
    const s = statsByUser.get(p.userId);
    return {
      userId: p.userId,
      name: p.name,
      image: p.image,
      points: s?.points ?? 0,
      rebounds: s?.rebounds ?? 0,
      assists: s?.assists ?? 0,
      steals: s?.steals ?? 0,
      blocks: s?.blocks ?? 0,
    };
  });
}

const GAME_SELECT = `
  SELECT g.*, ht.name as "homeTeamName", at.name as "awayTeamName"
  FROM "game" g
  JOIN "tournament_team" ht ON ht.id = g."homeTeamId"
  JOIN "tournament_team" at ON at.id = g."awayTeamId"
`;

// ─── Reads ───────────────────────────────────────────────────────────────────

export async function getGamesForEvent(tournamentId: string): Promise<Game[]> {
  await ensureGameTables();
  const res = await pool.query(
    `${GAME_SELECT} WHERE g."tournamentId" = $1 ORDER BY g."scheduledTime" ASC`,
    [tournamentId]
  );
  return res.rows.map(mapGameRow);
}

export async function getGameDetail(gameId: string): Promise<GameDetail | null> {
  await ensureGameTables();
  const res = await pool.query(`${GAME_SELECT} WHERE g.id = $1`, [gameId]);
  if (!res.rows[0]) return null;
  const row = res.rows[0] as GameRow;
  const [homeRoster, awayRoster] = await Promise.all([
    buildBoxScore(row.homeTeamId, gameId),
    buildBoxScore(row.awayTeamId, gameId),
  ]);
  return { ...mapGameRow(row), homeRoster, awayRoster };
}

export async function getAthleteGameHistory(userId: string): Promise<AthleteGameHistoryItem[]> {
  await ensureGameTables();

  const res = await pool.query(
    `SELECT g.id as "gameId", g."tournamentId", e.title as "tournamentTitle",
            g."scheduledTime", g.round, g.court,
            g."homeTeamId", g."awayTeamId", g."homeScore", g."awayScore",
            ht.name as "homeTeamName", at.name as "awayTeamName",
            gps."teamId" as "myTeamId"
     FROM "game_player_stat" gps
     JOIN "game" g ON g.id = gps."gameId"
     JOIN "event" e ON e.id = g."tournamentId"
     JOIN "tournament_team" ht ON ht.id = g."homeTeamId"
     JOIN "tournament_team" at ON at.id = g."awayTeamId"
     WHERE gps."userId" = $1 AND g.status = 'final'
     ORDER BY g."scheduledTime" DESC`,
    [userId]
  );

  return Promise.all(
    res.rows.map(async (row: {
      gameId: string; tournamentId: string; tournamentTitle: string; scheduledTime: Date | string;
      round: string | null; court: string | null; homeTeamId: string; awayTeamId: string;
      homeScore: number | null; awayScore: number | null; homeTeamName: string; awayTeamName: string; myTeamId: string;
    }) => {
      const isHome = row.myTeamId === row.homeTeamId;
      const [homeRoster, awayRoster] = await Promise.all([
        buildBoxScore(row.homeTeamId, row.gameId),
        buildBoxScore(row.awayTeamId, row.gameId),
      ]);
      const mine = (isHome ? homeRoster : awayRoster).find((p) => p.userId === userId);
      const teamScore = (isHome ? row.homeScore : row.awayScore) ?? 0;
      const opponentScore = (isHome ? row.awayScore : row.homeScore) ?? 0;

      return {
        gameId: row.gameId,
        tournamentId: row.tournamentId,
        tournamentTitle: row.tournamentTitle,
        scheduledTime: new Date(row.scheduledTime).toISOString(),
        round: row.round,
        court: row.court,
        teamId: row.myTeamId,
        teamName: isHome ? row.homeTeamName : row.awayTeamName,
        opponentTeamName: isHome ? row.awayTeamName : row.homeTeamName,
        teamScore,
        opponentScore,
        won: teamScore > opponentScore,
        myStats: mine
          ? { points: mine.points, rebounds: mine.rebounds, assists: mine.assists, steals: mine.steals, blocks: mine.blocks }
          : { points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0 },
        homeTeamName: row.homeTeamName,
        awayTeamName: row.awayTeamName,
        homeRoster,
        awayRoster,
        isHome,
      };
    })
  );
}

// ─── Writes ──────────────────────────────────────────────────────────────────

export async function createGame(
  tournamentId: string,
  data: { homeTeamId: string; awayTeamId: string; scheduledTime: string; court?: string; round?: string }
): Promise<{ error?: string; gameId?: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { error: "Unauthorized" };
    await Promise.all([ensureGameTables(), ensureTournamentTables()]);
    await assertCanManageTournament(tournamentId, session.user.id);

    if (data.homeTeamId === data.awayTeamId) return { error: "A team cannot play itself" };
    if (!data.scheduledTime) return { error: "Scheduled time is required" };

    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO "game" (id, "tournamentId", "homeTeamId", "awayTeamId", court, round, "scheduledTime")
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, tournamentId, data.homeTeamId, data.awayTeamId, data.court || null, data.round || null, data.scheduledTime]
    );

    revalidatePath(`/events/${tournamentId}`);
    return { gameId: id };
  } catch (e) {
    console.error("[createGame]", e);
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateGame(
  gameId: string,
  data: { homeTeamId: string; awayTeamId: string; scheduledTime: string; court?: string; round?: string }
): Promise<{ error?: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { error: "Unauthorized" };
    await ensureGameTables();

    const gameRes = await pool.query(`SELECT "tournamentId" FROM "game" WHERE id = $1`, [gameId]);
    if (!gameRes.rows[0]) return { error: "Game not found" };
    const tournamentId = gameRes.rows[0].tournamentId;
    await assertCanManageTournament(tournamentId, session.user.id);

    if (data.homeTeamId === data.awayTeamId) return { error: "A team cannot play itself" };

    await pool.query(
      `UPDATE "game"
       SET "homeTeamId" = $1, "awayTeamId" = $2, "scheduledTime" = $3, court = $4, round = $5, "updatedAt" = NOW()
       WHERE id = $6`,
      [data.homeTeamId, data.awayTeamId, data.scheduledTime, data.court || null, data.round || null, gameId]
    );

    revalidatePath(`/events/${tournamentId}`);
    return {};
  } catch (e) {
    console.error("[updateGame]", e);
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function deleteGame(gameId: string): Promise<{ error?: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { error: "Unauthorized" };
    await ensureGameTables();

    const gameRes = await pool.query(`SELECT "tournamentId" FROM "game" WHERE id = $1`, [gameId]);
    if (!gameRes.rows[0]) return { error: "Game not found" };
    const tournamentId = gameRes.rows[0].tournamentId;
    await assertCanManageTournament(tournamentId, session.user.id);

    await pool.query(`DELETE FROM "game" WHERE id = $1`, [gameId]);

    revalidatePath(`/events/${tournamentId}`);
    return {};
  } catch (e) {
    console.error("[deleteGame]", e);
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function submitGameResult(
  gameId: string,
  data: {
    homeScore: number;
    awayScore: number;
    stats: { userId: string; teamId: string; points: number; rebounds: number; assists: number; steals: number; blocks: number }[];
  }
): Promise<{ error?: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { error: "Unauthorized" };
    await ensureGameTables();

    const gameRes = await pool.query(`SELECT "tournamentId" FROM "game" WHERE id = $1`, [gameId]);
    if (!gameRes.rows[0]) return { error: "Game not found" };
    const tournamentId = gameRes.rows[0].tournamentId;
    await assertCanManageTournament(tournamentId, session.user.id);

    await pool.query(
      `UPDATE "game" SET status = 'final', "homeScore" = $1, "awayScore" = $2, "updatedAt" = NOW() WHERE id = $3`,
      [data.homeScore, data.awayScore, gameId]
    );

    await pool.query(`DELETE FROM "game_player_stat" WHERE "gameId" = $1`, [gameId]);
    for (const s of data.stats) {
      await pool.query(
        `INSERT INTO "game_player_stat" (id, "gameId", "teamId", "userId", points, rebounds, assists, steals, blocks)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [crypto.randomUUID(), gameId, s.teamId, s.userId, s.points, s.rebounds, s.assists, s.steals, s.blocks]
      );
      revalidatePath(`/athletes/${s.userId}`);
    }

    revalidatePath(`/events/${tournamentId}`);
    return {};
  } catch (e) {
    console.error("[submitGameResult]", e);
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}
