"use client";

// Progress bar shown in OrganizerSidebar; `percent` comes from
// computeCompleteness() (src/lib/organization-completeness.ts).
import { useTranslations } from "next-intl";

export default function HqCompletenessBar({ percent }: { percent: number }) {
  const t = useTranslations("Organizer");

  return (
    <div className="px-3 pb-4 pt-3 border-t border-zinc-100">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-zinc-500">{t("hqCompletenessLabel")}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
        <div className="h-full rounded-full bg-[#e21d12] transition-all" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-1.5 text-xs text-zinc-400">{t("hqCompletenessValue", { percent })}</p>
    </div>
  );
}
