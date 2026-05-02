import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const t = await getTranslations("Dashboard");
  const user = session!.user;

  const stats = [
    { label: t("statUpcoming"), value: "0", icon: "📅" },
    { label: t("statTeams"), value: "0", icon: "👥" },
    { label: t("statPlayed"), value: "0", icon: "🏅" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">

      {/* Header */}
      <div className="mb-8">
        <p className="text-sm font-bold tracking-wide uppercase text-[#e21d12] mb-1">
          {t("eyebrow")}
        </p>
        <h1
          className="text-3xl sm:text-4xl font-bold text-zinc-900"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          {t("greeting", { name: user.name?.split(" ")[0] ?? t("defaultName") })}
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map(({ label, value, icon }) => (
          <div key={label} className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 flex items-center gap-4">
            <span className="text-3xl">{icon}</span>
            <div>
              <p className="text-2xl font-bold text-zinc-900">{value}</p>
              <p className="text-sm text-zinc-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Upcoming Events */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-zinc-900">{t("upcomingEvents")}</h2>
            <Link href="/discover" className="text-xs font-semibold text-[#e21d12] hover:underline">
              {t("browseEvents")}
            </Link>
          </div>
          <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
            <span className="text-4xl">🔍</span>
            <p className="text-sm text-zinc-500">{t("noUpcoming")}</p>
            <Link
              href="/dashboard/events"
              className="mt-2 px-5 py-2 text-xs font-semibold text-white rounded-lg bg-[#e21d12] hover:bg-[#d41810] transition-colors"
            >
              {t("findEvent")}
            </Link>
          </div>
        </div>

        {/* My Teams */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-zinc-900">{t("myTeams")}</h2>
            <Link href="/teams" className="text-xs font-semibold text-[#e21d12] hover:underline">
              {t("browseTeams")}
            </Link>
          </div>
          <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
            <span className="text-4xl">👥</span>
            <p className="text-sm text-zinc-500">{t("noTeams")}</p>
            <Link
              href="/dashboard/teams"
              className="mt-2 px-5 py-2 text-xs font-semibold text-white rounded-lg bg-[#e21d12] hover:bg-[#d41810] transition-colors"
            >
              {t("joinTeam")}
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
