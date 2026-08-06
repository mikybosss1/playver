// node scripts/migrate-event-status.mjs
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
  console.log(`\n[${label}] Running event-status migration...`);

  await pool.query(`ALTER TABLE "event" ADD COLUMN IF NOT EXISTS "status" text NOT NULL DEFAULT 'active'`);
  await pool.query(`
    DO $$ BEGIN
      ALTER TABLE "event" ADD CONSTRAINT "event_status_check" CHECK ("status" IN ('active','cancelled'));
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `);
  console.log(`[${label}] ✓ event.status`);

  await pool.query(`ALTER TABLE "event_payment" ADD COLUMN IF NOT EXISTS "refundedAt" timestamp`);
  console.log(`[${label}] ✓ event_payment.refundedAt`);

  await pool.query(`ALTER TABLE "tournament_team_payment" ADD COLUMN IF NOT EXISTS "refundedAt" timestamp`);
  console.log(`[${label}] ✓ tournament_team_payment.refundedAt`);

  await pool.query(`ALTER TABLE "wallet_transaction" DROP CONSTRAINT IF EXISTS "wallet_transaction_type_check"`);
  await pool.query(`
    ALTER TABLE "wallet_transaction" ADD CONSTRAINT "wallet_transaction_type_check"
      CHECK ("type" IN ('deposit','event_payment_sent','event_payment_received','withdrawal','refund_sent','refund_received'))
  `);
  console.log(`[${label}] ✓ wallet_transaction.type extended with refund_sent/refund_received`);

  await pool.end();
}

await run("stage", DATABASE_URL);
if (PROD_DATABASE_URL) await run("prod", PROD_DATABASE_URL);
else console.log("\n(Skipping prod — PROD_DATABASE_URL not set in .env.local)");

console.log("\nDone.");
