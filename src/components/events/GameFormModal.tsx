"use client";

// Create/edit form for a scheduled game within a tournament (teams, court,
// round, time). Home/away teams may be left unset ("TBD") for
// bracket games scheduled before pool play resolves — see
// game-tables.ts's homeTeamId/awayTeamId nullability.
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import type { PublicTournamentTeam } from "@/app/actions/tournament";
import type { Game } from "@/app/actions/game";
import { createGame, updateGame } from "@/app/actions/game";

function toLocalInputValue(iso?: string) {
  const d = iso ? new Date(iso) : new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function GameFormModal({
  tournamentId,
  teams,
  game,
  onClose,
  onSaved,
}: {
  tournamentId: string;
  teams: PublicTournamentTeam[];
  game?: Game;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("EventDetails");
  const [homeTeamId, setHomeTeamId] = useState(game?.homeTeamId ?? "");
  const [awayTeamId, setAwayTeamId] = useState(game?.awayTeamId ?? "");
  const [scheduledTime, setScheduledTime] = useState(() => toLocalInputValue(game?.scheduledTime));
  const [court, setCourt] = useState(game?.court ?? "");
  const [round, setRound] = useState(game?.round ?? "");
  const [notes, setNotes] = useState(game?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!scheduledTime) {
      setError(t("gameFormMissingFields"));
      return;
    }
    if (homeTeamId && awayTeamId && homeTeamId === awayTeamId) {
      setError(t("gameFormSameTeam"));
      return;
    }
    setError(null);
    startTransition(async () => {
      const payload = {
        homeTeamId: homeTeamId || undefined,
        awayTeamId: awayTeamId || undefined,
        scheduledTime: new Date(scheduledTime).toISOString(),
        court: court.trim() || undefined,
        round: round.trim() || undefined,
        notes: notes.trim() || undefined,
      };
      const result = game ? await updateGame(game.id, payload) : await createGame(tournamentId, payload);
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
          <h2 className="text-lg font-extrabold text-zinc-900">{game ? t("editGame") : t("scheduleGame")}</h2>
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
          <div className="flex flex-col gap-4 px-6 py-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wide text-zinc-500">{t("homeTeam")}</span>
              <select
                value={homeTeamId}
                onChange={(e) => setHomeTeamId(e.target.value)}
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-800 outline-none focus:ring-2 focus:ring-red-200"
              >
                <option value="">{t("selectTeam")}</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wide text-zinc-500">{t("awayTeam")}</span>
              <select
                value={awayTeamId}
                onChange={(e) => setAwayTeamId(e.target.value)}
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-800 outline-none focus:ring-2 focus:ring-red-200"
              >
                <option value="">{t("selectTeam")}</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wide text-zinc-500">{t("gameTime")}</span>
              <input
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-800 outline-none focus:ring-2 focus:ring-red-200"
              />
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wide text-zinc-500">{t("court")}</span>
                <input
                  type="text"
                  value={court}
                  onChange={(e) => setCourt(e.target.value)}
                  placeholder={t("courtPlaceholder")}
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-800 outline-none focus:ring-2 focus:ring-red-200"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wide text-zinc-500">{t("round")}</span>
                <input
                  type="text"
                  value={round}
                  onChange={(e) => setRound(e.target.value)}
                  placeholder={t("roundPlaceholder")}
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-800 outline-none focus:ring-2 focus:ring-red-200"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wide text-zinc-500">{t("notes")}</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("notesPlaceholder")}
                rows={3}
                className="resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-800 outline-none focus:ring-2 focus:ring-red-200"
              />
            </label>

            {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
          </div>

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
              {isPending ? t("saving") : t("save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
