"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type TabKey = "all" | "following" | "athletes" | "organizations" | "challenges" | "events";

export default function FeedTabs() {
  const t = useTranslations("HomeFeed");
  const [active, setActive] = useState<TabKey>("all");

  const tabs: { key: TabKey; label: string }[] = [
    { key: "all", label: t("tabAll") },
    { key: "following", label: t("tabFollowing") },
    { key: "athletes", label: t("tabAthletes") },
    { key: "organizations", label: t("tabOrganizations") },
    { key: "challenges", label: t("tabChallenges") },
    { key: "events", label: t("tabEvents") },
  ];

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-2 flex items-center gap-1 overflow-x-auto">
      {tabs.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => setActive(key)}
          className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
            active === key ? "bg-[#e21d12] text-white" : "text-zinc-600 hover:bg-zinc-50"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
