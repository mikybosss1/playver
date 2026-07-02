"use client";

import { useState, useTransition } from "react";
import { leaveTeam } from "@/app/actions/team";
import { useRouter } from "next/navigation";

interface Props {
  teamId: string;
  leaveLabel: string;
}

export default function LeaveTeamButton({ teamId, leaveLabel }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await leaveTeam(teamId);
      if (result.error) {
        console.error("[LeaveTeamButton]", result.error);
        setError(result.error);
        return;
      }
      try {
        window.dispatchEvent(new CustomEvent("teamMembershipChanged", { detail: { teamId, member: false } }));
      } catch {
        // ignore in SSR or environments without window
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleClick}
        disabled={isPending}
        className="mt-auto px-4 py-2 text-xs font-semibold rounded-lg border border-zinc-300 text-zinc-600 hover:bg-zinc-50 transition-colors disabled:opacity-60"
      >
        {isPending ? "..." : leaveLabel}
      </button>
      {error && <p className="text-xs text-red-500 text-center">{error}</p>}
    </div>
  );
}
