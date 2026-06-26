"use client";

import { useState, useTransition } from "react";
import { joinTeam, leaveTeam } from "@/app/actions/team";
import { useRouter } from "next/navigation";

interface Props {
  teamId: string;
  isMember: boolean;
  joinLabel: string;
  leaveLabel: string;
}

export default function JoinTeamButton({ teamId, isMember, joinLabel, leaveLabel }: Props) {
  const [member, setMember] = useState(isMember);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = member ? await leaveTeam(teamId) : await joinTeam(teamId);
      if (result.error) {
        console.error("[JoinTeamButton]", result.error);
        setError(result.error);
        return;
      }
      setMember(!member);
      try {
        // notify other UI that membership changed so they can update optimistically
        window.dispatchEvent(new CustomEvent("teamMembershipChanged", { detail: { teamId, member: !member } }));
      } catch (e) {
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
        className={`mt-auto px-4 py-2 text-xs font-semibold rounded-lg border transition-colors disabled:opacity-60 ${
          member
            ? "border-zinc-300 text-zinc-600 hover:bg-zinc-50"
            : "bg-[#e21d12] text-white border-[#e21d12] hover:bg-[#d41810]"
        }`}
      >
        {isPending ? "..." : member ? leaveLabel : joinLabel}
      </button>
      {error && <p className="text-xs text-red-500 text-center">{error}</p>}
    </div>
  );
}
