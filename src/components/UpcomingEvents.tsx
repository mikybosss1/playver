import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import EventCard from "@/components/EventCard";
import type { EventItem } from "@/app/actions/event";

export default async function UpcomingEvents({ events }: { events: EventItem[] }) {
  const t = await getTranslations("UpcomingEvents");
  const now = new Date();
  const upcomingEvents = events
    .filter((event) => new Date(event.startDateTime) >= now)
    .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime())
    .slice(0, 3);

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-3" style={{ fontFamily: "var(--font-playfair)" }}>
            {t("title")}
          </h2>
          <p className="text-zinc-500 text-base max-w-xl mx-auto">{t("subtitle")}</p>
        </div>

        {upcomingEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 py-16 text-center">
            <p className="text-sm text-zinc-500">{t("empty")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {upcomingEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                freeLabel={t("free")}
                endedLabel={t("eventEnded")}
                joinedLabel={event.capacity
                  ? t("joinedProgress", { joined: event.participantCount, capacity: event.capacity })
                  : t("joinedCount", { count: event.participantCount })}
                organizerLabel={t("organizedBy")}
                href={`/discover/${event.id}`}
              />
            ))}
          </div>
        )}

        <div className="flex justify-center mt-12">
          <Link
            href="/discover"
            className="px-8 py-3 text-sm font-semibold text-white rounded-lg bg-[#e21d12] hover:bg-[#d41810] transition-colors shadow"
          >
            {t("viewAll")}
          </Link>
        </div>
      </div>
    </section>
  );
}
