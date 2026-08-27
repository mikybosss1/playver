import { getTranslations } from "next-intl/server";

// Placeholder sample data — Challenges isn't a real feature yet.
const SAMPLE_CHALLENGES = [
  { icon: "🏀", title: "3-Point Challenge", athletes: 2847 },
  { icon: "⚽", title: "Soccer Skills 500", athletes: 1203 },
  { icon: "💪", title: "30-Day Conditioning", athletes: 891 },
];

export default async function LiveChallengesCard() {
  const t = await getTranslations("HomeFeed");

  return (
    <div className="bg-[#e21d12] rounded-2xl shadow-sm p-5">
      <p className="flex items-center gap-2 text-white font-bold mb-4">
        <span aria-hidden>⚡</span>
        {t("liveChallengesTitle")}
      </p>
      <div className="flex flex-col gap-2">
        {SAMPLE_CHALLENGES.map((challenge) => (
          <div key={challenge.title} className="flex items-center gap-3 bg-white/10 hover:bg-white/15 transition-colors rounded-xl px-3 py-2.5">
            <span className="text-xl shrink-0">{challenge.icon}</span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{challenge.title}</p>
              <p className="text-xs text-white/70">{t("athletesCount", { count: challenge.athletes.toLocaleString() })}</p>
            </div>
          </div>
        ))}
      </div>
      <button type="button" title={t("comingSoon")} className="w-full text-center text-sm font-semibold text-white/90 hover:text-white transition-colors mt-4 cursor-not-allowed">
        {t("seeAllChallenges")} →
      </button>
    </div>
  );
}
