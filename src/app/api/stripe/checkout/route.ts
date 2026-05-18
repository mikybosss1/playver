import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { pool } from "@/lib/db";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId } = await request.json();
  if (!eventId) return NextResponse.json({ error: "Missing eventId" }, { status: 400 });

  const result = await pool.query(
    `SELECT id, title, price FROM "event" WHERE id = $1`,
    [eventId]
  );
  const event = result.rows[0];
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  if (!event.price) return NextResponse.json({ error: "Event is free" }, { status: 400 });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3001";

  const checkoutSession = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "cad",
          product_data: { name: event.title },
          unit_amount: event.price,
        },
        quantity: 1,
      },
    ],
    metadata: { eventId, userId: session.user.id },
    success_url: `${baseUrl}/events/${eventId}?payment=success`,
    cancel_url: `${baseUrl}/events/${eventId}`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
