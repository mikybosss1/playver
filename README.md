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
| URL | `localhost:3000` | `stage.playver.ca` | `playver.ca` |
| Git branch | (your working branch) | `staging` | `main` |
| Neon DB branch | your own dev branch | `staging` (empty, seeded — never cloned from prod) | `main`/production |
| Stripe mode | test | test | live |
| Outgoing emails | real (Resend) | guarded — logged, not sent (`EMAIL_MODE=log`) | real (Resend) |

**Workflow**: feature branches merge into `staging` first so people can try the change at `stage.playver.ca`, then into `main` for production. There's no CI enforcing this — periodically fast-forward `staging` from `main` after each release so it doesn't drift far behind.

**Running staging migrations/seed** (from your machine, against the staging Neon branch — never run these against `PROD_DATABASE_URL`):
```bash
STAGING_DATABASE_URL=<staging Neon connection string> npm run db:migrate:staging
STAGING_DATABASE_URL=<staging Neon connection string> STAGING_APP_URL=https://stage.playver.ca npm run db:seed:staging
```
`db:migrate:staging` runs the existing `scripts/migrate-*.mjs` files (plus the tables that are normally created lazily at runtime) in dependency order against whatever `STAGING_DATABASE_URL` you pass — see that script's header comment for details. `db:seed:staging` then creates one test login, one organization, and one event to click around with; it prints the test login credentials at the end.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — Playver-specific architecture, conventions, and a "where do I look for X" lookup table
- [`docs/stripe-testing.md`](./docs/stripe-testing.md) — local Stripe webhook testing setup
