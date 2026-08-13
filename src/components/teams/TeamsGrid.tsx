"use client";

import { useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import LeaveTeamButton from "@/components/teams/LeaveTeamButton";
import type { TeamItem } from "@/app/actions/team";

interface Props {
  teams: TeamItem[];
  currentUserId: string | null;
  initialJoinedIds: string[];
}

export default function TeamsGrid({ teams, currentUserId, initialJoinedIds }: Props) {
  const t = useTranslations("Teams");
  const [search, setSearch] = useState("");
  const joinedSet = new Set(initialJoinedIds);

  const filtered = search.trim()
    ? teams.filter(
        (team) =>
          team.name.toLowerCase().includes(search.toLowerCase()) ||
          team.location.toLowerCase().includes(search.toLowerCase())
      )
    : teams;

  return (
    <>
      {/* Search */}
      <div className="mt-10 relative max-w-md">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-zinc-100 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-red-200 placeholder:text-zinc-400 text-zinc-800"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-14 flex flex-col items-center justify-center py-20 text-center gap-3">
          <span className="text-5xl">👥</span>
          <p className="text-zinc-500">{search ? t("noResults") : t("noTeams")}</p>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((team) => {
            const isCaptain = currentUserId === team.captainId;
            const isMember = joinedSet.has(team.id);
            return (
              <div key={team.id} className="bg-white border border-zinc-200 rounded-xl shadow-sm flex flex-col hover:shadow-md transition-shadow overflow-hidden">
                {/* Cover + logo */}
                <Link href={`/teams/${team.id}`} className="relative block h-32 bg-zinc-900 shrink-0">
                  {team.coverImageUrl ? (
                    <Image src={team.coverImageUrl} alt={team.name} fill className="object-contain" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#e21d12]/20 via-[#e21d12]/8 to-zinc-100" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  <div className="absolute bottom-3 left-4">
                    {team.logoUrl ? (
                      <Image
                        src={team.logoUrl}
                        alt={team.name}
                        width={44}
                        height={44}
                        className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-[#e21d12] font-bold text-lg border-2 border-white shadow-sm">
                        {team.name[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                </Link>

                <div className="p-4 flex flex-col gap-3 flex-1">
                <Link href={`/teams/${team.id}`} className="flex flex-col">
                    <p className="font-bold text-zinc-900 text-base leading-tight hover:text-[#e21d12] transition-colors">{team.name}</p>
                    <p className="text-xs text-zinc-400 font-medium mt-0.5">{team.sport}</p>
                </Link>

                <div className="flex items-center gap-1.5 text-zinc-500 text-sm">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                  </svg>
                  {team.location}
                </div>

                {team.bio && (
                  <p className="text-sm text-zinc-500 line-clamp-2">{team.bio}</p>
                )}

                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>{t("captain")}: <span className="text-zinc-600 font-medium">{team.captainName}</span></span>
                  <span>{team.memberCount} {t("members")}</span>
                </div>

                <div className="mt-auto">
                  {currentUserId && !isCaptain && isMember && (
                    <LeaveTeamButton teamId={team.id} leaveLabel={t("leave")} />
                  )}
                  {isCaptain && (
                    <span className="block px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#e21d12]/10 text-[#e21d12] text-center">
                      {t("yourTeam")}
                    </span>
                  )}
                </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
