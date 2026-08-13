// node scripts/migrate-organizations.mjs
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
  console.log(`\n[${label}] Running organizations migration...`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "organization" (
      "id"                      text PRIMARY KEY,
      "name"                    text NOT NULL,
      "legalName"               text,
      "slug"                    text NOT NULL UNIQUE,
      "organizationType"        text,
      "shortDescription"        text,
      "mission"                 text,
      "vision"                  text,
      "history"                 text,
      "yearFounded"             integer,
      "ageGroups"               text[] NOT NULL DEFAULT '{}',
      "values"                  text[] NOT NULL DEFAULT '{}',
      "sports"                  text[] NOT NULL DEFAULT '{}',
      "primaryLanguage"         text,
      "publicEmail"             text,
      "phone"                   text,
      "website"                 text,
      "socialLinks"             jsonb NOT NULL DEFAULT '{}'::jsonb,
      "logoUrl"                 text,
      "coverImageUrl"           text,
      "slogan"                  text,
      "brandColor"              text,
      "registrationNumber"      text,
      "organizationStatus"      text,
      "insuranceProvider"       text,
      "insurancePolicyNumber"   text,
      "verificationStatus"      text NOT NULL DEFAULT 'unverified',
      "publicationStatus"       text NOT NULL DEFAULT 'draft',
      "enabledModules"          text[] NOT NULL DEFAULT '{}',
      "profileCompletion"       integer NOT NULL DEFAULT 0,
      "createdAt"               timestamp NOT NULL DEFAULT NOW(),
      "updatedAt"               timestamp NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`
    DO $$ BEGIN
      ALTER TABLE "organization" ADD CONSTRAINT "organization_publication_status_check"
        CHECK ("publicationStatus" IN ('draft','published','unpublished','suspended','archived'));
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `);
  console.log(`[${label}] ✓ organization`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "organization_membership" (
      "id"              text PRIMARY KEY,
      "organizationId"  text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
      "userId"          text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
      "role"            text NOT NULL,
      "status"          text NOT NULL DEFAULT 'active',
      "invitedBy"       text REFERENCES "user"("id") ON DELETE SET NULL,
      "invitedAt"       timestamp,
      "acceptedAt"      timestamp,
      "createdAt"       timestamp NOT NULL DEFAULT NOW(),
      "updatedAt"       timestamp NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`
    DO $$ BEGIN
      ALTER TABLE "organization_membership" ADD CONSTRAINT "organization_membership_role_check"
        CHECK ("role" IN ('OWNER','ADMINISTRATOR','OPERATIONS_MANAGER','COACH','STAFF','READ_ONLY'));
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `);
  await pool.query(`
    DO $$ BEGIN
      ALTER TABLE "organization_membership" ADD CONSTRAINT "organization_membership_status_check"
        CHECK ("status" IN ('invited','active','removed'));
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `);
  await pool.query(`
    DO $$ BEGIN
      ALTER TABLE "organization_membership"
        ADD CONSTRAINT "organization_membership_org_user_key" UNIQUE ("organizationId", "userId");
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `);
  console.log(`[${label}] ✓ organization_membership`);

  await pool.end();
}

await run("stage", DATABASE_URL);
if (PROD_DATABASE_URL) await run("prod", PROD_DATABASE_URL);
else console.log("\n(Skipping prod — PROD_DATABASE_URL not set in .env.local)");

console.log("\nDone.");
