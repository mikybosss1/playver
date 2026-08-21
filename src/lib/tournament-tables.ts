// Lazy schema: these tables self-create on first use rather than requiring a
// migration script to have run in every environment. See ARCHITECTURE.md §5
// for when to use this pattern vs. a scripts/migrate-*.mjs file.
import { pool } from "@/lib/db";

let tournamentTablesReady: Promise<void> | null = null;

export async function ensureTournamentTables() {
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
    await pool.query(`ALTER TABLE "tournament_team" ADD COLUMN IF NOT EXISTS "linkedTeamId" text`);
    await pool.query(`ALTER TABLE "tournament_team" ADD COLUMN IF NOT EXISTS "isImportedTeam" boolean NOT NULL DEFAULT false`);
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
