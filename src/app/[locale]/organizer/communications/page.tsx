import { getTranslations } from "next-intl/server";
import { getActiveOrganization } from "@/app/actions/organization";
import ComingSoonPanel from "@/components/organizer/ComingSoonPanel";

export default async function CommunicationsPage() {
  const [active, t] = await Promise.all([getActiveOrganization(), getTranslations("Organizer")]);
  if (!active) return null;

  return (
    <ComingSoonPanel
      eyebrow={t("navCommunications")}
      title={t("navCommunications")}
      badge={t("comingSoonBadge")}
      description={t("comingSoonDescription")}
    />
  );
}
