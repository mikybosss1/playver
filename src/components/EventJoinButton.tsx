"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { joinEvent, leaveEvent } from "@/app/actions/event";

export default function EventJoinButton({
  eventId,
  isJoined,
  joinLabel,
  leaveLabel,
}: {
  eventId: string;
  isJoined: boolean;
  joinLabel: string;
  leaveLabel: string;
}) {
  const [joined, setJoined] = useState(isJoined);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    startTransition(async () => {
      try {
        if (joined) {
          await leaveEvent(eventId);
          setJoined(false);
        } else {
          await joinEvent(eventId);
          setJoined(true);
        }
        router.refresh();
      } catch {
        // Keep the current state if the server rejects the request.
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={`mt-auto px-4 py-2 text-xs font-semibold rounded-lg border transition-colors disabled:opacity-60 ${
        joined
          ? "border-zinc-300 text-zinc-600 hover:bg-zinc-50"
          : "bg-[#e21d12] text-white border-[#e21d12] hover:bg-[#d41810]"
      }`}
    >
      {isPending ? "..." : joined ? leaveLabel : joinLabel}
    </button>
  );
}
