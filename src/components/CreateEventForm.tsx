"use client";

import { useState, useRef, useTransition } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useRouter } from "@/i18n/routing";
import { createEvent } from "@/app/actions/event";
import { useUploadThing } from "@/lib/uploadthing";

const SPORTS = ["Soccer","Basketball","Volleyball","Pickleball","Tennis","Hockey","Baseball","Cricket","Rugby","Other"];
const EVENT_TYPES = ["League","Tournament","Pickup Game","Training / Practice","Activity"];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 flex flex-col gap-5">
      <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wide">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-zinc-700">
        {label} {required && <span className="text-[#e21d12]">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function CreateEventForm({
  onSuccess,
  onCancel,
}: {
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const t = useTranslations("CreateEvent");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [sport, setSport] = useState("");
  const [eventType, setEventType] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [registrationMode, setRegistrationMode] = useState<"individual" | "team">("individual");
  const [capacity, setCapacity] = useState("");
  const [maxPlayersPerTeam, setMaxPlayersPerTeam] = useState("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState("");
  const [error, setError] = useState("");

  // Cover image
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Gallery
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const { startUpload: uploadCover } = useUploadThing("eventCover");
  const { startUpload: uploadGallery } = useUploadThing("eventGallery");

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  function handleGalleryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const combined = [...galleryFiles, ...files].slice(0, 10);
    setGalleryFiles(combined);
    setGalleryPreviews(combined.map(f => URL.createObjectURL(f)));
  }

  function removeGalleryItem(index: number) {
    const updated = galleryFiles.filter((_, i) => i !== index);
    setGalleryFiles(updated);
    setGalleryPreviews(updated.map(f => URL.createObjectURL(f)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !sport || !eventType || !location || !startDate || !startTime || !endDate || !endTime) {
      setError(t("requiredFields"));
      return;
    }
    setError("");

    let coverImageUrl: string | undefined;
    if (coverFile) {
      setUploadingCover(true);
      try {
        const res = await uploadCover([coverFile]);
        coverImageUrl = res?.[0]?.ufsUrl ?? res?.[0]?.url;
      } catch { setError(t("uploadError")); setUploadingCover(false); return; }
      setUploadingCover(false);
    }

    let galleryUrls: string[] = [];
    if (galleryFiles.length > 0) {
      setUploadingGallery(true);
      try {
        const res = await uploadGallery(galleryFiles);
        galleryUrls = (res ?? []).map(r => r.ufsUrl ?? r.url);
      } catch { setError(t("uploadError")); setUploadingGallery(false); return; }
      setUploadingGallery(false);
    }

    startTransition(async () => {
      try {
        await createEvent({
          title, sport, eventType, location,
          startDateTime: `${startDate}T${startTime}`,
          endDateTime: `${endDate}T${endTime}`,
          coverImageUrl,
          galleryUrls,
          registrationMode,
          capacity: capacity ? parseInt(capacity) : undefined,
          maxPlayersPerTeam: registrationMode === "team" && maxPlayersPerTeam ? parseInt(maxPlayersPerTeam) : undefined,
          description: description || undefined,
          rules: rules || undefined,
        });
        if (onSuccess) {
          onSuccess();
        } else {
          router.push({ pathname: "/discover", query: { created: "event" } });
        }
      } catch {
        setError(t("createError"));
      }
    });
  }

  const busy = uploadingCover || uploadingGallery || isPending;
  const inputClass = "w-full px-4 py-3 text-sm bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-red-200 placeholder:text-zinc-400 text-zinc-800";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">

      {/* Basic Info */}
      <Section title={t("sectionBasic")}>
        <Field label={t("titleLabel")} required>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder={t("titlePlaceholder")} className={inputClass} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t("sportLabel")} required>
            <select value={sport} onChange={e => setSport(e.target.value)} className={inputClass}>
              <option value="">{t("selectSport")}</option>
              {SPORTS.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label={t("eventTypeLabel")} required>
            <select value={eventType} onChange={e => setEventType(e.target.value)} className={inputClass}>
              <option value="">{t("selectType")}</option>
              {EVENT_TYPES.map(et => <option key={et}>{et}</option>)}
            </select>
          </Field>
        </div>
        <Field label={t("locationLabel")} required>
          <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder={t("locationPlaceholder")} className={inputClass} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t("startDateLabel")} required>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputClass} />
          </Field>
          <Field label={t("startTimeLabel")} required>
            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className={inputClass} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t("endDateLabel")} required>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputClass} />
          </Field>
          <Field label={t("endTimeLabel")} required>
            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className={inputClass} />
          </Field>
        </div>
      </Section>

      {/* Cover Image */}
      <Section title={t("sectionMedia")}>
        <Field label={t("coverLabel")}>
          <div
            onClick={() => coverInputRef.current?.click()}
            className={`relative cursor-pointer rounded-xl overflow-hidden border-2 border-dashed transition-colors ${
              coverPreview ? "border-transparent" : "border-zinc-200 hover:border-zinc-400"
            }`}
          >
            {coverPreview ? (
              <div className="relative h-48">
                <Image src={coverPreview} alt="Cover" fill className="object-cover" />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <span className="text-white text-sm font-semibold">{t("changeCover")}</span>
                </div>
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center gap-2 bg-zinc-50">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-300">
                  <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                </svg>
                <p className="text-sm font-semibold text-zinc-700">{t("coverUploadLabel")}</p>
                <p className="text-xs text-zinc-400">{t("coverHint")}</p>
              </div>
            )}
          </div>
          <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
        </Field>

        {/* Gallery */}
        <Field label={t("galleryLabel")}>
          <div className="flex flex-col gap-3">
            {galleryPreviews.length > 0 && (
              <div className="grid grid-cols-5 gap-2">
                {galleryPreviews.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
                    <Image src={src} alt={`Gallery ${i}`} fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => removeGalleryItem(i)}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                ))}
                {galleryFiles.length < 10 && (
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="aspect-square rounded-lg border-2 border-dashed border-zinc-200 hover:border-zinc-400 flex items-center justify-center transition-colors"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-zinc-400"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  </button>
                )}
              </div>
            )}
            {galleryPreviews.length === 0 && (
              <div
                onClick={() => galleryInputRef.current?.click()}
                className="cursor-pointer border-2 border-dashed border-zinc-200 hover:border-zinc-400 rounded-xl p-6 text-center transition-colors"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-300 mx-auto mb-2">
                  <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                </svg>
                <p className="text-sm font-medium text-zinc-700">{t("galleryUploadLabel")}</p>
                <p className="text-xs text-zinc-400 mt-1">{t("galleryHint")}</p>
              </div>
            )}
            <input ref={galleryInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleGalleryChange} />
          </div>
        </Field>
      </Section>

      {/* Registration */}
      <Section title={t("sectionRegistration")}>
        <Field label={t("registrationModeLabel")}>
          <div className="flex gap-3">
            {(["individual","team"] as const).map(mode => (
              <button
                key={mode} type="button"
                onClick={() => setRegistrationMode(mode)}
                className={`flex-1 py-3 text-sm font-semibold rounded-lg border transition-colors ${
                  registrationMode === mode
                    ? "bg-[#e21d12] text-white border-[#e21d12]"
                    : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"
                }`}
              >
                {mode === "individual" ? t("modeIndividual") : t("modeTeam")}
              </button>
            ))}
          </div>
        </Field>
        <Field label={t("capacityLabel")}>
          <input
            type="number" min="1" value={capacity} onChange={e => setCapacity(e.target.value)}
            placeholder={t("capacityPlaceholder")} className={inputClass}
          />
        </Field>
        {registrationMode === "team" && (
          <Field label={t("maxPlayersLabel")}>
            <input
              type="number" min="1" value={maxPlayersPerTeam} onChange={e => setMaxPlayersPerTeam(e.target.value)}
              placeholder={t("maxPlayersPlaceholder")} className={inputClass}
            />
          </Field>
        )}
      </Section>

      {/* Description & Rules */}
      <Section title={t("sectionDetails")}>
        <Field label={t("descriptionLabel")}>
          <textarea
            value={description} onChange={e => setDescription(e.target.value)} rows={4}
            placeholder={t("descriptionPlaceholder")}
            className={`${inputClass} resize-none`}
          />
        </Field>
        <Field label={t("rulesLabel")}>
          <textarea
            value={rules} onChange={e => setRules(e.target.value)} rows={3}
            placeholder={t("rulesPlaceholder")}
            className={`${inputClass} resize-none`}
          />
        </Field>
      </Section>

      {/* Upload status */}
      {(uploadingCover || uploadingGallery) && (
        <p className="text-sm text-zinc-500 font-medium text-center">
          {uploadingCover ? t("uploadingCover") : t("uploadingGallery")}
        </p>
      )}

      {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

      <div className="flex gap-3">
        <button
          type="button" onClick={onCancel ?? (() => router.back())}
          className="px-6 py-3 text-sm font-semibold text-zinc-700 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
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
  );
}
