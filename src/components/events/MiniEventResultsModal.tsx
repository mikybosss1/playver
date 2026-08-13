"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import type { MiniEventResultEntry } from "@/app/actions/miniEvent";

const MEDALS = ["🥇", "🥈", "🥉"];

export default function MiniEventResultsModal({
  title,
  court,
  results,
  onClose,
}: {
  title: string;
  court?: string | null;
  results: MiniEventResultEntry[];
  onClose: () => void;
}) {
  const t = useTranslations("EventDetails");
  const ranked = [...results].sort((a, b) => b.score - a.score);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-md flex-col rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-zinc-100 px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">{court || t("gameDetails")}</p>
            <button
              type="button"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <h2 className="mt-2 text-xl font-extrabold text-zinc-950">{title}</h2>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {ranked.length === 0 ? (
            <p className="py-4 text-center text-sm text-zinc-400">{t("miniEventNoParticipants")}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {ranked.map((entry, i) => (
                <div key={entry.userId} className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-white p-3">
                  <span className="w-6 shrink-0 text-center text-lg">{MEDALS[i] ?? `${i + 1}.`}</span>
                  {entry.image ? (
                    <Image src={entry.image} alt={entry.name} width={32} height={32} className="size-8 shrink-0 rounded-full object-cover" />
                  ) : (
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-bold text-zinc-500">
                      {entry.name[0]?.toUpperCase()}
                    </span>
                  )}
                  <Link
                    href={`/athletes/${entry.userId}`}
                    className="min-w-0 flex-1 truncate text-sm font-bold text-zinc-900 hover:text-[#e21d12] hover:underline"
                  >
                    {entry.name}
                  </Link>
                  <p className="shrink-0 text-lg font-extrabold text-zinc-950">{entry.score}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
