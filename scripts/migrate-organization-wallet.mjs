// node scripts/migrate-organization-wallet.mjs
//
// Adds an organization-level wallet + Stripe Connect account, so money from
// events owned by an organization can be credited to the org itself instead
// of the individual creator's personal wallet. wallet_transaction and
// wallet_withdrawal both gain a nullable organizationId column alongside the
// existing (now nullable) userId, with a check constraint enforcing exactly
// one of the two is set per row — an org row and a personal row never mix.
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
  console.log(`\n[${label}] Running organization wallet migration...`);

  await pool.query(`ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "walletBalance" bigint NOT NULL DEFAULT 0`);
  await pool.query(`ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "stripeConnectAccountId" text`);
  await pool.query(`ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "stripeConnectOnboarded" boolean NOT NULL DEFAULT false`);
  console.log(`[${label}] ✓ organization wallet/connect columns`);

  await pool.query(`ALTER TABLE "wallet_transaction" ADD COLUMN IF NOT EXISTS "organizationId" text REFERENCES "organization"("id") ON DELETE SET NULL`);
  await pool.query(`ALTER TABLE "wallet_transaction" ALTER COLUMN "userId" DROP NOT NULL`);
  await pool.query(`
    DO $$ BEGIN
      ALTER TABLE "wallet_transaction" ADD CONSTRAINT "wallet_transaction_owner_xor_check"
        CHECK ((("userId" IS NOT NULL)::int + ("organizationId" IS NOT NULL)::int) = 1);
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS "wallet_transaction_organizationId_idx" ON "wallet_transaction"("organizationId")`);
  console.log(`[${label}] ✓ wallet_transaction.organizationId + owner XOR check`);

  await pool.query(`ALTER TABLE "wallet_withdrawal" ADD COLUMN IF NOT EXISTS "organizationId" text REFERENCES "organization"("id") ON DELETE SET NULL`);
  // requestedByUserId: who actually clicked withdraw — for a personal withdrawal
  // that's always the wallet owner (userId), for an org withdrawal it's whichever
  // staff member with MANAGE_PAYMENTS acted. Backfilled from userId for existing
  // rows so it can become NOT NULL (every withdrawal, past or future, has an actor).
  await pool.query(`ALTER TABLE "wallet_withdrawal" ADD COLUMN IF NOT EXISTS "requestedByUserId" text REFERENCES "user"("id")`);
  await pool.query(`UPDATE "wallet_withdrawal" SET "requestedByUserId" = "userId" WHERE "requestedByUserId" IS NULL AND "userId" IS NOT NULL`);
  await pool.query(`ALTER TABLE "wallet_withdrawal" ALTER COLUMN "requestedByUserId" SET NOT NULL`);
  await pool.query(`ALTER TABLE "wallet_withdrawal" ALTER COLUMN "userId" DROP NOT NULL`);
  await pool.query(`
    DO $$ BEGIN
      ALTER TABLE "wallet_withdrawal" ADD CONSTRAINT "wallet_withdrawal_owner_xor_check"
        CHECK ((("userId" IS NOT NULL)::int + ("organizationId" IS NOT NULL)::int) = 1);
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS "wallet_withdrawal_organizationId_idx" ON "wallet_withdrawal"("organizationId")`);
  console.log(`[${label}] ✓ wallet_withdrawal.organizationId/requestedByUserId + owner XOR check`);

  await pool.end();
}

await run("stage", DATABASE_URL);
if (PROD_DATABASE_URL) await run("prod", PROD_DATABASE_URL);
else console.log("\n(Skipping prod — PROD_DATABASE_URL not set in .env.local)");

console.log("\nDone.");
