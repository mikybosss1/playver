import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

const MIN_TOPUP_CENTS = 100; // $1
const MAX_TOPUP_CENTS = 500000; // $5,000

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { amountCents } = await request.json();
  if (
    typeof amountCents !== "number" ||
    !Number.isInteger(amountCents) ||
    amountCents < MIN_TOPUP_CENTS ||
    amountCents > MAX_TOPUP_CENTS
  ) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  const checkoutSession = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "cad",
          product_data: { name: "Playver Wallet Top-up" },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    metadata: { type: "wallet_topup", userId: session.user.id },
    success_url: `${baseUrl}/dashboard/wallet?deposit=success`,
    cancel_url: `${baseUrl}/dashboard/wallet`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
