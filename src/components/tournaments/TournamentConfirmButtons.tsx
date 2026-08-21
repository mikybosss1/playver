"use client";

// Confirm/decline buttons for the emailed tournament_team_member invite
// link (token-based, no login required — see tournament.ts's
// confirmationToken flow).
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { confirmTournamentMembership, declineTournamentMembership } from "@/app/actions/tournament";

export default function TournamentConfirmButtons({
  token,
  tournamentId,
  initialAction,
}: {
  token: string;
  tournamentId: string;
  initialAction: "confirm" | "decline";
}) {
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [doneAction, setDoneAction] = useState<"confirm" | "decline" | null>(null);
  const [teamName, setTeamName] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  function handle(action: "confirm" | "decline") {
    startTransition(async () => {
      setError("");
      const fn = action === "confirm" ? confirmTournamentMembership : declineTournamentMembership;
      const res = await fn(token);
      if (res.error) { setError(res.error); return; }
      setTeamName(res.teamName ?? "");
      setDoneAction(action);
      setDone(true);
      router.refresh();
    });
  }

  if (done) {
    return (
      <div className={`w-full rounded-xl px-5 py-4 text-sm font-semibold ${
        doneAction === "confirm"
          ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
          : "bg-zinc-100 border border-zinc-200 text-zinc-600"
      }`}>
        {doneAction === "confirm"
          ? `You're confirmed on ${teamName}! See you at the tournament.`
          : `You've declined. Your captain has been notified.`}
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-3">
      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

      <button
        type="button"
        onClick={() => handle("confirm")}
        disabled={isPending}
        className={`w-full px-4 py-3 text-sm font-bold rounded-xl transition-colors disabled:opacity-60 ${
          initialAction === "confirm"
            ? "bg-emerald-500 text-white hover:bg-emerald-600"
            : "border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
        }`}
      >
        {isPending ? "..." : "✓ Yes, I'll be there"}
      </button>

      <button
        type="button"
        onClick={() => handle("decline")}
        disabled={isPending}
        className={`w-full px-4 py-3 text-sm font-bold rounded-xl transition-colors disabled:opacity-60 ${
          initialAction === "decline"
            ? "bg-zinc-100 border border-zinc-200 text-zinc-700 hover:bg-zinc-200"
            : "text-zinc-500 hover:text-zinc-700 underline"
        }`}
      >
        {isPending ? "..." : "✗ Can't make it"}
      </button>
    </div>
  );
}
