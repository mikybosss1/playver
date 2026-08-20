"use client";

import { useTranslations } from "next-intl";
import { slugify } from "@/lib/slug";
import { COUNTRY_OPTIONS, LANGUAGE_OPTIONS, SPORTS_OPTIONS, type StepProps } from "./types";

const inputClass =
  "w-full px-4 py-3 text-sm bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 placeholder:text-zinc-400 text-zinc-800";
const labelClass = "text-sm font-semibold text-zinc-700";

export default function Step2Identity({ state, update }: StepProps) {
  const t = useTranslations("Organizer");

  function handleNameChange(name: string) {
    const patch: Partial<typeof state> = { name };
    if (!state.slugTouched) patch.slug = slugify(name);
    update(patch);
  }

  function toggleSport(sport: string) {
    update({
      sports: state.sports.includes(sport)
        ? state.sports.filter((s) => s !== sport)
        : [...state.sports, sport],
    });
  }

  return (
    <div>
      <p className="text-xs font-bold tracking-wide uppercase text-[#e21d12] mb-2">
        {t("wizardStepLabel", { current: 2, total: 10 })}
      </p>
      <h2 className="text-2xl font-extrabold text-zinc-900 mb-2" style={{ fontFamily: "var(--font-playfair)" }}>
        {t("wizardIdentityTitle")}
      </h2>
      <p className="text-sm text-zinc-500 mb-8 max-w-md">{t("wizardIdentitySubtitle")}</p>

      <div className="flex flex-col gap-5 max-w-xl">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>{t("wizardOrgNameLabel")} *</label>
          <input
            type="text"
            value={state.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder={t("wizardOrgNamePlaceholder")}
            maxLength={200}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>{t("wizardCityLabel")} *</label>
            <input
              type="text"
              value={state.city}
              onChange={(e) => update({ city: e.target.value })}
              placeholder={t("wizardCityPlaceholder")}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>{t("wizardProvinceLabel")} *</label>
            <input
              type="text"
              value={state.province}
              onChange={(e) => update({ province: e.target.value })}
              placeholder={t("wizardProvincePlaceholder")}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>{t("wizardCountryLabel")} *</label>
            <select value={state.country} onChange={(e) => update({ country: e.target.value })} className={inputClass}>
              {COUNTRY_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>{t("wizardLanguageLabel")}</label>
            <select value={state.primaryLanguage} onChange={(e) => update({ primaryLanguage: e.target.value })} className={inputClass}>
              {LANGUAGE_OPTIONS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className={labelClass}>{t("wizardSportsLabel")} *</label>
          <div className="flex flex-wrap gap-2">
            {SPORTS_OPTIONS.map((sport) => {
              const selected = state.sports.includes(sport);
              return (
                <button
                  key={sport}
                  type="button"
                  onClick={() => toggleSport(sport)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                    selected ? "bg-[#e21d12] border-[#e21d12] text-white" : "bg-zinc-50 border-zinc-200 text-zinc-700 hover:border-zinc-400"
                  }`}
                >
                  {sport}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>{t("wizardSlugLabel")} *</label>
          <div className="flex items-center rounded-lg border border-zinc-200 bg-zinc-50 focus-within:ring-2 focus-within:ring-red-200 focus-within:border-red-300">
            <span className="pl-4 text-sm text-zinc-400 select-none">playver.com/</span>
            <input
              type="text"
              value={state.slug}
              onChange={(e) => update({ slug: slugify(e.target.value), slugTouched: true })}
              className="flex-1 py-3 pr-4 text-sm bg-transparent outline-none text-zinc-800"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>{t("wizardShortDescLabel")} *</label>
          <textarea
            value={state.shortDescription}
            onChange={(e) => update({ shortDescription: e.target.value.slice(0, 160) })}
            rows={2}
            placeholder={t("wizardShortDescPlaceholder")}
            className={`${inputClass} resize-none`}
          />
          <span className="self-end text-xs text-zinc-400">{state.shortDescription.length}/160</span>
        </div>
      </div>
    </div>
  );
}
