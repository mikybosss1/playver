import { headers } from "next/headers";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import JoinTeamButton from "@/components/JoinTeamButton";
import { Link } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { getMembershipMap, getTeamById, getTeamMembers } from "@/app/actions/team";
import { getTeamEvents } from "@/app/actions/event";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function formatEventDate(value: string) {
  const d = new Date(value);
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(d) +
    " · " +
    new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(d);
}

function LocationIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-zinc-200 bg-zinc-50 p-6">
      <p className="text-sm font-extrabold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-4 text-2xl font-extrabold text-zinc-950">{value}</p>
    </div>
  );
}

export default async function TeamDetailsPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const [{ teamId }, t, session] = await Promise.all([
    params,
    getTranslations("TeamDetails"),
    auth.api.getSession({ headers: await headers() }),
  ]);

  const team = await getTeamById(teamId);
  if (!team) notFound();

  const [members, membershipSet, teamEvents] = await Promise.all([
    getTeamMembers(team.id),
    session ? getMembershipMap([team.id]) : Promise.resolve(new Set<string>()),
    getTeamEvents(team.id),
  ]);

  const isCaptain = session?.user?.id === team.captainId;

  // Captain always first
  const sortedMembers = [
    ...members.filter((m) => m.id === team.captainId),
    ...members.filter((m) => m.id !== team.captainId),
  ];

  const now = new Date();
  const upcomingEvents = teamEvents.filter((e) => new Date(e.startDateTime) >= now);
  const pastEvents = teamEvents.filter((e) => new Date(e.startDateTime) < now);

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
          <Link href="/teams" className="mb-6 inline-flex text-sm font-semibold text-[#e21d12] hover:underline">
            ← {t("back")}
          </Link>

          <section className="overflow-hidden rounded-[24px] border border-zinc-200 bg-white shadow-sm">
            {/* Hero */}
            <div className="relative flex min-h-72 items-center justify-center overflow-hidden bg-[#e21d12]/8 px-6 py-12">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(226,29,18,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(226,29,18,0.12),transparent_35%)]" />
              <div className="relative z-10 flex flex-col items-center text-center">
                {team.logoUrl ? (
                  <Image src={team.logoUrl} alt={team.name} width={112} height={112} className="size-28 rounded-full border-4 border-white object-cover shadow-md" />
                ) : (
                  <div className="flex size-28 items-center justify-center rounded-full border-4 border-white bg-white text-4xl font-extrabold text-[#e21d12] shadow-md">
                    {team.name[0]?.toUpperCase()}
                  </div>
                )}
                <p className="mt-5 text-sm font-extrabold uppercase tracking-wide text-[#c32722]">{team.sport}</p>
                <h1 className="mt-2 text-4xl font-extrabold leading-tight text-zinc-950" style={{ fontFamily: "var(--font-playfair)" }}>
                  {team.name}
                </h1>
                <div className="mt-4 flex items-center gap-2 text-base font-semibold text-zinc-600">
                  <LocationIcon />
                  <span>{team.location}</span>
                </div>
              </div>
            </div>

            <div className="grid gap-6 p-6 lg:grid-cols-[1fr_300px]">
              <div className="grid gap-6">
                {/* Stats */}
                <div className="grid gap-5 sm:grid-cols-3">
                  <MetricCard label={t("captain")} value={team.captainName} />
                  <MetricCard label={t("members")} value={String(team.memberCount)} />
                  <MetricCard label={t("created")} value={formatDate(team.createdAt)} />
                </div>

                {/* About */}
                <section>
                  <h2 className="mb-3 text-xl font-extrabold text-zinc-950">{t("about")}</h2>
                  <p className="whitespace-pre-line text-base leading-7 text-zinc-600">{team.bio || t("noBio")}</p>
                </section>

                {/* Roster */}
                <section>
                  <h2 className="mb-4 text-xl font-extrabold text-zinc-950">{t("roster")}</h2>
                  {sortedMembers.length === 0 ? (
                    <div className="rounded-[18px] border-2 border-dashed border-zinc-200 py-16 text-center">
                      <p className="text-lg text-zinc-500">{t("noMembers")}</p>
                      <p className="mt-2 text-sm text-zinc-400">{t("firstMember")}</p>
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {sortedMembers.map((member) => {
                        const isTheCaptain = member.id === team.captainId;
                        return (
                          <Link
                            key={member.id}
                            href={`/athletes/${member.id}`}
                            className={`group flex items-center gap-4 rounded-2xl border bg-white p-4 transition-shadow hover:shadow-md ${
                              isTheCaptain
                                ? "border-[#e21d12]/40 ring-2 ring-[#e21d12]/20"
                                : "border-zinc-200"
                            }`}
                          >
                            <div className={`flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full font-extrabold ${
                              isTheCaptain
                                ? "bg-[#e21d12]/10 text-[#e21d12]"
                                : "bg-zinc-100 text-zinc-500"
                            }`}>
                              {member.image ? (
                                <Image src={member.image} alt={member.name} width={48} height={48} className="size-12 object-cover" />
                              ) : (
                                member.name[0]?.toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <p className="truncate font-extrabold text-zinc-950 group-hover:text-[#e21d12] transition-colors">
                                  {member.name}
                                </p>
                                {isTheCaptain && (
                                  <span className="shrink-0 rounded-full bg-[#e21d12] px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white">
                                    {t("captainBadge")}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-zinc-400">
                                {isTheCaptain ? t("captain") : `${t("joined")} ${formatDate(member.joinedAt)}`}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* Events Attending */}
                <section>
                  <h2 className="mb-4 text-xl font-extrabold text-zinc-950">{t("eventsAttending")}</h2>

                  {upcomingEvents.length === 0 && pastEvents.length === 0 ? (
                    <div className="rounded-[18px] border-2 border-dashed border-zinc-200 py-12 text-center">
                      <p className="text-zinc-500">{t("noTeamEvents")}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-6">
                      {upcomingEvents.length > 0 && (
                        <div>
                          <p className="mb-3 text-xs font-extrabold uppercase tracking-wide text-zinc-400">{t("upcoming")}</p>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {upcomingEvents.map((event) => (
                              <Link
                                key={event.id}
                                href={`/discover/${event.id}`}
                                className="group flex items-start gap-4 rounded-2xl border border-zinc-200 bg-white p-4 hover:shadow-md transition-shadow"
                              >
                                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#e21d12]/8 text-xl">
                                  {sportEmoji(event.sport)}
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate font-bold text-zinc-900 group-hover:text-[#e21d12] transition-colors text-sm">{event.title}</p>
                                  <p className="text-xs text-zinc-500 mt-0.5">{formatEventDate(event.startDateTime)}</p>
                                  <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
                                    </svg>
                                    {event.location}
                                  </p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {pastEvents.length > 0 && (
                        <div>
                          <p className="mb-3 text-xs font-extrabold uppercase tracking-wide text-zinc-400">{t("past")}</p>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {pastEvents.map((event) => (
                              <Link
                                key={event.id}
                                href={`/discover/${event.id}`}
                                className="group flex items-start gap-4 rounded-2xl border border-zinc-100 bg-zinc-50 p-4 hover:shadow-md transition-shadow"
                              >
                                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-zinc-200 text-xl">
                                  {sportEmoji(event.sport)}
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate font-bold text-zinc-500 text-sm">{event.title}</p>
                                  <p className="text-xs text-zinc-400 mt-0.5">{formatEventDate(event.startDateTime)}</p>
                                  <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
                                    </svg>
                                    {event.location}
                                  </p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </section>
              </div>

              {/* Sidebar */}
              <aside className="h-fit rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">{t("membership")}</p>
                <p className="mt-3 text-xl font-extrabold text-zinc-950">{team.memberCount} {t("membersLower")}</p>
                <p className="mt-4 text-sm text-zinc-500">
                  {t("captain")}: <span className="font-semibold text-zinc-700">{team.captainName}</span>
                </p>
                <div className="mt-6">
                  {isCaptain ? (
                    <span className="block rounded-lg bg-[#e21d12]/10 px-4 py-3 text-center text-sm font-bold text-[#e21d12]">
                      {t("yourTeam")}
                    </span>
                  ) : session ? (
                    <JoinTeamButton
                      teamId={team.id}
                      isMember={membershipSet.has(team.id)}
                      joinLabel={t("join")}
                      leaveLabel={t("leave")}
                    />
                  ) : null}
                </div>
              </aside>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}

function sportEmoji(sport: string): string {
  const map: Record<string, string> = {
    Soccer: "⚽", Basketball: "🏀", Volleyball: "🏐", Pickleball: "🏓",
    Tennis: "🎾", Hockey: "🏒", Baseball: "⚾", Cricket: "🏏", Rugby: "🏉",
  };
  return map[sport] ?? "🏅";
}
