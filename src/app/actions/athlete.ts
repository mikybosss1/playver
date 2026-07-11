"use server";

import { headers } from "next/headers";
import { pool } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getAthleteGameHistory, type AthleteGameHistoryItem } from "@/app/actions/game";

const toISO = (v: Date | string | null) => (v ? new Date(v).toISOString() : null);

// ── lazy DDL ────────────────────────────────────────────────────────────────

let ensureProfileColumnsPromise: Promise<void> | null = null;
function ensureUserProfileColumns() {
  if (!ensureProfileColumnsPromise) {
    ensureProfileColumnsPromise = Promise.all([
      pool.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS bio TEXT`),
      pool.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "mainSport" TEXT`),
    ]).then(() => undefined);
  }
  return ensureProfileColumnsPromise;
}

let ensureUserMediaPromise: Promise<void> | null = null;
function ensureUserMediaTable() {
  if (!ensureUserMediaPromise) {
    ensureUserMediaPromise = pool
      .query(`
        CREATE TABLE IF NOT EXISTS "user_media" (
          id TEXT PRIMARY KEY,
          "userId" TEXT NOT NULL,
          url TEXT NOT NULL,
          type TEXT NOT NULL DEFAULT 'image',
          "createdAt" TIMESTAMPTZ DEFAULT NOW()
        )
      `)
      .then(() => undefined);
  }
  return ensureUserMediaPromise;
}

// ── Public profile (athlete page) ───────────────────────────────────────────

export type AthleteUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  createdAt: string;
  bio: string;
  mainSport: string | null;
};

export type AthleteTeam = {
  id: string;
  name: string;
  sport: string;
  location: string;
  logoUrl: string | null;
  isCaptain: boolean;
};

export type AthleteEvent = {
  id: string;
  title: string;
  sport: string;
  eventType: string;
  location: string;
  startDateTime: string;
  endDateTime: string;
  coverImageUrl: string | null;
  role: "organizer" | "participant";
};

export type AthleteProfile = {
  user: AthleteUser;
  teams: AthleteTeam[];
  events: AthleteEvent[];
  sports: string[];
  media: UserMediaItem[];
  games: AthleteGameHistoryItem[];
};

export async function getAthleteProfile(userId: string): Promise<AthleteProfile | null> {
  await Promise.all([ensureUserProfileColumns(), ensureUserMediaTable()]);

  const [userResult, teamsResult, eventsResult, mediaResult, games] = await Promise.all([
    pool.query(
      `SELECT id, name, email, image, "createdAt", COALESCE(bio, '') AS bio, "mainSport" FROM "user" WHERE id = $1`,
      [userId]
    ),
    pool.query(
      `SELECT t.id, t.name, t.sport, t.location, t."logoUrl",
              (t."captainId" = $1) AS "isCaptain"
       FROM "team" t
       JOIN "team_member" tm ON tm."teamId" = t.id
       WHERE tm."userId" = $1
       ORDER BY "isCaptain" DESC, tm."joinedAt" ASC`,
      [userId]
    ),
    pool.query(
      `SELECT e.id, e.title, e.sport, e."eventType", e.location,
              e."startDateTime", e."endDateTime", e."coverImageUrl",
              CASE WHEN e."organizerId" = $1 THEN 'organizer' ELSE 'participant' END AS role
       FROM "event" e
       WHERE e."organizerId" = $1
          OR e.id IN (SELECT "eventId" FROM "event_participant" WHERE "userId" = $1)
       ORDER BY e."startDateTime" DESC`,
      [userId]
    ),
    pool.query(
      `SELECT id, url, type FROM "user_media" WHERE "userId" = $1 ORDER BY "createdAt" DESC`,
      [userId]
    ),
    getAthleteGameHistory(userId),
  ]);

  if (!userResult.rows[0]) return null;

  const user = userResult.rows[0];
  const teams: AthleteTeam[] = teamsResult.rows.map((r: AthleteTeam & { isCaptain: boolean }) => ({
    id: r.id,
    name: r.name,
    sport: r.sport,
    location: r.location,
    logoUrl: r.logoUrl,
    isCaptain: Boolean(r.isCaptain),
  }));

  const events: AthleteEvent[] = eventsResult.rows.map(
    (r: AthleteEvent & { startDateTime: Date | string; endDateTime: Date | string }) => ({
      id: r.id,
      title: r.title,
      sport: r.sport,
      eventType: r.eventType,
      location: r.location,
      startDateTime: new Date(r.startDateTime).toISOString(),
      endDateTime: new Date(r.endDateTime).toISOString(),
      coverImageUrl: r.coverImageUrl,
      role: r.role as "organizer" | "participant",
    })
  );

  const sports = [...new Set([...teams.map((t) => t.sport), ...events.map((e) => e.sport)])];

  return {
    user: {
      ...user,
      createdAt: new Date(user.createdAt).toISOString(),
      image: user.image ?? null,
      bio: user.bio ?? "",
      mainSport: user.mainSport ?? null,
    },
    teams,
    events,
    sports,
    media: mediaResult.rows as UserMediaItem[],
    games,
  };
}

// ── Dashboard profile actions ────────────────────────────────────────────────

export type UserMediaItem = {
  id: string;
  url: string;
  type: string;
};

export type ProfileData = {
  name: string;
  email: string;
  image: string | null;
  bio: string;
  mainSport: string | null;
  media: UserMediaItem[];
};

export async function getProfileData(): Promise<ProfileData> {
  await Promise.all([ensureUserProfileColumns(), ensureUserMediaTable()]);
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const [userResult, mediaResult] = await Promise.all([
    pool.query(
      `SELECT name, email, image, COALESCE(bio, '') AS bio, "mainSport" FROM "user" WHERE id = $1`,
      [session.user.id]
    ),
    pool.query(
      `SELECT id, url, type FROM "user_media" WHERE "userId" = $1 ORDER BY "createdAt" DESC`,
      [session.user.id]
    ),
  ]);

  const u = userResult.rows[0];
  return {
    name: u.name ?? "",
    email: u.email ?? "",
    image: u.image ?? null,
    bio: u.bio ?? "",
    mainSport: u.mainSport ?? null,
    media: mediaResult.rows as UserMediaItem[],
  };
}

export async function updateUserProfile(data: {
  name: string;
  bio: string;
  mainSport: string | null;
  imageUrl?: string;
}): Promise<void> {
  await ensureUserProfileColumns();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  if (data.imageUrl) {
    await pool.query(
      `UPDATE "user" SET name = $1, bio = $2, "mainSport" = $3, image = $4, "updatedAt" = NOW() WHERE id = $5`,
      [data.name, data.bio, data.mainSport, data.imageUrl, session.user.id]
    );
  } else {
    await pool.query(
      `UPDATE "user" SET name = $1, bio = $2, "mainSport" = $3, "updatedAt" = NOW() WHERE id = $4`,
      [data.name, data.bio, data.mainSport, session.user.id]
    );
  }
}

export async function addUserMedia(items: { url: string; type: string }[]): Promise<UserMediaItem[]> {
  await ensureUserMediaTable();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const results: UserMediaItem[] = [];
  for (const item of items) {
    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO "user_media" (id, "userId", url, type) VALUES ($1, $2, $3, $4)`,
      [id, session.user.id, item.url, item.type]
    );
    results.push({ id, url: item.url, type: item.type });
  }
  return results;
}

export async function deleteUserMedia(id: string): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  await pool.query(
    `DELETE FROM "user_media" WHERE id = $1 AND "userId" = $2`,
    [id, session.user.id]
  );
}
