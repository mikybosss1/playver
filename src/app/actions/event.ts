"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";

let eventParticipantsTablePromise: Promise<void> | null = null;

async function ensureEventParticipantsTable() {
  eventParticipantsTablePromise ??= pool.query(
    `CREATE TABLE IF NOT EXISTS "event_participant" (
      "id"        text PRIMARY KEY,
      "eventId"   text NOT NULL REFERENCES "event"("id") ON DELETE CASCADE,
      "userId"    text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
      "joinedAt"  timestamp NOT NULL DEFAULT NOW(),
      UNIQUE("eventId", "userId")
    )`
  ).then(() => undefined);
  await eventParticipantsTablePromise;
}

let formTablesReady: Promise<void> | null = null;

async function ensureFormTables() {
  formTablesReady ??= (async () => {
    await pool.query(`ALTER TABLE "event" ADD COLUMN IF NOT EXISTS "customFormEnabled" boolean NOT NULL DEFAULT false`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "event_form_field" (
        "id"        text PRIMARY KEY,
        "eventId"   text NOT NULL REFERENCES "event"("id") ON DELETE CASCADE,
        "label"     text NOT NULL,
        "fieldType" text NOT NULL,
        "required"  boolean NOT NULL DEFAULT false,
        "options"   text[] NOT NULL DEFAULT '{}',
        "order"     integer NOT NULL DEFAULT 0,
        "createdAt" timestamp NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "event_form_response" (
        "id"        text PRIMARY KEY,
        "eventId"   text NOT NULL REFERENCES "event"("id") ON DELETE CASCADE,
        "userId"    text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "fieldId"   text NOT NULL REFERENCES "event_form_field"("id") ON DELETE CASCADE,
        "value"     text,
        "createdAt" timestamp NOT NULL DEFAULT NOW()
      )
    `);
  })();
  await formTablesReady;
}

export type FormFieldType = 'text' | 'number' | 'dropdown' | 'checkbox' | 'file';

export type FormField = {
  id: string;
  eventId: string;
  label: string;
  fieldType: FormFieldType;
  required: boolean;
  options: string[];
  order: number;
};

export type FormResponseInput = {
  fieldId: string;
  value: string;
};

type EventRow = {
  id: string;
  title: string;
  sport: string;
  eventType: string;
  location: string;
  startDateTime: Date | string;
  endDateTime: Date | string;
  coverImageUrl: string | null;
  galleryUrls: string[] | null;
  registrationMode: string;
  capacity: number | null;
  maxPlayersPerTeam: number | null;
  description: string | null;
  rules: string | null;
  organizerId: string;
  organizerName: string;
  customFormEnabled: boolean;
  price: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  participantCount: string | number;
};

function serializeEvent(row: EventRow) {
  return {
    ...row,
    startDateTime: new Date(row.startDateTime).toISOString(),
    endDateTime: new Date(row.endDateTime).toISOString(),
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
    galleryUrls: row.galleryUrls ?? [],
    participantCount: Number(row.participantCount ?? 0),
    customFormEnabled: row.customFormEnabled ?? false,
    price: Number(row.price ?? 0),
  };
}

export type EventItem = ReturnType<typeof serializeEvent>;
export type EventParticipant = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  joinedAt: string;
};

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
  customFormEnabled?: boolean;
  price?: number;
  formFields?: Array<{
    label: string;
    fieldType: string;
    required: boolean;
    options: string[];
    order: number;
  }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  await ensureFormTables();

  const id = crypto.randomUUID();
  await pool.query(
    `INSERT INTO "event" (
       id, title, sport, "eventType", location,
       "startDateTime", "endDateTime", "coverImageUrl", "galleryUrls",
       "registrationMode", capacity, "maxPlayersPerTeam",
       description, rules, "organizerId", "customFormEnabled", price, "createdAt", "updatedAt"
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,NOW(),NOW())`,
    [
      id, data.title, data.sport, data.eventType, data.location,
      data.startDateTime, data.endDateTime, data.coverImageUrl ?? null,
      data.galleryUrls ?? [],
      data.registrationMode, data.capacity ?? null, data.maxPlayersPerTeam ?? null,
      data.description ?? null, data.rules ?? null, session.user.id,
      data.customFormEnabled ?? false, data.price ?? 0,
    ]
  );

  if (data.customFormEnabled && data.formFields?.length) {
    for (const field of data.formFields) {
      await pool.query(
        `INSERT INTO "event_form_field" (id, "eventId", label, "fieldType", required, options, "order")
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [crypto.randomUUID(), id, field.label, field.fieldType, field.required, field.options, field.order]
      );
    }
  }

  revalidatePath("/events");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/events");
  return { id };
}

export async function getEvents() {
  await ensureEventParticipantsTable();
  const result = await pool.query(
    `SELECT e.*, u.name as "organizerName", COUNT(ep.id) as "participantCount"
     FROM "event" e
     JOIN "user" u ON e."organizerId" = u.id
     LEFT JOIN "event_participant" ep ON ep."eventId" = e.id
     GROUP BY e.id, u.name
     ORDER BY COUNT(ep.id) DESC, e."createdAt" DESC`
  );
  return result.rows.map(serializeEvent);
}

export async function getEventById(eventId: string) {
  await ensureEventParticipantsTable();
  const result = await pool.query(
    `SELECT e.*, u.name as "organizerName", COUNT(ep.id) as "participantCount"
     FROM "event" e
     JOIN "user" u ON e."organizerId" = u.id
     LEFT JOIN "event_participant" ep ON ep."eventId" = e.id
     WHERE e.id = $1
     GROUP BY e.id, u.name`,
    [eventId]
  );
  return result.rows[0] ? serializeEvent(result.rows[0]) : null;
}

export async function getMyEvents() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return [];
  await ensureEventParticipantsTable();

  const result = await pool.query(
    `SELECT e.*, u.name as "organizerName", COUNT(ep.id) as "participantCount"
     FROM "event" e
     JOIN "user" u ON e."organizerId" = u.id
     LEFT JOIN "event_participant" ep ON ep."eventId" = e.id
     WHERE e."organizerId" = $1
     GROUP BY e.id, u.name
     ORDER BY e."startDateTime" ASC`,
    [session.user.id]
  );
  return result.rows.map(serializeEvent);
}

export async function getJoinedEvents() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return [];
  await ensureEventParticipantsTable();

  const result = await pool.query(
    `SELECT e.*, u.name as "organizerName", COUNT(all_ep.id) as "participantCount"
     FROM "event" e
     JOIN "user" u ON e."organizerId" = u.id
     JOIN "event_participant" ep ON ep."eventId" = e.id
     LEFT JOIN "event_participant" all_ep ON all_ep."eventId" = e.id
     WHERE ep."userId" = $1 AND e."organizerId" <> $1
     GROUP BY e.id, u.name, ep."joinedAt"
     ORDER BY ep."joinedAt" DESC`,
    [session.user.id]
  );
  return result.rows.map(serializeEvent);
}

export async function getEventParticipationMap(eventIds: string[]): Promise<Set<string>> {
  if (eventIds.length === 0) return new Set();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new Set();
  await ensureEventParticipantsTable();

  const result = await pool.query(
    `SELECT "eventId" FROM "event_participant" WHERE "eventId" = ANY($1) AND "userId" = $2`,
    [eventIds, session.user.id]
  );
  return new Set(result.rows.map((row: { eventId: string }) => row.eventId));
}

export async function getEventParticipants(eventId: string): Promise<EventParticipant[]> {
  await ensureEventParticipantsTable();
  const result = await pool.query(
    `SELECT u.id, u.name, u.email, u.image, ep."joinedAt"
     FROM "event_participant" ep
     JOIN "user" u ON u.id = ep."userId"
     WHERE ep."eventId" = $1
     ORDER BY ep."joinedAt" ASC`,
    [eventId]
  );
  return result.rows.map((row: EventParticipant & { joinedAt: Date | string }) => ({
    ...row,
    joinedAt: new Date(row.joinedAt).toISOString(),
  }));
}

export async function getTeamEvents(teamId: string): Promise<EventItem[]> {
  await ensureEventParticipantsTable();
  const result = await pool.query(
    `SELECT e.*, u.name as "organizerName", COUNT(all_ep.id)::int as "participantCount"
     FROM "event" e
     JOIN "user" u ON e."organizerId" = u.id
     LEFT JOIN "event_participant" all_ep ON all_ep."eventId" = e.id
     WHERE e.id IN (
       SELECT ep."eventId"
       FROM "event_participant" ep
       JOIN "team_member" tm ON tm."userId" = ep."userId"
       WHERE tm."teamId" = $1
     )
     GROUP BY e.id, u.name
     ORDER BY e."startDateTime" ASC`,
    [teamId]
  );
  return result.rows.map(serializeEvent);
}

export async function joinEvent(eventId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  await ensureEventParticipantsTable();

  const event = await pool.query(
    `SELECT id, "organizerId", capacity FROM "event" WHERE id = $1`,
    [eventId]
  );
  if (event.rows.length === 0) throw new Error("Event not found");

  if (event.rows[0].capacity) {
    const participants = await pool.query(
      `SELECT COUNT(*) FROM "event_participant" WHERE "eventId" = $1`,
      [eventId]
    );
    if (Number(participants.rows[0].count) >= Number(event.rows[0].capacity)) {
      throw new Error("Event is full");
    }
  }

  await pool.query(
    `INSERT INTO "event_participant" (id, "eventId", "userId")
     VALUES ($1, $2, $3)
     ON CONFLICT ("eventId", "userId") DO NOTHING`,
    [crypto.randomUUID(), eventId, session.user.id]
  );

  revalidatePath("/events");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/events");
}

export async function leaveEvent(eventId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  await ensureEventParticipantsTable();

  await pool.query(
    `DELETE FROM "event_participant" WHERE "eventId" = $1 AND "userId" = $2`,
    [eventId, session.user.id]
  );

  revalidatePath("/events");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/events");
}

export async function getEventFormFields(eventId: string): Promise<FormField[]> {
  await ensureFormTables();
  const result = await pool.query(
    `SELECT id, "eventId", label, "fieldType", required, options, "order"
     FROM "event_form_field"
     WHERE "eventId" = $1
     ORDER BY "order" ASC`,
    [eventId]
  );
  return result.rows.map((row: {
    id: string; eventId: string; label: string;
    fieldType: string; required: boolean; options: string[]; order: number;
  }) => ({
    id: row.id,
    eventId: row.eventId,
    label: row.label,
    fieldType: row.fieldType as FormFieldType,
    required: row.required,
    options: row.options ?? [],
    order: row.order,
  }));
}

export async function joinEventWithForm(
  eventId: string,
  responses: FormResponseInput[]
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  await ensureEventParticipantsTable();
  await ensureFormTables();

  const event = await pool.query(
    `SELECT id, "organizerId", capacity FROM "event" WHERE id = $1`,
    [eventId]
  );
  if (event.rows.length === 0) throw new Error("Event not found");

  if (event.rows[0].capacity) {
    const participants = await pool.query(
      `SELECT COUNT(*) FROM "event_participant" WHERE "eventId" = $1`,
      [eventId]
    );
    if (Number(participants.rows[0].count) >= Number(event.rows[0].capacity)) {
      throw new Error("Event is full");
    }
  }

  await pool.query(
    `INSERT INTO "event_participant" (id, "eventId", "userId")
     VALUES ($1, $2, $3)
     ON CONFLICT ("eventId", "userId") DO NOTHING`,
    [crypto.randomUUID(), eventId, session.user.id]
  );

  for (const response of responses) {
    if (response.value !== undefined && response.value !== "") {
      await pool.query(
        `INSERT INTO "event_form_response" (id, "eventId", "userId", "fieldId", value)
         VALUES ($1, $2, $3, $4, $5)`,
        [crypto.randomUUID(), eventId, session.user.id, response.fieldId, response.value]
      );
    }
  }

  revalidatePath("/events");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/events");
}
