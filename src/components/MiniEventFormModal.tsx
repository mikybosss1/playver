"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import type { MiniEvent } from "@/app/actions/miniEvent";
import { createMiniEvent, updateMiniEvent } from "@/app/actions/miniEvent";

function toLocalInputValue(iso?: string) {
  const d = iso ? new Date(iso) : new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function MiniEventFormModal({
  tournamentId,
  miniEvent,
  onClose,
  onSaved,
}: {
  tournamentId: string;
  miniEvent?: MiniEvent;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("EventDetails");
  const [title, setTitle] = useState(miniEvent?.title ?? "");
  const [scheduledTime, setScheduledTime] = useState(() => toLocalInputValue(miniEvent?.scheduledTime));
  const [court, setCourt] = useState(miniEvent?.court ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !scheduledTime) {
      setError(t("miniEventFormMissingFields"));
      return;
    }
    setError(null);
    startTransition(async () => {
      const payload = {
        title: title.trim(),
        scheduledTime: new Date(scheduledTime).toISOString(),
        court: court.trim() || undefined,
      };
      const result = miniEvent ? await updateMiniEvent(miniEvent.id, payload) : await createMiniEvent(tournamentId, payload);
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
          <h2 className="text-lg font-extrabold text-zinc-900">{miniEvent ? t("editMiniEvent") : t("scheduleMiniEvent")}</h2>
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
              <span className="text-xs font-bold uppercase tracking-wide text-zinc-500">{t("miniEventTitle")}</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("miniEventTitlePlaceholder")}
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-800 outline-none focus:ring-2 focus:ring-red-200"
              />
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
