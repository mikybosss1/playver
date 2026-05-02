"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function createEvent(data: {
  title: string;
  sport: string;
  eventType: string;
  location: string;
  startDateTime: string;
  endDateTime: string;
  coverImageUrl?: string;
  galleryUrls?: string[];
  registrationMode: string;
  capacity?: number;
  maxPlayersPerTeam?: number;
  description?: string;
  rules?: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const id = crypto.randomUUID();
  await pool.query(
    `INSERT INTO "event" (
       id, title, sport, "eventType", location,
       "startDateTime", "endDateTime", "coverImageUrl", "galleryUrls",
       "registrationMode", capacity, "maxPlayersPerTeam",
       description, rules, "organizerId", "createdAt", "updatedAt"
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW(),NOW())`,
    [
      id, data.title, data.sport, data.eventType, data.location,
      data.startDateTime, data.endDateTime, data.coverImageUrl ?? null,
      data.galleryUrls ?? [],
      data.registrationMode, data.capacity ?? null, data.maxPlayersPerTeam ?? null,
      data.description ?? null, data.rules ?? null, session.user.id,
    ]
  );

  revalidatePath("/discover");
  revalidatePath("/dashboard/events");
  return { id };
}
