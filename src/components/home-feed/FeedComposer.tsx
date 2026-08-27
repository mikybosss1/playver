"use client";

import { useTranslations } from "next-intl";
import CreateEventButton from "@/components/events/CreateEventButton";

const composerActionClass =
  "flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-700 transition-colors";

export default function FeedComposer({ userInitial }: { userInitial: string }) {
  const t = useTranslations("HomeFeed");

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-full bg-[#e21d12] flex items-center justify-center text-white text-sm font-bold shrink-0">
          {userInitial}
        </span>
        <input
          type="text"
          readOnly
          placeholder={t("composerPlaceholder")}
          className="flex-1 min-w-0 bg-zinc-50 border border-zinc-200 rounded-full px-4 py-2.5 text-sm text-zinc-500 placeholder:text-zinc-400 outline-none cursor-default"
        />
      </div>
      <div className="flex items-center gap-6 mt-4 pt-4 border-t border-zinc-100">
        <button type="button" className={composerActionClass}>
          <span aria-hidden>📷</span>
          {t("composerPhoto")}
        </button>
        <button type="button" className={composerActionClass}>
          <span aria-hidden>🎬</span>
          {t("composerVideo")}
        </button>
        <CreateEventButton
          label={t("composerEvent")}
          icon={<span aria-hidden>📅</span>}
          className={composerActionClass}
        />
        <button type="button" className={composerActionClass}>
          <span aria-hidden>🏆</span>
          {t("composerAchievement")}
        </button>
      </div>
    </div>
  );
}
