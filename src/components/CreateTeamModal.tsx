"use client";

import { useState, useRef, useTransition } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { createTeam } from "@/app/actions/team";
import { useUploadThing } from "@/lib/uploadthing";

const SPORTS = ["Soccer","Basketball","Volleyball","Pickleball","Tennis","Hockey","Baseball","Cricket","Rugby","Other"];

export default function CreateTeamModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const t = useTranslations("CreateTeam");
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [sport, setSport] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [captainPhone, setCaptainPhone] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const logoInputRef = useRef<HTMLInputElement>(null);

  const { startUpload } = useUploadThing("teamLogo");

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !sport || !location) { setError(t("requiredFields")); return; }
    setError("");

    let logoUrl: string | undefined;
    if (logoFile) {
      setUploading(true);
      try {
        const res = await startUpload([logoFile]);
        logoUrl = res?.[0]?.ufsUrl ?? res?.[0]?.url;
      } catch {
        setError(t("uploadError"));
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    startTransition(async () => {
      try {
        await createTeam({ name, sport, location, bio: bio || undefined, captainPhone: captainPhone || undefined, logoUrl });
        onSuccess();
      } catch {
        setError(t("createError"));
      }
    });
  }

  const busy = uploading || isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-zinc-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-zinc-900" style={{ fontFamily: "var(--font-playfair)" }}>
            {t("title")}
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 flex flex-col gap-5">

          {/* Logo upload */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-zinc-700">{t("logoLabel")}</label>
            <div
              onClick={() => logoInputRef.current?.click()}
              className="flex items-center gap-4 p-4 border-2 border-dashed border-zinc-200 rounded-xl cursor-pointer hover:border-zinc-400 transition-colors"
            >
              {logoPreview ? (
                <Image src={logoPreview} alt="Logo preview" width={56} height={56} className="w-14 h-14 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
                    <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-zinc-700">{logoPreview ? t("logoChangeHint") : t("logoUploadHint")}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{t("logoSubhint")}</p>
              </div>
            </div>
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
          </div>

          {/* Team Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-zinc-700">{t("nameLabel")} <span className="text-[#e21d12]">*</span></label>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)} required
              placeholder={t("namePlaceholder")}
              className="w-full px-4 py-3 text-sm bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-red-200 placeholder:text-zinc-400"
            />
          </div>

          {/* Sport */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-zinc-700">{t("sportLabel")} <span className="text-[#e21d12]">*</span></label>
            <select
              value={sport} onChange={e => setSport(e.target.value)} required
              className="w-full px-4 py-3 text-sm bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-red-200 text-zinc-700"
            >
              <option value="">{t("sportPlaceholder")}</option>
              {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Location */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-zinc-700">{t("locationLabel")} <span className="text-[#e21d12]">*</span></label>
            <input
              type="text" value={location} onChange={e => setLocation(e.target.value)} required
              placeholder={t("locationPlaceholder")}
              className="w-full px-4 py-3 text-sm bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-red-200 placeholder:text-zinc-400"
            />
          </div>

          {/* Team Bio */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-zinc-700">{t("bioLabel")}</label>
            <textarea
              value={bio} onChange={e => setBio(e.target.value)} rows={3}
              placeholder={t("bioPlaceholder")}
              className="w-full px-4 py-3 text-sm bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-red-200 placeholder:text-zinc-400 resize-none"
            />
          </div>

          {/* Captain Phone */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-zinc-700">{t("phoneLabel")}</label>
            <input
              type="tel" value={captainPhone} onChange={e => setCaptainPhone(e.target.value)}
              placeholder={t("phonePlaceholder")}
              className="w-full px-4 py-3 text-sm bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-red-200 placeholder:text-zinc-400"
            />
          </div>

          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button" onClick={onClose}
              className="flex-1 py-3 text-sm font-semibold text-zinc-700 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
            >
              {t("cancel")}
            </button>
            <button
              type="submit" disabled={busy}
              className="flex-1 py-3 text-sm font-semibold text-white rounded-lg bg-[#e21d12] hover:bg-[#d41810] disabled:opacity-60 transition-colors shadow-sm"
            >
              {busy ? t("creating") : t("submit")}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
