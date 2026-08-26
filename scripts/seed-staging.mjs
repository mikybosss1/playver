// Seeds the minimum data to click around on staging after
// run-staging-migrations.mjs has run: one login-able test user, one
// published organization (that user as OWNER), and one event.
//
// Usage:
//   STAGING_DATABASE_URL=postgresql://... STAGING_APP_URL=https://staging.playver.ca \
//     node scripts/seed-staging.mjs
//   (or: npm run db:seed:staging)
//
// The test user is created by calling the deployed staging app's own
// sign-up endpoint (not by hand-rolling a Better Auth password hash in raw
// SQL) — this guarantees a genuinely working login and doubles as a smoke
// test that DATABASE_URL / trustedOrigins are wired correctly end to end.
// It also exercises sendWelcomeEmail, a good live check that EMAIL_MODE=log
// is working (should log, not actually send).

import { Pool } from "@neondatabase/serverless";

const STAGING_DATABASE_URL = process.env.STAGING_DATABASE_URL;
const STAGING_APP_URL = process.env.STAGING_APP_URL;
if (!STAGING_DATABASE_URL || !STAGING_APP_URL) {
  console.error("STAGING_DATABASE_URL and STAGING_APP_URL are both required.");
  process.exit(1);
}

const TEST_EMAIL = "test@stage.playver.internal";
const TEST_PASSWORD = "StagingTest123!";
const TEST_NAME = "Staging Test User";

console.log(`\nSigning up ${TEST_EMAIL} on ${STAGING_APP_URL}...`);
const signUpRes = await fetch(`${STAGING_APP_URL}/api/auth/sign-up/email`, {
  method: "POST",
  // Better Auth rejects sign-up requests with no Origin header (CSRF
  // protection) — must match an entry in trustedOrigins (src/lib/auth.ts).
  headers: { "Content-Type": "application/json", Origin: STAGING_APP_URL },
  body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD, name: TEST_NAME }),
});
if (!signUpRes.ok) {
  const body = await signUpRes.text();
  console.error(`Sign-up failed (${signUpRes.status}): ${body}`);
  console.error("If this is because the account already exists, that's fine — rerun with an existing DB is idempotent for the rest of this script only if you adjust the email; otherwise seed data below will fail on duplicate rows.");
  process.exit(1);
}
console.log("✓ test user created");

const pool = new Pool({ connectionString: STAGING_DATABASE_URL });

const userRes = await pool.query(`SELECT "id" FROM "user" WHERE "email" = $1`, [TEST_EMAIL]);
const userId = userRes.rows[0]?.id;
if (!userId) {
  console.error("Could not find the just-created user row — sign-up may not have persisted.");
  process.exit(1);
}

const orgId = crypto.randomUUID();
await pool.query(
  `INSERT INTO "organization" ("id", "name", "slug", "organizationType", "sports", "publicationStatus")
   VALUES ($1, $2, $3, $4, $5, 'published')`,
  [orgId, "Staging Test Org", `staging-test-org-${orgId.slice(0, 8)}`, "CLUB", ["Basketball"]]
);
console.log(`✓ organization (${orgId})`);

await pool.query(
  `INSERT INTO "organization_membership" ("id", "organizationId", "userId", "role", "status")
   VALUES ($1, $2, $3, 'OWNER', 'active')`,
  [crypto.randomUUID(), orgId, userId]
);
console.log("✓ organization_membership (OWNER)");

const eventId = crypto.randomUUID();
const startDateTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // one week out
const endDateTime = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000); // +2h
await pool.query(
  `INSERT INTO "event" ("id", "title", "sport", "eventType", "location", "startDateTime", "endDateTime", "organizerId", "organizationId", "capacity")
   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
  [eventId, "Staging Test Pickup Game", "Basketball", "Pickup Game", "Test Gym, Staging City", startDateTime, endDateTime, userId, orgId, 10]
);
console.log(`✓ event (${eventId})`);

await pool.end();

console.log(`\nSeed complete. Log in at ${STAGING_APP_URL}/auth/signin with:`);
console.log(`  email:    ${TEST_EMAIL}`);
console.log(`  password: ${TEST_PASSWORD}`);
