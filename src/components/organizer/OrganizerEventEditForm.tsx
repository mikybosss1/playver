"use client";

import { useRouter } from "@/i18n/routing";
import CreateEventForm from "@/components/events/CreateEventForm";
import type { EventItem, FormField } from "@/app/actions/event";

// Thin wrapper so the (server-component) organizer manage page can keep the
// organizer on /organizer/events/[eventId] after a save, instead of
// CreateEventForm's default post-edit redirect to the public event page.
export default function OrganizerEventEditForm({
  event,
  formFields,
}: {
  event: EventItem;
  formFields: FormField[];
}) {
  const router = useRouter();
  return (
    <CreateEventForm
      initialData={event}
      initialFormFields={formFields}
      eventId={event.id}
      onSuccess={() => router.push(`/organizer/events/${event.id}` as Parameters<typeof router.push>[0])}
    />
  );
}
