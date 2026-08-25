// Single source of truth for "which environment is this running in" —
// used to control search-engine indexing (robots.txt, metadata robots
// tag). Deliberately keyed off an explicit APP_ENV var set manually per
// Vercel environment, NOT inferred from VERCEL_ENV: Vercel sets
// VERCEL_ENV="preview" for both real PR previews AND any branch-domain
// deployment that isn't the configured Production branch (e.g. staging),
// so VERCEL_ENV alone can't tell staging apart from a random preview —
// and depending on how "Production" is configured, it's not a safe signal
// to trust for "is this the real public site" either. Anything without an
// explicit APP_ENV=production (a real PR preview, staging, or local dev)
// safely defaults to non-indexable.
export type AppEnv = "production" | "staging" | "preview";

export function getAppEnv(): AppEnv {
  if (process.env.APP_ENV === "production") return "production";
  if (process.env.APP_ENV === "staging") return "staging";
  return "preview";
}

export function isIndexable(): boolean {
  return getAppEnv() === "production";
}
