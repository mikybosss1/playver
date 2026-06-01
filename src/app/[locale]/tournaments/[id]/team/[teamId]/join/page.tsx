import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { getTournamentTeamByInviteCode } from "@/app/actions/tournament";
import InviteAcceptButtons from "@/components/TournamentInviteAcceptButtons";

export default async function TournamentTeamJoinPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; teamId: string }>;
  searchParams: Promise<{ code?: string }>;
}) {
  const [{ id, teamId }, session, { code }] = await Promise.all([
    params,
    auth.api.getSession({ headers: await headers() }),
    searchParams,
  ]);

  if (!code) notFound();

  const team = await getTournamentTeamByInviteCode(code);
  if (!team || team.id !== teamId || team.tournamentId !== id) notFound();

  if (!session) {
    const callbackUrl = encodeURIComponent(`/tournaments/${id}/team/${teamId}/join?code=${code}`);
    redirect(`/auth/signin?callbackUrl=${callbackUrl}`);
  }

  const isAlreadyCaptain = team.captainId === session.user.id;
  const isAlreadyMember = team.members.some((m) => m.userId === session.user.id);
  const isFull = team.memberCount >= team.playerCount;
  const alreadyIn = isAlreadyCaptain || isAlreadyMember;

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-zinc-50 flex items-center justify-center py-16 px-4">
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm w-full max-w-md p-8 flex flex-col items-center gap-6 text-center">
          {/* Trophy icon */}
          <div className="w-16 h-16 rounded-2xl bg-[#e21d12]/10 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#e21d12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M4 22h16" />
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
            </svg>
          </div>

          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-zinc-400 mb-1">
              Tournament Team Invite
            </p>
            <h1 className="text-2xl font-extrabold text-zinc-900" style={{ fontFamily: "var(--font-playfair)" }}>
              {team.tournamentTitle}
            </h1>
          </div>

          {alreadyIn ? (
            <div className="w-full flex flex-col gap-4">
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-700">
                {isAlreadyCaptain
                  ? "You are the captain of this team."
                  : "You are already a member of this team."}
              </div>
              <Link
                href={`/tournaments/${id}`}
                className="block w-full px-4 py-2.5 text-sm font-semibold rounded-lg bg-[#e21d12] text-white hover:bg-[#d41810] transition-colors"
              >
                View Tournament
              </Link>
            </div>
          ) : isFull ? (
            <div className="w-full flex flex-col gap-4">
              <div className="rounded-xl bg-zinc-100 border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-600">
                Sorry, this team is already full ({team.memberCount} / {team.playerCount} players).
              </div>
              <Link
                href={`/tournaments/${id}`}
                className="block w-full px-4 py-2.5 text-sm font-semibold rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                Browse Tournament
              </Link>
            </div>
          ) : (
            <div className="w-full flex flex-col gap-4">
              <p className="text-zinc-600 text-sm leading-relaxed">
                <span className="font-bold text-zinc-900">{team.captainName}</span> has invited you to join{" "}
                <span className="font-bold text-zinc-900">{team.name}</span>.
                <br />
                Would you like to join?
              </p>

              <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-3 text-sm text-zinc-600">
                <span className="font-semibold">{team.memberCount}</span> / {team.playerCount} players
              </div>

              <InviteAcceptButtons inviteCode={code} tournamentId={id} />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
