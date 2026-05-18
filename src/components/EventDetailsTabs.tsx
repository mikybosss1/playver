"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { EventItem, EventParticipant } from "@/app/actions/event";
import { adminRemoveParticipant } from "@/app/actions/admin";

type TabKey = "details" | "agenda" | "results" | "participants" | "gallery";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(value));
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

function isVideo(url: string) {
  return /\.(mp4|mov|webm|m4v)(\?|$)/i.test(url);
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
  const [, startTransition] = useTransition();

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
  const agendaItems = useMemo(() => [
    {
      title: event.title,
      location: event.location,
      start: formatTime(event.startDateTime),
      end: formatTime(event.endDateTime),
    },
  ], [event]);
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
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard icon={<span>▣</span>} label={t("startDate")} value={formatDate(event.startDateTime)} />
            <MetricCard icon={<span>◷</span>} label={t("duration")} value={duration} />
            <MetricCard icon={<span>⌖</span>} label={t("location")} value={event.location} />
            <MetricCard icon={<span>♟</span>} label={t("teams")} value={`${event.participantCount}/${capacity || "-"}`} />
            <MetricCard icon={<span>♟</span>} label={t("spectators")} value="0/50" />
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
          <div className="grid gap-5">
            {agendaItems.map((item) => (
              <div key={item.title} className="grid gap-6 rounded-[20px] border border-zinc-100 bg-white p-6 shadow-md md:grid-cols-[130px_1fr]">
                <div className="border-zinc-100 text-center md:border-r">
                  <p className="text-xl font-extrabold text-[#b72a25]">{item.start}</p>
                  <p className="text-base text-zinc-400">{t("to")}</p>
                  <p className="text-xl font-extrabold text-[#b72a25]">{item.end}</p>
                </div>
                <div>
                  <h3 className="text-2xl font-extrabold text-zinc-950">{item.title}</h3>
                  <p className="mt-4 text-lg font-medium text-emerald-900">📍 {item.location}</p>
                </div>
              </div>
            ))}
          </div>
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
          {event.galleryUrls.length === 0 ? (
            <EmptyState
              icon={<svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>}
              title={t("noGallery")}
              subtitle={t("galleryHint")}
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {event.galleryUrls.map((url) => (
                <div key={url} className="relative aspect-[4/3] overflow-hidden rounded-[16px] bg-zinc-100">
                  {isVideo(url) ? (
                    <>
                      <video src={url} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/15">
                        <span className="flex size-12 items-center justify-center rounded-full bg-white/80 text-xl text-zinc-700">▶</span>
                      </div>
                    </>
                  ) : (
                    <Image src={url} alt={t("galleryTitle")} fill className="object-cover" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
