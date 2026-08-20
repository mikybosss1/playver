"use client";

import { useTranslations } from "next-intl";
import type { StepProps } from "./types";

const ORG_TYPES = [
  { key: "ACADEMY", icon: "🏆" },
  { key: "CLUB", icon: "🚩" },
  { key: "LEAGUE", icon: "🏢" },
  { key: "SCHOOL_ATHLETICS", icon: "🏫" },
  { key: "TOURNAMENT_ORGANIZER", icon: "📅" },
  { key: "FEDERATION", icon: "🌐" },
  { key: "FACILITY", icon: "🏟️" },
  { key: "COMMUNITY_PROGRAM", icon: "👥" },
] as const;

export default function Step1Type({ state, update }: StepProps) {
  const t = useTranslations("Organizer");

  return (
    <div>
      <p className="text-xs font-bold tracking-wide uppercase text-[#e21d12] mb-2">
        {t("wizardStepLabel", { current: 1, total: 10 })}
      </p>
      <h2 className="text-2xl font-extrabold text-zinc-900 mb-2" style={{ fontFamily: "var(--font-playfair)" }}>
        {t("wizardTypeTitle")}
      </h2>
      <p className="text-sm text-zinc-500 mb-8 max-w-md">{t("wizardTypeSubtitle")}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        {ORG_TYPES.map(({ key, icon }) => {
          const selected = state.organizationType === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => update({ organizationType: key })}
              className={`flex items-start gap-3 text-left p-4 rounded-xl border-2 transition-colors ${
                selected ? "border-[#e21d12] bg-red-50" : "border-zinc-200 bg-white hover:border-zinc-300"
              }`}
            >
              <span className="text-2xl leading-none shrink-0">{icon}</span>
              <span>
                <span className="block text-sm font-bold text-zinc-900">{t(`wizardType_${key}_label`)}</span>
                <span className="block text-xs text-zinc-500 mt-0.5">{t(`wizardType_${key}_desc`)}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
