"use client";

// Organizer control for cancelling or postponing an event. `isPaid` changes
// the cancel-confirm copy (cancelling a paid event triggers automatic
// refunds — see event.ts's cancelEvent, and the withdrawal-hold logic in
// organizer-wallet.ts that keeps funds available for exactly this case).
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { cancelEvent, postponeEvent } from "@/app/actions/event";

type View = "closed" | "choice" | "cancel-confirm" | "postpone-form";

export default function EventCancelPostponeButton({
  eventId,
  eventTitle,
  startDateTime,
  endDateTime,
  isPaid,
}: {
  eventId: string;
  eventTitle: string;
  startDateTime: string;
  endDateTime: string;
  isPaid: boolean;
}) {
  const t = useTranslations("EventCancelPostpone");
  const router = useRouter();
  const [view, setView] = useState<View>("closed");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [newStart, setNewStart] = useState(startDateTime.slice(0, 16));
  const [newEnd, setNewEnd] = useState(endDateTime.slice(0, 16));

  function close() {
    setView("closed");
    setError("");
  }

  async function handleCancel() {
    setIsLoading(true);
    setError("");
    const result = await cancelEvent(eventId);
    setIsLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    close();
    router.refresh();
  }

  async function handlePostpone(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    const result = await postponeEvent(eventId, newStart, newEnd);
    setIsLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    close();
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setView("choice")}
        className="block w-full rounded-lg border border-red-200 px-4 py-3 text-center text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
      >
        {t("buttonLabel")}
      </button>

      {view !== "closed" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-5">
            {view === "choice" && (
              <>
                <div>
                  <h2 className="text-lg font-extrabold text-zinc-900">{t("modalTitle")}</h2>
                  <p className="mt-1.5 text-sm text-zinc-500">{t("modalSubtitle", { eventTitle })}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setView("postpone-form")}
                    className="w-full py-2.5 text-sm font-semibold text-zinc-700 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
                  >
                    {t("postponeOption")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("cancel-confirm")}
                    className="w-full py-2.5 text-sm font-semibold text-white bg-[#e21d12] rounded-lg hover:bg-[#d41810] transition-colors"
                  >
                    {t("cancelOption")}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={close}
                  className="text-sm font-semibold text-zinc-500 hover:text-zinc-700 transition-colors"
                >
                  {t("close")}
                </button>
              </>
            )}

            {view === "cancel-confirm" && (
              <>
                <div>
                  <h2 className="text-lg font-extrabold text-zinc-900">{t("cancelConfirmTitle")}</h2>
                  <p className="mt-1.5 text-sm text-zinc-500">
                    {isPaid ? t("cancelConfirmPaidBody", { eventTitle }) : t("cancelConfirmBody", { eventTitle })}
                  </p>
                </div>
                {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setView("choice")}
                    disabled={isLoading}
                    className="flex-1 py-2.5 text-sm font-semibold text-zinc-700 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors disabled:opacity-50"
                  >
                    {t("back")}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="flex-1 py-2.5 text-sm font-semibold text-white bg-[#e21d12] rounded-lg hover:bg-[#d41810] transition-colors disabled:opacity-60"
                  >
                    {isLoading ? t("cancelling") : t("confirmCancel")}
                  </button>
                </div>
              </>
            )}

            {view === "postpone-form" && (
              <form onSubmit={handlePostpone} className="flex flex-col gap-5">
                <div>
                  <h2 className="text-lg font-extrabold text-zinc-900">{t("postponeTitle")}</h2>
                  <p className="mt-1.5 text-sm text-zinc-500">{t("postponeBody")}</p>
                </div>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-wide text-zinc-500">{t("newStart")}</span>
                  <input
                    type="datetime-local"
                    value={newStart}
                    onChange={(e) => setNewStart(e.target.value)}
                    required
                    className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-800 outline-none focus:ring-2 focus:ring-red-200"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-wide text-zinc-500">{t("newEnd")}</span>
                  <input
                    type="datetime-local"
                    value={newEnd}
                    onChange={(e) => setNewEnd(e.target.value)}
                    required
                    className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-800 outline-none focus:ring-2 focus:ring-red-200"
                  />
                </label>
                {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setView("choice")}
                    disabled={isLoading}
                    className="flex-1 py-2.5 text-sm font-semibold text-zinc-700 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors disabled:opacity-50"
                  >
                    {t("back")}
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-2.5 text-sm font-semibold text-white bg-[#e21d12] rounded-lg hover:bg-[#d41810] transition-colors disabled:opacity-60"
                  >
                    {isLoading ? t("postponing") : t("confirmPostpone")}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
