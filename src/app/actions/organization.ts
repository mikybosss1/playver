"use server";

import { headers, cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { pool, withTransaction } from "@/lib/db";
import { slugify } from "@/lib/slug";
import { hasPermission, type OrgRole, type OrgPermission } from "@/lib/organizer-permissions";
import { ForbiddenError } from "@/lib/organizer-errors";

const ACTIVE_ORG_COOKIE = "active_org_id";

export type OrganizationSummary = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  role: OrgRole;
  publicationStatus: string;
};

export type Organization = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
  shortDescription: string | null;
  mission: string | null;
  publicEmail: string | null;
  phone: string | null;
  sports: string[];
  primaryLanguage: string | null;
  publicationStatus: string;
  organizationType: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
};

const ORGANIZATION_COLUMNS = `o.id, o.name, o.slug, o."logoUrl", o."coverImageUrl", o."shortDescription",
     o.mission, o."publicEmail", o.phone, o.sports, o."primaryLanguage", o."publicationStatus",
     o."organizationType", o.city, o.province, o.country`;

function mapOrganizationRow(row: {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
  shortDescription: string | null;
  mission: string | null;
  publicEmail: string | null;
  phone: string | null;
  sports: string[];
  primaryLanguage: string | null;
  publicationStatus: string;
  organizationType: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
}): Organization {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    logoUrl: row.logoUrl,
    coverImageUrl: row.coverImageUrl,
    shortDescription: row.shortDescription,
    mission: row.mission,
    publicEmail: row.publicEmail,
    phone: row.phone,
    sports: row.sports ?? [],
    primaryLanguage: row.primaryLanguage,
    publicationStatus: row.publicationStatus,
    organizationType: row.organizationType,
    city: row.city,
    province: row.province,
    country: row.country,
  };
}

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  return session;
}

export async function getUserOrganizations(): Promise<OrganizationSummary[]> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return []; // the organizer layout is what enforces the redirect; this just fails closed

  const result = await pool.query(
    `SELECT o.id, o.name, o.slug, o."logoUrl", om.role, o."publicationStatus"
     FROM "organization_membership" om
     JOIN "organization" o ON o.id = om."organizationId"
     WHERE om."userId" = $1 AND om.status = 'active'
     ORDER BY om."createdAt" ASC`,
    [session.user.id]
  );

  return result.rows as OrganizationSummary[];
}

// Resolves which organization the caller is currently viewing. The cookie is
// only ever a UI preference for *which* org to look at — membership is
// re-verified server-side on every call, so a forged/stale cookie value just
// resolves to "not a member" (falls back or returns null), never elevated
// access to an org the caller doesn't belong to.
export async function getActiveOrganization(): Promise<{ organization: Organization; role: OrgRole } | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null; // the organizer layout is what enforces the redirect; this just fails closed
  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;

  if (activeOrgId) {
    const verified = await pool.query(
      `SELECT ${ORGANIZATION_COLUMNS}, om.role
       FROM "organization_membership" om
       JOIN "organization" o ON o.id = om."organizationId"
       WHERE om."userId" = $1 AND om."organizationId" = $2 AND om.status = 'active'`,
      [session.user.id, activeOrgId]
    );
    if (verified.rows[0]) {
      return { organization: mapOrganizationRow(verified.rows[0]), role: verified.rows[0].role };
    }
  }

  // Cookie unset or pointed at an org the user isn't (or is no longer) a member
  // of — fall back to their first membership rather than failing outright.
  const fallback = await pool.query(
    `SELECT ${ORGANIZATION_COLUMNS}, om.role
     FROM "organization_membership" om
     JOIN "organization" o ON o.id = om."organizationId"
     WHERE om."userId" = $1 AND om.status = 'active'
     ORDER BY om."createdAt" ASC
     LIMIT 1`,
    [session.user.id]
  );
  if (!fallback.rows[0]) return null;
  return { organization: mapOrganizationRow(fallback.rows[0]), role: fallback.rows[0].role };
}

export async function setActiveOrganization(organizationId: string): Promise<{ error?: string }> {
  const session = await requireSession();

  const membership = await pool.query(
    `SELECT 1 FROM "organization_membership" WHERE "userId" = $1 AND "organizationId" = $2 AND status = 'active'`,
    [session.user.id, organizationId]
  );
  if (membership.rows.length === 0) return { error: "Forbidden" };

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORG_COOKIE, organizationId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });

  return {};
}

// Shared server-side gate for every organizer action. Resolves session ->
// active organization (server-verified) -> membership role -> permission,
// throwing rather than silently degrading, so callers fail closed.
export async function requireOrganizationPermission(
  permission: OrgPermission
): Promise<{ userId: string; organization: Organization; role: OrgRole }> {
  const session = await requireSession();
  const active = await getActiveOrganization();
  if (!active) throw new ForbiddenError("No active organization");
  if (!hasPermission(active.role, permission)) throw new ForbiddenError("Forbidden");
  return { userId: session.user.id, organization: active.organization, role: active.role };
}

// ---------------------------------------------------------------------------
// Create-organization wizard. Writes progressively: nothing is
// persisted until Identity (step 2), since name/slug are NOT NULL; every step
// after that upserts through updateOrganizationDraft and bumps wizardStep so
// closing and reopening the wizard resumes exactly where the user left off.
// ---------------------------------------------------------------------------

export type LocationInput = {
  name: string;
  streetAddress: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
};

export type OrganizationLocation = LocationInput & { id: string };

export type OrganizationDraftFields = Partial<{
  // Type (step 1, editable again via Back after creation)
  organizationType: string;
  // Identity (step 2)
  name: string;
  city: string;
  province: string;
  country: string;
  primaryLanguage: string;
  sports: string[];
  slug: string;
  shortDescription: string;
  // Branding (step 3)
  logoUrl: string | null;
  coverImageUrl: string | null;
  slogan: string;
  brandColor: string;
  // About (step 4)
  mission: string;
  vision: string;
  history: string;
  yearFounded: number | null;
  ageGroups: string[];
  values: string[];
  affiliations: string[];
  // Contact (step 5)
  publicEmail: string;
  phone: string;
  website: string;
  socialLinks: Record<string, string>;
  // Legal (step 6)
  legalName: string;
  registrationNumber: string;
  organizationStatus: string;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  refundPolicyUrl: string | null;
  refundPolicyText: string | null;
  privacyPolicyUrl: string | null;
  privacyPolicyText: string | null;
  codeOfConductUrl: string | null;
  codeOfConductText: string | null;
  // Modules (step 7)
  enabledModules: string[];
}>;

const DRAFT_COLUMN_TYPES: Record<keyof OrganizationDraftFields, "text" | "text[]" | "int" | "jsonb"> = {
  organizationType: "text",
  name: "text",
  city: "text",
  province: "text",
  country: "text",
  primaryLanguage: "text",
  sports: "text[]",
  slug: "text",
  shortDescription: "text",
  logoUrl: "text",
  coverImageUrl: "text",
  slogan: "text",
  brandColor: "text",
  mission: "text",
  vision: "text",
  history: "text",
  yearFounded: "int",
  ageGroups: "text[]",
  values: "text[]",
  affiliations: "text[]",
  publicEmail: "text",
  phone: "text",
  website: "text",
  socialLinks: "jsonb",
  legalName: "text",
  registrationNumber: "text",
  organizationStatus: "text",
  insuranceProvider: "text",
  insurancePolicyNumber: "text",
  refundPolicyUrl: "text",
  refundPolicyText: "text",
  privacyPolicyUrl: "text",
  privacyPolicyText: "text",
  codeOfConductUrl: "text",
  codeOfConductText: "text",
  enabledModules: "text[]",
};

export type OrganizationDraftState = Organization & {
  legalName: string | null;
  registrationNumber: string | null;
  organizationStatus: string | null;
  insuranceProvider: string | null;
  insurancePolicyNumber: string | null;
  vision: string | null;
  history: string | null;
  yearFounded: number | null;
  ageGroups: string[];
  values: string[];
  affiliations: string[];
  website: string | null;
  slogan: string | null;
  brandColor: string | null;
  socialLinks: Record<string, string>;
  refundPolicyUrl: string | null;
  refundPolicyText: string | null;
  privacyPolicyUrl: string | null;
  privacyPolicyText: string | null;
  codeOfConductUrl: string | null;
  codeOfConductText: string | null;
  enabledModules: string[];
  wizardStep: number;
  locations: OrganizationLocation[];
};

async function generateUniqueSlugExcluding(name: string, excludeOrganizationId: string): Promise<string> {
  const base = slugify(name) || "organization";
  let candidate = base;
  let suffix = 2;
  while (true) {
    const existing = await pool.query(
      `SELECT 1 FROM "organization" WHERE slug = $1 AND id != $2`,
      [candidate, excludeOrganizationId]
    );
    if (existing.rows.length === 0) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

// First real write in the wizard. organizationType comes from step 1 (kept in
// client state until now, since it alone isn't enough for a valid row).
export async function createOrganizationDraft(input: {
  organizationType: string;
  name: string;
  city: string;
  province: string;
  country: string;
  primaryLanguage: string;
  sports: string[];
  shortDescription: string;
  desiredSlug?: string;
  wizardStep?: number;
}): Promise<{ organizationId?: string; slug?: string; error?: string }> {
  const session = await requireSession();

  const name = input.name.trim();
  if (!name) return { error: "Organization name is required" };
  if (name.length > 200) return { error: "Organization name is too long" };

  const slugSeed = input.desiredSlug?.trim() || name;
  const base = slugify(slugSeed) || "organization";
  let slug = base;
  let suffix = 2;
  while (true) {
    const existing = await pool.query(`SELECT 1 FROM "organization" WHERE slug = $1`, [slug]);
    if (existing.rows.length === 0) break;
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  const organizationId = crypto.randomUUID();

  await withTransaction(async (client) => {
    await client.query(
      `INSERT INTO "organization"
         (id, name, slug, "organizationType", city, province, country, "primaryLanguage", sports,
          "shortDescription", "publicationStatus", "wizardStep")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'draft',$11)`,
      [
        organizationId, name, slug, input.organizationType, input.city, input.province,
        input.country, input.primaryLanguage, input.sports, input.shortDescription,
        input.wizardStep ?? 2,
      ]
    );
    await client.query(
      `INSERT INTO "organization_membership" (id, "organizationId", "userId", role, status, "acceptedAt")
       VALUES ($1, $2, $3, 'OWNER', 'active', NOW())`,
      [crypto.randomUUID(), organizationId, session.user.id]
    );
  });

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORG_COOKIE, organizationId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });

  return { organizationId, slug };
}

// Generic step-save for everything after Identity. Whitelisted column map
// keeps this injection-safe while letting each wizard step send only the
// fields it owns. advanceToStep only ever moves wizardStep forward (via
// GREATEST) so revisiting an earlier step via Back never regresses the
// resume point.
export async function updateOrganizationDraft(
  fields: OrganizationDraftFields,
  advanceToStep?: number
): Promise<{ error?: string; slug?: string }> {
  const { organization } = await requireOrganizationPermission("MANAGE_ORGANIZATION_PROFILE");

  const setClauses: string[] = [];
  const values: unknown[] = [];
  let resolvedSlug: string | undefined;

  for (const [key, value] of Object.entries(fields) as [keyof OrganizationDraftFields, unknown][]) {
    if (value === undefined) continue;
    const type = DRAFT_COLUMN_TYPES[key];
    if (!type) continue;

    if (key === "slug" && typeof value === "string") {
      resolvedSlug = await generateUniqueSlugExcluding(value, organization.id);
      values.push(resolvedSlug);
      setClauses.push(`"${key}" = $${values.length}`);
      continue;
    }

    if (type === "jsonb") {
      values.push(JSON.stringify(value));
      setClauses.push(`"${key}" = $${values.length}::jsonb`);
    } else {
      values.push(value);
      setClauses.push(`"${key}" = $${values.length}`);
    }
  }

  if (advanceToStep !== undefined) {
    values.push(advanceToStep);
    setClauses.push(`"wizardStep" = GREATEST("wizardStep", $${values.length})`);
  }

  if (setClauses.length === 0) return {};

  values.push(organization.id);
  await pool.query(
    `UPDATE "organization" SET ${setClauses.join(", ")}, "updatedAt" = NOW() WHERE id = $${values.length}`,
    values
  );

  return { slug: resolvedSlug };
}

// Replace-all semantics: the wizard's location editor always sends the full
// current list, so delete+reinsert is simpler and just as correct as a diff.
export async function setOrganizationLocations(locations: LocationInput[]): Promise<{ error?: string }> {
  const { organization } = await requireOrganizationPermission("MANAGE_ORGANIZATION_PROFILE");

  await withTransaction(async (client) => {
    await client.query(`DELETE FROM "organization_location" WHERE "organizationId" = $1`, [organization.id]);
    for (const loc of locations) {
      await client.query(
        `INSERT INTO "organization_location"
           (id, "organizationId", name, "streetAddress", city, province, "postalCode", country)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [crypto.randomUUID(), organization.id, loc.name, loc.streetAddress, loc.city, loc.province, loc.postalCode, loc.country]
      );
    }
  });

  return {};
}

export type DraftOrganizationSummary = {
  id: string;
  name: string;
  organizationType: string | null;
  logoUrl: string | null;
  wizardStep: number;
  updatedAt: string;
};

// Drafts the caller can resume — anyone with MANAGE_ORGANIZATION_PROFILE on
// an org still sitting at publicationStatus='draft', not just its creator.
export async function getDraftOrganizations(): Promise<DraftOrganizationSummary[]> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return [];

  const result = await pool.query(
    `SELECT o.id, o.name, o."organizationType", o."logoUrl", o."wizardStep", o."updatedAt", om.role
     FROM "organization_membership" om
     JOIN "organization" o ON o.id = om."organizationId"
     WHERE om."userId" = $1 AND om.status = 'active' AND o."publicationStatus" = 'draft'
     ORDER BY o."updatedAt" DESC`,
    [session.user.id]
  );

  return result.rows
    .filter((row) => hasPermission(row.role as OrgRole, "MANAGE_ORGANIZATION_PROFILE"))
    .map((row) => ({
      id: row.id,
      name: row.name,
      organizationType: row.organizationType,
      logoUrl: row.logoUrl,
      wizardStep: row.wizardStep,
      updatedAt: new Date(row.updatedAt).toISOString(),
    }));
}

// Hydrates a specific draft for resume. Unlike requireOrganizationPermission,
// this checks membership on the *requested* org directly rather than
// whatever's currently active — the user may be resuming a draft that isn't
// their active org — then flips the active-org cookie to it as a side effect
// so every subsequent per-step save in this wizard session lands correctly.
export async function getOrganizationDraftState(
  organizationId: string
): Promise<{ draft?: OrganizationDraftState; error?: string }> {
  const session = await requireSession();

  const membership = await pool.query(
    `SELECT role FROM "organization_membership" WHERE "userId" = $1 AND "organizationId" = $2 AND status = 'active'`,
    [session.user.id, organizationId]
  );
  const role = membership.rows[0]?.role as OrgRole | undefined;
  if (!role || !hasPermission(role, "MANAGE_ORGANIZATION_PROFILE")) return { error: "Forbidden" };

  const orgResult = await pool.query(`SELECT * FROM "organization" WHERE id = $1`, [organizationId]);
  const row = orgResult.rows[0];
  if (!row) return { error: "Organization not found" };

  const locationsResult = await pool.query(
    `SELECT id, name, "streetAddress", city, province, "postalCode", country
     FROM "organization_location" WHERE "organizationId" = $1 ORDER BY "createdAt" ASC`,
    [organizationId]
  );

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORG_COOKIE, organizationId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });

  return {
    draft: {
      ...mapOrganizationRow(row),
      legalName: row.legalName,
      registrationNumber: row.registrationNumber,
      organizationStatus: row.organizationStatus,
      insuranceProvider: row.insuranceProvider,
      insurancePolicyNumber: row.insurancePolicyNumber,
      vision: row.vision,
      history: row.history,
      yearFounded: row.yearFounded,
      ageGroups: row.ageGroups ?? [],
      values: row.values ?? [],
      affiliations: row.affiliations ?? [],
      website: row.website,
      slogan: row.slogan,
      brandColor: row.brandColor,
      socialLinks: row.socialLinks ?? {},
      refundPolicyUrl: row.refundPolicyUrl,
      refundPolicyText: row.refundPolicyText,
      privacyPolicyUrl: row.privacyPolicyUrl,
      privacyPolicyText: row.privacyPolicyText,
      codeOfConductUrl: row.codeOfConductUrl,
      codeOfConductText: row.codeOfConductText,
      enabledModules: row.enabledModules ?? [],
      wizardStep: row.wizardStep,
      locations: locationsResult.rows as OrganizationLocation[],
    },
  };
}

export async function publishOrganization(): Promise<{ error?: string }> {
  const { organization } = await requireOrganizationPermission("MANAGE_ORGANIZATION_PROFILE");

  await pool.query(
    `UPDATE "organization" SET "publicationStatus" = 'published', "updatedAt" = NOW() WHERE id = $1`,
    [organization.id]
  );

  return {};
}
