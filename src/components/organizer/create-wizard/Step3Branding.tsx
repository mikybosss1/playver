"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useUploadThing } from "@/lib/uploadthing";
import { BRAND_COLOR_OPTIONS, type StepProps } from "./types";

const inputClass =
  "w-full px-4 py-3 text-sm bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 placeholder:text-zinc-400 text-zinc-800";
const labelClass = "text-sm font-semibold text-zinc-700";

function UploadBox({
  label,
  hint,
  imageUrl,
  uploading,
  onPick,
}: {
  label: string;
  hint: string;
  imageUrl: string | null;
  uploading: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={uploading}
      className="w-full rounded-xl border-2 border-dashed border-zinc-200 hover:border-emerald-400 transition-colors overflow-hidden disabled:opacity-60"
    >
      {imageUrl ? (
        <div className="relative w-full h-40">
          <Image src={imageUrl} alt="" fill className="object-cover" sizes="600px" />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 py-10 px-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-300">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p className="text-sm font-semibold text-zinc-600">{uploading ? "…" : label}</p>
          <p className="text-xs text-zinc-400">{hint}</p>
        </div>
      )}
    </button>
  );
}

export default function Step3Branding({ state, update }: StepProps) {
  const t = useTranslations("Organizer");
  const [logoUploading, setLogoUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const { startUpload: uploadLogo } = useUploadThing("organizationLogo", {
    onClientUploadComplete: (res) => {
      const url = res?.[0]?.ufsUrl ?? res?.[0]?.url;
      if (url) update({ logoUrl: url });
      setLogoUploading(false);
    },
    onUploadError: () => setLogoUploading(false),
  });

  const { startUpload: uploadCover } = useUploadThing("organizationCover", {
    onClientUploadComplete: (res) => {
      const url = res?.[0]?.ufsUrl ?? res?.[0]?.url;
      if (url) update({ coverImageUrl: url });
      setCoverUploading(false);
    },
    onUploadError: () => setCoverUploading(false),
  });

  return (
    <div>
      <p className="text-xs font-bold tracking-wide uppercase text-emerald-600 mb-2">
        {t("wizardStepLabel", { current: 3, total: 10 })}
      </p>
      <h2 className="text-2xl font-extrabold text-zinc-900 mb-2" style={{ fontFamily: "var(--font-playfair)" }}>
        {t("wizardBrandingTitle")}
      </h2>
      <p className="text-sm text-zinc-500 mb-8 max-w-md">{t("wizardBrandingSubtitle")}</p>

      <div className="flex flex-col gap-5 max-w-xl">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>{t("wizardLogoLabel")} *</label>
          <UploadBox
            label={t("wizardLogoDropLabel")}
            hint={t("wizardLogoHint")}
            imageUrl={state.logoUrl}
            uploading={logoUploading}
            onPick={() => logoInputRef.current?.click()}
          />
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setLogoUploading(true);
              uploadLogo([file]);
              e.target.value = "";
            }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>{t("wizardCoverLabel")}</label>
          <UploadBox
            label={t("wizardCoverDropLabel")}
            hint={t("wizardCoverHint")}
            imageUrl={state.coverImageUrl}
            uploading={coverUploading}
            onPick={() => coverInputRef.current?.click()}
          />
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setCoverUploading(true);
              uploadCover([file]);
              e.target.value = "";
            }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>{t("wizardSloganLabel")}</label>
          <input
            type="text"
            value={state.slogan}
            onChange={(e) => update({ slogan: e.target.value })}
            placeholder={t("wizardSloganPlaceholder")}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className={labelClass}>{t("wizardBrandColorLabel")}</label>
          <div className="flex items-center gap-2.5">
            {BRAND_COLOR_OPTIONS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => update({ brandColor: color })}
                style={{ backgroundColor: color }}
                className={`size-8 rounded-full transition-transform ${state.brandColor === color ? "ring-2 ring-offset-2 ring-zinc-400 scale-105" : ""}`}
                aria-label={color}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
