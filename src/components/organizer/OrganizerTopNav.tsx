"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link, useRouter } from "@/i18n/routing";
import OrganizerSwitcher from "@/components/organizer/OrganizerSwitcher";
import OrganizerUserMenu from "@/components/organizer/OrganizerUserMenu";
import CreateOrganizationLauncher from "@/components/organizer/create-wizard/CreateOrganizationLauncher";
import { setActiveOrganization } from "@/app/actions/organization";
import type { OrganizationSummary } from "@/app/actions/organization";
import type { OrgRole } from "@/lib/organizer-permissions";

const IconBell = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

export default function OrganizerTopNav({
  organizations,
  activeOrganizationId,
  role,
  userName,
  userEmail,
  userImage,
}: {
  organizations: OrganizationSummary[];
  activeOrganizationId: string;
  role: OrgRole;
  userName: string;
  userEmail: string;
  userImage: string | null;
}) {
  const t = useTranslations("Organizer");
  const router = useRouter();

  async function handlePublished(organizationId: string) {
    await setActiveOrganization(organizationId);
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-zinc-200">
        <div className="h-16 px-4 md:px-6 flex items-center gap-3">
          <Link href="/" className="shrink-0">
            <Image src="/logo.png" alt="Playver" width={90} height={36} priority className="object-contain" />
          </Link>

          <div className="w-56 shrink-0 hidden sm:block">
            <OrganizerSwitcher organizations={organizations} activeOrganizationId={activeOrganizationId} />
          </div>

          <CreateOrganizationLauncher
            onPublished={handlePublished}
            trigger={(open) => (
              <button
                type="button"
                onClick={open}
                className="hidden md:flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white rounded-full bg-[#e21d12] hover:bg-[#d41810] transition-colors shrink-0"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                {t("newOrganization")}
              </button>
            )}
          />

          <div className="ml-auto flex items-center gap-2 shrink-0">
            <div className="hidden lg:flex items-center rounded-full border border-zinc-200 p-0.5 text-xs font-semibold">
              <span
                className="px-3 py-1.5 rounded-full text-zinc-300 cursor-not-allowed"
                title={t("publicViewComingSoon")}
              >
                {t("publicView")}
              </span>
              <span className="px-3 py-1.5 rounded-full bg-zinc-900 text-white">{t("adminView")}</span>
            </div>

            <button
              type="button"
              disabled
              title={t("notificationsComingSoon")}
              className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-300 cursor-not-allowed"
            >
              <IconBell />
            </button>

            <OrganizerUserMenu userName={userName} userEmail={userEmail} userImage={userImage} role={role} />
          </div>
      </div>
    </header>
  );
}
