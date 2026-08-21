"use client";

// Score + (sport-permitting) per-player box-score entry form for a
// completed game. The box-score rows only render when
// sportTracksBoxScore(sport) is true; otherwise this is just a final-score
// form. Read-only counterpart is GameStatsModal.
import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import type { GameDetail, PlayerBoxScore } from "@/app/actions/game";
import { submitGameResult } from "@/app/actions/game";
import { sportTracksBoxScore } from "@/lib/game-sports";

type StatKey = "points" | "rebounds" | "assists" | "steals" | "blocks";
const STAT_KEYS: StatKey[] = ["points", "rebounds", "assists", "steals", "blocks"];
const STAT_LABELS: Record<StatKey, string> = {
  points: "PTS",
  rebounds: "REB",
  assists: "AST",
  steals: "STL",
  blocks: "BLK",
};

export default function GameResultModal({
  detail,
  sport,
  onClose,
  onSaved,
}: {
  detail: GameDetail;
  sport: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("EventDetails");
  const tracksBoxScore = sportTracksBoxScore(sport);
  const [homeStats, setHomeStats] = useState<Record<string, PlayerBoxScore>>(() =>
    Object.fromEntries(detail.homeRoster.map((p) => [p.userId, p]))
  );
  const [awayStats, setAwayStats] = useState<Record<string, PlayerBoxScore>>(() =>
    Object.fromEntries(detail.awayRoster.map((p) => [p.userId, p]))
  );
  const [homeScoreManual, setHomeScoreManual] = useState(detail.homeScore ?? 0);
  const [awayScoreManual, setAwayScoreManual] = useState(detail.awayScore ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const homeScoreFromStats = useMemo(
    () => Object.values(homeStats).reduce((sum, p) => sum + p.points, 0),
    [homeStats]
  );
  const awayScoreFromStats = useMemo(
    () => Object.values(awayStats).reduce((sum, p) => sum + p.points, 0),
    [awayStats]
  );
  const homeScore = tracksBoxScore ? homeScoreFromStats : homeScoreManual;
  const awayScore = tracksBoxScore ? awayScoreFromStats : awayScoreManual;

  function setStat(side: "home" | "away", userId: string, key: StatKey, value: number) {
    const setter = side === "home" ? setHomeStats : setAwayStats;
    const clamped = Math.max(0, Number.isFinite(value) ? Math.trunc(value) : 0);
    setter((prev) => ({ ...prev, [userId]: { ...prev[userId], [key]: clamped } }));
  }

  function adjustStat(side: "home" | "away", userId: string, key: StatKey, delta: number) {
    const stats = side === "home" ? homeStats : awayStats;
    setStat(side, userId, key, stats[userId][key] + delta);
  }

  // "Enter Result" is disabled in the schedule card until both teams are assigned, and
  // submitGameResult() re-validates this server-side — this is just a defensive fallback.
  if (!detail.homeTeamId || !detail.awayTeamId) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
          <p className="text-sm font-semibold text-zinc-700">{t("assignTeamsFirst")}</p>
          <button
            type="button"
            onClick={onClose}
            className="mt-4 w-full rounded-lg border border-zinc-200 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            {t("cancel")}
          </button>
        </div>
      </div>
    );
  }
  const homeTeamId = detail.homeTeamId;
  const awayTeamId = detail.awayTeamId;
  const homeTeamName = detail.homeTeamName ?? t("tbd");
  const awayTeamName = detail.awayTeamName ?? t("tbd");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const stats = tracksBoxScore
      ? [
          ...Object.values(homeStats).map((p) => ({
            userId: p.userId, teamId: homeTeamId,
            points: p.points, rebounds: p.rebounds, assists: p.assists, steals: p.steals, blocks: p.blocks,
          })),
          ...Object.values(awayStats).map((p) => ({
            userId: p.userId, teamId: awayTeamId,
            points: p.points, rebounds: p.rebounds, assists: p.assists, steals: p.steals, blocks: p.blocks,
          })),
        ]
      : [];
    startTransition(async () => {
      const result = await submitGameResult(detail.id, { homeScore, awayScore, stats });
      if (result.error) {
        setError(result.error);
        return;
      }
      onSaved();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-zinc-100">
          <div>
            <h2 className="text-lg font-extrabold text-zinc-900">{t("enterResult")}</h2>
            <p className="mt-0.5 text-xs text-zinc-500">{homeTeamName} {t("vs")} {awayTeamName}</p>
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
          <div className="grid grid-cols-2 gap-4 border-b border-zinc-100 px-6 py-4">
            {tracksBoxScore ? (
              <>
                <ScoreDisplay label={homeTeamName} value={homeScore} />
                <ScoreDisplay label={awayTeamName} value={awayScore} />
              </>
            ) : (
              <>
                <ScoreInput label={homeTeamName} value={homeScoreManual} onChange={setHomeScoreManual} />
                <ScoreInput label={awayTeamName} value={awayScoreManual} onChange={setAwayScoreManual} />
              </>
            )}
          </div>
          {tracksBoxScore && <p className="px-6 pt-3 text-xs text-zinc-400">{t("scoreAutoCalculated")}</p>}

          {tracksBoxScore && (
            <div className="flex flex-col gap-6 px-6 py-4">
              <TeamStatsTable
                teamName={homeTeamName}
                players={Object.values(homeStats)}
                noPlayersLabel={t("noRosterPlayers")}
                onAdjust={(userId, key, delta) => adjustStat("home", userId, key, delta)}
                onSet={(userId, key, value) => setStat("home", userId, key, value)}
              />
              <TeamStatsTable
                teamName={awayTeamName}
                players={Object.values(awayStats)}
                noPlayersLabel={t("noRosterPlayers")}
                onAdjust={(userId, key, delta) => adjustStat("away", userId, key, delta)}
                onSet={(userId, key, value) => setStat("away", userId, key, value)}
              />
            </div>
          )}

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

function ScoreDisplay({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-center">
      <p className="truncate text-xs font-bold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-extrabold text-zinc-950">{value}</p>
    </div>
  );
}

function ScoreInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-center">
      <p className="truncate text-xs font-bold uppercase tracking-wide text-zinc-500">{label}</p>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        className="mt-2 w-full bg-transparent text-center text-3xl font-extrabold text-zinc-950 outline-none"
      />
    </div>
  );
}

function TeamStatsTable({
  teamName,
  players,
  noPlayersLabel,
  onAdjust,
  onSet,
}: {
  teamName: string;
  players: PlayerBoxScore[];
  noPlayersLabel: string;
  onAdjust: (userId: string, key: StatKey, delta: number) => void;
  onSet: (userId: string, key: StatKey, value: number) => void;
}) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-extrabold text-zinc-900">{teamName}</h3>
      {players.length === 0 ? (
        <p className="text-sm text-zinc-400">{noPlayersLabel}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {players.map((player) => (
            <div key={player.userId} className="rounded-xl border border-zinc-100 bg-white p-3">
              <p className="mb-2 truncate text-sm font-bold text-zinc-900">{player.name}</p>
              <div className="grid grid-cols-5 gap-2">
                {STAT_KEYS.map((key) => (
                  <div key={key} className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">{STAT_LABELS[key]}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onAdjust(player.userId, key, -1)}
                        className="flex size-6 shrink-0 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 hover:bg-zinc-50"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={0}
                        value={player[key]}
                        onChange={(e) => onSet(player.userId, key, e.target.value === "" ? 0 : Number(e.target.value))}
                        className="w-9 rounded border border-transparent bg-transparent text-center text-sm font-extrabold text-zinc-950 outline-none focus:border-zinc-200 focus:bg-zinc-50"
                      />
                      <button
                        type="button"
                        onClick={() => onAdjust(player.userId, key, 1)}
                        className="flex size-6 shrink-0 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 hover:bg-zinc-50"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
