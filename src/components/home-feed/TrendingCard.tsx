import { getTranslations } from "next-intl/server";

// Placeholder sample trends — trending topics isn't a real feature yet.
const SAMPLE_TRENDS = [
  { tag: "SpringClassic2025", posts: 84 },
  { tag: "PlayverChallenge", posts: 2100 },
  { tag: "SoccerMontreal", posts: 612 },
];

export default async function TrendingCard() {
  const t = await getTranslations("HomeFeed");

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
      <p className="font-bold text-zinc-900 mb-4">{t("trendingTitle")}</p>
      <div className="flex flex-col gap-3">
        {SAMPLE_TRENDS.map((trend, index) => (
          <div key={trend.tag} className="flex items-center gap-3">
            <span className="text-sm font-bold text-zinc-300 w-4 shrink-0">{index + 1}</span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#e21d12] truncate">#{trend.tag}</p>
              <p className="text-xs text-zinc-400">{t("postsCount", { count: trend.posts.toLocaleString() })}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
