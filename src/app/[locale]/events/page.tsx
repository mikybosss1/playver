import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import EventsDiscoverContent from "@/components/events/EventsDiscoverContent";
import SuccessToast from "@/components/ui/SuccessToast";
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
        <EventsDiscoverContent
          events={events}
          currentUserId={session?.user?.id ?? null}
          joinedEventIds={joinedEventIds}
          showCreateButton={Boolean(session)}
        />
      </main>
      <Footer />
    </>
  );
}
