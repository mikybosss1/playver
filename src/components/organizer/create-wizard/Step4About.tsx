"use client";

import { useTranslations } from "next-intl";
import type { StepProps } from "./types";

const inputClass =
  "w-full px-4 py-3 text-sm bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 placeholder:text-zinc-400 text-zinc-800";
const labelClass = "text-sm font-semibold text-zinc-700";

export default function Step4About({ state, update }: StepProps) {
  const t = useTranslations("Organizer");

  return (
    <div>
      <p className="text-xs font-bold tracking-wide uppercase text-[#e21d12] mb-2">
        {t("wizardStepLabel", { current: 4, total: 10 })}
      </p>
      <h2 className="text-2xl font-extrabold text-zinc-900 mb-2" style={{ fontFamily: "var(--font-playfair)" }}>
        {t("wizardAboutTitle")}
      </h2>
      <p className="text-sm text-zinc-500 mb-8 max-w-md">{t("wizardAboutSubtitle")}</p>

      <div className="flex flex-col gap-5 max-w-xl">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>{t("wizardMissionLabel")}</label>
          <textarea
            value={state.mission}
            onChange={(e) => update({ mission: e.target.value })}
            rows={3}
            placeholder={t("wizardMissionPlaceholder")}
            className={`${inputClass} resize-none`}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>{t("wizardVisionLabel")}</label>
          <textarea
            value={state.vision}
            onChange={(e) => update({ vision: e.target.value })}
            rows={3}
            placeholder={t("wizardVisionPlaceholder")}
            className={`${inputClass} resize-none`}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>{t("wizardHistoryLabel")}</label>
          <textarea
            value={state.history}
            onChange={(e) => update({ history: e.target.value })}
            rows={3}
            placeholder={t("wizardHistoryPlaceholder")}
            className={`${inputClass} resize-none`}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>{t("wizardYearFoundedLabel")}</label>
            <input
              type="number"
              value={state.yearFounded}
              onChange={(e) => update({ yearFounded: e.target.value })}
              placeholder="2009"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>{t("wizardAgeGroupsLabel")}</label>
            <input
              type="text"
              value={state.ageGroups}
              onChange={(e) => update({ ageGroups: e.target.value })}
              placeholder="U8-U18"
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>{t("wizardValuesLabel")}</label>
          <input
            type="text"
            value={state.values}
            onChange={(e) => update({ values: e.target.value })}
            placeholder={t("wizardValuesPlaceholder")}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>{t("wizardAffiliationsLabel")}</label>
          <input
            type="text"
            value={state.affiliations}
            onChange={(e) => update({ affiliations: e.target.value })}
            placeholder={t("wizardAffiliationsPlaceholder")}
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );
}
