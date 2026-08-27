import { getTranslations } from "next-intl/server";

// Placeholder sample people — stand-in for a real stories feature, not tied to
// real accounts. Swap for real data once stories/posts exist.
const SAMPLE_STORIES = [
  { name: "Alexei", color: "#e21d12" },
  { name: "Maria", color: "#0ea5e9" },
  { name: "Jordan", color: "#71717a" },
  { name: "ESA", color: "#e21d12" },
  { name: "Kevin", color: "#71717a" },
];

export default async function StoriesRow() {
  const t = await getTranslations("HomeFeed");

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm px-6 py-5">
      <div className="flex items-center gap-5 overflow-x-auto">
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <span className="w-14 h-14 rounded-full border-2 border-dashed border-zinc-300 flex items-center justify-center text-zinc-400 text-xl font-semibold">
            +
          </span>
          <span className="text-xs font-medium text-zinc-500 whitespace-nowrap">{t("yourStory")}</span>
        </div>
        {SAMPLE_STORIES.map((story) => (
          <div key={story.name} className="flex flex-col items-center gap-1.5 shrink-0">
            <span
              className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold"
              style={{ backgroundColor: story.color, boxShadow: `0 0 0 2px white, 0 0 0 4px ${story.color}` }}
            >
              {story.name[0]}
            </span>
            <span className="text-xs font-medium text-zinc-600 whitespace-nowrap">{story.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
