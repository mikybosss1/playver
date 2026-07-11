"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { AthleteGameHistoryItem } from "@/app/actions/game";
import GameStatsModal from "@/components/GameStatsModal";
import { sportTracksBoxScore } from "@/lib/game-sports";

function formatGameDate(iso: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));
}

export default function AthleteGameHistory({ games }: { games: AthleteGameHistoryItem[] }) {
  const t = useTranslations("AthleteProfile");
  const [selected, setSelected] = useState<AthleteGameHistoryItem | null>(null);

  if (games.length === 0) {
    return (
      <section id="games" className="mb-6 scroll-mt-20">
        <h2 className="text-lg font-extrabold text-zinc-900 mb-4">{t("gameHistory")}</h2>
        <div className="bg-white rounded-2xl border border-zinc-200 p-8 text-center text-zinc-500 text-sm">
          {t("noGameHistory")}
        </div>
      </section>
    );
  }

  return (
    <section id="games" className="mb-6 scroll-mt-20">
      <h2 className="text-lg font-extrabold text-zinc-900 mb-4">{t("gameHistory")}</h2>
      <div className="flex flex-col gap-3">
        {games.map((game) => (
          <button
            key={game.gameId}
            type="button"
            onClick={() => setSelected(game)}
            className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 text-left transition-shadow hover:shadow-md"
          >
            <div
              className={`flex size-11 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${
                game.won ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
              }`}
            >
              {game.won ? t("winBadge") : t("lossBadge")}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-zinc-900">
                {game.teamName} <span className="text-zinc-300">{t("vsShort")}</span> {game.opponentTeamName}
              </p>
              <p className="mt-0.5 truncate text-xs text-zinc-400">
                {game.tournamentTitle} · {formatGameDate(game.scheduledTime)}
              </p>
              {sportTracksBoxScore(game.sport) && (
                <p className="mt-1 text-xs font-semibold text-zinc-500">
                  {game.myStats.points} {t("ptsShort")} · {game.myStats.rebounds} {t("rebShort")} · {game.myStats.assists} {t("astShort")}
                </p>
              )}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-lg font-extrabold text-zinc-950">
                {game.teamScore}-{game.opponentScore}
              </p>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <GameStatsModal
          homeTeamName={selected.homeTeamName}
          awayTeamName={selected.awayTeamName}
          homeScore={selected.isHome ? selected.teamScore : selected.opponentScore}
          awayScore={selected.isHome ? selected.opponentScore : selected.teamScore}
          sport={selected.sport}
          round={selected.round}
          court={selected.court}
          homeRoster={selected.homeRoster}
          awayRoster={selected.awayRoster}
          onClose={() => setSelected(null)}
        />
      )}
    </section>
  );
}
