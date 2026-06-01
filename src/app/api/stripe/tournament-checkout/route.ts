import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { pool } from "@/lib/db";
import { ensureTournamentTables } from "@/lib/tournament-tables";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureTournamentTables();
  const { teamId } = await request.json();
  if (!teamId) return NextResponse.json({ error: "Missing teamId" }, { status: 400 });

  const result = await pool.query(
    `SELECT tt.*, e.title, e.price, e.id as "tournamentId", e."endDateTime"
     FROM "tournament_team" tt
     JOIN "event" e ON e.id = tt."tournamentId"
     WHERE tt.id = $1`,
    [teamId]
  );
  const team = result.rows[0];
  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });
  if (team.captainId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!team.price) return NextResponse.json({ error: "Tournament is free" }, { status: 400 });
  if (new Date(team.endDateTime) < new Date()) return NextResponse.json({ error: "Tournament has ended" }, { status: 400 });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  const checkoutSession = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "cad",
          product_data: { name: `${team.title} — Team Registration (${team.name})` },
          unit_amount: team.price,
        },
        quantity: 1,
      },
    ],
    metadata: { teamId, captainId: session.user.id, tournamentId: team.tournamentId },
    success_url: `${baseUrl}/events/${team.tournamentId}?payment=success`,
    cancel_url: `${baseUrl}/events/${team.tournamentId}`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
