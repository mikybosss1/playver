// Landing page for the tournament_team_member confirm/decline email link
// (?token=...&action=confirm|decline). Shows the right icon/copy up front
// based on the `action` param, then TournamentConfirmButtons performs the
// actual confirm/decline call.
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Link } from "@/i18n/routing";
import TournamentConfirmButtons from "@/components/tournaments/TournamentConfirmButtons";

export default async function TournamentConfirmPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string; action?: string }>;
}) {
  const [{ id }, { token, action }] = await Promise.all([params, searchParams]);

  if (!token) notFound();

  const isConfirm = action !== "decline";

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-zinc-50 flex items-center justify-center py-16 px-4">
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm w-full max-w-md p-8 flex flex-col items-center gap-6 text-center">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isConfirm ? "bg-emerald-100" : "bg-zinc-100"}`}>
            {isConfirm ? (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            )}
          </div>

          <div>
            <h1 className="text-2xl font-extrabold text-zinc-900" style={{ fontFamily: "var(--font-playfair)" }}>
              {isConfirm ? "Confirm your spot" : "Can't make it?"}
            </h1>
            <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
              {isConfirm
                ? "Your captain is counting on you. Confirm your participation in the tournament."
                : "Let your captain know so they can find a replacement player."}
            </p>
          </div>

          <TournamentConfirmButtons token={token} tournamentId={id} initialAction={isConfirm ? "confirm" : "decline"} />

          <Link href={`/tournaments/${id}`} className="text-sm text-zinc-400 hover:text-zinc-600 underline">
            View tournament
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
