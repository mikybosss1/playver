// Org-wide registrations page (/organizer/registrations): lists the org's
// events, RegistrationsClient drills into per-event registrant lists.
import { getTranslations } from "next-intl/server";
import { ForbiddenError } from "@/lib/organizer-errors";
import { getOrganizationEvents } from "@/app/actions/organizer-registrations";
import ComingSoonPanel from "@/components/organizer/ComingSoonPanel";
import RegistrationsClient from "@/components/organizer/RegistrationsClient";

export default async function RegistrationsPage() {
  const t = await getTranslations("Organizer");

  let events;
  try {
    events = await getOrganizationEvents();
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return (
        <ComingSoonPanel
          eyebrow={t("navRegistrations")}
          title={t("registrationsPermissionDeniedTitle")}
          badge={t("registrationsPermissionDeniedBadge")}
          description={t("registrationsPermissionDeniedDescription")}
        />
      );
    }
    throw error;
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <p className="text-sm font-bold tracking-wide uppercase text-[#e21d12] mb-1">{t("navRegistrations")}</p>
      <h1 className="text-3xl font-extrabold text-zinc-900 mb-6" style={{ fontFamily: "var(--font-playfair)" }}>
        {t("navRegistrations")}
      </h1>

      <RegistrationsClient events={events} />
    </div>
  );
}
