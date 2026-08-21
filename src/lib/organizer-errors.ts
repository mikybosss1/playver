// Thrown by requireOrganizationPermission() (organization.ts) and similar
// gates when the caller lacks the required org permission — callers should
// let it propagate (pages catch it and render a 404/coming-soon state, e.g.
// organizer/events/[eventId]/page.tsx) rather than catching it themselves.
export class ForbiddenError extends Error {}
