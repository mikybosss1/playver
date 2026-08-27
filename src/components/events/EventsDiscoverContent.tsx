import { getTranslations } from "next-intl/server";
import DiscoverSearch from "@/components/events/DiscoverSearch";
import CreateEventButton from "@/components/events/CreateEventButton";
import type { EventItem } from "@/app/actions/event";

// The events browse experience (header + search/filter/grid) — shared between
// the standalone /events page and the "Events" tab embedded in the logged-in
// home feed, so both stay in sync instead of duplicating this UI.
export default async function EventsDiscoverContent({
  events,
  currentUserId,
  joinedEventIds,
  showCreateButton,
}: {
  events: EventItem[];
  currentUserId: string | null;
  joinedEventIds: string[];
  showCreateButton: boolean;
}) {
  const t = await getTranslations("Discover");

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-16">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold tracking-wide uppercase text-purple-600 mb-4">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {t("eyebrow")}
          </p>
          <h1
            className="text-4xl sm:text-5xl font-bold text-zinc-900 mb-4"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            {t("title")}
          </h1>
          <p className="text-zinc-500 text-lg max-w-2xl">{t("subtitle")}</p>
        </div>
        {showCreateButton && (
          <div className="shrink-0 pt-1">
            <CreateEventButton label={t("createEvent")} />
          </div>
        )}
      </div>

      <DiscoverSearch
        events={events}
        currentUserId={currentUserId}
        joinedEventIds={joinedEventIds}
      />
    </div>
  );
}
