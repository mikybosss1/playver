// /dashboard/tournaments: tournaments the user created plus ones their
// tournament_team has joined.
import { getTranslations } from "next-intl/server";
import EventCard from "@/components/events/EventCard";
import { getMyTournaments, getJoinedTournaments } from "@/app/actions/event";

export default async function DashboardTournamentsPage() {
  const [t, myTournaments, joinedTournaments] = await Promise.all([
    getTranslations("DashboardTournaments"),
    getMyTournaments(),
    getJoinedTournaments(),
  ]);

  const joinedLabel = (event: (typeof myTournaments)[number]) =>
    event.capacity
      ? t("teamsOf", { count: event.participantCount, capacity: event.capacity })
      : t("teamsCount", { count: event.participantCount });

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="mb-8">
        <p className="text-sm font-bold tracking-wide uppercase text-[#e21d12] mb-1">
          {t("eyebrow")}
        </p>
        <h1 className="text-3xl font-bold text-zinc-900" style={{ fontFamily: "var(--font-playfair)" }}>
          {t("title")}
        </h1>
      </div>

      {myTournaments.length > 0 && (
        <section className="mb-10">
          <h2 className="text-base font-bold text-zinc-700 mb-4">{t("myTitle")}</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {myTournaments.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                freeLabel={t("free")}
                endedLabel={t("ended")}
                joinedLabel={joinedLabel(event)}
                organizerLabel={t("organizedBy")}
                href={`/events/${event.id}`}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-base font-bold text-zinc-700 mb-4">{t("joinedTitle")}</h2>
        {joinedTournaments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-10 flex flex-col items-center justify-center text-center gap-3">
            <span className="text-4xl">🎯</span>
            <p className="text-zinc-500 text-sm">{t("emptyJoined")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {joinedTournaments.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                freeLabel={t("free")}
                endedLabel={t("ended")}
                joinedLabel={joinedLabel(event)}
                organizerLabel={t("organizedBy")}
                href={`/events/${event.id}`}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
