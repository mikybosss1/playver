// node scripts/migrate-event-payment-stripe-direct.mjs
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
  console.log(`\n[${label}] Running event-payment stripe-direct migration...`);

  // 'stripe_direct' = a player paying by card straight through Stripe Checkout
  // for one specific event, with the amount credited into the organizer's
  // wallet (same as a 'wallet' transfer) rather than a real Stripe transfer to
  // the organizer's bank account. Kept distinct from the older 'stripe' value,
  // which predates the wallet system entirely: those legacy rows really were
  // paid out to the organizer via Stripe directly, so they still require a
  // real stripe.refunds.create and stay flagged for manual review in
  // runEventRefundSweep. 'stripe_direct' rows behave like 'wallet' rows for
  // refund purposes (auto wallet-reversal) since the money already lives in
  // the organizer's wallet balance.
  await pool.query(`ALTER TABLE "event_payment" DROP CONSTRAINT IF EXISTS "event_payment_method_check"`);
  await pool.query(`
    ALTER TABLE "event_payment" ADD CONSTRAINT "event_payment_method_check"
      CHECK ("method" IN ('stripe','wallet','stripe_direct'))
  `);
  console.log(`[${label}] ✓ event_payment.method allows 'stripe_direct'`);

  await pool.end();
}

await run("stage", DATABASE_URL);
if (PROD_DATABASE_URL) await run("prod", PROD_DATABASE_URL);
else console.log("\n(Skipping prod — PROD_DATABASE_URL not set in .env.local)");

console.log("\nDone.");
