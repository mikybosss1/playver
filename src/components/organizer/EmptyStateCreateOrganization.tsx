"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { setActiveOrganization } from "@/app/actions/organization";
import CreateOrganizationLauncher from "@/components/organizer/create-wizard/CreateOrganizationLauncher";

export default function EmptyStateCreateOrganization() {
  const t = useTranslations("Organizer");
  const router = useRouter();

  async function handlePublished(organizationId: string) {
    await setActiveOrganization(organizationId);
    router.refresh();
  }

  return (
    <CreateOrganizationLauncher
      onPublished={handlePublished}
      trigger={(open) => (
        <button
          type="button"
          onClick={open}
          className="px-6 py-3 text-sm font-semibold text-white rounded-full bg-[#e21d12] hover:bg-[#d41810] transition-colors shadow-sm"
        >
          {t("newOrganization")}
        </button>
      )}
    />
  );
}
