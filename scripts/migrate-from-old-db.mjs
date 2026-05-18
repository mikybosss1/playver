// node scripts/migrate-from-old-db.mjs [--prod]
//
// Migrates users, accounts, teams, team members, events, gallery, and
// portfolio items from the old Prisma-based DB into the new schema.
// Safe to re-run — every insert uses ON CONFLICT DO NOTHING.
//
// --prod  Target PROD_DATABASE_URL instead of DATABASE_URL

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

if (!OLD_URL) { console.error("OLD_DATABASE_URL not found in .env.local"); process.exit(1); }
if (!NEW_URL) {
  console.error(isProd ? "PROD_DATABASE_URL not found in .env.local" : "DATABASE_URL not found in .env.local");
  process.exit(1);
}

console.log(`\nTarget: ${isProd ? "PRODUCTION (PROD_DATABASE_URL)" : "development (DATABASE_URL)"}`);

const old = new Pool({ connectionString: OLD_URL });
const db  = new Pool({ connectionString: NEW_URL });

let inserted = 0;
let skipped  = 0;

async function upsert(label, query, params) {
  const result = await db.query(query, params);
  if (result.rowCount > 0) { inserted++; process.stdout.write("."); }
  else { skipped++; process.stdout.write("s"); }
}

// ── 1. Users ────────────────────────────────────────────────────────────────
console.log("\n[1/7] Migrating users...");
const users = await old.query(`SELECT * FROM "user"`);

for (const u of users.rows) {
  await upsert("user",
    `INSERT INTO "user"
       (id, name, email, "emailVerified", image, bio, "mainSport", role, "createdAt", "updatedAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7,'player',$8,$9)
     ON CONFLICT DO NOTHING`,
    [
      u.id,
      u.name ?? "",
      u.email,
      u.emailVerified ?? false,
      u.image ?? null,
      u.bio ?? null,
      u.primarySport ?? null,
      new Date(u.createdAt),
      new Date(u.updatedAt),
    ]
  );
}
console.log(`\n  → ${users.rows.length} users processed`);

// ── 2. Accounts (OAuth + password credentials) ───────────────────────────────
console.log("\n[2/7] Migrating accounts...");
const accounts = await old.query(`SELECT * FROM "account"`);

for (const a of accounts.rows) {
  // skip if the linked user wasn't migrated
  const userExists = await db.query(`SELECT 1 FROM "user" WHERE id = $1`, [a.userId]);
  if (!userExists.rows.length) { skipped++; process.stdout.write("s"); continue; }

  await upsert("account",
    `INSERT INTO "account"
       (id, "accountId", "providerId", "userId", "accessToken", "refreshToken",
        "idToken", "accessTokenExpiresAt", "refreshTokenExpiresAt", scope, password, "createdAt", "updatedAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     ON CONFLICT DO NOTHING`,
    [
      a.id, a.accountId, a.providerId, a.userId,
      a.accessToken ?? null, a.refreshToken ?? null, a.idToken ?? null,
      a.accessTokenExpiresAt ? new Date(a.accessTokenExpiresAt) : null,
      a.refreshTokenExpiresAt ? new Date(a.refreshTokenExpiresAt) : null,
      a.scope ?? null, a.password ?? null,
      new Date(a.createdAt), new Date(a.updatedAt),
    ]
  );
}
console.log(`\n  → ${accounts.rows.length} accounts processed`);

// ── 3. Teams ────────────────────────────────────────────────────────────────
console.log("\n[3/7] Migrating teams...");
const teams = await old.query(`SELECT * FROM "Team"`);

for (const t of teams.rows) {
  const captainExists = await db.query(`SELECT 1 FROM "user" WHERE id = $1`, [t.captainId]);
  if (!captainExists.rows.length) { skipped++; process.stdout.write("s"); continue; }

  await upsert("team",
    `INSERT INTO "team"
       (id, name, sport, location, bio, "captainPhone", "logoUrl", "captainId", "createdAt", "updatedAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     ON CONFLICT DO NOTHING`,
    [
      t.id, t.name, t.sport, t.location,
      t.bio ?? null, t.captainPhone ?? null,
      t.logo ?? null,       // old: logo → new: logoUrl
      t.captainId,
      new Date(t.createdAt), new Date(t.updatedAt),
    ]
  );
}
console.log(`\n  → ${teams.rows.length} teams processed`);

// ── 4. Team members ─────────────────────────────────────────────────────────
console.log("\n[4/7] Migrating team members...");
const members = await old.query(`SELECT * FROM "TeamMember"`);

for (const m of members.rows) {
  const [teamOk, userOk] = await Promise.all([
    db.query(`SELECT 1 FROM "team" WHERE id = $1`, [m.teamId]),
    db.query(`SELECT 1 FROM "user" WHERE id = $1`, [m.userId]),
  ]);
  if (!teamOk.rows.length || !userOk.rows.length) { skipped++; process.stdout.write("s"); continue; }

  await upsert("team_member",
    `INSERT INTO "team_member" (id, "teamId", "userId", "joinedAt")
     VALUES ($1,$2,$3,$4)
     ON CONFLICT DO NOTHING`,
    [m.id, m.teamId, m.userId, new Date(m.joinedAt)]
  );
}
console.log(`\n  → ${members.rows.length} team members processed`);

// ── 5. Events ───────────────────────────────────────────────────────────────
console.log("\n[5/7] Migrating events...");
const events = await old.query(`SELECT * FROM "Event"`);

for (const e of events.rows) {
  const organizerExists = await db.query(`SELECT 1 FROM "user" WHERE id = $1`, [e.organizerId]);
  if (!organizerExists.rows.length) { skipped++; process.stdout.write("s"); continue; }

  const registrationMode = e.isTeamBased ? "team" : "individual";
  const priceCents = Math.round(Number(e.price ?? 0) * 100);

  await upsert("event",
    `INSERT INTO "event"
       (id, title, sport, "eventType", location,
        "startDateTime", "endDateTime", "coverImageUrl", "galleryUrls",
        "registrationMode", capacity, "maxPlayersPerTeam",
        description, rules, "organizerId", "customFormEnabled", price, "createdAt", "updatedAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
     ON CONFLICT DO NOTHING`,
    [
      e.id, e.title, e.sport, e.eventType, e.location,
      new Date(e.startDate),   // startDate → startDateTime
      new Date(e.endDate),     // endDate   → endDateTime
      e.backgroundImage ?? null,
      [],                      // galleryUrls populated in step 6
      registrationMode,
      e.maxParticipants ?? null,
      e.maxPlayersPerTeam ?? null,
      e.description ?? null,
      e.rules ?? null,
      e.organizerId,
      false,
      priceCents,
      new Date(e.createdAt),
      new Date(e.updatedAt),
    ]
  );
}
console.log(`\n  → ${events.rows.length} events processed`);

// ── 6. Event gallery ────────────────────────────────────────────────────────
console.log("\n[6/7] Migrating event gallery images...");
const galleryItems = await old.query(`SELECT * FROM "event_gallery_item" ORDER BY "eventId", "createdAt"`);

// Group URLs by eventId
const galleryByEvent = {};
for (const item of galleryItems.rows) {
  if (!galleryByEvent[item.eventId]) galleryByEvent[item.eventId] = [];
  galleryByEvent[item.eventId].push(item.url);
}

let galleryCount = 0;
for (const [eventId, urls] of Object.entries(galleryByEvent)) {
  const eventExists = await db.query(`SELECT 1 FROM "event" WHERE id = $1`, [eventId]);
  if (!eventExists.rows.length) continue;

  await db.query(
    `UPDATE "event" SET "galleryUrls" = $1 WHERE id = $2`,
    [urls, eventId]
  );
  galleryCount += urls.length;
  process.stdout.write(".");
}
console.log(`\n  → ${galleryCount} gallery images applied to ${Object.keys(galleryByEvent).length} events`);

// ── 7. Portfolio items → user_media ─────────────────────────────────────────
console.log("\n[7/7] Migrating portfolio items → user_media...");

// Ensure user_media table exists
await db.query(`
  CREATE TABLE IF NOT EXISTS "user_media" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'image',
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
  )
`);

const portfolio = await old.query(`SELECT * FROM "portfolio_item"`);
for (const p of portfolio.rows) {
  const userExists = await db.query(`SELECT 1 FROM "user" WHERE id = $1`, [p.userId]);
  if (!userExists.rows.length) { skipped++; process.stdout.write("s"); continue; }

  await upsert("user_media",
    `INSERT INTO "user_media" (id, "userId", url, type, "createdAt")
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT DO NOTHING`,
    [p.id, p.userId, p.url, p.type ?? "image", new Date(p.createdAt)]
  );
}
console.log(`\n  → ${portfolio.rows.length} portfolio items processed`);

// ── Re-apply super admin role ────────────────────────────────────────────────
console.log("\n[+] Re-applying super_admin role to miky.baril3@gmail.com...");
const adminResult = await db.query(
  `UPDATE "user" SET role = 'super_admin' WHERE email = 'miky.baril3@gmail.com' RETURNING email`
);
if (adminResult.rowCount > 0) console.log("  → Super admin role confirmed");
else console.log("  → Super admin user not found (will be set on next run after login)");

// ── Summary ─────────────────────────────────────────────────────────────────
await old.end();
await db.end();

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Migration complete
  Inserted : ${inserted}
  Skipped  : ${skipped} (already existed or missing FK)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
