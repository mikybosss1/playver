# Testing Stripe payments locally

## One-time setup

1. In `.env.local`, `STRIPE_SECRET_KEY` must be a **test** key (`sk_test_...`), never `sk_live_...`. Get it from the [Stripe Dashboard](https://dashboard.stripe.com) with the "Test mode" toggle on (top right), under Developers → API keys.
2. Authenticate the Stripe CLI once: `stripe login`
3. Every time you test, run this in a terminal and leave it running — it forwards Stripe's test-mode webhook events to your local server:
   ```
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   It prints `Your webhook signing secret is whsec_...` — put that value in `.env.local` as `STRIPE_WEBHOOK_SECRET`, then restart the dev server.

You'll know you're in test mode (not live) if the Stripe Checkout page shows a **"Sandbox"** badge next to the merchant name, and the URL contains `checkout.stripe.com/c/pay/cs_test_...` (not `cs_live_...`).

## Test card numbers

Use any future expiry date (e.g. `12/34`), any 3-digit CVC (4 digits for Amex), and any postal code — Stripe ignores them in test mode.

| Card number | Behavior |
|---|---|
| `4242 4242 4242 4242` | Succeeds — standard Visa test card, use this for the happy path |
| `4000 0000 0000 0002` | Card declined (generic decline) |
| `4000 0000 0000 9995` | Card declined — insufficient funds |
| `4000 0027 6000 3184` | Requires 3D Secure authentication (test the auth modal) |
| `4000 0000 0000 0069` | Expired card decline |
| `4000 0000 0000 0127` | Incorrect CVC decline |

Full reference (more cards, international, wallets): https://docs.stripe.com/testing

## Sanity checks after a test payment

- `stripe listen` terminal should show `checkout.session.completed --> ... <-- [200]`.
- `event_payment` table: new row, `method = 'stripe_direct'`, `status = 'completed'`.
- `event_participant` table: new row for the payer.
- Organizer's `user.walletBalance` increased by the full event price.
- `wallet_transaction` table: `event_payment_received` row for the organizer (and `event_payment_sent` for the payer if wallet credit was applied).
