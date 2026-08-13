export type CompletenessFields = {
  logoUrl: string | null;
  coverImageUrl: string | null;
  shortDescription: string | null;
  mission: string | null;
  publicEmail: string | null;
  phone: string | null;
  sports: string[];
  primaryLanguage: string | null;
};

function isFilled(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

// Percentage of the organization's public-profile fields that are filled in.
// Computed live from real columns (not the currently-unused stored
// profileCompletion column) so it always reflects the org's actual state.
export function computeCompleteness(org: CompletenessFields): number {
  const checks = [
    isFilled(org.logoUrl),
    isFilled(org.coverImageUrl),
    isFilled(org.shortDescription),
    isFilled(org.mission),
    isFilled(org.publicEmail),
    isFilled(org.phone),
    org.sports.length > 0,
    isFilled(org.primaryLanguage),
  ];
  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}
