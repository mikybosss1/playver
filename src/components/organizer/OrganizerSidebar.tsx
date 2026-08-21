"use client";

// Left nav for /organizer/*. `role` (an OrgRole) is only used to render the
// role badge here — actual permission gating happens per-page/per-action via
// requireOrganizationPermission(), not by hiding sidebar links; a page the
// role can't use will 404 or show ForbiddenError when actually visited.
import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import HqCompletenessBar from "@/components/organizer/HqCompletenessBar";
import type { OrgRole } from "@/lib/organizer-permissions";

const ICON_PROPS = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const IconOverview = () => (
  <svg {...ICON_PROPS}>
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
  </svg>
);
const IconInbox = () => (
  <svg {...ICON_PROPS}>
    <path d="M22 12h-6l-2 3h-4l-2-3H2" />
    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </svg>
);
const IconPeople = () => (
  <svg {...ICON_PROPS}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const IconPrograms = () => (
  <svg {...ICON_PROPS}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);
const IconTeams = () => (
  <svg {...ICON_PROPS}>
    <circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 1 0-16 0" />
  </svg>
);
const IconEvents = () => (
  <svg {...ICON_PROPS}>
    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const IconRegistrations = () => (
  <svg {...ICON_PROPS}>
    <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);
const IconPayments = () => (
  <svg {...ICON_PROPS}>
    <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);
const IconCommunications = () => (
  <svg {...ICON_PROPS}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const IconOpportunities = () => (
  <svg {...ICON_PROPS}>
    <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);
const IconPartners = () => (
  <svg {...ICON_PROPS}>
    <path d="M18.36 5.64a9 9 0 1 1-12.73 0" /><line x1="12" y1="2" x2="12" y2="12" />
  </svg>
);
const IconMore = () => (
  <svg {...ICON_PROPS}>
    <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
  </svg>
);
const IconClose = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

type NavItem = { href: string; labelKey: string; icon: React.ReactNode };

const TOP_ITEMS: NavItem[] = [
  { href: "/organizer/overview", labelKey: "navOverview", icon: <IconOverview /> },
  { href: "/organizer/inbox", labelKey: "navInbox", icon: <IconInbox /> },
];

const NAV_SECTIONS: { headingKey: string; items: NavItem[] }[] = [
  {
    headingKey: "navSectionPeopleActivities",
    items: [
      { href: "/organizer/people", labelKey: "navPeople", icon: <IconPeople /> },
      { href: "/organizer/programs", labelKey: "navPrograms", icon: <IconPrograms /> },
      { href: "/organizer/teams", labelKey: "navTeams", icon: <IconTeams /> },
      { href: "/organizer/events", labelKey: "navEvents", icon: <IconEvents /> },
    ],
  },
  {
    headingKey: "navSectionOperations",
    items: [
      { href: "/organizer/registrations", labelKey: "navRegistrations", icon: <IconRegistrations /> },
      { href: "/organizer/payments", labelKey: "navPayments", icon: <IconPayments /> },
      { href: "/organizer/communications", labelKey: "navCommunications", icon: <IconCommunications /> },
      { href: "/organizer/opportunities", labelKey: "navOpportunities", icon: <IconOpportunities /> },
      { href: "/organizer/partners", labelKey: "navPartners", icon: <IconPartners /> },
    ],
  },
];

const MOBILE_ITEMS: NavItem[] = [
  TOP_ITEMS[0],
  NAV_SECTIONS[0].items[0],
  TOP_ITEMS[1],
];

function NavLink({ item, isActive, onClick }: { item: NavItem; isActive: boolean; onClick?: () => void }) {
  const t = useTranslations("Organizer");
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        isActive ? "bg-red-50 text-[#e21d12]" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
      }`}
    >
      <span className={isActive ? "text-[#e21d12]" : "text-zinc-400"}>{item.icon}</span>
      {t(item.labelKey)}
    </Link>
  );
}

export default function OrganizerSidebar({
  organizationName,
  organizationLogoUrl,
  role,
  userName,
  completeness,
}: {
  organizationName: string;
  organizationLogoUrl: string | null;
  role: OrgRole;
  userName: string;
  completeness: number;
}) {
  const t = useTranslations("Organizer");
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const orgInitial = organizationName[0]?.toUpperCase() ?? "?";

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 bg-white border-r border-zinc-200 flex-col sticky top-16 h-[calc(100vh-4rem)]">
        <div className="px-4 py-4 border-b border-zinc-100 flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-lg bg-zinc-900 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
            {organizationLogoUrl ? (
              <Image src={organizationLogoUrl} alt="" width={36} height={36} className="w-full h-full object-cover" />
            ) : (
              orgInitial
            )}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-900 truncate">{organizationName}</p>
            <p className="text-xs text-zinc-400 truncate">
              {t(`role_${role}`)} · {userName}
            </p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          {TOP_ITEMS.map((item) => (
            <NavLink key={item.href} item={item} isActive={isActive(item.href)} />
          ))}

          {NAV_SECTIONS.map((section) => (
            <div key={section.headingKey} className="mt-4">
              <p className="px-3 mb-1 text-[11px] font-bold uppercase tracking-wide text-zinc-400">
                {t(section.headingKey)}
              </p>
              <div className="flex flex-col gap-1">
                {section.items.map((item) => (
                  <NavLink key={item.href} item={item} isActive={isActive(item.href)} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <HqCompletenessBar percent={completeness} />
      </aside>

      {/* Mobile bottom navigation — curated set + "More" drawer for everything else */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-zinc-200">
        <div className="flex items-stretch h-16">
          {MOBILE_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 transition-colors ${
                isActive(item.href) ? "text-[#e21d12]" : "text-zinc-400"
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-semibold leading-none">{t(item.labelKey)}</span>
            </Link>
          ))}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1 text-zinc-400"
          >
            <IconMore />
            <span className="text-[10px] font-semibold leading-none">{t("navMore")}</span>
          </button>
        </div>
      </nav>

      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
          <div className="relative w-full max-h-[80vh] overflow-y-auto bg-white rounded-t-2xl px-4 pt-4 pb-8">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-zinc-900">{organizationName}</p>
              <button onClick={() => setDrawerOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <IconClose />
              </button>
            </div>
            <div className="flex flex-col gap-1">
              {TOP_ITEMS.map((item) => (
                <NavLink key={item.href} item={item} isActive={isActive(item.href)} onClick={() => setDrawerOpen(false)} />
              ))}
            </div>
            {NAV_SECTIONS.map((section) => (
              <div key={section.headingKey} className="mt-4">
                <p className="px-3 mb-1 text-[11px] font-bold uppercase tracking-wide text-zinc-400">
                  {t(section.headingKey)}
                </p>
                <div className="flex flex-col gap-1">
                  {section.items.map((item) => (
                    <NavLink key={item.href} item={item} isActive={isActive(item.href)} onClick={() => setDrawerOpen(false)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
