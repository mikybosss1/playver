"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useUploadThing } from "@/lib/uploadthing";
import { ORG_STATUS_OPTIONS, type PolicyMode, type StepProps } from "./types";

const inputClass =
  "w-full px-4 py-3 text-sm bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 placeholder:text-zinc-400 text-zinc-800";
const labelClass = "text-sm font-semibold text-zinc-700";

type PolicyKey = "refund" | "privacy" | "codeOfConduct";

function PolicyRow({
  title,
  mode,
  url,
  text,
  uploading,
  onModeChange,
  onTextChange,
  onPick,
}: {
  title: string;
  mode: PolicyMode;
  url: string;
  text: string;
  uploading: boolean;
  onModeChange: (mode: PolicyMode) => void;
  onTextChange: (text: string) => void;
  onPick: () => void;
}) {
  const t = useTranslations("Organizer");

  return (
    <div className="rounded-lg border border-zinc-200 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-zinc-800">{title}</span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onPick}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
              mode === "upload" ? "bg-zinc-900 border-zinc-900 text-white" : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
            }`}
          >
            {uploading ? "…" : t("wizardUploadPdf")}
          </button>
          <button
            type="button"
            onClick={() => onModeChange("write")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
              mode === "write" ? "bg-[#e21d12] border-[#e21d12] text-white" : "border-zinc-200 text-[#e21d12] hover:border-red-300"
            }`}
          >
            {t("wizardWriteOnline")}
          </button>
        </div>
      </div>
      {mode === "upload" ? (
        url && <p className="text-xs text-zinc-500 truncate">{url}</p>
      ) : (
        <textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          rows={3}
          placeholder={t("wizardPolicyPlaceholder")}
          className={`${inputClass} resize-none`}
        />
      )}
    </div>
  );
}

export default function Step6Legal({ state, update }: StepProps) {
  const t = useTranslations("Organizer");
  const [uploadingKey, setUploadingKey] = useState<PolicyKey | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingKeyRef = useRef<PolicyKey | null>(null);

  const { startUpload } = useUploadThing("organizationPolicyDocument", {
    onClientUploadComplete: (res) => {
      const url = res?.[0]?.ufsUrl ?? res?.[0]?.url;
      const key = pendingKeyRef.current;
      if (url && key) {
        if (key === "refund") update({ refundPolicyUrl: url, refundPolicyMode: "upload" });
        if (key === "privacy") update({ privacyPolicyUrl: url, privacyPolicyMode: "upload" });
        if (key === "codeOfConduct") update({ codeOfConductUrl: url, codeOfConductMode: "upload" });
      }
      setUploadingKey(null);
    },
    onUploadError: () => setUploadingKey(null),
  });

  function pickFileFor(key: PolicyKey) {
    pendingKeyRef.current = key;
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !pendingKeyRef.current) return;
    setUploadingKey(pendingKeyRef.current);
    startUpload([file]);
    e.target.value = "";
  }

  return (
    <div>
      <p className="text-xs font-bold tracking-wide uppercase text-[#e21d12] mb-2">
        {t("wizardStepLabel", { current: 6, total: 10 })}
      </p>
      <h2 className="text-2xl font-extrabold text-zinc-900 mb-2" style={{ fontFamily: "var(--font-playfair)" }}>
        {t("wizardLegalTitle")}
      </h2>
      <p className="text-sm text-zinc-500 mb-6 max-w-md">{t("wizardLegalSubtitle")}</p>

      <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 mb-6 max-w-xl">
        <p className="text-sm text-amber-800">{t("wizardLegalPrivateNotice")}</p>
      </div>

      <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />

      <div className="flex flex-col gap-5 max-w-xl">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>{t("wizardLegalNameLabel")}</label>
          <input
            type="text"
            value={state.legalName}
            onChange={(e) => update({ legalName: e.target.value })}
            placeholder={t("wizardLegalNamePlaceholder")}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>{t("wizardRegistrationNumberLabel")}</label>
            <input
              type="text"
              value={state.registrationNumber}
              onChange={(e) => update({ registrationNumber: e.target.value })}
              placeholder={t("wizardRegistrationNumberPlaceholder")}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>{t("wizardOrgStatusLabel")}</label>
            <select value={state.organizationStatus} onChange={(e) => update({ organizationStatus: e.target.value })} className={inputClass}>
              {ORG_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>{t("wizardInsuranceProviderLabel")}</label>
          <input
            type="text"
            value={state.insuranceProvider}
            onChange={(e) => update({ insuranceProvider: e.target.value })}
            placeholder={t("wizardInsuranceProviderPlaceholder")}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>{t("wizardInsurancePolicyNumberLabel")}</label>
          <input
            type="text"
            value={state.insurancePolicyNumber}
            onChange={(e) => update({ insurancePolicyNumber: e.target.value })}
            placeholder={t("wizardInsurancePolicyNumberPlaceholder")}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-3">
          <label className={labelClass}>{t("wizardPoliciesLabel")}</label>
          <PolicyRow
            title={t("wizardRefundPolicy")}
            mode={state.refundPolicyMode}
            url={state.refundPolicyUrl}
            text={state.refundPolicyText}
            uploading={uploadingKey === "refund"}
            onModeChange={(mode) => update({ refundPolicyMode: mode })}
            onTextChange={(text) => update({ refundPolicyText: text })}
            onPick={() => pickFileFor("refund")}
          />
          <PolicyRow
            title={t("wizardPrivacyPolicy")}
            mode={state.privacyPolicyMode}
            url={state.privacyPolicyUrl}
            text={state.privacyPolicyText}
            uploading={uploadingKey === "privacy"}
            onModeChange={(mode) => update({ privacyPolicyMode: mode })}
            onTextChange={(text) => update({ privacyPolicyText: text })}
            onPick={() => pickFileFor("privacy")}
          />
          <PolicyRow
            title={t("wizardCodeOfConduct")}
            mode={state.codeOfConductMode}
            url={state.codeOfConductUrl}
            text={state.codeOfConductText}
            uploading={uploadingKey === "codeOfConduct"}
            onModeChange={(mode) => update({ codeOfConductMode: mode })}
            onTextChange={(text) => update({ codeOfConductText: text })}
            onPick={() => pickFileFor("codeOfConduct")}
          />
        </div>
      </div>
    </div>
  );
}
