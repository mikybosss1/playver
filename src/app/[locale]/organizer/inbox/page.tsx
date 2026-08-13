import { getTranslations } from "next-intl/server";
import { getActiveOrganization } from "@/app/actions/organization";
import ComingSoonPanel from "@/components/organizer/ComingSoonPanel";

export default async function InboxPage() {
  const [active, t] = await Promise.all([getActiveOrganization(), getTranslations("Organizer")]);
  if (!active) return null;

  return (
    <ComingSoonPanel
      eyebrow={t("navInbox")}
      title={t("navInbox")}
      badge={t("comingSoonBadge")}
      description={t("comingSoonDescription")}
    />
  );
}
