import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import JoinTeamButton from "@/components/JoinTeamButton";
import { getTeams, getMembershipMap } from "@/app/actions/team";
import { auth } from "@/lib/auth";

export default async function TeamsPage() {
  const t = await getTranslations("Teams");
  const teams = await getTeams();

  const session = await auth.api.getSession({ headers: await headers() });
  const currentUserId = session?.user?.id ?? null;

  const memberSet = currentUserId
    ? await getMembershipMap(teams.map((t) => t.id))
    : new Set<string>();

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-20">
          <p className="text-sm font-bold tracking-wide uppercase text-[#e21d12] mb-4">
            {t("eyebrow")}
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 mb-4" style={{ fontFamily: "var(--font-playfair)" }}>
            {t("title")}
          </h1>
          <p className="text-zinc-500 text-lg max-w-xl">{t("subtitle")}</p>

          {teams.length === 0 ? (
            <div className="mt-14 flex flex-col items-center justify-center py-20 text-center gap-3">
              <span className="text-5xl">👥</span>
              <p className="text-zinc-500">{t("noTeams")}</p>
            </div>
          ) : (
            <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((team) => {
                const isCaptain = currentUserId === team.captainId;
                const isMember = memberSet.has(team.id);
                return (
                  <div key={team.id} className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm flex flex-col gap-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      {team.logoUrl ? (
                        <Image
                          src={team.logoUrl}
                          alt={team.name}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-full object-cover border border-zinc-100"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-[#e21d12]/10 flex items-center justify-center text-[#e21d12] font-bold text-lg">
                          {team.name[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-zinc-900 text-base leading-tight">{team.name}</p>
                        <p className="text-xs text-zinc-400 font-medium">{team.sport}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-zinc-500 text-sm">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                      </svg>
                      {team.location}
                    </div>

                    {team.bio && (
                      <p className="text-sm text-zinc-500 line-clamp-2">{team.bio}</p>
                    )}

                    <p className="text-xs text-zinc-400">
                      {t("captain")}: <span className="text-zinc-600 font-medium">{team.captainName}</span>
                    </p>

                    {currentUserId && !isCaptain && (
                      <JoinTeamButton
                        teamId={team.id}
                        isMember={isMember}
                        joinLabel={t("join")}
                        leaveLabel={t("leave")}
                      />
                    )}
                    {isCaptain && (
                      <span className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#e21d12]/10 text-[#e21d12] text-center">
                        {t("yourTeam")}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
