"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { respondToJoinRequest } from "@/app/actions/tournament";
import type { LinkedTeamJoinRequest } from "@/app/actions/tournament";

export default function TeamJoinRequests({ requests }: { requests: LinkedTeamJoinRequest[] }) {
  const t = useTranslations("TournamentPanel");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const router = useRouter();

  if (requests.length === 0) return null;

  function handleRespond(requestId: string, accept: boolean) {
    startTransition(async () => {
      setError("");
      const res = await respondToJoinRequest(requestId, accept);
      if (res.error) { setError(res.error); return; }
      router.refresh();
    });
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-400">
        {t("joinRequests", { count: requests.length })}
      </p>
      <div className="flex flex-col gap-2">
        {requests.map((req) => (
          <div key={req.id} className="flex items-center gap-2 rounded-lg border border-zinc-100 px-3 py-2">
            <div className="w-6 h-6 shrink-0 flex items-center justify-center rounded-full bg-zinc-100 text-[10px] font-extrabold uppercase text-zinc-500 overflow-hidden">
              {req.userImage ? (
                <Image src={req.userImage} alt={req.userName} width={24} height={24} className="w-6 h-6 object-cover" />
              ) : (
                req.userName[0]
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-zinc-800">{req.userName}</p>
              <p className="truncate text-[10px] text-zinc-400">{req.tournamentTitle}</p>
            </div>
            <div className="flex shrink-0 gap-1.5">
              <button
                type="button"
                onClick={() => handleRespond(req.id, true)}
                disabled={isPending}
                className="rounded-md bg-emerald-500 px-2 py-1 text-[10px] font-bold text-white hover:bg-emerald-600 disabled:opacity-50"
              >
                {t("accept")}
              </button>
              <button
                type="button"
                onClick={() => handleRespond(req.id, false)}
                disabled={isPending}
                className="rounded-md border border-zinc-200 px-2 py-1 text-[10px] font-bold text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
              >
                {t("decline")}
              </button>
            </div>
          </div>
        ))}
      </div>
      {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
    </div>
  );
}
