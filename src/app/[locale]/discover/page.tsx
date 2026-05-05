import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DiscoverSearch from "@/components/DiscoverSearch";
import SuccessToast from "@/components/SuccessToast";
import { auth } from "@/lib/auth";
import { getEventParticipationMap, getEvents } from "@/app/actions/event";

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const t = await getTranslations("Discover");
  const params = await searchParams;
  const [events, session] = await Promise.all([
    getEvents(),
    auth.api.getSession({ headers: await headers() }),
  ]);
  const joinedEventIds = session
    ? Array.from(await getEventParticipationMap(events.map((event) => event.id)))
    : [];

  return (
    <>
      <Navbar />
      {params.created === "event" && <SuccessToast message={t("eventCreated")} />}
      <main className="flex-1 bg-white">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-16">
          <p className="text-sm font-bold tracking-wide uppercase text-[#e21d12] mb-4">
            {t("eyebrow")}
          </p>
          <h1
            className="text-4xl sm:text-5xl font-bold text-zinc-900 mb-4"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            {t("title")}
          </h1>
          <p className="text-zinc-500 text-lg max-w-2xl">{t("subtitle")}</p>

          <DiscoverSearch
            events={events}
            currentUserId={session?.user?.id ?? null}
            joinedEventIds={joinedEventIds}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
