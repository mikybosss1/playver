// node scripts/migrate-gallery-types.mjs [--prod]
//
// Backfills the galleryItems JSONB column for existing events.
// - For events migrated from the old DB: reads type from event_gallery_item.type
// - For events created in the new app:   defaults to type="image"
// Safe to re-run.

import { Pool } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const isProd = process.argv.includes("--prod");
const __dirname = dirname(fileURLToPath(import.meta.url));
const env = readFileSync(resolve(__dirname, "../.env.local"), "utf8");

const OLD_URL = env.match(/^OLD_DATABASE_URL=(.+)$/m)?.[1].trim();
const NEW_URL = isProd
  ? env.match(/^PROD_DATABASE_URL=(.+)$/m)?.[1].trim()
  : env.match(/^DATABASE_URL=(.+)$/m)?.[1].trim();

if (!OLD_URL) { console.error("OLD_DATABASE_URL not found"); process.exit(1); }
if (!NEW_URL) { console.error(isProd ? "PROD_DATABASE_URL" : "DATABASE_URL", "not found"); process.exit(1); }

console.log(`\nTarget: ${isProd ? "PRODUCTION" : "development"}`);

const old = new Pool({ connectionString: OLD_URL });
const db  = new Pool({ connectionString: NEW_URL });

// Ensure column exists
await db.query(`ALTER TABLE "event" ADD COLUMN IF NOT EXISTS "galleryItems" JSONB NOT NULL DEFAULT '[]'::jsonb`);

// ── 1. Populate from old DB (with correct types) ────────────────────────────
console.log("\n[1/2] Backfilling gallery types from old DB...");
const galleryItems = await old.query(
  `SELECT "eventId", url, type FROM "event_gallery_item" ORDER BY "eventId", "createdAt"`
);

const byEvent = {};
for (const row of galleryItems.rows) {
  (byEvent[row.eventId] ??= []).push({ url: row.url, type: row.type });
}

let updated = 0;
for (const [eventId, items] of Object.entries(byEvent)) {
  const exists = await db.query(`SELECT 1 FROM "event" WHERE id = $1`, [eventId]);
  if (!exists.rows.length) continue;
  await db.query(`UPDATE "event" SET "galleryItems" = $1 WHERE id = $2`, [JSON.stringify(items), eventId]);
  updated++;
  process.stdout.write(".");
}
console.log(`\n  → ${updated} events updated from old DB`);

// ── 2. Fallback: events with galleryUrls but empty galleryItems ─────────────
console.log("\n[2/2] Filling remaining events with type=image fallback...");
const result = await db.query(`
  UPDATE "event"
  SET "galleryItems" = (
    SELECT jsonb_agg(jsonb_build_object('url', u, 'type', 'image'))
    FROM unnest("galleryUrls") AS u
  )
  WHERE array_length("galleryUrls", 1) > 0
    AND "galleryItems" = '[]'::jsonb
  RETURNING id
`);
console.log(`  → ${result.rowCount} events filled with image fallback`);

await old.end();
await db.end();
console.log("\nDone.");
