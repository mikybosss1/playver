// node scripts/migrate-organization-invitations.mjs
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
  console.log(`\n[${label}] Running organization invitations migration...`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "organization_invitation" (
      "id"              text PRIMARY KEY,
      "organizationId"  text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
      "email"           text NOT NULL,
      "role"            text NOT NULL,
      "token"           text NOT NULL UNIQUE,
      "invitedBy"       text REFERENCES "user"("id") ON DELETE SET NULL,
      "invitedAt"       timestamp NOT NULL DEFAULT NOW(),
      "expiresAt"       timestamp NOT NULL,
      "acceptedAt"      timestamp,
      "status"          text NOT NULL DEFAULT 'pending',
      "createdAt"       timestamp NOT NULL DEFAULT NOW(),
      "updatedAt"       timestamp NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`
    DO $$ BEGIN
      ALTER TABLE "organization_invitation" ADD CONSTRAINT "organization_invitation_role_check"
        CHECK ("role" IN ('OWNER','ADMINISTRATOR','OPERATIONS_MANAGER','COACH','STAFF','READ_ONLY'));
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `);
  await pool.query(`
    DO $$ BEGIN
      ALTER TABLE "organization_invitation" ADD CONSTRAINT "organization_invitation_status_check"
        CHECK ("status" IN ('pending','accepted','cancelled','expired'));
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `);
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS "organization_invitation_org_email_pending_key"
      ON "organization_invitation" ("organizationId", lower("email"))
      WHERE "status" = 'pending'
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS "organization_invitation_org_idx"
      ON "organization_invitation" ("organizationId")
  `);
  console.log(`[${label}] ✓ organization_invitation`);

  await pool.end();
}

await run("stage", DATABASE_URL);
if (PROD_DATABASE_URL) await run("prod", PROD_DATABASE_URL);
else console.log("\n(Skipping prod — PROD_DATABASE_URL not set in .env.local)");

console.log("\nDone.");
