"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toggleTeamRecruitment } from "@/app/actions/team";

export default function TeamRecruitmentToggle({
  teamId,
  initialOpen,
}: {
  teamId: string;
  initialOpen: boolean;
}) {
  const t = useTranslations("TournamentPanel");
  const [open, setOpen] = useState(initialOpen);
  const [copied, setCopied] = useState(false);
  const [, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      const res = await toggleTeamRecruitment(teamId);
      if (res.recruitmentOpen !== undefined) setOpen(res.recruitmentOpen);
    });
  }

  function handleCopy() {
    const url = `${window.location.origin}/teams/${teamId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Invite link */}
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-xs font-extrabold uppercase tracking-wide text-zinc-500 mb-1">
          {t("inviteLink")}
        </p>
        <p className="text-sm text-zinc-500 mb-3">{t("inviteLinkDesc")}</p>
        <button
          type="button"
          onClick={handleCopy}
          className="w-full rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-zinc-700 transition-colors"
        >
          {copied ? t("copied") : t("copyInviteLink")}
        </button>
      </div>

      {/* Recruitment toggle */}
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-xs font-extrabold uppercase tracking-wide text-zinc-500 mb-1">
          {t("openRecruitment")}
        </p>
        <p className="text-sm text-zinc-500 mb-4">
          {open ? t("recruitmentOpen") : t("recruitmentClosed")}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-zinc-700">
            {open ? t("recruitmentOn") : t("recruitmentOff")}
          </span>
          <button
            type="button"
            onClick={handleToggle}
            className={`relative w-10 h-5 rounded-full transition-colors ${open ? "bg-[#e21d12]" : "bg-zinc-200"}`}
            aria-pressed={open}
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${open ? "left-[calc(100%-18px)]" : "left-0.5"}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
