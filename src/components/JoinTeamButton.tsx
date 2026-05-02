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
  const router = useRouter();

  function handleClick() {
    startTransition(async () => {
      try {
        if (member) {
          await leaveTeam(teamId);
          setMember(false);
        } else {
          await joinTeam(teamId);
          setMember(true);
        }
        router.refresh();
      } catch {
        // silently ignore
      }
    });
  }

  return (
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
  );
}
