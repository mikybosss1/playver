import { pool } from "@/lib/db";

let gameTablesReady: Promise<void> | null = null;

export async function ensureGameTables() {
  gameTablesReady ??= (async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "game" (
        "id"            text PRIMARY KEY,
        "tournamentId"  text NOT NULL REFERENCES "event"("id") ON DELETE CASCADE,
        "homeTeamId"    text REFERENCES "tournament_team"("id") ON DELETE CASCADE,
        "awayTeamId"    text REFERENCES "tournament_team"("id") ON DELETE CASCADE,
        "court"         text,
        "round"         text,
        "notes"         text,
        "scheduledTime" timestamptz NOT NULL,
        "status"        text NOT NULL DEFAULT 'scheduled',
        "homeScore"     integer,
        "awayScore"     integer,
        "createdAt"     timestamptz NOT NULL DEFAULT NOW(),
        "updatedAt"     timestamptz NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`ALTER TABLE "game" ADD COLUMN IF NOT EXISTS "notes" text`);
    // Teams can now be assigned later (e.g. bracket games scheduled before pool play finishes),
    // so a game may exist with no home/away team yet — a "TBD" placeholder until edited.
    await pool.query(`ALTER TABLE "game" ALTER COLUMN "homeTeamId" DROP NOT NULL`);
    await pool.query(`ALTER TABLE "game" ALTER COLUMN "awayTeamId" DROP NOT NULL`);
    // Fix for games created before this column was timestamptz: the naive "timestamp" type
    // silently dropped timezone info and got reinterpreted using the DB session's timezone on
    // read, shifting displayed times by several hours. The stored digits already represent the
    // correct UTC instant, so reinterpret (not shift) them when widening the column.
    await pool.query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'game' AND column_name = 'scheduledTime' AND data_type = 'timestamp without time zone'
        ) THEN
          ALTER TABLE "game" ALTER COLUMN "scheduledTime" TYPE timestamptz USING "scheduledTime" AT TIME ZONE 'UTC';
        END IF;
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'game' AND column_name = 'createdAt' AND data_type = 'timestamp without time zone'
        ) THEN
          ALTER TABLE "game" ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC';
        END IF;
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'game' AND column_name = 'updatedAt' AND data_type = 'timestamp without time zone'
        ) THEN
          ALTER TABLE "game" ALTER COLUMN "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'UTC';
        END IF;
      END $$;
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "game_player_stat" (
        "id"       text PRIMARY KEY,
        "gameId"   text NOT NULL REFERENCES "game"("id") ON DELETE CASCADE,
        "teamId"   text NOT NULL REFERENCES "tournament_team"("id") ON DELETE CASCADE,
        "userId"   text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "points"   integer NOT NULL DEFAULT 0,
        "rebounds" integer NOT NULL DEFAULT 0,
        "assists"  integer NOT NULL DEFAULT 0,
        "steals"   integer NOT NULL DEFAULT 0,
        "blocks"   integer NOT NULL DEFAULT 0
      )
    `);
    await pool.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'game_player_stat_gameId_userId_key'
        ) THEN
          ALTER TABLE "game_player_stat"
            ADD CONSTRAINT "game_player_stat_gameId_userId_key" UNIQUE ("gameId", "userId");
        END IF;
      END $$;
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS "game_tournamentId_idx" ON "game" ("tournamentId")`);
    await pool.query(`CREATE INDEX IF NOT EXISTS "game_player_stat_userId_idx" ON "game_player_stat" ("userId")`);
  })();
  await gameTablesReady;
}
