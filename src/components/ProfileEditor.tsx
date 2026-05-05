"use client";

import { useState, useTransition, useRef } from "react";
import Image from "next/image";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useUploadThing } from "@/lib/uploadthing";
import { updateUserProfile, addUserMedia, deleteUserMedia } from "@/app/actions/athlete";
import type { UserMediaItem } from "@/app/actions/athlete";

const SPORTS = [
  "Soccer", "Basketball", "Volleyball", "Pickleball",
  "Tennis", "Hockey", "Baseball", "Cricket", "Rugby", "Other",
];

function sportEmoji(sport: string): string {
  const map: Record<string, string> = {
    Soccer: "⚽", Basketball: "🏀", Volleyball: "🏐", Pickleball: "🏓",
    Tennis: "🎾", Hockey: "🏒", Baseball: "⚾", Cricket: "🏏", Rugby: "🏉",
  };
  return map[sport] ?? "🏅";
}

function isVideoUrl(url: string) {
  return /\.(mp4|webm|mov|avi|mkv)(\?|$)/i.test(url);
}

export default function ProfileEditor({
  initialName,
  initialBio,
  initialMainSport,
  initialImage,
  initialMedia,
}: {
  initialName: string;
  initialBio: string;
  initialMainSport: string | null;
  initialImage: string | null;
  initialMedia: UserMediaItem[];
}) {
  const t = useTranslations("DashboardProfile");
  const router = useRouter();

  const [name, setName] = useState(initialName);
  const [bio, setBio] = useState(initialBio);
  const [mainSport, setMainSport] = useState<string | null>(initialMainSport);
  const [imageUrl, setImageUrl] = useState<string | null>(initialImage);
  const [media, setMedia] = useState<UserMediaItem[]>(initialMedia);
  const [toast, setToast] = useState("");
  const [saving, startSaving] = useTransition();
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [mediaUploading, setMediaUploading] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  const { startUpload: uploadAvatar } = useUploadThing("profileAvatar", {
    onClientUploadComplete: async (res) => {
      const url = res[0]?.ufsUrl ?? res[0]?.url;
      if (!url) { setAvatarUploading(false); return; }
      setImageUrl(url);
      await updateUserProfile({ name, bio, mainSport, imageUrl: url });
      setAvatarUploading(false);
      router.refresh();
    },
    onUploadError: () => setAvatarUploading(false),
  });

  const { startUpload: uploadMedia } = useUploadThing("profileMedia", {
    onClientUploadComplete: async (res) => {
      const items = (res ?? []).map((f) => ({
        url: f.ufsUrl ?? f.url,
        type: isVideoUrl(f.ufsUrl ?? f.url) ? "video" : "image",
      }));
      const newMedia = await addUserMedia(items);
      setMedia((prev) => [...newMedia, ...prev]);
      setMediaUploading(false);
    },
    onUploadError: () => setMediaUploading(false),
  });

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    uploadAvatar([file]);
    e.target.value = "";
  }

  function handleMediaChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setMediaUploading(true);
    uploadMedia(files);
    e.target.value = "";
  }

  function handleSave() {
    startSaving(async () => {
      await updateUserProfile({ name, bio, mainSport });
      setToast(t("saved"));
      router.refresh();
      setTimeout(() => setToast(""), 3200);
    });
  }

  async function handleDeleteMedia(id: string) {
    await deleteUserMedia(id);
    setMedia((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <div className="max-w-2xl space-y-6">

      {/* Toast */}
      {toast && (
        <div className="fixed right-4 top-20 z-50 rounded-lg border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-700 shadow-lg animate-in slide-in-from-right-4">
          {toast}
        </div>
      )}

      {/* Profile Photo */}
      <section className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
        <h2 className="text-base font-bold text-zinc-900 mb-5">{t("photoTitle")}</h2>
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="relative group shrink-0"
            disabled={avatarUploading}
          >
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt=""
                width={80}
                height={80}
                className="size-20 rounded-full object-cover border-4 border-white shadow-md"
              />
            ) : (
              <div className="flex size-20 items-center justify-center rounded-full bg-[#e21d12] text-2xl font-extrabold text-white shadow-md">
                {name[0]?.toUpperCase() ?? "?"}
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </div>
          </button>
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          <div>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
              className="px-4 py-2 text-sm font-semibold rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 transition-colors disabled:opacity-50"
            >
              {avatarUploading ? t("avatarUploading") : t("changePhoto")}
            </button>
            <p className="mt-1.5 text-xs text-zinc-400">{t("photoHint")}</p>
          </div>
        </div>
      </section>

      {/* Basic Info */}
      <section className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
        <h2 className="text-base font-bold text-zinc-900 mb-5">{t("basicInfoTitle")}</h2>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-zinc-700">{t("nameLabel")}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 text-sm bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-red-200"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-zinc-700">{t("bioLabel")}</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder={t("bioPlaceholder")}
              className="w-full px-4 py-3 text-sm bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-red-200 resize-none placeholder:text-zinc-400"
            />
          </div>
        </div>
      </section>

      {/* Main Sport */}
      <section className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
        <h2 className="text-base font-bold text-zinc-900 mb-1">{t("mainSportTitle")}</h2>
        <p className="text-sm text-zinc-400 mb-5">{t("mainSportSubtitle")}</p>
        <div className="flex flex-wrap gap-2">
          {SPORTS.map((sport) => (
            <button
              key={sport}
              type="button"
              onClick={() => setMainSport(mainSport === sport ? null : sport)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                mainSport === sport
                  ? "bg-[#e21d12] border-[#e21d12] text-white shadow-sm"
                  : "bg-zinc-50 border-zinc-200 text-zinc-700 hover:border-zinc-400"
              }`}
            >
              {sportEmoji(sport)} {sport}
            </button>
          ))}
        </div>
      </section>

      {/* Save */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 text-sm font-semibold text-white rounded-lg bg-[#e21d12] hover:bg-[#d41810] transition-colors shadow-sm disabled:opacity-60"
        >
          {saving ? t("saving") : t("save")}
        </button>
      </div>

      {/* Gameplay Gallery */}
      <section className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-zinc-900">{t("galleryTitle")}</h2>
            <p className="text-sm text-zinc-400 mt-0.5">{t("gallerySubtitle")}</p>
          </div>
          <button
            type="button"
            onClick={() => mediaInputRef.current?.click()}
            disabled={mediaUploading}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-[#e21d12] text-white hover:bg-[#d41810] transition-colors disabled:opacity-50 shrink-0"
          >
            {mediaUploading ? t("mediaUploading") : t("addMedia")}
          </button>
        </div>
        <input ref={mediaInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleMediaChange} />

        {media.length === 0 ? (
          <div
            onClick={() => mediaInputRef.current?.click()}
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 py-16 cursor-pointer hover:border-zinc-400 transition-colors gap-3"
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-300">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <div className="text-center">
              <p className="text-sm font-semibold text-zinc-500">{t("emptyGallery")}</p>
              <p className="text-xs text-zinc-400 mt-1">{t("emptyGalleryHint")}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {media.map((item) => (
              <MediaTile key={item.id} item={item} onDelete={handleDeleteMedia} />
            ))}
            <button
              type="button"
              onClick={() => mediaInputRef.current?.click()}
              disabled={mediaUploading}
              className="aspect-video rounded-xl border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-zinc-400 transition-colors text-zinc-400 disabled:opacity-50"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              <span className="text-xs font-semibold">{t("addMore")}</span>
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function MediaTile({
  item,
  onDelete,
}: {
  item: UserMediaItem;
  onDelete: (id: string) => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    setDeleting(true);
    await onDelete(item.id);
  }

  const isVideo = item.type === "video" || isVideoUrl(item.url);

  return (
    <div className={`relative group aspect-video rounded-xl overflow-hidden bg-zinc-100 transition-opacity ${deleting ? "opacity-40" : ""}`}>
      {isVideo ? (
        <>
          <video src={item.url} className="w-full h-full object-cover" muted playsInline />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="size-10 rounded-full bg-black/50 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
            </div>
          </div>
        </>
      ) : (
        <Image src={item.url} alt="" fill className="object-cover" sizes="(max-width: 640px) 50vw, 33vw" />
      )}
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 size-7 bg-black/60 rounded-full flex items-center justify-center text-white transition-opacity hover:bg-black/80 text-xs font-bold"
      >
        ✕
      </button>
    </div>
  );
}
