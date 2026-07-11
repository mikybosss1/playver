"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import type { PlayerBoxScore } from "@/app/actions/game";

const STAT_ORDER: (keyof Pick<PlayerBoxScore, "points" | "rebounds" | "assists" | "steals" | "blocks">)[] = [
  "points", "rebounds", "assists", "steals", "blocks",
];
const STAT_LABELS: Record<string, string> = {
  points: "PTS", rebounds: "REB", assists: "AST", steals: "STL", blocks: "BLK",
};

export default function GameStatsModal({
  homeTeamName,
  awayTeamName,
  homeScore,
  awayScore,
  round,
  court,
  homeRoster,
  awayRoster,
  onClose,
}: {
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  round?: string | null;
  court?: string | null;
  homeRoster: PlayerBoxScore[];
  awayRoster: PlayerBoxScore[];
  onClose: () => void;
}) {
  const t = useTranslations("EventDetails");
  const homeWon = homeScore > awayScore;
  const awayWon = awayScore > homeScore;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-zinc-100 px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">
              {[round, court].filter(Boolean).join(" · ") || t("gameDetails")}
            </p>
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
          <div className="mt-3 flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className={`truncate text-lg font-extrabold ${homeWon ? "text-zinc-950" : "text-zinc-400"}`}>{homeTeamName}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2 text-2xl font-extrabold text-zinc-950">
              <span>{homeScore}</span>
              <span className="text-zinc-300">–</span>
              <span>{awayScore}</span>
            </div>
            <div className="min-w-0 flex-1 text-right">
              <p className={`truncate text-lg font-extrabold ${awayWon ? "text-zinc-950" : "text-zinc-400"}`}>{awayTeamName}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-4">
          <BoxScoreTable teamName={homeTeamName} players={homeRoster} />
          <BoxScoreTable teamName={awayTeamName} players={awayRoster} />
        </div>
      </div>
    </div>
  );
}

function BoxScoreTable({ teamName, players }: { teamName: string; players: PlayerBoxScore[] }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-extrabold text-zinc-900">{teamName}</h3>
      <div className="overflow-x-auto rounded-xl border border-zinc-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-50 text-left text-[10px] font-extrabold uppercase tracking-wide text-zinc-400">
              <th className="px-3 py-2">Player</th>
              {STAT_ORDER.map((key) => (
                <th key={key} className="px-2 py-2 text-center">{STAT_LABELS[key]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {players.map((player) => (
              <tr key={player.userId} className="border-t border-zinc-100">
                <td className="max-w-[160px] truncate px-3 py-2 font-semibold text-zinc-900">
                  <Link href={`/athletes/${player.userId}`} className="hover:text-[#e21d12] hover:underline">
                    {player.name}
                  </Link>
                </td>
                {STAT_ORDER.map((key) => (
                  <td key={key} className="px-2 py-2 text-center font-bold text-zinc-700">{player[key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
