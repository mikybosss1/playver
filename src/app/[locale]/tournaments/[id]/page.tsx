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
