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
| Neon DB branch | your own dev branch | `staging` (branched/cloned from prod's data) | `main`/production |
| Stripe mode | test | test | live |
| Outgoing emails | real (Resend) | guarded — logged, not sent (`EMAIL_MODE=log`) | real (Resend) |

**Workflow**: feature branches merge into `staging` first so people can try the change at `staging.playver.ca`, then into `main` for production. There's no CI enforcing this — periodically fast-forward `staging` from `main` after each release so it doesn't drift far behind.

**Staging DB contains real cloned prod data** (a deliberate choice, not the original plan) — real user PII and payment/wallet records exist there. `EMAIL_MODE=log` stays on regardless, so testing never emails real cloned users. Cloned rows that reference *live*-mode Stripe objects (e.g. an org's `stripeConnectAccountId`) won't resolve against staging's *test*-mode `STRIPE_SECRET_KEY` — expected, not a bug; Stripe's test/live objects are separate namespaces.

**Seeding a known test login** (from your machine, against the staging Neon branch — never run these against `PROD_DATABASE_URL`):
```bash
STAGING_DATABASE_URL=<staging Neon connection string> STAGING_APP_URL=https://staging.playver.ca npm run db:seed:staging
```
Since staging is a clone of prod, you won't know any real user's password — this creates one test login (plus an org and an event) you do know the credentials for; it prints them at the end. `db:migrate:staging` (runs `scripts/migrate-*.mjs` against a target DB) is no longer needed for staging specifically since a prod clone already has current schema — it's still there for standing up a *fresh* empty database elsewhere if that's ever needed again, and is safe to run against staging too (every statement is idempotent).

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — Playver-specific architecture, conventions, and a "where do I look for X" lookup table
- [`docs/stripe-testing.md`](./docs/stripe-testing.md) — local Stripe webhook testing setup
