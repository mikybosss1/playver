// node scripts/migrate-roles.mjs
import { Pool } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = readFileSync(resolve(__dirname, "../.env.local"), "utf8");
const DATABASE_URL = env.match(/^DATABASE_URL=(.+)$/m)?.[1].trim();
const PROD_DATABASE_URL = env.match(/^PROD_DATABASE_URL=(.+)$/m)?.[1].trim();
if (!DATABASE_URL) { console.error("DATABASE_URL not found in .env.local"); process.exit(1); }

const SUPER_ADMIN_EMAIL = "miky.baril3@gmail.com";

async function run(label, url) {
  const pool = new Pool({ connectionString: url });
  console.log(`\n[${label}] Running roles migration...`);

  await pool.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "role" text NOT NULL DEFAULT 'player'`);
  console.log(`[${label}] ✓ user.role column`);

  const result = await pool.query(
    `UPDATE "user" SET role = 'super_admin' WHERE email = $1 RETURNING id, name, email`,
    [SUPER_ADMIN_EMAIL]
  );
  if (result.rowCount > 0) {
    const u = result.rows[0];
    console.log(`[${label}] ✓ Super admin set: ${u.name} (${u.email})`);
  } else {
    console.log(`[${label}] ℹ No user found with email ${SUPER_ADMIN_EMAIL} — role will be set on first login`);
  }

  await pool.end();
}

await run("stage", DATABASE_URL);
if (PROD_DATABASE_URL) await run("prod", PROD_DATABASE_URL);
else console.log("\n(Skipping prod — PROD_DATABASE_URL not set in .env.local)");

console.log("\nDone.");
