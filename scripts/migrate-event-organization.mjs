// node scripts/migrate-event-organization.mjs
import { Pool } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = readFileSync(resolve(__dirname, "../.env.local"), "utf8");
const DATABASE_URL = env.match(/^DATABASE_URL=(.+)$/m)?.[1].trim();
const PROD_DATABASE_URL = env.match(/^PROD_DATABASE_URL=(.+)$/m)?.[1].trim();
if (!DATABASE_URL) { console.error("DATABASE_URL not found in .env.local"); process.exit(1); }

async function run(label, url) {
  const pool = new Pool({ connectionString: url });
  console.log(`\n[${label}] Running event-organization migration...`);

  // Nullable and ON DELETE SET NULL: existing events created before organizations
  // existed (and any event created outside an organizer's active org) simply have
  // no organizationId and won't show up in that org's Registrations tab. The
  // existing organizerId (user) column is untouched — it's still what payments,
  // refunds, and the wallet hold logic key off of.
  await pool.query(`
    ALTER TABLE "event" ADD COLUMN IF NOT EXISTS "organizationId" text
      REFERENCES "organization"("id") ON DELETE SET NULL
  `);
  console.log(`[${label}] ✓ event.organizationId`);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS "event_organizationId_idx" ON "event"("organizationId")
  `);
  console.log(`[${label}] ✓ event_organizationId_idx`);

  await pool.end();
}

await run("stage", DATABASE_URL);
if (PROD_DATABASE_URL) await run("prod", PROD_DATABASE_URL);
else console.log("\n(Skipping prod — PROD_DATABASE_URL not set in .env.local)");

console.log("\nDone.");
