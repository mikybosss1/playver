// node scripts/migrate-wallet.mjs
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
  console.log(`\n[${label}] Running wallet migration...`);

  await pool.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "walletBalance" bigint NOT NULL DEFAULT 0`);
  await pool.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "stripeConnectAccountId" text`);
  await pool.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "stripeConnectOnboarded" boolean NOT NULL DEFAULT false`);
  console.log(`[${label}] ✓ user wallet/connect columns`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "wallet_withdrawal" (
      "id"               text PRIMARY KEY,
      "userId"           text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
      "amount"           bigint NOT NULL,
      "platformFeeCents" bigint NOT NULL DEFAULT 0,
      "status"           text NOT NULL DEFAULT 'processing',
      "stripeTransferId" text,
      "failureReason"    text,
      "createdAt"        timestamp NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`
    DO $$ BEGIN
      ALTER TABLE "wallet_withdrawal" ADD CONSTRAINT "wallet_withdrawal_status_check" CHECK ("status" IN ('processing','completed','failed'));
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `);
  console.log(`[${label}] ✓ wallet_withdrawal`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "wallet_transaction" (
      "id"              text PRIMARY KEY,
      "userId"          text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
      "type"            text NOT NULL,
      "amount"          bigint NOT NULL,
      "balanceAfter"    bigint NOT NULL,
      "eventId"         text REFERENCES "event"("id") ON DELETE SET NULL,
      "teamId"          text REFERENCES "tournament_team"("id") ON DELETE SET NULL,
      "withdrawalId"    text REFERENCES "wallet_withdrawal"("id") ON DELETE SET NULL,
      "stripeSessionId" text,
      "createdAt"       timestamp NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`
    DO $$ BEGIN
      ALTER TABLE "wallet_transaction" ADD CONSTRAINT "wallet_transaction_type_check"
        CHECK ("type" IN ('deposit','event_payment_sent','event_payment_received','withdrawal'));
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `);
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS "wallet_transaction_stripe_session_idx"
      ON "wallet_transaction" ("stripeSessionId") WHERE "stripeSessionId" IS NOT NULL
  `);
  console.log(`[${label}] ✓ wallet_transaction`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "tournament_team_payment" (
      "id"        text PRIMARY KEY,
      "teamId"    text NOT NULL REFERENCES "tournament_team"("id") ON DELETE CASCADE UNIQUE,
      "userId"    text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
      "amount"    bigint NOT NULL,
      "createdAt" timestamp NOT NULL DEFAULT NOW()
    )
  `);
  console.log(`[${label}] ✓ tournament_team_payment`);

  await pool.query(`ALTER TABLE "event_payment" ALTER COLUMN "stripeSessionId" DROP NOT NULL`);
  await pool.query(`ALTER TABLE "event_payment" ADD COLUMN IF NOT EXISTS "method" text NOT NULL DEFAULT 'stripe'`);
  await pool.query(`
    DO $$ BEGIN
      ALTER TABLE "event_payment" ADD CONSTRAINT "event_payment_method_check" CHECK ("method" IN ('stripe','wallet'));
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `);
  console.log(`[${label}] ✓ event_payment.method / nullable stripeSessionId`);

  await pool.end();
}

await run("stage", DATABASE_URL);
if (PROD_DATABASE_URL) await run("prod", PROD_DATABASE_URL);
else console.log("\n(Skipping prod — PROD_DATABASE_URL not set in .env.local)");

console.log("\nDone.");
