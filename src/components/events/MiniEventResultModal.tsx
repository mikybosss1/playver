"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import type { MiniEventResultEntry, TournamentPlayer } from "@/app/actions/miniEvent";
import { submitMiniEventResult } from "@/app/actions/miniEvent";

export default function MiniEventResultModal({
  miniEventId,
  title,
  allPlayers,
  initialResults,
  onClose,
  onSaved,
}: {
  miniEventId: string;
  title: string;
  allPlayers: TournamentPlayer[];
  initialResults: MiniEventResultEntry[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("EventDetails");
  const [entries, setEntries] = useState<MiniEventResultEntry[]>(initialResults);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const addedIds = new Set(entries.map((e) => e.userId));
  const candidates = allPlayers.filter(
    (p) =>
      !addedIds.has(p.userId) &&
      (p.name.toLowerCase().includes(search.toLowerCase()) || search === "")
  );

  function addPlayer(player: TournamentPlayer) {
    setEntries((prev) => [...prev, { userId: player.userId, name: player.name, image: player.image, score: 0 }]);
    setSearch("");
  }

  function removePlayer(userId: string) {
    setEntries((prev) => prev.filter((e) => e.userId !== userId));
  }

  function setScore(userId: string, value: number) {
    const clamped = Math.max(0, Number.isFinite(value) ? Math.trunc(value) : 0);
    setEntries((prev) => prev.map((e) => (e.userId === userId ? { ...e, score: clamped } : e)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (entries.length === 0) {
      setError(t("miniEventNoParticipants"));
      return;
    }
    startTransition(async () => {
      const result = await submitMiniEventResult(
        miniEventId,
        entries.map((entry) => ({ userId: entry.userId, score: entry.score }))
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      onSaved();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-zinc-100">
          <div>
            <h2 className="text-lg font-extrabold text-zinc-900">{t("enterResult")}</h2>
            <p className="mt-0.5 text-xs text-zinc-500">{title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto">
          <div className="border-b border-zinc-100 px-6 py-3">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("miniEventAddParticipant")}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 focus:ring-2 focus:ring-red-200"
              />
              {search && candidates.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-lg">
                  {candidates.map((player) => (
                    <button
                      key={player.userId}
                      type="button"
                      onClick={() => addPlayer(player)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-50"
                    >
                      {player.image ? (
                        <Image src={player.image} alt={player.name} width={24} height={24} className="size-6 rounded-full object-cover" />
                      ) : (
                        <span className="flex size-6 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-bold text-zinc-500">
                          {player.name[0]?.toUpperCase()}
                        </span>
                      )}
                      <span className="font-semibold text-zinc-800">{player.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 px-6 py-4">
            {entries.length === 0 ? (
              <p className="py-4 text-center text-sm text-zinc-400">{t("miniEventNoParticipants")}</p>
            ) : (
              entries.map((entry) => (
                <div key={entry.userId} className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-white p-3">
                  {entry.image ? (
                    <Image src={entry.image} alt={entry.name} width={32} height={32} className="size-8 shrink-0 rounded-full object-cover" />
                  ) : (
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-bold text-zinc-500">
                      {entry.name[0]?.toUpperCase()}
                    </span>
                  )}
                  <p className="min-w-0 flex-1 truncate text-sm font-bold text-zinc-900">{entry.name}</p>
                  <input
                    type="number"
                    min={0}
                    value={entry.score}
                    onChange={(ev) => setScore(entry.userId, ev.target.value === "" ? 0 : Number(ev.target.value))}
                    className="w-16 rounded-lg border border-zinc-200 px-2 py-1.5 text-center text-sm font-extrabold text-zinc-950 outline-none focus:ring-2 focus:ring-red-200"
                  />
                  <button
                    type="button"
                    onClick={() => removePlayer(entry.userId)}
                    className="shrink-0 text-xs font-semibold text-red-500 hover:underline"
                  >
                    {t("delete")}
                  </button>
                </div>
              ))
            )}
          </div>

          {error && <p className="px-6 pb-4 text-sm font-semibold text-red-600">{error}</p>}

          <div className="flex gap-3 border-t border-zinc-100 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-zinc-200 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-lg bg-[#e21d12] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#d41810] disabled:opacity-50"
            >
              {isPending ? t("saving") : t("saveResult")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
