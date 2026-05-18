import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { pool } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const { eventId, userId } = session.metadata ?? {};

    if (!eventId || !userId) {
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    await pool.query(
      `INSERT INTO "event_payment" (id, "eventId", "userId", "stripeSessionId", amount, currency, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'completed')
       ON CONFLICT ("stripeSessionId") DO NOTHING`,
      [crypto.randomUUID(), eventId, userId, session.id, session.amount_total, session.currency]
    );

    await pool.query(
      `INSERT INTO "event_participant" (id, "eventId", "userId")
       VALUES ($1, $2, $3)
       ON CONFLICT ("eventId", "userId") DO NOTHING`,
      [crypto.randomUUID(), eventId, userId]
    );

    revalidatePath(`/events/${eventId}`);
    revalidatePath("/events");
    revalidatePath("/dashboard");
  }

  return NextResponse.json({ received: true });
}
