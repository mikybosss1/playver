import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ForbiddenError } from "@/lib/organizer-errors";
import { getOrganizationPeople } from "@/app/actions/organizer-people";
import PeopleClient from "@/components/organizer/PeopleClient";
import ComingSoonPanel from "@/components/organizer/ComingSoonPanel";

export default async function PeoplePage() {
  const t = await getTranslations("Organizer");

  let data;
  try {
    data = await getOrganizationPeople();
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return (
        <ComingSoonPanel
          eyebrow={t("navPeople")}
          title={t("peoplePermissionDeniedTitle")}
          badge={t("peoplePermissionDeniedBadge")}
          description={t("peoplePermissionDeniedDescription")}
        />
      );
    }
    throw error;
  }

  const session = await auth.api.getSession({ headers: await headers() });
  const currentUserId = session?.user.id ?? "";

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <p className="text-sm font-bold tracking-wide uppercase text-[#e21d12] mb-1">{t("navPeople")}</p>
      <h1 className="text-3xl font-extrabold text-zinc-900 mb-6" style={{ fontFamily: "var(--font-playfair)" }}>
        {t("navPeople")}
      </h1>

      <PeopleClient
        members={data.members}
        invitations={data.invitations}
        currentUserId={currentUserId}
      />
    </div>
  );
}
