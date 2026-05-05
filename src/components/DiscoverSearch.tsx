"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import EventCard from "@/components/EventCard";
import type { EventItem } from "@/app/actions/event";

type EventType = "all" | "league" | "tournament" | "pickup" | "activity";
type Sport =
  | "all" | "soccer" | "basketball" | "volleyball" | "pickleball"
  | "tennis" | "hockey" | "baseball" | "cricket" | "rugby" | "other";

const RECENT_KEY = "playver:recent-events";

function eventMatchesType(eventType: string, activeType: EventType) {
  if (activeType === "all") return true;
  const normalized = eventType.toLowerCase();
  if (activeType === "pickup") return normalized.includes("pickup") || normalized.includes("pick up");
  if (activeType === "activity") return normalized.includes("activity") || normalized.includes("training") || normalized.includes("practice");
  return normalized.includes(activeType);
}

export default function DiscoverSearch({
  events,
}: {
  events: EventItem[];
  currentUserId: string | null;
  joinedEventIds: string[];
}) {
  const t = useTranslations("Discover");

  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState<EventType>("all");
  const [sport, setSport] = useState<Sport>("all");
  const [upcomingOnly, setUpcomingOnly] = useState(false);
  const [recentIds, setRecentIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(window.localStorage.getItem(RECENT_KEY) ?? "[]");
    } catch {
      return [];
    }
  });

  const eventTypes: { key: EventType; label: string }[] = [
    { key: "all", label: t("typeAll") },
    { key: "league", label: t("typeLeague") },
    { key: "tournament", label: t("typeTournament") },
    { key: "pickup", label: t("typePickup") },
    { key: "activity", label: t("typeActivity") },
  ];

  const sports: { key: Sport; label: string }[] = [
    { key: "all", label: t("sportAll") },
    { key: "soccer", label: t("sportSoccer") },
    { key: "basketball", label: t("sportBasketball") },
    { key: "volleyball", label: t("sportVolleyball") },
    { key: "pickleball", label: t("sportPickleball") },
    { key: "tennis", label: t("sportTennis") },
    { key: "hockey", label: t("sportHockey") },
    { key: "baseball", label: t("sportBaseball") },
    { key: "cricket", label: t("sportCricket") },
    { key: "rugby", label: t("sportRugby") },
    { key: "other", label: t("sportOther") },
  ];

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return events.filter((event) => {
      const matchesSearch = !query || [
        event.title,
        event.sport,
        event.eventType,
        event.location,
        event.description ?? "",
        event.organizerName,
      ].some((value) => value.toLowerCase().includes(query));
      const matchesSport = sport === "all" || event.sport.toLowerCase() === sport;
      const matchesUpcoming = !upcomingOnly || new Date(event.startDateTime) >= new Date();
      return matchesSearch && matchesSport && matchesUpcoming && eventMatchesType(event.eventType, activeType);
    });
  }, [activeType, events, search, sport, upcomingOnly]);

  const recentlyViewed = recentIds
    .map((id) => events.find((event) => event.id === id))
    .filter((event): event is EventItem => Boolean(event));

  function rememberEvent(event: EventItem) {
    const next = [event.id, ...recentIds.filter((id) => id !== event.id)].slice(0, 4);
    setRecentIds(next);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  }

  const hasActiveSearch = search.trim() || activeType !== "all" || sport !== "all" || upcomingOnly;
  const joinedLabel = (event: EventItem) => event.capacity
    ? t("joinedProgress", { joined: event.participantCount, capacity: event.capacity })
    : t("joinedCount", { count: event.participantCount });

  return (
    <div className="mt-10 flex flex-col gap-8">
      <form onSubmit={(event) => event.preventDefault()} className="flex flex-col gap-6">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full pl-11 pr-4 py-3 text-sm bg-zinc-100 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-red-200 placeholder:text-zinc-400 text-zinc-800"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {eventTypes.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveType(key)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                activeType === key
                  ? "bg-[#e21d12] text-white border-[#e21d12]"
                  : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <select
              value={sport}
              onChange={(e) => setSport(e.target.value as Sport)}
              className="appearance-none pl-4 pr-9 py-2.5 text-sm bg-white border border-zinc-200 rounded-lg text-zinc-700 outline-none focus:ring-2 focus:ring-red-200 cursor-pointer hover:border-zinc-400 transition-colors"
            >
              {sports.map(({ key, label }) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </span>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <button
              type="button"
              onClick={() => setUpcomingOnly((value) => !value)}
              className={`relative w-10 h-5 rounded-full transition-colors ${upcomingOnly ? "bg-[#e21d12]" : "bg-zinc-200"}`}
              aria-pressed={upcomingOnly}
            >
              <span className={`absolute left-0 top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${upcomingOnly ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
            <span className="text-sm text-zinc-600 font-medium">{t("upcomingOnly")}</span>
          </label>
        </div>
      </form>

      {recentlyViewed.length > 0 && (
        <section>
          <h2 className="text-base font-bold text-zinc-700 mb-4">{t("recentlyViewed")}</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {recentlyViewed.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                freeLabel={t("free")}
                endedLabel={t("eventEnded")}
                joinedLabel={joinedLabel(event)}
                organizerLabel={t("organizedBy")}
                href={`/discover/${event.id}`}
                onViewed={rememberEvent}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-base font-bold text-zinc-700 mb-4">
          {hasActiveSearch ? t("searchResults") : t("popularEvents")}
        </h2>
        {filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <span className="text-5xl">🔍</span>
            <p className="text-zinc-500 text-base">{t("noEvents")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                freeLabel={t("free")}
                endedLabel={t("eventEnded")}
                joinedLabel={joinedLabel(event)}
                organizerLabel={t("organizedBy")}
                href={`/discover/${event.id}`}
                onViewed={rememberEvent}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
