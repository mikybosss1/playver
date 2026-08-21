"use client";

// Wizard step 10 of 10: read-only summary of everything entered, a
// completeness score, and the final confirm checkbox that gates
// CreateOrganizationWizard's handlePublish -> publishOrganization() call.
import Image from "next/image";
import { useTranslations } from "next-intl";
import { computeCompleteness } from "@/lib/organization-completeness";
import type { StepProps } from "./types";

export default function Step10Review({
  state,
  confirmed,
  onConfirmedChange,
}: StepProps & { confirmed: boolean; onConfirmedChange: (v: boolean) => void }) {
  const t = useTranslations("Organizer");

  const completeness = computeCompleteness({
    logoUrl: state.logoUrl,
    coverImageUrl: state.coverImageUrl,
    shortDescription: state.shortDescription,
    mission: state.mission,
    publicEmail: state.publicEmail,
    phone: state.phone,
    sports: state.sports,
    primaryLanguage: state.primaryLanguage,
  });

  const checklist: { key: string; done: boolean; optional?: boolean }[] = [
    { key: "wizardChecklistType", done: Boolean(state.organizationType) },
    { key: "wizardChecklistIdentity", done: Boolean(state.name && state.city && state.province && state.country && state.sports.length > 0) },
    { key: "wizardChecklistBranding", done: Boolean(state.logoUrl), optional: true },
    { key: "wizardChecklistMission", done: Boolean(state.mission), optional: true },
    { key: "wizardChecklistContact", done: Boolean(state.publicEmail && state.locations.length > 0) },
    { key: "wizardChecklistLegal", done: Boolean(state.legalName || state.registrationNumber), optional: true },
    { key: "wizardChecklistModules", done: state.enabledModules.length > 0 },
    { key: "wizardChecklistPayment", done: state.connectOnboarded, optional: true },
  ];

  return (
    <div>
      <p className="text-xs font-bold tracking-wide uppercase text-[#e21d12] mb-2">
        {t("wizardStepLabel", { current: 10, total: 10 })}
      </p>
      <h2 className="text-2xl font-extrabold text-zinc-900 mb-2" style={{ fontFamily: "var(--font-playfair)" }}>
        {t("wizardReviewTitle")}
      </h2>
      <p className="text-sm text-zinc-500 mb-8 max-w-md">{t("wizardReviewSubtitle")}</p>

      <div className="max-w-xl flex flex-col gap-6">
        <div className="rounded-xl border border-zinc-200 overflow-hidden">
          <div className="h-20 bg-zinc-900 relative">
            {state.coverImageUrl && (
              <Image src={state.coverImageUrl} alt="" fill className="object-cover" sizes="600px" />
            )}
          </div>
          <div className="px-5 py-4 flex items-center gap-3 -mt-8">
            <div className="size-14 rounded-xl border-4 border-white bg-[#e21d12] flex items-center justify-center text-white font-bold overflow-hidden shrink-0 shadow-md">
              {state.logoUrl ? (
                <Image src={state.logoUrl} alt="" width={56} height={56} className="w-full h-full object-cover" />
              ) : (
                state.name.slice(0, 2).toUpperCase() || "??"
              )}
            </div>
            <div className="pt-6">
              <div className="flex items-center gap-2">
                <span className="font-bold text-zinc-900">{state.name || t("wizardUntitled")}</span>
                <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500 text-xs font-semibold">{t("wizardDraftBadge")}</span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                {[state.organizationType && t(`wizardType_${state.organizationType}_label`), state.sports[0], [state.city, state.province].filter(Boolean).join(", ")]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {state.slug && <p className="text-xs text-zinc-400 mt-0.5">playver.com/{state.slug}</p>}
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-zinc-700">{t("wizardCompletenessLabel")}</span>
            <span className="text-sm font-semibold text-zinc-700">{completeness}%</span>
          </div>
          <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
            <div className="h-full bg-amber-400 transition-all" style={{ width: `${completeness}%` }} />
          </div>
        </div>

        <ul className="flex flex-col gap-2">
          {checklist.map(({ key, done, optional }) => (
            <li key={key} className="flex items-center gap-2.5 text-sm">
              <span className={`size-5 rounded-full flex items-center justify-center shrink-0 ${done ? "bg-[#e21d12]" : "bg-zinc-200"}`}>
                {done && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </span>
              <span className={done ? "text-zinc-700" : "text-zinc-400"}>{t(key)}</span>
              {optional && <span className="text-xs text-amber-500 font-semibold">— {t("wizardOptional")}</span>}
            </li>
          ))}
        </ul>

        <label className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => onConfirmedChange(e.target.checked)}
            className="mt-0.5 size-4 accent-[#e21d12]"
          />
          <span className="text-sm text-zinc-600">{t("wizardConfirmAuthorized")}</span>
        </label>
      </div>
    </div>
  );
}
