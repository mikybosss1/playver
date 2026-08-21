// Lazy schema for miniEvent.ts's tables — see ARCHITECTURE.md §5 for the
// lazy-DDL vs. migration-script split.
import { pool } from "@/lib/db";

let miniEventTablesReady: Promise<void> | null = null;

export async function ensureMiniEventTables() {
  miniEventTablesReady ??= (async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "mini_event" (
        "id"            text PRIMARY KEY,
        "tournamentId"  text NOT NULL REFERENCES "event"("id") ON DELETE CASCADE,
        "title"         text NOT NULL,
        "court"         text,
        "notes"         text,
        "scheduledTime" timestamptz NOT NULL,
        "status"        text NOT NULL DEFAULT 'scheduled',
        "createdAt"     timestamptz NOT NULL DEFAULT NOW(),
        "updatedAt"     timestamptz NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`ALTER TABLE "mini_event" ADD COLUMN IF NOT EXISTS "notes" text`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "mini_event_result" (
        "id"          text PRIMARY KEY,
        "miniEventId" text NOT NULL REFERENCES "mini_event"("id") ON DELETE CASCADE,
        "userId"      text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "score"       integer NOT NULL DEFAULT 0
      )
    `);
    await pool.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'mini_event_result_miniEventId_userId_key'
        ) THEN
          ALTER TABLE "mini_event_result"
            ADD CONSTRAINT "mini_event_result_miniEventId_userId_key" UNIQUE ("miniEventId", "userId");
        END IF;
      END $$;
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS "mini_event_tournamentId_idx" ON "mini_event" ("tournamentId")`);
  })();
  await miniEventTablesReady;
}
