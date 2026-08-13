"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { joinTeamViaInvite } from "@/app/actions/tournament";

export default function InviteAcceptButtons({
  inviteCode,
  tournamentId,
}: {
  inviteCode: string;
  tournamentId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const router = useRouter();

  function handleAccept() {
    startTransition(async () => {
      setError("");
      const res = await joinTeamViaInvite(inviteCode);
      if (res.error) { setError(res.error); return; }
      router.push(`/tournaments/${tournamentId}`);
    });
  }

  function handleDecline() {
    router.push(`/tournaments/${tournamentId}`);
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      {error && (
        <p className="text-sm font-semibold text-red-600 text-center">{error}</p>
      )}
      <button
        type="button"
        onClick={handleAccept}
        disabled={isPending}
        className="w-full px-4 py-3 text-sm font-bold rounded-xl bg-[#e21d12] text-white hover:bg-[#d41810] transition-colors disabled:opacity-60"
      >
        {isPending ? "Joining..." : "Yes, Join Team"}
      </button>
      <button
        type="button"
        onClick={handleDecline}
        disabled={isPending}
        className="w-full px-4 py-3 text-sm font-semibold rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-60"
      >
        No, Decline
      </button>
    </div>
  );
}
