"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import CreateOrganizationLauncher from "@/components/organizer/create-wizard/CreateOrganizationLauncher";
import { setActiveOrganization } from "@/app/actions/organization";
import { signOut } from "@/lib/auth-client";

const IconHome = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const IconDiscover = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
);
const IconChallenges = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 21h8" /><path d="M12 17v4" /><path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
    <path d="M17 5h2a2 2 0 0 1 2 2 4 4 0 0 1-4 4" /><path d="M7 5H5a2 2 0 0 0-2 2 4 4 0 0 0 4 4" />
  </svg>
);
const IconEvents = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const IconOrganizations = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);
const IconPerks = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" />
    <line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
  </svg>
);
const IconAthletes = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const IconNotifications = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);
const IconProfile = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);
const IconOrganizer = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l3 6 6.5 1-4.7 4.5 1.1 6.5L12 17l-5.9 3 1.1-6.5L2.5 9 9 8z" />
  </svg>
);
const IconSignOut = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
export type FeedView = "home" | "events";

export default function FeedSidebar({
  user,
  activeView,
  onNavigate,
  hasOrganization,
}: {
  user: { name: string; email: string };
  activeView: FeedView;
  onNavigate: (view: FeedView) => void;
  hasOrganization: boolean;
}) {
  const t = useTranslations("HomeFeed");
  const pathname = usePathname();
  const router = useRouter();
  const firstName = user.name.split(" ")[0] || user.name;
  const initial = firstName[0]?.toUpperCase() ?? "?";

  async function handleOrgPublished(organizationId: string) {
    await setActiveOrganization(organizationId);
    router.refresh();
  }

  async function handleSignOut() {
    await signOut();
    router.push("/auth/signin");
  }

  const navItems: (
    | { kind: "view"; view: FeedView; label: string; icon: React.ReactNode }
    | { kind: "link"; href: "/dashboard/profile"; label: string; icon: React.ReactNode }
    | { kind: "soon"; label: string; icon: React.ReactNode; badge?: string }
  )[] = [
    { kind: "view", view: "home", label: t("navHome"), icon: <IconHome /> },
    { kind: "soon", label: t("navDiscover"), icon: <IconDiscover /> },
    { kind: "soon", label: t("navChallenges"), icon: <IconChallenges />, badge: t("navLive") },
    { kind: "view", view: "events", label: t("navEvents"), icon: <IconEvents /> },
    { kind: "soon", label: t("navOrganizations"), icon: <IconOrganizations /> },
    { kind: "soon", label: t("navPerks"), icon: <IconPerks /> },
    { kind: "soon", label: t("navAthletes"), icon: <IconAthletes /> },
    { kind: "soon", label: t("navNotifications"), icon: <IconNotifications /> },
    { kind: "link", href: "/dashboard/profile", label: t("navProfile"), icon: <IconProfile /> },
  ];

  function isLinkActive(href: string) {
    return pathname.startsWith(href);
  }

  return (
    <aside className="hidden lg:flex w-64 shrink-0 bg-white border-r border-zinc-200 flex-col sticky top-0 h-screen">
      <div className="px-5 pt-5 pb-4">
        <button type="button" onClick={() => onNavigate("home")} className="flex items-center gap-2">
          <Image src="/logo.png" alt="Playver" width={110} height={44} priority className="object-contain" />
        </button>
      </div>

      <nav className="flex-1 px-3 flex flex-col gap-1 overflow-y-auto">
        {navItems.map((item) => {
          if (item.kind === "view") {
            const active = activeView === item.view;
            return (
              <button
                key={item.view}
                type="button"
                onClick={() => onNavigate(item.view)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors text-left ${
                  active ? "bg-red-50 text-[#e21d12]" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                }`}
              >
                <span className={active ? "text-[#e21d12]" : "text-zinc-400"}>{item.icon}</span>
                {item.label}
              </button>
            );
          }
          if (item.kind === "link") {
            const active = isLinkActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  active ? "bg-red-50 text-[#e21d12]" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                }`}
              >
                <span className={active ? "text-[#e21d12]" : "text-zinc-400"}>{item.icon}</span>
                {item.label}
              </Link>
            );
          }
          return (
            <span
              key={item.label}
              title={t("comingSoon")}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-300 cursor-not-allowed"
            >
              {item.icon}
              {item.label}
              {item.badge && (
                <span className="ml-auto px-1.5 py-0.5 rounded-full bg-red-50 text-[#e21d12] text-[10px] font-bold uppercase tracking-wide">
                  {item.badge}
                </span>
              )}
            </span>
          );
        })}
      </nav>

      <div className="px-3 pb-3 flex flex-col gap-2 border-t border-zinc-100 pt-3">
        {hasOrganization ? (
          <Link
            href="/organizer"
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-bold text-[#e21d12] rounded-lg border border-[#e21d12] hover:bg-red-50 transition-colors"
          >
            <IconOrganizer />
            {t("organizerDashboard")}
          </Link>
        ) : (
          <CreateOrganizationLauncher
            onPublished={handleOrgPublished}
            trigger={(open) => (
              <button
                type="button"
                onClick={open}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-bold text-[#e21d12] rounded-lg border border-[#e21d12] hover:bg-red-50 transition-colors"
              >
                <IconOrganizer />
                {t("becomeOrganizer")}
              </button>
            )}
          />
        )}
      </div>

      <div className="px-3 pb-4 border-t border-zinc-100 pt-3">
        <div className="flex items-center gap-3 px-2 pb-3">
          <span className="w-9 h-9 rounded-full bg-[#e21d12] flex items-center justify-center text-white text-sm font-bold shrink-0">
            {initial}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-900 truncate">{user.name}</p>
            <p className="text-xs text-zinc-400 truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 transition-colors"
        >
          <IconSignOut />
          {t("signOut")}
        </button>
      </div>
    </aside>
  );
}
