import { headers } from "next/headers";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EventJoinButton from "@/components/EventJoinButton";
import EventDetailsTabs from "@/components/EventDetailsTabs";
import AdminDeleteEventButton from "@/components/AdminDeleteEventButton";
import AdminAddParticipant from "@/components/AdminAddParticipant";
import { Link } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { getEventById, getEventParticipants, getEventParticipationMap, getEventFormFields } from "@/app/actions/event";
import { getTournamentTeams, getMyTournamentTeam, getPendingJoinRequests, getMyTeamOptions } from "@/app/actions/tournament";
import { getUserRole } from "@/app/actions/admin";
import { formatPrice } from "@/lib/stripe";
import TournamentRegisterButton from "@/components/TournamentRegisterButton";
import { TournamentCaptainPanel, TournamentMemberPanel } from "@/components/TournamentCaptainPanel";
import JoinTeamTabButton from "@/components/JoinTeamTabButton";

export default async function EventDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ payment?: string }>;
}) {
  const [{ eventId }, t, session, { payment }] = await Promise.all([
    params,
    getTranslations("EventDetails"),
    auth.api.getSession({ headers: await headers() }),
    searchParams,
  ]);
  const paymentSuccess = payment === "success";
  const event = await getEventById(eventId);
  if (!event) notFound();

  const isTournament = event.eventType === "Tournament";

  const [joinedSet, participants, formFields, userRole] = await Promise.all([
    session && !isTournament ? getEventParticipationMap([event.id]) : Promise.resolve(new Set<string>()),
    getEventParticipants(event.id),
    event.customFormEnabled ? getEventFormFields(event.id) : Promise.resolve([]),
    session ? getUserRole(session.user.id) : Promise.resolve("player" as const),
  ]);

  const [teams, myTeam, myTeamOptions] = isTournament
    ? await Promise.all([
        getTournamentTeams(eventId),
        session ? getMyTournamentTeam(eventId) : Promise.resolve(null),
        session ? getMyTeamOptions() : Promise.resolve([]),
      ])
    : [[], null, []];

  const pendingRequests =
    isTournament && session && myTeam && myTeam.captainId === session.user.id
      ? await getPendingJoinRequests(myTeam.id)
      : [];

  const isSuperAdmin = userRole === "super_admin";
  const isOrganizer = session?.user?.id === event.organizerId;
  const isEnded = new Date(event.endDateTime) < new Date();
  const capacity = event.capacity ?? 0;
  const progress = capacity > 0 ? Math.min((event.participantCount / capacity) * 100, 100) : 0;
  const joinedLabel = capacity
    ? t("joinedProgress", { joined: event.participantCount, capacity })
    : t("joinedCount", { count: event.participantCount });

  const isCaptain = isTournament && myTeam?.captainId === session?.user?.id;
  const isMember = isTournament && myTeam && !isCaptain;

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
          <Link
            href={isTournament ? "/tournaments" : "/events"}
            className="mb-6 inline-flex text-sm font-semibold text-[#e21d12] hover:underline"
          >
            {isTournament ? t("backToTournaments") : t("back")}
          </Link>

          {paymentSuccess && (
            <div className="mb-6 flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-4 text-sm font-semibold text-emerald-700">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {isTournament ? t("tournamentPaymentSuccess") : t("paymentSuccess")}
            </div>
          )}

          <section className="overflow-hidden rounded-[24px] border border-zinc-200 bg-white shadow-sm">
            {/* Cover */}
            <div className="relative h-[200px] sm:h-[320px] overflow-hidden bg-zinc-100">
              {event.coverImageUrl ? (
                <Image src={event.coverImageUrl} alt={event.title} fill priority className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-6xl font-bold text-[#e21d12]">
                  {event.title[0]?.toUpperCase()}
                </div>
              )}
              <div className="absolute left-6 top-6 rounded-full bg-white px-5 py-2 text-xs font-extrabold uppercase tracking-wide text-[#c32722] shadow-sm">
                {event.sport}
              </div>
              {isEnded && (
                <div className="absolute bottom-6 right-6 rounded-full border-2 border-red-300 bg-[#e21d12] px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-white shadow-md">
                  {t("eventEnded")}
                </div>
              )}
            </div>

            {isTournament ? (
              /* ── Tournament: sidebar layout matching regular events ── */
              (() => {
                const activeTeams = teams.filter(tm => tm.status === "active").length;
                const teamsProgress = (event.capacity ?? 0) > 0 ? Math.min((activeTeams / event.capacity!) * 100, 100) : 0;
                return (
                  <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[1fr_300px]">
                    {/* Left: title */}
                    <div className="order-last lg:order-first flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight text-zinc-950" style={{ fontFamily: "var(--font-playfair)" }}>
                          {event.title}
                        </h1>
                        <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">{t("tournamentBadge", { sport: event.sport })}</p>
                      </div>
                      {event.price > 0 ? (
                        <span className="text-2xl font-extrabold text-[#e21d12] shrink-0">{formatPrice(event.price)}</span>
                      ) : (
                        <span className="text-2xl font-extrabold uppercase text-emerald-600 shrink-0">{t("free")}</span>
                      )}
                    </div>

                    {/* Right: registration sidebar */}
                    <aside className="h-fit rounded-2xl border border-zinc-200 bg-zinc-50 p-5 order-first lg:order-last">
                      <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">{t("registration")}</p>
                      <p className="mt-3 text-xl font-extrabold text-zinc-950">
                        {(event.capacity ?? 0) > 0
                          ? t("tournamentTeamCountMax", { count: activeTeams, max: event.capacity ?? 0 })
                          : t("tournamentTeamCount", { count: activeTeams })}
                      </p>
                      {(event.capacity ?? 0) > 0 && (
                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
                          <div className="h-full rounded-full bg-[#e21d12]" style={{ width: `${teamsProgress}%` }} />
                        </div>
                      )}
                      <p className="mt-6 text-sm text-zinc-500">
                        {t("organizedBy")}: <span className="font-semibold text-zinc-700">{event.organizerName}</span>
                      </p>
                      <div className="mt-6 flex flex-col gap-2">
                        {isOrganizer && (
                          <>
                            <span className="block rounded-lg bg-[#e21d12]/10 px-4 py-3 text-center text-sm font-bold text-[#e21d12]">
                              {t("youreOrganizer")}
                            </span>
                            <Link
                              href={`/events/${event.id}/edit`}
                              className="block rounded-lg border border-zinc-200 bg-white px-4 py-3 text-center text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
                            >
                              {t("editTournament")}
                            </Link>
                          </>
                        )}
                        {myTeam && isCaptain ? (
                          <TournamentCaptainPanel
                            team={myTeam}
                            pendingRequests={pendingRequests}
                            tournamentId={eventId}
                            price={event.price}
                          />
                        ) : myTeam && isMember ? (
                          <TournamentMemberPanel team={myTeam} />
                        ) : session && !isEnded ? (
                          <>
                            <TournamentRegisterButton
                              tournamentId={eventId}
                              price={event.price}
                              maxPlayersPerTeam={event.maxPlayersPerTeam}
                              myTeams={myTeamOptions}
                            />
                            <JoinTeamTabButton />
                          </>
                        ) : !session ? (
                          <Link
                            href="/auth/signin"
                            className="block rounded-lg bg-[#e21d12] px-4 py-3 text-center text-sm font-semibold text-white hover:bg-[#d41810] transition-colors"
                          >
                            {t("signInToRegister")}
                          </Link>
                        ) : (
                          <p className="text-sm text-zinc-500">{t("registrationClosed")}</p>
                        )}
                        {isSuperAdmin && (
                          <AdminDeleteEventButton eventId={event.id} eventTitle={event.title} />
                        )}
                      </div>
                    </aside>
                  </div>
                );
              })()
            ) : (
              /* ── Regular event: sidebar layout ── */
              <div className="grid gap-6 p-6 lg:grid-cols-[1fr_300px]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h1 className="text-3xl font-extrabold leading-tight text-zinc-950" style={{ fontFamily: "var(--font-playfair)" }}>
                      {event.title}
                    </h1>
                    <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">{event.eventType}</p>
                  </div>
                  {event.price > 0 ? (
                    <span className="text-2xl font-extrabold text-[#e21d12]">{formatPrice(event.price)}</span>
                  ) : (
                    <span className="text-2xl font-extrabold uppercase text-emerald-600">{t("free")}</span>
                  )}
                </div>

                <aside className="h-fit rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">{t("registration")}</p>
                  <p className="mt-3 text-xl font-extrabold text-zinc-950">{joinedLabel}</p>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
                    <div className="h-full rounded-full bg-[#e21d12]" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="mt-6 text-sm text-zinc-500">
                    {t("organizedBy")}: <span className="font-semibold text-zinc-700">{event.organizerName}</span>
                  </p>
                  <div className="mt-6 flex flex-col gap-2">
                    {isOrganizer && (
                      <span className="block rounded-lg bg-[#e21d12]/10 px-4 py-3 text-center text-sm font-bold text-[#e21d12]">
                        {t("yourEvent")}
                      </span>
                    )}
                    {(isOrganizer || isSuperAdmin) && (
                      <Link
                        href={`/events/${event.id}/edit`}
                        className="block rounded-lg border border-zinc-200 px-4 py-3 text-center text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
                      >
                        {t("editEvent")}
                      </Link>
                    )}
                    {session && (
                      <EventJoinButton
                        eventId={event.id}
                        isJoined={joinedSet.has(event.id)}
                        joinLabel={t("join")}
                        leaveLabel={t("leave")}
                        price={event.price}
                        formFields={formFields}
                        isEnded={isEnded}
                      />
                    )}
                    {isSuperAdmin && (
                      <>
                        <AdminAddParticipant eventId={event.id} />
                        <AdminDeleteEventButton eventId={event.id} eventTitle={event.title} />
                      </>
                    )}
                  </div>
                </aside>
              </div>
            )}
          </section>

          <EventDetailsTabs
            event={event}
            participants={participants}
            isSuperAdmin={isSuperAdmin}
            hideTabs={isTournament ? ["participants"] : []}
            tournamentTeams={isTournament ? teams : undefined}
            myTournamentTeamId={myTeam?.id}
            canRequestJoin={!!(session && !myTeam && !isEnded)}
            tournamentId={eventId}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
