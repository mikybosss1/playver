import CreateEventButton from "@/components/CreateEventButton";
import EventCard from "@/components/EventCard";
import { getMyTournaments, getJoinedTournaments } from "@/app/actions/event";

export default async function DashboardTournamentsPage() {
  const [myTournaments, joinedTournaments] = await Promise.all([
    getMyTournaments(),
    getJoinedTournaments(),
  ]);

  const joinedLabel = (event: (typeof myTournaments)[number]) =>
    event.capacity
      ? `${event.participantCount} / ${event.capacity} joined`
      : `${event.participantCount} joined`;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <p className="text-sm font-bold tracking-wide uppercase text-[#e21d12] mb-1">
            Compete
          </p>
          <h1 className="text-3xl font-bold text-zinc-900" style={{ fontFamily: "var(--font-playfair)" }}>
            Tournaments
          </h1>
        </div>
        <CreateEventButton label="Create Tournament" />
      </div>

      <section className="mb-10">
        <h2 className="text-base font-bold text-zinc-700 mb-4">My Tournaments</h2>
        {myTournaments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-10 flex flex-col items-center justify-center text-center gap-3">
            <span className="text-4xl">🏆</span>
            <p className="text-zinc-500 text-sm">You haven&apos;t organized any tournaments yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {myTournaments.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                freeLabel="Free"
                endedLabel="Ended"
                joinedLabel={joinedLabel(event)}
                organizerLabel="Organized by"
                href={`/events/${event.id}`}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-base font-bold text-zinc-700 mb-4">Joined Tournaments</h2>
        {joinedTournaments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-10 flex flex-col items-center justify-center text-center gap-3">
            <span className="text-4xl">🎯</span>
            <p className="text-zinc-500 text-sm">You haven&apos;t joined any tournaments yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {joinedTournaments.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                freeLabel="Free"
                endedLabel="Ended"
                joinedLabel={joinedLabel(event)}
                organizerLabel="Organized by"
                href={`/events/${event.id}`}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
