// Not-yet-built organizer section — see organizer/communications/page.tsx
// for the shared ComingSoonPanel pattern used by this whole group.
import { getTranslations } from "next-intl/server";
import { getActiveOrganization } from "@/app/actions/organization";
import ComingSoonPanel from "@/components/organizer/ComingSoonPanel";

export default async function OpportunitiesPage() {
  const [active, t] = await Promise.all([getActiveOrganization(), getTranslations("Organizer")]);
  if (!active) return null;

  return (
    <ComingSoonPanel
      eyebrow={t("navOpportunities")}
      title={t("navOpportunities")}
      badge={t("comingSoonBadge")}
      description={t("comingSoonDescription")}
    />
  );
}
