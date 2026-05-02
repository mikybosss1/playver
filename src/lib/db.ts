import { Pool } from "@neondatabase/serverless";

const g = globalThis as typeof globalThis & { _pool?: Pool };
if (!g._pool) g._pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const pool = g._pool;
