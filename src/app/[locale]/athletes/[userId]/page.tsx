import { notFound } from "next/navigation";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "@/i18n/routing";
import { getAthleteProfile } from "@/app/actions/athlete";

function formatMonth(iso: string) {
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(new Date(iso));
}

function formatEventDate(iso: string) {
  const d = new Date(iso);
  return (
    new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(d) +
    " · " +
    new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(d)
  );
}

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

export default async function AthleteProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const [profile, t] = await Promise.all([
    getAthleteProfile(userId),
    getTranslations("AthleteProfile"),
  ]);

  if (!profile) notFound();

  const { user, teams, events, sports, media } = profile;
  const captainTeams = teams.filter((team) => team.isCaptain);
  const now = new Date();
  const upcomingEvents = events.filter((e) => new Date(e.startDateTime) >= now);
  const pastEvents = events.filter((e) => new Date(e.startDateTime) < now);

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-zinc-50">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-10">

          {/* Profile card */}
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden mb-6">
            {/* Header band */}
            <div className="h-28 bg-gradient-to-br from-[#e21d12]/10 via-[#e21d12]/5 to-transparent" />

            <div className="px-8 pb-8">
              <div className="-mt-14 mb-4 flex items-end gap-5">
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name}
                    width={80}
                    height={80}
                    className="size-20 rounded-full border-4 border-white object-cover shadow-md"
                  />
                ) : (
                  <div className="flex size-20 shrink-0 items-center justify-center rounded-full border-4 border-white bg-[#e21d12] text-2xl font-extrabold text-white shadow-md">
                    {user.name[0]?.toUpperCase()}
                  </div>
                )}
                <div className="mb-1">
                  <h1 className="text-2xl font-extrabold text-zinc-950" style={{ fontFamily: "var(--font-playfair)" }}>
                    {user.name}
                  </h1>
                  <p className="text-sm text-zinc-500">{t("memberSince")} {formatMonth(user.createdAt)}</p>
                </div>
              </div>

              {/* Bio */}
              {user.bio && (
                <p className="text-sm leading-6 text-zinc-600 mb-5">{user.bio}</p>
              )}

              {/* Sport badges — main sport highlighted */}
              {(sports.length > 0 || user.mainSport) && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {user.mainSport && (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e21d12] text-xs font-bold text-white">
                      {sportEmoji(user.mainSport)} {user.mainSport}
                      <span className="ml-0.5 text-[9px] font-extrabold uppercase tracking-wide opacity-80">
                        {t("mainSportLabel")}
                      </span>
                    </span>
                  )}
                  {sports
                    .filter((s) => s !== user.mainSport)
                    .map((sport) => (
                      <span key={sport} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 text-xs font-semibold text-zinc-700">
                        {sportEmoji(sport)} {sport}
                      </span>
                    ))}
                </div>
              )}

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-4 rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                <div className="text-center">
                  <p className="text-2xl font-extrabold text-zinc-950">{teams.length}</p>
                  <p className="text-xs font-semibold text-zinc-500 mt-0.5">{t("teamsCount")}</p>
                </div>
                <div className="text-center border-x border-zinc-200">
                  <p className="text-2xl font-extrabold text-zinc-950">{events.length}</p>
                  <p className="text-xs font-semibold text-zinc-500 mt-0.5">{t("eventsCount")}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-extrabold text-zinc-950">{captainTeams.length}</p>
                  <p className="text-xs font-semibold text-zinc-500 mt-0.5">{t("captainOf")}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Teams */}
          <section className="mb-6">
            <h2 className="text-lg font-extrabold text-zinc-900 mb-4">{t("teams")}</h2>
            {teams.length === 0 ? (
              <div className="bg-white rounded-2xl border border-zinc-200 p-8 text-center text-zinc-500 text-sm">
                {t("noTeams")}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {teams.map((team) => (
                  <Link
                    key={team.id}
                    href={`/teams/${team.id}`}
                    className="group flex items-center gap-4 bg-white rounded-2xl border border-zinc-200 p-4 hover:shadow-md transition-shadow"
                  >
                    {team.logoUrl ? (
                      <Image
                        src={team.logoUrl}
                        alt={team.name}
                        width={44}
                        height={44}
                        className="size-11 rounded-full object-cover border border-zinc-100 shrink-0"
                      />
                    ) : (
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#e21d12]/10 font-extrabold text-[#e21d12]">
                        {team.name[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-bold text-zinc-900 group-hover:text-[#e21d12] transition-colors text-sm">{team.name}</p>
                        {team.isCaptain && (
                          <span className="shrink-0 rounded-full bg-[#e21d12] px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white">
                            {t("captainBadge")}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400">{team.sport} · {team.location}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Events */}
          <section className="mb-6">
            <h2 className="text-lg font-extrabold text-zinc-900 mb-4">{t("events")}</h2>
            {events.length === 0 ? (
              <div className="bg-white rounded-2xl border border-zinc-200 p-8 text-center text-zinc-500 text-sm">
                {t("noEvents")}
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {upcomingEvents.length > 0 && (
                  <div>
                    <p className="mb-3 text-xs font-extrabold uppercase tracking-wide text-zinc-400">{t("upcoming")}</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {upcomingEvents.map((event) => (
                        <EventCard key={event.id} event={event} organizerLabel={t("organizerBadge")} participantLabel={t("participantBadge")} />
                      ))}
                    </div>
                  </div>
                )}
                {pastEvents.length > 0 && (
                  <div>
                    <p className="mb-3 text-xs font-extrabold uppercase tracking-wide text-zinc-400">{t("past")}</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {pastEvents.map((event) => (
                        <EventCard key={event.id} event={event} organizerLabel={t("organizerBadge")} participantLabel={t("participantBadge")} past />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Gameplay Gallery */}
          {media.length > 0 && (
            <section>
              <h2 className="text-lg font-extrabold text-zinc-900 mb-4">{t("galleryTitle")}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {media.map((item) => (
                  <GalleryTile key={item.id} url={item.url} type={item.type} />
                ))}
              </div>
            </section>
          )}

        </div>
      </main>
      <Footer />
    </>
  );
}

function GalleryTile({ url, type }: { url: string; type: string }) {
  const isVideo = type === "video" || isVideoUrl(url);

  return (
    <div className="relative aspect-video rounded-2xl overflow-hidden bg-zinc-100">
      {isVideo ? (
        <>
          <video src={url} className="w-full h-full object-cover" muted playsInline />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="size-10 rounded-full bg-black/50 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
            </div>
          </div>
        </>
      ) : (
        <Image src={url} alt="" fill className="object-cover" sizes="(max-width: 640px) 50vw, 33vw" />
      )}
    </div>
  );
}

function EventCard({
  event,
  organizerLabel,
  participantLabel,
  past = false,
}: {
  event: { id: string; title: string; sport: string; eventType: string; location: string; startDateTime: string; role: string };
  organizerLabel: string;
  participantLabel: string;
  past?: boolean;
}) {
  const roleColor = event.role === "organizer"
    ? "bg-amber-100 text-amber-700"
    : "bg-emerald-100 text-emerald-700";

  return (
    <Link
      href={`/discover/${event.id}`}
      className={`group flex items-start gap-4 rounded-2xl border p-4 hover:shadow-md transition-shadow ${
        past ? "border-zinc-100 bg-zinc-50" : "border-zinc-200 bg-white"
      }`}
    >
      <div className={`flex size-12 shrink-0 items-center justify-center rounded-xl text-xl ${past ? "bg-zinc-200" : "bg-[#e21d12]/8"}`}>
        {sportEmoji(event.sport)}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`truncate font-bold text-sm group-hover:text-[#e21d12] transition-colors ${past ? "text-zinc-500" : "text-zinc-900"}`}>
          {event.title}
        </p>
        <p className="text-xs text-zinc-400 mt-0.5">{formatEventDate(event.startDateTime)}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${roleColor}`}>
            {event.role === "organizer" ? organizerLabel : participantLabel}
          </span>
          <span className="text-[10px] text-zinc-400">{event.eventType}</span>
        </div>
      </div>
    </Link>
  );
}
