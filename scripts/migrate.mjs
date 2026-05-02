// Run once to create Better Auth tables in NeonDB:
//   node scripts/migrate.mjs
import { Pool } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load DATABASE_URL from .env.local
const envPath = resolve(__dirname, "../.env.local");
const env = readFileSync(envPath, "utf8");
const match = env.match(/^DATABASE_URL=(.+)$/m);
if (!match) {
  console.error("DATABASE_URL not found in .env.local");
  process.exit(1);
}
const DATABASE_URL = match[1].trim();

const pool = new Pool({ connectionString: DATABASE_URL });

const tables = [
  `CREATE TABLE IF NOT EXISTS "user" (
    "id"            text PRIMARY KEY,
    "name"          text NOT NULL,
    "email"         text NOT NULL UNIQUE,
    "emailVerified" boolean NOT NULL DEFAULT false,
    "image"         text,
    "createdAt"     timestamp NOT NULL,
    "updatedAt"     timestamp NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS "session" (
    "id"          text PRIMARY KEY,
    "expiresAt"   timestamp NOT NULL,
    "token"       text NOT NULL UNIQUE,
    "createdAt"   timestamp NOT NULL,
    "updatedAt"   timestamp NOT NULL,
    "ipAddress"   text,
    "userAgent"   text,
    "userId"      text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS "account" (
    "id"                     text PRIMARY KEY,
    "accountId"              text NOT NULL,
    "providerId"             text NOT NULL,
    "userId"                 text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "accessToken"            text,
    "refreshToken"           text,
    "idToken"                text,
    "accessTokenExpiresAt"   timestamp,
    "refreshTokenExpiresAt"  timestamp,
    "scope"                  text,
    "password"               text,
    "createdAt"              timestamp NOT NULL,
    "updatedAt"              timestamp NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS "verification" (
    "id"         text PRIMARY KEY,
    "identifier" text NOT NULL,
    "value"      text NOT NULL,
    "expiresAt"  timestamp NOT NULL,
    "createdAt"  timestamp,
    "updatedAt"  timestamp
  )`,
];

console.log("Connecting to NeonDB...");
for (const statement of tables) {
  const tableName = statement.match(/"(\w+)"/)?.[1];
  await pool.query(statement);
  console.log(`✓ ${tableName}`);
}
await pool.end();
console.log("\nDone. All Better Auth tables are ready.");
