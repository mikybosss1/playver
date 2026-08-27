"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

// Placeholder sample people — Follow/followers isn't a real feature yet.
const SAMPLE_PEOPLE = [
  { name: "Maria Santos", initial: "M", color: "#0ea5e9", role: "Forward · Soccer · Montréal", mutual: 3 },
  { name: "Jordan Mensah", initial: "J", color: "#71717a", role: "Guard · Basketball · Toronto", mutual: 1 },
  { name: "Élite Sports Academy", initial: "E", color: "#e21d12", role: "Sports Academy · Montréal", mutual: 5 },
];

export default function PeopleToFollowCard() {
  const t = useTranslations("HomeFeed");
  const [following, setFollowing] = useState<Record<string, boolean>>({});

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
      <p className="font-bold text-zinc-900 mb-4">{t("peopleToFollowTitle")}</p>
      <div className="flex flex-col gap-4">
        {SAMPLE_PEOPLE.map((person) => {
          const isFollowing = following[person.name] ?? false;
          return (
            <div key={person.name} className="flex items-center gap-3">
              <span
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                style={{ backgroundColor: person.color }}
              >
                {person.initial}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-zinc-900 truncate">{person.name}</p>
                <p className="text-xs text-zinc-400 truncate">{person.role}</p>
                <p className="text-[11px] text-zinc-400">{t("mutualConnections", { count: person.mutual })}</p>
              </div>
              <button
                type="button"
                onClick={() => setFollowing((f) => ({ ...f, [person.name]: !isFollowing }))}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  isFollowing
                    ? "bg-zinc-100 border-zinc-200 text-zinc-600"
                    : "border-[#e21d12] text-[#e21d12] hover:bg-red-50"
                }`}
              >
                {isFollowing ? t("following") : t("follow")}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
