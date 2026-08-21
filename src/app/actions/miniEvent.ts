"use server";

// "Mini-events" — free-for-all side competitions inside a tournament that
// aren't a team-vs-team game (e.g. a 3-point contest, a skills challenge):
// individual players get a single score rather than a box score. Reuses
// game.ts's assertCanManageTournament() for authorization, so the same
// creator-or-super-admin-only gap noted there applies here too.

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";
import { ensureMiniEventTables } from "@/lib/mini-event-tables";
import { assertCanManageTournament } from "@/app/actions/game";

// ─── Types ───────────────────────────────────────────────────────────────────

export type MiniEventStatus = "scheduled" | "final";

export type MiniEvent = {
  id: string;
  tournamentId: string;
  title: string;
  court: string | null;
  notes: string | null;
  scheduledTime: string;
  status: MiniEventStatus;
};

export type MiniEventResultEntry = {
  userId: string;
  name: string;
  image: string | null;
  score: number;
};

export type MiniEventDetail = MiniEvent & {
  results: MiniEventResultEntry[];
};

export type TournamentPlayer = {
  userId: string;
  name: string;
  image: string | null;
};

type MiniEventRow = {
  id: string;
  tournamentId: string;
  title: string;
  court: string | null;
  notes: string | null;
  scheduledTime: Date | string;
  status: string;
};

function mapMiniEventRow(row: MiniEventRow): MiniEvent {
  return {
    id: row.id,
    tournamentId: row.tournamentId,
    title: row.title,
    court: row.court,
    notes: row.notes,
    scheduledTime: new Date(row.scheduledTime).toISOString(),
    status: row.status as MiniEventStatus,
  };
}

// ─── Reads ───────────────────────────────────────────────────────────────────

export async function getTournamentPlayers(tournamentId: string): Promise<TournamentPlayer[]> {
  const res = await pool.query(
    `SELECT DISTINCT u.id as "userId", u.name, u.image
     FROM "tournament_team" tt
     JOIN "user" u ON u.id = tt."captainId"
     WHERE tt."tournamentId" = $1
     UNION
     SELECT DISTINCT u.id as "userId", u.name, u.image
     FROM "tournament_team_member" ttm
     JOIN "tournament_team" tt ON tt.id = ttm."teamId"
     JOIN "user" u ON u.id = ttm."userId"
     WHERE tt."tournamentId" = $1 AND ttm."confirmationStatus" != 'declined'
     ORDER BY name ASC`,
    [tournamentId]
  );
  return res.rows;
}

export async function getMiniEventsForEvent(tournamentId: string): Promise<MiniEvent[]> {
  await ensureMiniEventTables();
  const res = await pool.query(
    `SELECT * FROM "mini_event" WHERE "tournamentId" = $1 ORDER BY "scheduledTime" ASC`,
    [tournamentId]
  );
  return res.rows.map(mapMiniEventRow);
}

export async function getMiniEventDetail(miniEventId: string): Promise<MiniEventDetail | null> {
  await ensureMiniEventTables();
  const res = await pool.query(`SELECT * FROM "mini_event" WHERE id = $1`, [miniEventId]);
  if (!res.rows[0]) return null;

  const resultsRes = await pool.query(
    `SELECT mer."userId", mer.score, u.name, u.image
     FROM "mini_event_result" mer
     JOIN "user" u ON u.id = mer."userId"
     WHERE mer."miniEventId" = $1
     ORDER BY mer.score DESC`,
    [miniEventId]
  );

  return {
    ...mapMiniEventRow(res.rows[0]),
    results: resultsRes.rows,
  };
}

// ─── Writes ──────────────────────────────────────────────────────────────────

export async function createMiniEvent(
  tournamentId: string,
  data: { title: string; scheduledTime: string; court?: string; notes?: string }
): Promise<{ error?: string; miniEventId?: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { error: "Unauthorized" };
    await ensureMiniEventTables();
    await assertCanManageTournament(tournamentId, session.user.id);

    if (!data.title.trim()) return { error: "Title is required" };
    if (!data.scheduledTime) return { error: "Scheduled time is required" };

    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO "mini_event" (id, "tournamentId", title, court, notes, "scheduledTime")
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, tournamentId, data.title.trim(), data.court || null, data.notes || null, data.scheduledTime]
    );

    revalidatePath(`/events/${tournamentId}`);
    return { miniEventId: id };
  } catch (e) {
    console.error("[createMiniEvent]", e);
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateMiniEvent(
  miniEventId: string,
  data: { title: string; scheduledTime: string; court?: string; notes?: string }
): Promise<{ error?: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { error: "Unauthorized" };
    await ensureMiniEventTables();

    const eventRes = await pool.query(`SELECT "tournamentId" FROM "mini_event" WHERE id = $1`, [miniEventId]);
    if (!eventRes.rows[0]) return { error: "Mini event not found" };
    const tournamentId = eventRes.rows[0].tournamentId;
    await assertCanManageTournament(tournamentId, session.user.id);

    if (!data.title.trim()) return { error: "Title is required" };

    await pool.query(
      `UPDATE "mini_event" SET title = $1, court = $2, notes = $3, "scheduledTime" = $4, "updatedAt" = NOW() WHERE id = $5`,
      [data.title.trim(), data.court || null, data.notes || null, data.scheduledTime, miniEventId]
    );

    revalidatePath(`/events/${tournamentId}`);
    return {};
  } catch (e) {
    console.error("[updateMiniEvent]", e);
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function deleteMiniEvent(miniEventId: string): Promise<{ error?: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { error: "Unauthorized" };
    await ensureMiniEventTables();

    const eventRes = await pool.query(`SELECT "tournamentId" FROM "mini_event" WHERE id = $1`, [miniEventId]);
    if (!eventRes.rows[0]) return { error: "Mini event not found" };
    const tournamentId = eventRes.rows[0].tournamentId;
    await assertCanManageTournament(tournamentId, session.user.id);

    await pool.query(`DELETE FROM "mini_event" WHERE id = $1`, [miniEventId]);

    revalidatePath(`/events/${tournamentId}`);
    return {};
  } catch (e) {
    console.error("[deleteMiniEvent]", e);
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function clearMiniEventResult(miniEventId: string): Promise<{ error?: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { error: "Unauthorized" };
    await ensureMiniEventTables();

    const eventRes = await pool.query(`SELECT "tournamentId" FROM "mini_event" WHERE id = $1`, [miniEventId]);
    if (!eventRes.rows[0]) return { error: "Mini event not found" };
    const tournamentId = eventRes.rows[0].tournamentId;
    await assertCanManageTournament(tournamentId, session.user.id);

    await pool.query(`DELETE FROM "mini_event_result" WHERE "miniEventId" = $1`, [miniEventId]);
    await pool.query(`UPDATE "mini_event" SET status = 'scheduled', "updatedAt" = NOW() WHERE id = $1`, [miniEventId]);

    revalidatePath(`/events/${tournamentId}`);
    return {};
  } catch (e) {
    console.error("[clearMiniEventResult]", e);
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function submitMiniEventResult(
  miniEventId: string,
  results: { userId: string; score: number }[]
): Promise<{ error?: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { error: "Unauthorized" };
    await ensureMiniEventTables();

    const eventRes = await pool.query(`SELECT "tournamentId" FROM "mini_event" WHERE id = $1`, [miniEventId]);
    if (!eventRes.rows[0]) return { error: "Mini event not found" };
    const tournamentId = eventRes.rows[0].tournamentId;
    await assertCanManageTournament(tournamentId, session.user.id);

    await pool.query(`UPDATE "mini_event" SET status = 'final', "updatedAt" = NOW() WHERE id = $1`, [miniEventId]);

    await pool.query(`DELETE FROM "mini_event_result" WHERE "miniEventId" = $1`, [miniEventId]);
    for (const r of results) {
      await pool.query(
        `INSERT INTO "mini_event_result" (id, "miniEventId", "userId", score) VALUES ($1, $2, $3, $4)`,
        [crypto.randomUUID(), miniEventId, r.userId, r.score]
      );
    }

    revalidatePath(`/events/${tournamentId}`);
    return {};
  } catch (e) {
    console.error("[submitMiniEventResult]", e);
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}
