// node scripts/migrate-team-members.mjs
import { Pool } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = readFileSync(resolve(__dirname, "../.env.local"), "utf8");
const DATABASE_URL = env.match(/^DATABASE_URL=(.+)$/m)?.[1].trim();
if (!DATABASE_URL) { console.error("DATABASE_URL not found"); process.exit(1); }

const pool = new Pool({ connectionString: DATABASE_URL });

const sql = `CREATE TABLE IF NOT EXISTS "team_member" (
  "id"        text PRIMARY KEY,
  "teamId"    text NOT NULL REFERENCES "team"("id") ON DELETE CASCADE,
  "userId"    text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "joinedAt"  timestamp NOT NULL DEFAULT NOW(),
  UNIQUE("teamId", "userId")
)`;

console.log("Running migration...");
await pool.query(sql);
console.log("✓ team_member");
await pool.end();
console.log("\nDone.");
