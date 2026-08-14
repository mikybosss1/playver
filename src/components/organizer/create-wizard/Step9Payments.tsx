"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { createOrganizationConnectOnboardingLink, getOrganizationWalletOverview } from "@/app/actions/organizer-wallet";
import type { StepProps } from "./types";

export default function Step9Payments({ state, update }: StepProps) {
  const t = useTranslations("Organizer");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getOrganizationWalletOverview()
      .then((overview) => update({ connectAccountId: overview.connectAccountId, connectOnboarded: overview.connectOnboarded }))
      .catch(() => {});
    // Only needs to run once when this step mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleConnect() {
    setConnecting(true);
    setError("");
    const result = await createOrganizationConnectOnboardingLink("/organizer/overview");
    if (result.url) {
      window.location.href = result.url;
      return;
    }
    setError(result.error ?? t("wizardPaymentsError"));
    setConnecting(false);
  }

  return (
    <div>
      <p className="text-xs font-bold tracking-wide uppercase text-emerald-600 mb-2">
        {t("wizardStepLabel", { current: 9, total: 10 })}
      </p>
      <h2 className="text-2xl font-extrabold text-zinc-900 mb-2" style={{ fontFamily: "var(--font-playfair)" }}>
        {t("wizardPaymentsTitle")}
      </h2>
      <p className="text-sm text-zinc-500 mb-8 max-w-md">{t("wizardPaymentsSubtitle")}</p>

      <div className="max-w-xl flex flex-col gap-5">
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-5 py-4">
          <p className="text-sm font-bold text-emerald-800 mb-1">{t("wizardPoweredByStripe")}</p>
          <p className="text-sm text-emerald-700">{t("wizardStripeExplainer")}</p>
        </div>

        {state.connectOnboarded ? (
          <div className="rounded-lg border border-zinc-200 px-5 py-4 flex items-center gap-3">
            <span className="size-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            <p className="text-sm font-semibold text-zinc-800">{t("wizardStripeConnected")}</p>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleConnect}
            disabled={connecting}
            className="flex items-center justify-center gap-2 py-3.5 rounded-lg bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-60"
          >
            {connecting ? t("wizardConnecting") : t("wizardConnectWithStripe")}
          </button>
        )}
        {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

        <ul className="flex flex-col gap-2">
          {["wizardPaymentsFeature1", "wizardPaymentsFeature2", "wizardPaymentsFeature3", "wizardPaymentsFeature4", "wizardPaymentsFeature5"].map((key) => (
            <li key={key} className="flex items-center gap-2 text-sm text-zinc-600">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {t(key)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
