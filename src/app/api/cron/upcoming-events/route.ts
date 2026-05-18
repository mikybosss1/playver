import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { sendUpcomingEventEmail } from "@/lib/emails";

// Runs every hour (see vercel.json).
// Sends reminders to participants whose event starts in ~24 h or ~2 h.
// Each window is ±30 min around the target, so a cron running every hour
// hits each event exactly once per reminder.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const windows: { label: "24h" | "2h"; minH: string; maxH: string }[] = [
    { label: "24h", minH: "23 hours 30 minutes", maxH: "24 hours 30 minutes" },
    { label: "2h",  minH: "1 hour 30 minutes",   maxH: "2 hours 30 minutes"  },
  ];

  let totalSent = 0;

  for (const window of windows) {
    const result = await pool.query(`
      SELECT
        e.id, e.title, e.sport, e.location, e."startDateTime",
        u.name AS "userName", u.email
      FROM "event_participant" ep
      JOIN "event" e ON e.id = ep."eventId"
      JOIN "user" u  ON u.id = ep."userId"
      WHERE e."startDateTime" BETWEEN NOW() + INTERVAL '${window.minH}'
                                   AND NOW() + INTERVAL '${window.maxH}'
        AND u.email IS NOT NULL
    `);

    for (const row of result.rows) {
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
        // log and continue — one failure shouldn't block others
      }
    }
  }

  return NextResponse.json({ sent: totalSent });
}
