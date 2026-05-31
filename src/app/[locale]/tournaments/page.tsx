import { headers } from "next/headers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DiscoverSearch from "@/components/DiscoverSearch";
import CreateEventButton from "@/components/CreateEventButton";
import { auth } from "@/lib/auth";
import { getEventParticipationMap, getTournamentEvents } from "@/app/actions/event";

export default async function TournamentsPage() {
  const [events, session] = await Promise.all([
    getTournamentEvents(),
    auth.api.getSession({ headers: await headers() }),
  ]);
  const joinedEventIds = session
    ? Array.from(await getEventParticipationMap(events.map((e) => e.id)))
    : [];

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-16">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-sm font-bold tracking-wide uppercase text-[#e21d12] mb-4">
                Compete
              </p>
              <h1
                className="text-4xl sm:text-5xl font-bold text-zinc-900 mb-4"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                Tournaments
              </h1>
              <p className="text-zinc-500 text-lg max-w-2xl">
                Find competitive brackets, elimination rounds, and championship events near you.
              </p>
            </div>
            {session && (
              <div className="shrink-0 pt-1">
                <CreateEventButton label="Create Tournament" />
              </div>
            )}
          </div>

          {events.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-zinc-200 bg-zinc-50 p-12 flex flex-col items-center justify-center text-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#e21d12]/10 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#e21d12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                  <path d="M4 22h16" />
                  <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                  <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-zinc-900">No tournaments yet</h2>
              <p className="text-zinc-500 text-sm max-w-sm">
                Be the first to organize a tournament in your area.
              </p>
            </div>
          ) : (
            <DiscoverSearch
              events={events}
              currentUserId={session?.user?.id ?? null}
              joinedEventIds={joinedEventIds}
              hideTypeFilter
            />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
