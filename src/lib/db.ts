import { Pool, type PoolClient } from "@neondatabase/serverless";

const g = globalThis as typeof globalThis & { _pool?: Pool };
if (!g._pool) g._pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
export const pool = g._pool;

// Statements inside `fn` must run on the passed `client`, never on the ambient
// `pool` export — mixing the two breaks atomicity since pool.query() calls can
// each land on a different pooled connection.
export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}
