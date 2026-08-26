# Playver

A sports events/tournaments platform (Next.js App Router, Neon Postgres, Better Auth, Stripe Connect). See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full tech stack, directory layout, and conventions.

## Getting Started

1. `cp .env.example .env.local` and fill in real values (ask a teammate for dev credentials, or provision your own Neon/Stripe test/Resend/UploadThing/Google OAuth accounts).
2. `npm install`
3. Run the schema migrations against your local `DATABASE_URL` — see each file's header comment in `scripts/migrate-*.mjs` for the exact command, run in the order listed there.
4. `npm run dev` and open [http://localhost:3000](http://localhost:3000).

## Environments

| | Local | Staging | Production |
|---|---|---|---|
| URL | `localhost:3000` | `staging.playver.ca` | `playver.ca` |
| Git branch | (your working branch) | `staging` | `main` |
| Neon DB branch | your own dev branch | `staging` (empty, seeded — not a clone of prod) | `main`/production |
| Stripe mode | test | test | live |
| Outgoing emails | real (Resend) | guarded — logged, not sent (`EMAIL_MODE=log`) | real (Resend) |

**Workflow**: feature branches merge into `staging` first so people can try the change at `staging.playver.ca`, then into `main` for production. There's no CI enforcing this — periodically fast-forward `staging` from `main` after each release so it doesn't drift far behind.

**Staging DB is deliberately empty, not a clone of prod** — no real user PII or payment/wallet records live there, so testing can't leak real data or accidentally act on it. If the staging Neon branch is ever re-created from prod (branching there always copies data — see the branch's own history for the exact procedure), wipe it immediately with `DROP SCHEMA public CASCADE; CREATE SCHEMA public;` before doing anything else.

**Rebuilding schema + seeding a known test login** (from your machine, against the staging Neon branch — never run these against `PROD_DATABASE_URL`):
```bash
STAGING_DATABASE_URL=<staging Neon connection string> npm run db:migrate:staging
STAGING_DATABASE_URL=<staging Neon connection string> STAGING_APP_URL=https://staging.playver.ca npm run db:seed:staging
```
`db:migrate:staging` runs the existing `scripts/migrate-*.mjs` files (plus the tables normally created lazily at runtime) against a genuinely empty DB — see that script's header comment for details. `db:seed:staging` then creates one test login, one organization, and one event to click around with; it prints the test login credentials at the end.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — Playver-specific architecture, conventions, and a "where do I look for X" lookup table
- [`docs/stripe-testing.md`](./docs/stripe-testing.md) — local Stripe webhook testing setup
