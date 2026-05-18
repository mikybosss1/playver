"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";
import {
  sendEventCancelledEmail,
  sendRemovedFromEventEmail,
  sendRoleChangedEmail,
  sendNewParticipantEmail,
  sendEventFullEmail,
  sendEventJoinedEmail,
} from "@/lib/emails";

export type UserRole = "player" | "organizer" | "super_admin";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: UserRole;
  createdAt: string;
};

async function requireSuperAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  const result = await pool.query(`SELECT role FROM "user" WHERE id = $1`, [session.user.id]);
  if (result.rows[0]?.role !== "super_admin") throw new Error("Forbidden");
  return session;
}

export async function getUserRole(userId: string): Promise<UserRole> {
  const result = await pool.query(`SELECT role FROM "user" WHERE id = $1`, [userId]);
  return (result.rows[0]?.role ?? "player") as UserRole;
}

export async function getAllUsers(): Promise<AdminUser[]> {
  await requireSuperAdmin();
  const result = await pool.query(
    `SELECT id, name, email, image, role, "createdAt" FROM "user" ORDER BY "createdAt" DESC`
  );
  return result.rows.map((row: AdminUser & { createdAt: Date | string }) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    image: row.image,
    role: (row.role ?? "player") as UserRole,
    createdAt: new Date(row.createdAt).toISOString(),
  }));
}

export async function setUserRole(userId: string, role: UserRole) {
  const session = await requireSuperAdmin();
  if (userId === session.user.id) throw new Error("Cannot change your own role");
  const userRow = await pool.query(`SELECT name, email, role FROM "user" WHERE id = $1`, [userId]);
  const u = userRow.rows[0];
  await pool.query(
    `UPDATE "user" SET role = $1, "updatedAt" = NOW() WHERE id = $2`,
    [role, userId]
  );
  if (u?.email) {
    sendRoleChangedEmail(u.email, {
      userName: u.name ?? "Athlete",
      oldRole: u.role ?? "player",
      newRole: role,
    }).catch(() => {});
  }
  revalidatePath("/dashboard/roles");
}

export async function deleteUser(userId: string) {
  const session = await requireSuperAdmin();
  if (userId === session.user.id) throw new Error("Cannot delete yourself");
  await pool.query(`DELETE FROM "user" WHERE id = $1`, [userId]);
  revalidatePath("/dashboard/roles");
}

export async function adminRemoveParticipant(eventId: string, userId: string) {
  await requireSuperAdmin();
  const [eventRow, userRow] = await Promise.all([
    pool.query(`SELECT title, sport, location, "startDateTime" FROM "event" WHERE id = $1`, [eventId]),
    pool.query(`SELECT name, email FROM "user" WHERE id = $1`, [userId]),
  ]);
  await pool.query(
    `DELETE FROM "event_participant" WHERE "eventId" = $1 AND "userId" = $2`,
    [eventId, userId]
  );
  const e = eventRow.rows[0];
  const u = userRow.rows[0];
  if (e && u?.email) {
    sendRemovedFromEventEmail(u.email, {
      userName: u.name ?? "Athlete",
      eventTitle: e.title,
      sport: e.sport,
      location: e.location,
      startDateTime: new Date(e.startDateTime).toISOString(),
    }).catch(() => {});
  }
  revalidatePath(`/events/${eventId}`);
}

export async function getEventNonParticipants(eventId: string) {
  await requireSuperAdmin();
  const result = await pool.query(
    `SELECT id, name, email, image FROM "user"
     WHERE id NOT IN (
       SELECT "userId" FROM "event_participant" WHERE "eventId" = $1
     )
     ORDER BY name ASC`,
    [eventId]
  );
  return result.rows.map((row: { id: string; name: string; email: string; image: string | null }) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    image: row.image,
  }));
}

export async function adminAddParticipant(eventId: string, userId: string) {
  await requireSuperAdmin();
  const [eventRow, userRow] = await Promise.all([
    pool.query(`SELECT title, sport, location, "startDateTime", "organizerId", capacity FROM "event" WHERE id = $1`, [eventId]),
    pool.query(`SELECT name, email FROM "user" WHERE id = $1`, [userId]),
  ]);
  await pool.query(
    `INSERT INTO "event_participant" (id, "eventId", "userId")
     VALUES ($1, $2, $3)
     ON CONFLICT ("eventId", "userId") DO NOTHING`,
    [crypto.randomUUID(), eventId, userId]
  );
  const e = eventRow.rows[0];
  const u = userRow.rows[0];
  if (e && u) {
    const eventEmailData = {
      eventTitle: e.title,
      sport: e.sport,
      location: e.location,
      startDateTime: new Date(e.startDateTime).toISOString(),
      eventId,
    };
    if (u.email) {
      sendEventJoinedEmail(u.email, { userName: u.name ?? "Athlete", ...eventEmailData }).catch(() => {});
    }
    const [organizerRow, countRow] = await Promise.all([
      pool.query(`SELECT name, email FROM "user" WHERE id = $1`, [e.organizerId]),
      e.capacity ? pool.query(`SELECT COUNT(*) FROM "event_participant" WHERE "eventId" = $1`, [eventId]) : Promise.resolve(null),
    ]);
    const org = organizerRow.rows[0];
    const participantCount = countRow ? Number(countRow.rows[0].count) : 1;
    const isFull = e.capacity && participantCount >= Number(e.capacity);
    if (org?.email) {
      sendNewParticipantEmail(org.email, {
        organizerName: org.name ?? "Organizer",
        participantName: u.name ?? "Athlete",
        ...eventEmailData,
        participantCount,
        capacity: e.capacity ? Number(e.capacity) : null,
      }).catch(() => {});
      if (isFull) {
        sendEventFullEmail(org.email, {
          organizerName: org.name ?? "Organizer",
          eventTitle: e.title,
          eventId,
          capacity: Number(e.capacity),
        }).catch(() => {});
      }
    }
  }
  revalidatePath(`/events/${eventId}`);
}

export async function adminDeleteEvent(eventId: string) {
  await requireSuperAdmin();
  const [eventRow, participantsRow] = await Promise.all([
    pool.query(`SELECT title, sport, location, "startDateTime" FROM "event" WHERE id = $1`, [eventId]),
    pool.query(`SELECT u.name, u.email FROM "event_participant" ep JOIN "user" u ON u.id = ep."userId" WHERE ep."eventId" = $1`, [eventId]),
  ]);
  await pool.query(`DELETE FROM "event" WHERE id = $1`, [eventId]);
  const e = eventRow.rows[0];
  if (e) {
    for (const u of participantsRow.rows) {
      if (u.email) {
        sendEventCancelledEmail(u.email, {
          userName: u.name ?? "Athlete",
          eventTitle: e.title,
          sport: e.sport,
          location: e.location,
          startDateTime: new Date(e.startDateTime).toISOString(),
        }).catch(() => {});
      }
    }
  }
  revalidatePath("/events");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/events");
}
