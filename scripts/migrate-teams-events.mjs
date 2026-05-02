// node scripts/migrate-teams-events.mjs
import { Pool } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = readFileSync(resolve(__dirname, "../.env.local"), "utf8");
const DATABASE_URL = env.match(/^DATABASE_URL=(.+)$/m)?.[1].trim();
if (!DATABASE_URL) { console.error("DATABASE_URL not found"); process.exit(1); }

const pool = new Pool({ connectionString: DATABASE_URL });

const tables = [
  {
    name: "team",
    sql: `CREATE TABLE IF NOT EXISTS "team" (
      "id"            text PRIMARY KEY,
      "name"          text NOT NULL,
      "sport"         text NOT NULL,
      "location"      text NOT NULL,
      "bio"           text,
      "captainPhone"  text,
      "logoUrl"       text,
      "captainId"     text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
      "createdAt"     timestamp NOT NULL DEFAULT NOW(),
      "updatedAt"     timestamp NOT NULL DEFAULT NOW()
    )`,
  },
  {
    name: "event",
    sql: `CREATE TABLE IF NOT EXISTS "event" (
      "id"                  text PRIMARY KEY,
      "title"               text NOT NULL,
      "sport"               text NOT NULL,
      "eventType"           text NOT NULL,
      "location"            text NOT NULL,
      "startDateTime"       timestamp NOT NULL,
      "endDateTime"         timestamp NOT NULL,
      "coverImageUrl"       text,
      "galleryUrls"         text[] DEFAULT '{}',
      "registrationMode"    text NOT NULL DEFAULT 'individual',
      "capacity"            integer,
      "maxPlayersPerTeam"   integer,
      "description"         text,
      "rules"               text,
      "organizerId"         text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
      "createdAt"           timestamp NOT NULL DEFAULT NOW(),
      "updatedAt"           timestamp NOT NULL DEFAULT NOW()
    )`,
  },
];

console.log("Running migration...");
for (const { name, sql } of tables) {
  await pool.query(sql);
  console.log(`✓ ${name}`);
}
await pool.end();
console.log("\nDone.");
