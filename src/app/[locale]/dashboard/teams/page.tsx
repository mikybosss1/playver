import { getTranslations } from "next-intl/server";
import Image from "next/image";
import CreateTeamButton from "@/components/teams/CreateTeamButton";
import { getMyTeams, getJoinedTeams } from "@/app/actions/team";
import { Link } from "@/i18n/routing";

type TeamCardData = Awaited<ReturnType<typeof getMyTeams>>[number];

function TeamCard({ team, badge }: { team: TeamCardData; badge?: string }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow">
      <Link href={`/teams/${team.id}`} className="flex items-center gap-3">
        {team.logoUrl ? (
          <Image
            src={team.logoUrl}
            alt={team.name}
            width={44}
            height={44}
            className="w-11 h-11 rounded-full object-cover border border-zinc-100 shrink-0"
          />
        ) : (
          <div className="w-11 h-11 rounded-full bg-[#e21d12]/10 flex items-center justify-center text-[#e21d12] font-bold text-base shrink-0">
            {team.name[0].toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-bold text-zinc-900 text-sm leading-tight truncate">{team.name}</p>
            {badge && (
              <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-bold rounded bg-[#e21d12]/10 text-[#e21d12]">
                {badge}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 font-medium">{team.sport}</p>
        </div>
      </Link>

      <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
        </svg>
        {team.location}
      </div>

      {team.bio && (
        <p className="text-xs text-zinc-500 line-clamp-2">{team.bio}</p>
      )}
      <p className="text-xs text-zinc-400">{team.memberCount} member{team.memberCount === 1 ? "" : "s"}</p>
    </div>
  );
}

export default async function DashboardTeamsPage() {
  const t = await getTranslations("DashboardTeams");
  const [myTeams, joinedTeams] = await Promise.all([getMyTeams(), getJoinedTeams()]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <p className="text-sm font-bold tracking-wide uppercase text-[#e21d12] mb-1">
            {t("eyebrow")}
          </p>
          <h1 className="text-3xl font-bold text-zinc-900" style={{ fontFamily: "var(--font-playfair)" }}>
            {t("title")}
          </h1>
        </div>
        <CreateTeamButton label={t("createButton")} />
      </div>

      {/* My Teams */}
      <section className="mb-10">
        <h2 className="text-base font-bold text-zinc-700 mb-4">{t("myTeamsTitle")}</h2>
        {myTeams.length === 0 ? (
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-10 flex flex-col items-center justify-center text-center gap-3">
            <span className="text-4xl">🏆</span>
            <p className="text-zinc-500 text-sm">{t("emptyMyTeams")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myTeams.map((team) => (
              <TeamCard key={team.id} team={team} badge={t("captainBadge")} />
            ))}
          </div>
        )}
      </section>

      {/* Joined Teams */}
      <section>
        <h2 className="text-base font-bold text-zinc-700 mb-4">{t("joinedTeamsTitle")}</h2>
        {joinedTeams.length === 0 ? (
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-10 flex flex-col items-center justify-center text-center gap-3">
            <span className="text-4xl">👥</span>
            <p className="text-zinc-500 text-sm">{t("emptyJoinedTeams")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {joinedTeams.map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
