"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type EventType = "all" | "league" | "tournament" | "pickup" | "activity";
type Sport =
  | "all" | "soccer" | "basketball" | "volleyball" | "pickleball"
  | "tennis" | "hockey" | "baseball" | "cricket" | "rugby" | "other";

export default function DiscoverSearch() {
  const t = useTranslations("Discover");

  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState<EventType>("all");
  const [sport, setSport] = useState<Sport>("all");
  const [upcomingOnly, setUpcomingOnly] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-6">
      {/* Search bar */}
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
          onChange={(e) => { setSearch(e.target.value); setSubmitted(false); }}
          placeholder={t("searchPlaceholder")}
          className="w-full pl-11 pr-4 py-3 text-sm bg-zinc-100 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-red-200 placeholder:text-zinc-400 text-zinc-800"
        />
      </div>

      {/* Event type tabs */}
      <div className="flex flex-wrap gap-2">
        {eventTypes.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => { setActiveType(key); setSubmitted(false); }}
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

      {/* Sport filter + upcoming toggle + CTA */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Sport dropdown */}
        <div className="relative">
          <select
            value={sport}
            onChange={(e) => { setSport(e.target.value as Sport); setSubmitted(false); }}
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

        {/* Upcoming Only toggle */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div
            onClick={() => { setUpcomingOnly((v) => !v); setSubmitted(false); }}
            className={`relative w-10 h-5 rounded-full transition-colors ${upcomingOnly ? "bg-[#e21d12]" : "bg-zinc-200"}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${upcomingOnly ? "translate-x-5" : "translate-x-0.5"}`} />
          </div>
          <span className="text-sm text-zinc-600 font-medium">{t("upcomingOnly")}</span>
        </label>

        {/* Find Events button */}
        <button
          type="submit"
          className="ml-auto px-6 py-2.5 text-sm font-semibold text-white rounded-lg bg-[#e21d12] hover:bg-[#d41810] transition-colors shadow-sm"
        >
          {t("findEvents")}
        </button>
      </div>

      {/* Empty state (shown after search) */}
      {submitted && (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <span className="text-5xl">🔍</span>
          <p className="text-zinc-500 text-base">{t("noEvents")}</p>
        </div>
      )}
    </form>
  );
}
