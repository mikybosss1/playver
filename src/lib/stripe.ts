// Shared Stripe SDK client, used by both wallet.ts's/organizer-wallet.ts's
// Connect payouts and the checkout/webhook routes under src/app/api/stripe/.
// STRIPE_SECRET_KEY must be a sk_test_... key outside of production — see
// docs/stripe-testing.md before touching anything payment-related.
import Stripe from "stripe";
export { formatPrice } from "./format-price";

// Falls back to an obviously-fake key rather than a non-null assertion:
// this module is imported by routes that get pulled into every Vercel
// build's page-data-collection step, so throwing here at import time
// would fail the ENTIRE build on any deployment that doesn't have
// STRIPE_SECRET_KEY set — not just the routes that actually use Stripe.
// A misconfigured deployment now builds fine and only fails at the point
// something actually calls the Stripe API (a clear, real Stripe error),
// instead of blocking every other route in the app too.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_not_configured", {
  apiVersion: "2026-04-22.dahlia",
});
