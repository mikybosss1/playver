import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CreateEventForm from "@/components/CreateEventForm";
import { auth } from "@/lib/auth";
import { getEventById, getEventFormFields } from "@/app/actions/event";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  const [t, session] = await Promise.all([
    getTranslations("CreateEvent"),
    auth.api.getSession({ headers: await headers() }),
  ]);

  if (!session) notFound();

  const event = await getEventById(eventId);
  if (!event) notFound();
  if (event.organizerId !== session.user.id) notFound();

  const formFields = event.customFormEnabled ? await getEventFormFields(eventId) : [];

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-zinc-50">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-12">
          <h1
            className="text-3xl font-bold text-zinc-900 mb-8"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            {t("editTitle")}
          </h1>
          <CreateEventForm
            initialData={event}
            initialFormFields={formFields}
            eventId={eventId}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
