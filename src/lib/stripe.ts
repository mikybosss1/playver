import Stripe from "stripe";
export { formatPrice } from "./format-price";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia",
});
