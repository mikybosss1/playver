"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type AudienceKey = "individuals" | "organizations" | "brands";

const GRADIENTS: Record<AudienceKey, string> = {
  individuals: "linear-gradient(135deg, #27272a 0%, #52525b 100%)",
  organizations: "linear-gradient(135deg, #7f1d1d 0%, #e21d12 100%)",
  brands: "linear-gradient(135deg, #18181b 0%, #7f1d1d 100%)",
};

export default function WhoIsPlayverFor() {
  const t = useTranslations("AudienceSelector");
  const [selected, setSelected] = useState<AudienceKey>("individuals");

  const audiences: { key: AudienceKey; label: string; panelTitle: string; panelDescription: string }[] = [
    {
      key: "individuals",
      label: t("individualsLabel"),
      panelTitle: t("individualsPanelTitle"),
      panelDescription: t("individualsPanelDescription"),
    },
    {
      key: "organizations",
      label: t("organizationsLabel"),
      panelTitle: t("organizationsPanelTitle"),
      panelDescription: t("organizationsPanelDescription"),
    },
    {
      key: "brands",
      label: t("brandsLabel"),
      panelTitle: t("brandsPanelTitle"),
      panelDescription: t("brandsPanelDescription"),
    },
  ];

  const active = audiences.find((a) => a.key === selected) ?? audiences[0];

  return (
    <section className="py-20 sm:py-28 bg-zinc-50">
      <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <div>
          <p className="text-sm font-bold tracking-wide uppercase text-[#e21d12] mb-4">
            {t("eyebrow")}
          </p>
          <h2
            className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-3"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            {t("heading")}
          </h2>
          <p className="text-lg font-semibold text-zinc-800 mb-3">{t("subheading")}</p>
          <p className="text-zinc-500 leading-relaxed mb-8 max-w-lg">{t("description")}</p>

          <div className="flex flex-col gap-3">
            {audiences.map((audience) => {
              const isSelected = audience.key === selected;
              return (
                <button
                  key={audience.key}
                  type="button"
                  onClick={() => setSelected(audience.key)}
                  className={`flex items-center justify-between px-5 py-4 rounded-xl border-2 text-left transition-colors ${
                    isSelected ? "border-[#e21d12] bg-red-50" : "border-zinc-200 bg-white hover:border-zinc-300"
                  }`}
                >
                  <span className={`font-bold ${isSelected ? "text-[#e21d12]" : "text-zinc-900"}`}>
                    {audience.label}
                  </span>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={isSelected ? "text-[#e21d12]" : "text-zinc-400"}
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              );
            })}
          </div>
        </div>

        <div
          className="relative rounded-2xl overflow-hidden aspect-[4/3] lg:aspect-square flex items-end p-8 shadow-lg transition-[background] duration-500"
          style={{ background: GRADIENTS[selected] }}
        >
          <div className="relative z-10">
            <p className="text-xl sm:text-2xl font-bold text-white mb-1" style={{ fontFamily: "var(--font-playfair)" }}>
              {active.panelTitle}
            </p>
            <p className="text-sm text-white/80 max-w-sm">{active.panelDescription}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
