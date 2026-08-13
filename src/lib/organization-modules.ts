// Canonical module list for the create-organization wizard's Modules step
// and (source of truth going forward for) enabledModules on the organization
// row. i18n keys follow `module_<key>Label` / `module_<key>Description`.
export type OrganizationModuleKey =
  | "posts"
  | "programs"
  | "teams"
  | "events"
  | "people"
  | "opportunities"
  | "partners"
  | "memberships";

export type OrganizationModuleDefinition = {
  key: OrganizationModuleKey;
  alwaysOn?: boolean;
  recommended?: boolean;
};

export const ORGANIZATION_MODULES: OrganizationModuleDefinition[] = [
  { key: "posts", alwaysOn: true },
  { key: "programs", recommended: true },
  { key: "teams", recommended: true },
  { key: "events", recommended: true },
  { key: "people", recommended: true },
  { key: "opportunities" },
  { key: "partners" },
  { key: "memberships" },
];

export const DEFAULT_ENABLED_MODULES: OrganizationModuleKey[] = ORGANIZATION_MODULES
  .filter((m) => m.alwaysOn || m.recommended)
  .map((m) => m.key);
