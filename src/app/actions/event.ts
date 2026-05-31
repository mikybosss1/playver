"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";
import { sendEventJoinedEmail, sendNewParticipantEmail, sendEventFullEmail } from "@/lib/emails";

let eventParticipantsTablePromise: Promise<void> | null = null;

async function ensureEventParticipantsTable() {
  eventParticipantsTablePromise ??= (async () => {
    await pool.query(
      `CREATE TABLE IF NOT EXISTS "event_participant" (
        "id"        text PRIMARY KEY,
        "eventId"   text NOT NULL REFERENCES "event"("id") ON DELETE CASCADE,
        "userId"    text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "joinedAt"  timestamp NOT NULL DEFAULT NOW()
      )`
    );
    // Drop the old bad single-column constraint if it still exists (one-time migration)
    await pool.query(`
      ALTER TABLE "event_participant"
        DROP CONSTRAINT IF EXISTS "event_participant_eventId_key";
    `);
    // Add the correct composite constraint idempotently — safe across concurrent serverless instances
    await pool.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'event_participant_eventId_userId_key'
        ) THEN
          ALTER TABLE "event_participant"
            ADD CONSTRAINT "event_participant_eventId_userId_key" UNIQUE ("eventId", "userId");
        END IF;
      END $$;
    `);
  })();
  await eventParticipantsTablePromise;
}

let formTablesReady: Promise<void> | null = null;

async function ensureFormTables() {
  formTablesReady ??= (async () => {
    await pool.query(`ALTER TABLE "event" ADD COLUMN IF NOT EXISTS "customFormEnabled" boolean NOT NULL DEFAULT false`);
    await pool.query(`ALTER TABLE "event" ADD COLUMN IF NOT EXISTS "galleryItems" JSONB NOT NULL DEFAULT '[]'::jsonb`);
    await pool.query(`ALTER TABLE "event" ADD COLUMN IF NOT EXISTS "agendaItems" JSONB NOT NULL DEFAULT '[]'::jsonb`);
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

export type GalleryItem = { url: string; type: "image" | "video" };
export type AgendaItem = { title: string; date?: string; startTime: string; endTime: string; description?: string };

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
  galleryItems: GalleryItem[] | null;
  agendaItems: AgendaItem[] | null;
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
  const rawItems: GalleryItem[] = row.galleryItems ?? [];
  const galleryItems: GalleryItem[] = rawItems.length > 0
    ? rawItems
    : (row.galleryUrls ?? []).map(url => ({ url, type: "image" as const }));
  return {
    ...row,
    startDateTime: new Date(row.startDateTime).toISOString(),
    endDateTime: new Date(row.endDateTime).toISOString(),
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
    galleryUrls: row.galleryUrls ?? [],
    galleryItems,
    agendaItems: (row.agendaItems ?? []) as AgendaItem[],
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
  galleryItems?: GalleryItem[];
  agendaItems?: AgendaItem[];
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

  const galleryItems = data.galleryItems ?? [];
  const galleryUrls = galleryItems.map(i => i.url);
  const agendaItems = data.agendaItems ?? [];

  const id = crypto.randomUUID();
  await pool.query(
    `INSERT INTO "event" (
       id, title, sport, "eventType", location,
       "startDateTime", "endDateTime", "coverImageUrl", "galleryUrls", "galleryItems",
       "registrationMode", capacity, "maxPlayersPerTeam",
       description, rules, "organizerId", "customFormEnabled", price, "agendaItems", "createdAt", "updatedAt"
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19::jsonb,NOW(),NOW())`,
    [
      id, data.title, data.sport, data.eventType, data.location,
      data.startDateTime, data.endDateTime, data.coverImageUrl ?? null,
      galleryUrls, JSON.stringify(galleryItems),
      data.registrationMode, data.capacity ?? null, data.maxPlayersPerTeam ?? null,
      data.description ?? null, data.rules ?? null, session.user.id,
      data.customFormEnabled ?? false, data.price ?? 0,
      JSON.stringify(agendaItems),
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
     ORDER BY
       CASE WHEN e."endDateTime" < NOW() THEN 1 ELSE 0 END ASC,
       CASE WHEN e."endDateTime" >= NOW() THEN e."startDateTime" END ASC NULLS LAST,
       CASE WHEN e."endDateTime" < NOW() THEN e."startDateTime" END DESC NULLS LAST`
  );
  return result.rows.map(serializeEvent);
}

export async function getTournamentEvents() {
  await ensureEventParticipantsTable();
  const result = await pool.query(
    `SELECT e.*, u.name as "organizerName", COUNT(ep.id) as "participantCount"
     FROM "event" e
     JOIN "user" u ON e."organizerId" = u.id
     LEFT JOIN "event_participant" ep ON ep."eventId" = e.id
     WHERE e."eventType" = 'Tournament'
     GROUP BY e.id, u.name
     ORDER BY
       CASE WHEN e."endDateTime" < NOW() THEN 1 ELSE 0 END ASC,
       CASE WHEN e."endDateTime" >= NOW() THEN e."startDateTime" END ASC NULLS LAST,
       CASE WHEN e."endDateTime" < NOW() THEN e."startDateTime" END DESC NULLS LAST`
  );
  return result.rows.map(serializeEvent);
}

export async function getMyTournaments() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return [];
  await ensureEventParticipantsTable();
  const result = await pool.query(
    `SELECT e.*, u.name as "organizerName", COUNT(ep.id) as "participantCount"
     FROM "event" e
     JOIN "user" u ON e."organizerId" = u.id
     LEFT JOIN "event_participant" ep ON ep."eventId" = e.id
     WHERE e."organizerId" = $1 AND e."eventType" = 'Tournament'
     GROUP BY e.id, u.name
     ORDER BY
       CASE WHEN e."endDateTime" < NOW() THEN 1 ELSE 0 END ASC,
       CASE WHEN e."endDateTime" >= NOW() THEN e."startDateTime" END ASC NULLS LAST,
       CASE WHEN e."endDateTime" < NOW() THEN e."startDateTime" END DESC NULLS LAST`,
    [session.user.id]
  );
  return result.rows.map(serializeEvent);
}

export async function getJoinedTournaments() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return [];
  await ensureEventParticipantsTable();
  const result = await pool.query(
    `SELECT e.*, u.name as "organizerName", COUNT(all_ep.id) as "participantCount"
     FROM "event" e
     JOIN "user" u ON e."organizerId" = u.id
     JOIN "event_participant" ep ON ep."eventId" = e.id
     LEFT JOIN "event_participant" all_ep ON all_ep."eventId" = e.id
     WHERE ep."userId" = $1 AND e."organizerId" <> $1 AND e."eventType" = 'Tournament'
     GROUP BY e.id, u.name, ep."joinedAt"
     ORDER BY
       CASE WHEN e."endDateTime" < NOW() THEN 1 ELSE 0 END ASC,
       CASE WHEN e."endDateTime" >= NOW() THEN e."startDateTime" END ASC NULLS LAST,
       CASE WHEN e."endDateTime" < NOW() THEN e."startDateTime" END DESC NULLS LAST`,
    [session.user.id]
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
     ORDER BY
       CASE WHEN e."endDateTime" < NOW() THEN 1 ELSE 0 END ASC,
       CASE WHEN e."endDateTime" >= NOW() THEN e."startDateTime" END ASC NULLS LAST,
       CASE WHEN e."endDateTime" < NOW() THEN e."startDateTime" END DESC NULLS LAST`,
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
     ORDER BY
       CASE WHEN e."endDateTime" < NOW() THEN 1 ELSE 0 END ASC,
       CASE WHEN e."endDateTime" >= NOW() THEN e."startDateTime" END ASC NULLS LAST,
       CASE WHEN e."endDateTime" < NOW() THEN e."startDateTime" END DESC NULLS LAST`,
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

async function fireJoinEmails(
  userId: string,
  eventId: string,
  eventRow: { title: string; sport: string; location: string; startDateTime: Date | string; organizerId: string; capacity: number | null }
) {
  const [userRow, organizerRow] = await Promise.all([
    pool.query(`SELECT name, email FROM "user" WHERE id = $1`, [userId]),
    pool.query(`SELECT name, email FROM "user" WHERE id = $1`, [eventRow.organizerId]),
  ]);
  const u = userRow.rows[0];
  const org = organizerRow.rows[0];
  const emailData = {
    eventTitle: eventRow.title,
    sport: eventRow.sport,
    location: eventRow.location,
    startDateTime: new Date(eventRow.startDateTime).toISOString(),
    eventId,
  };
  if (u?.email) sendEventJoinedEmail(u.email, { userName: u.name ?? "Athlete", ...emailData }).catch(() => {});
  const isOrganizerJoining = userId === eventRow.organizerId;
  if (!isOrganizerJoining && org?.email) {
    let participantCount = 1;
    let isFull = false;
    if (eventRow.capacity) {
      const countRes = await pool.query(`SELECT COUNT(*) FROM "event_participant" WHERE "eventId" = $1`, [eventId]);
      participantCount = Number(countRes.rows[0].count);
      isFull = participantCount >= Number(eventRow.capacity);
    }
    sendNewParticipantEmail(org.email, {
      organizerName: org.name ?? "Organizer",
      participantName: u?.name ?? "Athlete",
      participantCount,
      capacity: eventRow.capacity ? Number(eventRow.capacity) : null,
      ...emailData,
    }).catch(() => {});
    if (isFull) {
      sendEventFullEmail(org.email, {
        organizerName: org.name ?? "Organizer",
        eventTitle: eventRow.title,
        eventId,
        capacity: Number(eventRow.capacity),
      }).catch(() => {});
    }
  }
}

export async function joinEvent(eventId: string): Promise<{ error?: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { error: "Unauthorized" };
    await ensureEventParticipantsTable();

    const event = await pool.query(
      `SELECT id, title, sport, location, "organizerId", capacity, "endDateTime", "startDateTime" FROM "event" WHERE id = $1`,
      [eventId]
    );
    if (event.rows.length === 0) return { error: "Event not found" };
    if (new Date(event.rows[0].endDateTime) < new Date()) return { error: "Event has ended" };

    if (event.rows[0].capacity) {
      const participants = await pool.query(
        `SELECT COUNT(*) FROM "event_participant" WHERE "eventId" = $1`,
        [eventId]
      );
      if (Number(participants.rows[0].count) >= Number(event.rows[0].capacity)) {
        return { error: "Event is full" };
      }
    }

    await pool.query(
      `INSERT INTO "event_participant" (id, "eventId", "userId")
       VALUES ($1, $2, $3)
       ON CONFLICT ("eventId", "userId") DO NOTHING`,
      [crypto.randomUUID(), eventId, session.user.id]
    );

    fireJoinEmails(session.user.id, eventId, event.rows[0]).catch(() => {});

    revalidatePath("/events");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/events");
    return {};
  } catch (e) {
    console.error("[joinEvent]", e);
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function leaveEvent(eventId: string): Promise<{ error?: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { error: "Unauthorized" };
    await ensureEventParticipantsTable();

    await pool.query(
      `DELETE FROM "event_participant" WHERE "eventId" = $1 AND "userId" = $2`,
      [eventId, session.user.id]
    );

    revalidatePath("/events");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/events");
    return {};
  } catch (e) {
    console.error("[leaveEvent]", e);
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateEvent(eventId: string, data: {
  title: string;
  sport: string;
  eventType: string;
  location: string;
  startDateTime: string;
  endDateTime: string;
  coverImageUrl?: string;
  galleryItems?: GalleryItem[];
  agendaItems?: AgendaItem[];
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

  const [existing, roleRow] = await Promise.all([
    pool.query(`SELECT "organizerId" FROM "event" WHERE id = $1`, [eventId]),
    pool.query(`SELECT role FROM "user" WHERE id = $1`, [session.user.id]),
  ]);
  if (!existing.rows[0]) throw new Error("Event not found");
  const isSuperAdmin = roleRow.rows[0]?.role === "super_admin";
  if (existing.rows[0].organizerId !== session.user.id && !isSuperAdmin) throw new Error("Forbidden");

  const galleryItems = data.galleryItems ?? [];
  const galleryUrls = galleryItems.map(i => i.url);
  const agendaItems = data.agendaItems ?? [];

  await pool.query(
    `UPDATE "event" SET
      title=$1, sport=$2, "eventType"=$3, location=$4,
      "startDateTime"=$5, "endDateTime"=$6, "coverImageUrl"=$7,
      "galleryUrls"=$8, "galleryItems"=$9::jsonb,
      "registrationMode"=$10, capacity=$11, "maxPlayersPerTeam"=$12,
      description=$13, rules=$14, "customFormEnabled"=$15, price=$16,
      "agendaItems"=$17::jsonb,
      "updatedAt"=NOW()
    WHERE id=$18`,
    [
      data.title, data.sport, data.eventType, data.location,
      data.startDateTime, data.endDateTime, data.coverImageUrl ?? null,
      galleryUrls, JSON.stringify(galleryItems),
      data.registrationMode, data.capacity ?? null, data.maxPlayersPerTeam ?? null,
      data.description ?? null, data.rules ?? null,
      data.customFormEnabled ?? false, data.price ?? 0,
      JSON.stringify(agendaItems),
      eventId,
    ]
  );

  await pool.query(`DELETE FROM "event_form_field" WHERE "eventId" = $1`, [eventId]);
  if (data.customFormEnabled && data.formFields?.length) {
    for (const field of data.formFields) {
      await pool.query(
        `INSERT INTO "event_form_field" (id, "eventId", label, "fieldType", required, options, "order")
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [crypto.randomUUID(), eventId, field.label, field.fieldType, field.required, field.options, field.order]
      );
    }
  }

  revalidatePath("/", "layout");
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
): Promise<{ error?: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { error: "Unauthorized" };
    await ensureEventParticipantsTable();
    await ensureFormTables();

    const event = await pool.query(
      `SELECT id, title, sport, location, "organizerId", capacity, "endDateTime", "startDateTime" FROM "event" WHERE id = $1`,
      [eventId]
    );
    if (event.rows.length === 0) return { error: "Event not found" };
    if (new Date(event.rows[0].endDateTime) < new Date()) return { error: "Event has ended" };

    if (event.rows[0].capacity) {
      const participants = await pool.query(
        `SELECT COUNT(*) FROM "event_participant" WHERE "eventId" = $1`,
        [eventId]
      );
      if (Number(participants.rows[0].count) >= Number(event.rows[0].capacity)) {
        return { error: "Event is full" };
      }
    }

    await pool.query(
      `INSERT INTO "event_participant" (id, "eventId", "userId")
       VALUES ($1, $2, $3)
       ON CONFLICT ("eventId", "userId") DO NOTHING`,
      [crypto.randomUUID(), eventId, session.user.id]
    );

    fireJoinEmails(session.user.id, eventId, event.rows[0]).catch(() => {});

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
    return {};
  } catch (e) {
    console.error("[joinEventWithForm]", e);
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}
