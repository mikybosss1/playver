// Shared Stripe SDK client, used by both wallet.ts's/organizer-wallet.ts's
// Connect payouts and the checkout/webhook routes under src/app/api/stripe/.
// STRIPE_SECRET_KEY must be a sk_test_... key outside of production — see
// docs/stripe-testing.md before touching anything payment-related.
import Stripe from "stripe";
export { formatPrice } from "./format-price";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia",
});
