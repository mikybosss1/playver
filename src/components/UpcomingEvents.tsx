import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

const placeholderAvatarColors = ["bg-red-300", "bg-blue-300", "bg-green-300"];

function EventCardSkeleton() {
  return (
    <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
      <div className="h-48 w-full bg-zinc-200 animate-pulse" />
      <div className="p-6 flex flex-col gap-3">
        <div className="h-5 bg-zinc-200 rounded animate-pulse w-3/4" />
        <div className="h-4 bg-zinc-100 rounded animate-pulse w-1/2" />
        <div className="h-4 bg-zinc-100 rounded animate-pulse w-2/3" />
        <div className="flex items-center mt-2 -space-x-2">
          {placeholderAvatarColors.map((color, i) => (
            <div key={i} className={`size-7 rounded-full border-2 border-white ${color} animate-pulse`} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function UpcomingEvents() {
  const t = await getTranslations("UpcomingEvents");

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-3" style={{ fontFamily: "var(--font-playfair)" }}>
            {t("title")}
          </h2>
          <p className="text-zinc-500 text-base max-w-xl mx-auto">{t("subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <EventCardSkeleton />
          <EventCardSkeleton />
          <EventCardSkeleton />
        </div>

        <div className="flex justify-center mt-12">
          <Link
            href="/discover"
            className="px-8 py-3 text-sm font-semibold text-white rounded-lg bg-[#e21d12] hover:bg-[#d41810] transition-colors shadow"
          >
            {t("viewAll")}
          </Link>
        </div>
      </div>
    </section>
  );
}
