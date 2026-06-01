import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { pool } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { sendPaymentReceiptEmail, sendNewParticipantEmail, sendEventFullEmail } from "@/lib/emails";
import { activateTournamentTeam } from "@/app/actions/tournament";

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
    const { eventId, userId, teamId, tournamentId } = session.metadata ?? {};

    // Tournament team payment
    if (teamId && tournamentId) {
      await activateTournamentTeam(teamId);
      revalidatePath(`/events/${tournamentId}`);
      return NextResponse.json({ received: true });
    }

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

    // Fire email notifications without blocking the webhook response
    Promise.all([
      pool.query(`SELECT title, sport, location, "startDateTime", "organizerId", capacity FROM "event" WHERE id = $1`, [eventId]),
      pool.query(`SELECT name, email FROM "user" WHERE id = $1`, [userId]),
    ]).then(async ([eventRow, userRow]) => {
      const e = eventRow.rows[0];
      const u = userRow.rows[0];
      if (!e || !u?.email) return;

      const emailData = {
        eventTitle: e.title,
        sport: e.sport,
        location: e.location,
        startDateTime: new Date(e.startDateTime).toISOString(),
        eventId,
      };

      sendPaymentReceiptEmail(u.email, {
        userName: u.name ?? "Athlete",
        amountCents: session.amount_total ?? 0,
        currency: session.currency ?? "cad",
        ...emailData,
      }).catch(() => {});

      const organizerRow = await pool.query(`SELECT name, email FROM "user" WHERE id = $1`, [e.organizerId]);
      const org = organizerRow.rows[0];
      if (!org?.email) return;

      let participantCount = 1;
      let isFull = false;
      if (e.capacity) {
        const countRes = await pool.query(`SELECT COUNT(*) FROM "event_participant" WHERE "eventId" = $1`, [eventId]);
        participantCount = Number(countRes.rows[0].count);
        isFull = participantCount >= Number(e.capacity);
      }

      sendNewParticipantEmail(org.email, {
        organizerName: org.name ?? "Organizer",
        participantName: u.name ?? "Athlete",
        participantCount,
        capacity: e.capacity ? Number(e.capacity) : null,
        ...emailData,
      }).catch(() => {});

      if (isFull) {
        sendEventFullEmail(org.email, {
          organizerName: org.name ?? "Organizer",
          eventTitle: e.title,
          eventId,
          capacity: Number(e.capacity),
        }).catch(() => {});
      }
    }).catch(() => {});

    revalidatePath(`/events/${eventId}`);
    revalidatePath("/events");
    revalidatePath("/dashboard");
  }

  return NextResponse.json({ received: true });
}
