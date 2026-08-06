import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { sendUpcomingEventEmail } from "@/lib/emails";

// Runs daily at 8 AM UTC (see vercel.json).
// Sends reminders at 3 intervals: 7 days out, 2 days out, and morning of.
// Windows are ±4 h around each target so a once-daily cron catches every event exactly once.
// Both regular participants (event_participant) and tournament team members are covered.

type ReminderLabel = "7d" | "2d" | "morning";

const WINDOWS: { label: ReminderLabel; minH: string; maxH: string }[] = [
  { label: "7d",      minH: "164 hours", maxH: "172 hours" },
  { label: "2d",      minH: "44 hours",  maxH: "52 hours"  },
  { label: "morning", minH: "0 hours",   maxH: "16 hours"  },
];

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let totalSent = 0;

  for (const window of WINDOWS) {
    const between = `e."startDateTime" BETWEEN NOW() + INTERVAL '${window.minH}' AND NOW() + INTERVAL '${window.maxH}'`;

    // Regular event participants
    const regular = await pool.query(`
      SELECT e.id, e.title, e.sport, e.location, e."startDateTime",
             u.name AS "userName", u.email
      FROM "event_participant" ep
      JOIN "event" e ON e.id = ep."eventId"
      JOIN "user" u  ON u.id = ep."userId"
      WHERE ${between} AND u.email IS NOT NULL AND e.status = 'active'
    `);

    // Tournament team members — union captains + tournament_team_member rows,
    // since a captain is not automatically inserted into tournament_team_member.
    const tournament = await pool.query(`
      SELECT e.id, e.title, e.sport, e.location, e."startDateTime",
             u.name AS "userName", u.email
      FROM (
        SELECT id AS "teamId", "captainId" AS "userId" FROM "tournament_team"
        UNION
        SELECT "teamId", "userId" FROM "tournament_team_member"
      ) participants
      JOIN "tournament_team" tt ON tt.id = participants."teamId"
      JOIN "event" e ON e.id = tt."tournamentId"
      JOIN "user" u ON u.id = participants."userId"
      WHERE ${between} AND u.email IS NOT NULL AND e.status = 'active'
    `);

    // Deduplicate by email+eventId so nobody gets two emails for the same reminder
    const seen = new Set<string>();
    const rows = [...regular.rows, ...tournament.rows].filter((row) => {
      const key = `${row.email}:${row.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    for (const row of rows) {
      const hoursUntil = (new Date(row.startDateTime).getTime() - Date.now()) / 36e5;
      try {
        await sendUpcomingEventEmail(row.email, {
          userName: row.userName ?? "Athlete",
          eventTitle: row.title,
          sport: row.sport,
          location: row.location,
          startDateTime: new Date(row.startDateTime).toISOString(),
          eventId: row.id,
          hoursUntil,
          reminderLabel: window.label,
        });
        totalSent++;
      } catch {
        // continue — one failure shouldn't block others
      }
    }
  }

  return NextResponse.json({ sent: totalSent });
}
