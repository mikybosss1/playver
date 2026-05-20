"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { EventItem, EventParticipant, GalleryItem } from "@/app/actions/event";
import { adminRemoveParticipant } from "@/app/actions/admin";

type TabKey = "details" | "agenda" | "results" | "participants" | "gallery";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function formatTimeStr(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h < 12 ? "AM" : "PM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

function IconBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#b72a25] text-xl text-white">
      {children}
    </span>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-zinc-200 bg-zinc-50 p-6">
      <div className="mb-5 flex items-center gap-3 text-[#c32722]">
        {icon}
        <p className="text-sm font-extrabold uppercase tracking-wide text-zinc-500">{label}</p>
      </div>
      <p className="text-2xl font-extrabold leading-snug text-zinc-950">{value}</p>
    </div>
  );
}

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-[18px] border-2 border-dashed border-zinc-200 text-center">
      <div className="mb-5 text-zinc-300">{icon}</div>
      <p className="text-xl text-zinc-500">{title}</p>
      <p className="mt-3 text-base text-zinc-400">{subtitle}</p>
    </div>
  );
}

function GalleryLightbox({
  items,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  items: GalleryItem[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const item = items[index];
  const hasPrev = index > 0;
  const hasNext = index < items.length - 1;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onPrev();
      if (e.key === "ArrowRight" && hasNext) onNext();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onPrev, onNext, hasPrev, hasNext]);

  async function handleDownload() {
    try {
      const res = await fetch(item.url);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = item.url.split("/").pop() ?? "download";
      a.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(item.url, "_blank");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      <div
        className="relative flex h-full w-full flex-col items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3">
          <span className="text-sm font-semibold text-white/60">
            {index + 1} / {items.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20 transition-colors"
              title="Download"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex size-9 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Prev */}
        {hasPrev && (
          <button
            type="button"
            onClick={onPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 flex size-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
        )}

        {/* Media */}
        <div className="flex max-h-[85vh] max-w-[90vw] items-center justify-center">
          {item.type === "video" ? (
            <video
              key={item.url}
              src={item.url}
              controls
              autoPlay
              className="max-h-[85vh] max-w-[90vw] rounded-lg"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.url}
              alt=""
              className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
            />
          )}
        </div>

        {/* Next */}
        {hasNext && (
          <button
            type="button"
            onClick={onNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex size-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}


export default function EventDetailsTabs({
  event,
  participants: initialParticipants,
  isSuperAdmin = false,
}: {
  event: EventItem;
  participants: EventParticipant[];
  isSuperAdmin?: boolean;
}) {
  const t = useTranslations("EventDetails");
  const [activeTab, setActiveTab] = useState<TabKey>("details");
  const [participants, setParticipants] = useState(initialParticipants);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const prevItem = useCallback(() => setLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : i)), []);
  const nextItem = useCallback(() => setLightboxIndex((i) => (i !== null && i < event.galleryItems.length - 1 ? i + 1 : i)), [event.galleryItems.length]);

  function handleRemoveParticipant(userId: string) {
    setRemovingId(userId);
    startTransition(async () => {
      try {
        await adminRemoveParticipant(event.id, userId);
        setParticipants((prev) => prev.filter((p) => p.id !== userId));
      } catch {
        // keep current state
      }
      setRemovingId(null);
    });
  }
  const capacity = event.capacity ?? 0;
  const end = new Date(event.endDateTime);
  const duration = `${formatTime(event.startDateTime)} - ${formatTime(event.endDateTime)}`;
  const agendaItems = useMemo(() =>
    [...(event.agendaItems ?? [])].sort((a, b) => {
      const dateA = `${a.date ?? ""}${a.startTime ?? ""}`;
      const dateB = `${b.date ?? ""}${b.startTime ?? ""}`;
      return dateA.localeCompare(dateB);
    }),
  [event.agendaItems]);
  const tabs: { key: TabKey; label: string }[] = [
    { key: "details", label: t("tabDetails") },
    { key: "agenda", label: t("tabAgenda") },
    { key: "results", label: t("tabResults") },
    { key: "participants", label: t("tabParticipants") },
    { key: "gallery", label: t("tabGallery") },
  ];

  return (
    <section className="mt-10">
      <div className="mb-10 flex overflow-x-auto border-b border-zinc-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`min-w-fit px-8 pb-4 text-base font-extrabold uppercase tracking-[0.12em] transition-colors ${
              activeTab === tab.key
                ? "border-b-[3px] border-[#c32722] text-[#b72a25]"
                : "border-b-[3px] border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "details" && (
        <div className="grid gap-8">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={<span>▣</span>} label={t("startDate")} value={`${formatDate(event.startDateTime)} · ${formatTime(event.startDateTime)}`} />
            <MetricCard icon={<span>▣</span>} label={t("endDate")} value={`${formatDate(event.endDateTime)} · ${formatTime(event.endDateTime)}`} />
            <MetricCard icon={<span>⌖</span>} label={t("location")} value={event.location} />
            <MetricCard icon={<span>♟</span>} label={t("tabParticipants")} value={`${event.participantCount}/${capacity || "-"}`} />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <section>
              <h2 className="mb-3 text-xl font-extrabold text-zinc-950">{t("description")}</h2>
              <p className="whitespace-pre-line text-base leading-7 text-zinc-600">{event.description || t("noDescription")}</p>
            </section>
            <section>
              <h2 className="mb-3 text-xl font-extrabold text-zinc-950">{t("rules")}</h2>
              <p className="whitespace-pre-line text-base leading-7 text-zinc-600">{event.rules || t("noRules")}</p>
            </section>
          </div>
        </div>
      )}

      {activeTab === "agenda" && (
        <div>
          <div className="mb-8 flex items-center gap-4">
            <IconBadge>▣</IconBadge>
            <h2 className="text-3xl font-extrabold text-[#b72a25]">{t("agendaTitle")}</h2>
          </div>
          {agendaItems.length === 0 ? (
            <EmptyState
              icon={<svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>}
              title={t("noAgenda")}
              subtitle={t("noAgendaHint")}
            />
          ) : (
            <div className="grid gap-5">
              {agendaItems.map((item, i) => (
                <div key={i} className="grid gap-6 rounded-[20px] border border-zinc-100 bg-white p-6 shadow-md md:grid-cols-[160px_1fr]">
                  <div className="border-zinc-100 text-center md:border-r flex flex-col items-center justify-center gap-1">
                    {item.date && (
                      <p className="text-sm font-bold text-zinc-500 uppercase tracking-wide">
                        {new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(`${item.date}T12:00:00`))}
                      </p>
                    )}
                    {item.startTime && <p className="text-xl font-extrabold text-[#b72a25]">{formatTimeStr(item.startTime)}</p>}
                    {item.startTime && item.endTime && <p className="text-sm text-zinc-400">{t("to")}</p>}
                    {item.endTime && <p className="text-xl font-extrabold text-[#b72a25]">{formatTimeStr(item.endTime)}</p>}
                    {!item.date && !item.startTime && !item.endTime && (
                      <span className="text-3xl text-zinc-200">◷</span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-2xl font-extrabold text-zinc-950">{item.title}</h3>
                    {item.description && <p className="mt-3 text-base leading-7 text-zinc-600">{item.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "results" && (
        <div>
          <div className="mb-8 flex items-center gap-4">
            <IconBadge>⚔</IconBadge>
            <h2 className="text-3xl font-extrabold text-[#b72a25]">{t("resultsTitle")}</h2>
          </div>
          <div className="rounded-[20px] border border-zinc-100 bg-white p-8 shadow-md">
            {end < new Date() ? (
              <p className="text-xl font-extrabold text-zinc-950">{t("resultsPending")}</p>
            ) : (
              <p className="text-xl font-extrabold text-zinc-950">{t("resultsAfterEvent")}</p>
            )}
          </div>
        </div>
      )}

      {activeTab === "participants" && (
        participants.length === 0 ? (
          <EmptyState
            icon={<svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>}
            title={t("noParticipants")}
            subtitle={t("firstToRegister")}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {participants.map((participant) => (
              <div key={participant.id} className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4">
                <div className="flex size-12 items-center justify-center overflow-hidden rounded-full bg-zinc-100 font-extrabold text-zinc-500">
                  {participant.image ? <Image src={participant.image} alt={participant.name} width={48} height={48} className="size-12 object-cover" /> : participant.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-zinc-950">{participant.name}</p>
                  <p className="text-sm text-zinc-400">{formatDate(participant.joinedAt)}</p>
                </div>
                {isSuperAdmin && (
                  <button
                    type="button"
                    disabled={removingId === participant.id}
                    onClick={() => handleRemoveParticipant(participant.id)}
                    className="shrink-0 px-2.5 py-1 text-xs font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {removingId === participant.id ? "..." : t("removeParticipant")}
                  </button>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {activeTab === "gallery" && (
        <div>
          <h2 className="mb-8 text-3xl font-extrabold text-zinc-950">{t("galleryTitle")}</h2>
          {event.galleryItems.length === 0 ? (
            <EmptyState
              icon={<svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>}
              title={t("noGallery")}
              subtitle={t("galleryHint")}
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {event.galleryItems.map((item, i) => (
                <button
                  key={item.url}
                  type="button"
                  onClick={() => setLightboxIndex(i)}
                  className="group relative aspect-[4/3] overflow-hidden rounded-[16px] bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#e21d12]"
                >
                  {item.type === "video" ? (
                    <>
                      <video src={item.url} className="h-full w-full object-cover" muted />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/35">
                        <span className="flex size-12 items-center justify-center rounded-full bg-white/85 text-xl text-zinc-700 shadow">▶</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <Image src={item.url} alt={t("galleryTitle")} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/15" />
                    </>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {lightboxIndex !== null && (
        <GalleryLightbox
          items={event.galleryItems}
          index={lightboxIndex}
          onClose={closeLightbox}
          onPrev={prevItem}
          onNext={nextItem}
        />
      )}
    </section>
  );
}
