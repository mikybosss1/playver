"use client";

// The 10-step create-organization wizard shell: owns `state`/`currentStep`,
// validates and persists one step at a time (see persistStep below), and
// renders the matching Step*.tsx for `currentStep`. Step 2 is special — it's
// the step that actually creates the draft organization row (every step
// before that has nothing to save yet); every step after it just updates
// that same draft row via updateOrganizationDraft. Step10Review calls
// publishOrganization() to flip the draft to a real, published org.
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  createOrganizationDraft,
  publishOrganization,
  setOrganizationLocations,
  updateOrganizationDraft,
} from "@/app/actions/organization";
import { inviteOrganizationMembers } from "@/app/actions/organizer-people";
import { createInitialWizardState, type WizardState } from "./types";
import Step1Type from "./Step1Type";
import Step2Identity from "./Step2Identity";
import Step3Branding from "./Step3Branding";
import Step4About from "./Step4About";
import Step5Contact from "./Step5Contact";
import Step6Legal from "./Step6Legal";
import Step7Modules from "./Step7Modules";
import Step8Admins from "./Step8Admins";
import Step9Payments from "./Step9Payments";
import Step10Review from "./Step10Review";

const STEP_KEYS = [
  "wizardSidebarType",
  "wizardSidebarIdentity",
  "wizardSidebarBranding",
  "wizardSidebarAbout",
  "wizardSidebarContact",
  "wizardSidebarLegal",
  "wizardSidebarModules",
  "wizardSidebarAdmins",
  "wizardSidebarPayments",
  "wizardSidebarPreview",
];

function splitCsv(value: string): string[] {
  return value.split(",").map((v) => v.trim()).filter(Boolean);
}

export default function CreateOrganizationWizard({
  initialState,
  onClose,
  onPublished,
  onSaveDraft,
}: {
  initialState?: WizardState;
  onClose: () => void;
  onPublished: (organizationId: string) => void;
  onSaveDraft?: () => void;
}) {
  const t = useTranslations("Organizer");
  const [state, setState] = useState<WizardState>(initialState ?? createInitialWizardState());
  const [currentStep, setCurrentStep] = useState(initialState ? Math.min(initialState.furthestStep, 10) : 1);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  function update(patch: Partial<WizardState>) {
    setState((s) => ({ ...s, ...patch }));
  }

  function validateStep(step: number): string | null {
    switch (step) {
      case 1:
        return state.organizationType ? null : t("wizardErrorType");
      case 2:
        if (!state.name.trim()) return t("wizardErrorName");
        if (!state.city.trim() || !state.province.trim() || !state.country.trim()) return t("wizardErrorLocation");
        if (state.sports.length === 0) return t("wizardErrorSports");
        if (!state.slug.trim()) return t("wizardErrorSlug");
        if (!state.shortDescription.trim()) return t("wizardErrorShortDesc");
        return null;
      case 3:
        return state.logoUrl ? null : t("wizardErrorLogo");
      case 5:
        if (!state.publicEmail.trim()) return t("wizardErrorPublicEmail");
        if (state.locations.length === 0) return t("wizardErrorLocations");
        return null;
      default:
        return null;
    }
  }

  // Persists whatever the current step owns. Returns an error message, or
  // null on success (including "nothing to do yet", e.g. step 1 before the
  // draft row exists).
  // Saves the given step's fields to the draft (or creates it, on step 2)
  // and, if `advanceTo` is given, advances the draft's stored wizardStep —
  // this is what makes "resume where I left off" work from
  // CreateOrganizationLauncher's draft picker.
  async function persistStep(step: number, advanceTo?: number): Promise<string | null> {
    switch (step) {
      case 1: {
        if (!state.organizationId) return null;
        const res = await updateOrganizationDraft({ organizationType: state.organizationType }, advanceTo);
        return res.error ?? null;
      }
      case 2: {
        if (!state.organizationId) {
          const res = await createOrganizationDraft({
            organizationType: state.organizationType,
            name: state.name,
            city: state.city,
            province: state.province,
            country: state.country,
            primaryLanguage: state.primaryLanguage,
            sports: state.sports,
            shortDescription: state.shortDescription,
            desiredSlug: state.slug,
            wizardStep: advanceTo,
          });
          if (res.error) return res.error;
          setState((s) => ({ ...s, organizationId: res.organizationId ?? s.organizationId, slug: res.slug ?? s.slug }));
          return null;
        }
        const res = await updateOrganizationDraft(
          {
            name: state.name,
            city: state.city,
            province: state.province,
            country: state.country,
            primaryLanguage: state.primaryLanguage,
            sports: state.sports,
            shortDescription: state.shortDescription,
            slug: state.slugTouched ? state.slug : undefined,
          },
          advanceTo
        );
        if (res.error) return res.error;
        if (res.slug) setState((s) => ({ ...s, slug: res.slug! }));
        return null;
      }
      case 3: {
        if (!state.organizationId) return null;
        const res = await updateOrganizationDraft(
          { logoUrl: state.logoUrl, coverImageUrl: state.coverImageUrl, slogan: state.slogan, brandColor: state.brandColor },
          advanceTo
        );
        return res.error ?? null;
      }
      case 4: {
        if (!state.organizationId) return null;
        const res = await updateOrganizationDraft(
          {
            mission: state.mission,
            vision: state.vision,
            history: state.history,
            yearFounded: state.yearFounded ? Number(state.yearFounded) : null,
            ageGroups: state.ageGroups.trim() ? [state.ageGroups.trim()] : [],
            values: splitCsv(state.values),
            affiliations: splitCsv(state.affiliations),
          },
          advanceTo
        );
        return res.error ?? null;
      }
      case 5: {
        if (!state.organizationId) return null;
        const socialLinks: Record<string, string> = {};
        if (state.instagram.trim()) socialLinks.instagram = state.instagram.trim();
        if (state.twitter.trim()) socialLinks.twitter = state.twitter.trim();
        if (state.facebook.trim()) socialLinks.facebook = state.facebook.trim();
        if (state.youtube.trim()) socialLinks.youtube = state.youtube.trim();
        if (state.tiktok.trim()) socialLinks.tiktok = state.tiktok.trim();

        const [updateRes, locationsRes] = await Promise.all([
          updateOrganizationDraft(
            { publicEmail: state.publicEmail, phone: state.phone, website: state.website, socialLinks },
            advanceTo
          ),
          setOrganizationLocations(state.locations),
        ]);
        return updateRes.error ?? locationsRes.error ?? null;
      }
      case 6: {
        if (!state.organizationId) return null;
        const res = await updateOrganizationDraft(
          {
            legalName: state.legalName,
            registrationNumber: state.registrationNumber,
            organizationStatus: state.organizationStatus,
            insuranceProvider: state.insuranceProvider,
            insurancePolicyNumber: state.insurancePolicyNumber,
            refundPolicyUrl: state.refundPolicyMode === "upload" ? state.refundPolicyUrl || null : null,
            refundPolicyText: state.refundPolicyMode === "write" ? state.refundPolicyText || null : null,
            privacyPolicyUrl: state.privacyPolicyMode === "upload" ? state.privacyPolicyUrl || null : null,
            privacyPolicyText: state.privacyPolicyMode === "write" ? state.privacyPolicyText || null : null,
            codeOfConductUrl: state.codeOfConductMode === "upload" ? state.codeOfConductUrl || null : null,
            codeOfConductText: state.codeOfConductMode === "write" ? state.codeOfConductText || null : null,
          },
          advanceTo
        );
        return res.error ?? null;
      }
      case 7: {
        if (!state.organizationId) return null;
        const res = await updateOrganizationDraft({ enabledModules: state.enabledModules }, advanceTo);
        return res.error ?? null;
      }
      case 8: {
        if (!state.organizationId) return null;
        const entries = state.admins.filter((a) => a.email.trim());
        if (entries.length > 0) {
          const res = await inviteOrganizationMembers(entries);
          if (res.errors.length > 0) return res.errors.map((e) => `${e.email}: ${e.error}`).join(" · ");
        }
        if (advanceTo !== undefined) await updateOrganizationDraft({}, advanceTo);
        return null;
      }
      case 9: {
        if (!state.organizationId) return null;
        if (advanceTo !== undefined) await updateOrganizationDraft({}, advanceTo);
        return null;
      }
      default:
        return null;
    }
  }

  async function handleContinue() {
    const validationError = validateStep(currentStep);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setSaving(true);
    const nextStep = currentStep + 1;
    const persistError = await persistStep(currentStep, nextStep);
    setSaving(false);
    if (persistError) {
      setError(persistError);
      return;
    }
    setState((s) => ({ ...s, furthestStep: Math.max(s.furthestStep, nextStep) }));
    setCurrentStep(nextStep);
  }

  async function handleSaveDraft() {
    setSaving(true);
    await persistStep(currentStep, undefined);
    setSaving(false);
    onSaveDraft?.();
    onClose();
  }

  async function handlePublish() {
    if (!confirmed || !state.organizationId) return;
    setError("");
    setSaving(true);
    const res = await publishOrganization();
    setSaving(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onPublished(state.organizationId);
  }

  function goToStep(step: number) {
    if (step > state.furthestStep) return;
    setError("");
    setCurrentStep(step);
  }

  const StepComponent = [Step1Type, Step2Identity, Step3Branding, Step4About, Step5Contact, Step6Legal, Step7Modules, Step8Admins, Step9Payments][currentStep - 1];

  return (
    <div className="fixed inset-0 z-50 flex bg-white">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-white text-zinc-900 border-r border-zinc-200 flex flex-col overflow-y-auto">
        <div className="px-6 pt-6 pb-5 flex items-center justify-between">
          <div>
            <p className="text-lg font-black tracking-tight text-[#e21d12]">PLAYVER</p>
            <p className="text-xs text-zinc-500 mt-0.5">{t("wizardChromeTitle")}</p>
          </div>
        </div>

        <nav className="flex-1 px-3 pb-6 flex flex-col gap-1">
          {STEP_KEYS.map((key, index) => {
            const step = index + 1;
            const isCurrent = step === currentStep;
            const reachable = step <= state.furthestStep;
            return (
              <button
                key={key}
                type="button"
                onClick={() => goToStep(step)}
                disabled={!reachable}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors text-left ${
                  isCurrent ? "bg-red-50 text-[#e21d12]" : reachable ? "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900" : "text-zinc-300 cursor-not-allowed"
                }`}
              >
                <span
                  className={`size-6 rounded-full flex items-center justify-center text-xs shrink-0 ${
                    isCurrent ? "bg-[#e21d12] text-white" : step < state.furthestStep ? "bg-[#e21d12] text-white" : "bg-zinc-100 text-zinc-400"
                  }`}
                >
                  {step < state.furthestStep && !isCurrent ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    step
                  )}
                </span>
                {t(key)}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex justify-end px-6 pt-5">
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 md:px-12 pt-4 pb-10">
          {currentStep === 10 ? (
            <Step10Review state={state} update={update} confirmed={confirmed} onConfirmedChange={setConfirmed} />
          ) : (
            StepComponent && <StepComponent state={state} update={update} />
          )}
        </div>

        <div className="border-t border-zinc-100 px-6 md:px-12 py-4 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => currentStep > 1 && setCurrentStep(currentStep - 1)}
            disabled={currentStep === 1}
            className="px-4 py-2.5 text-sm font-semibold text-zinc-600 rounded-lg border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          >
            {t("wizardBack")}
          </button>

          <div className="flex items-center gap-4">
            {error && <p className="text-sm font-semibold text-red-500 max-w-sm text-right">{error}</p>}
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saving}
              className="text-sm font-semibold text-zinc-500 hover:text-zinc-700 transition-colors disabled:opacity-50"
            >
              {t("wizardSaveDraft")}
            </button>
            {currentStep === 10 ? (
              <button
                type="button"
                onClick={handlePublish}
                disabled={saving || !confirmed}
                className="px-6 py-2.5 text-sm font-semibold text-white rounded-full bg-[#e21d12] hover:bg-[#d41810] transition-colors shadow-sm disabled:opacity-50"
              >
                {t("wizardPublishOrganization")}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleContinue}
                disabled={saving}
                className="px-6 py-2.5 text-sm font-semibold text-white rounded-full bg-[#e21d12] hover:bg-[#d41810] transition-colors shadow-sm disabled:opacity-60"
              >
                {saving ? t("wizardSaving") : currentStep === 9 ? t("wizardReviewAndPublish") : t("wizardContinue")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
