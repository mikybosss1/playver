"use client";

// Captain-only kick control for a standalone team member.
import { useState, useTransition } from "react";
import { removeTeamMember } from "@/app/actions/team";

export default function RemoveTeamMemberButton({
  teamId,
  memberId,
}: {
  teamId: string;
  memberId: string;
}) {
  const [, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() =>
            startTransition(async () => {
              await removeTeamMember(teamId, memberId);
              setConfirming(false);
            })
          }
          className="px-2 py-1 text-xs font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
        >
          Confirm
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="px-2 py-1 text-xs font-bold text-zinc-500 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="shrink-0 px-2.5 py-1 text-xs font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
    >
      Remove
    </button>
  );
}
