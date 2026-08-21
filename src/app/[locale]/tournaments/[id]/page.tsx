// Tournaments have no separate detail page — they're just events with
// eventType "Tournament", so this permanently redirects to the shared
// /events/[eventId] detail page (query params preserved), which renders
// the tournament-specific tabs (teams/standings/results) when relevant.
import { redirect } from "next/navigation";

export default async function TournamentDetailRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const query = new URLSearchParams(sp).toString();
  redirect(`/events/${id}${query ? `?${query}` : ""}`);
}
