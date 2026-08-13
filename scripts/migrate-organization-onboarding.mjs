// node scripts/migrate-organization-onboarding.mjs
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
  console.log(`\n[${label}] Running organization onboarding migration...`);

  await pool.query(`ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "city" text`);
  await pool.query(`ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "province" text`);
  await pool.query(`ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "country" text`);
  await pool.query(`ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "affiliations" text[] NOT NULL DEFAULT '{}'`);
  await pool.query(`ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "refundPolicyUrl" text`);
  await pool.query(`ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "refundPolicyText" text`);
  await pool.query(`ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "privacyPolicyUrl" text`);
  await pool.query(`ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "privacyPolicyText" text`);
  await pool.query(`ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "codeOfConductUrl" text`);
  await pool.query(`ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "codeOfConductText" text`);
  await pool.query(`ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "wizardStep" integer NOT NULL DEFAULT 1`);
  console.log(`[${label}] ✓ organization onboarding columns`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "organization_location" (
      "id"              text PRIMARY KEY,
      "organizationId"  text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
      "name"            text,
      "streetAddress"   text,
      "city"            text,
      "province"        text,
      "postalCode"      text,
      "country"         text,
      "createdAt"       timestamp NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS "organization_location_org_idx"
      ON "organization_location" ("organizationId")
  `);
  console.log(`[${label}] ✓ organization_location`);

  await pool.end();
}

await run("stage", DATABASE_URL);
if (PROD_DATABASE_URL) await run("prod", PROD_DATABASE_URL);
else console.log("\n(Skipping prod — PROD_DATABASE_URL not set in .env.local)");

console.log("\nDone.");
