// node scripts/migrate-event-participants.mjs
import { Pool } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = readFileSync(resolve(__dirname, "../.env.local"), "utf8");
const DATABASE_URL = env.match(/^DATABASE_URL=(.+)$/m)?.[1].trim();
const PROD_DATABASE_URL = env.match(/^PROD_DATABASE_URL=(.+)$/m)?.[1].trim();
if (!DATABASE_URL) { console.error("DATABASE_URL not found in .env.local"); process.exit(1); }

const sql = `CREATE TABLE IF NOT EXISTS "event_participant" (
  "id"        text PRIMARY KEY,
  "eventId"   text NOT NULL REFERENCES "event"("id") ON DELETE CASCADE,
  "userId"    text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "joinedAt"  timestamp NOT NULL DEFAULT NOW(),
  UNIQUE("eventId", "userId")
)`;

async function run(label, url) {
  const pool = new Pool({ connectionString: url });
  console.log(`\n[${label}] Running migration...`);
  await pool.query(sql);
  console.log(`[${label}] ✓ event_participant`);
  await pool.end();
}

await run("stage", DATABASE_URL);
if (PROD_DATABASE_URL) await run("prod", PROD_DATABASE_URL);
else console.log("\n(Skipping prod — PROD_DATABASE_URL not set in .env.local)");

console.log("\nDone.");
