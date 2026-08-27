"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import FeedSidebar, { type FeedView } from "@/components/home-feed/FeedSidebar";
import HomeFeedMobileNav from "@/components/home-feed/HomeFeedMobileNav";

// Home/Events are swapped in place client-side (not real navigation) so the
// sidebar/shell stays mounted — clicking "Events" shows the same content as
// the standalone /events page without leaving this page.
export default function HomeFeedShell({
  user,
  hasOrganization,
  homeContent,
  rightRail,
  eventsContent,
}: {
  user: { name: string; email: string };
  hasOrganization: boolean;
  homeContent: ReactNode;
  rightRail: ReactNode;
  eventsContent: ReactNode;
}) {
  const t = useTranslations("HomeFeed");
  const [view, setView] = useState<FeedView>("home");
  const initial = (user.name.split(" ")[0]?.[0] ?? "?").toUpperCase();

  return (
    <div className="flex flex-1 bg-zinc-100 min-h-screen">
      <FeedSidebar user={user} activeView={view} onNavigate={setView} hasOrganization={hasOrganization} />

      <main className="flex-1 min-w-0 pb-20 lg:pb-8">
        <div className="flex justify-end items-center gap-3 px-4 md:px-8 py-4">
          <button
            type="button"
            disabled
            title={t("comingSoon")}
            className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-400 bg-white border border-zinc-200 cursor-not-allowed"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </button>
          <Link href="/dashboard/profile" className="w-9 h-9 rounded-full bg-[#e21d12] flex items-center justify-center text-white text-sm font-bold">
            {initial}
          </Link>
        </div>

        {view === "home" ? (
          <div className="px-4 md:px-8 grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start">
            <div className="flex flex-col gap-4 min-w-0 max-w-2xl">{homeContent}</div>
            <div className="flex flex-col gap-4">{rightRail}</div>
          </div>
        ) : (
          eventsContent
        )}
      </main>

      <HomeFeedMobileNav activeView={view} onNavigate={setView} />
    </div>
  );
}
