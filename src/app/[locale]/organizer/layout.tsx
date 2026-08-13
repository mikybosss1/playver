import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getActiveOrganization, getUserOrganizations } from "@/app/actions/organization";
import { computeCompleteness } from "@/lib/organization-completeness";
import Navbar from "@/components/layout/Navbar";
import OrganizerTopNav from "@/components/organizer/OrganizerTopNav";
import OrganizerSidebar from "@/components/organizer/OrganizerSidebar";
import EmptyStateCreateOrganization from "@/components/organizer/EmptyStateCreateOrganization";

export default async function OrganizerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/auth/signin");

  const [active, organizations, t] = await Promise.all([
    getActiveOrganization(),
    getUserOrganizations(),
    getTranslations("Organizer"),
  ]);

  if (!active) {
    return (
      <>
        <Navbar />
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 py-16">
          <div className="flex flex-col items-center gap-3 text-center max-w-sm">
            <p className="text-sm font-bold tracking-wide uppercase text-[#e21d12]">{t("emptyEyebrow")}</p>
            <h1 className="text-2xl font-extrabold text-zinc-900" style={{ fontFamily: "var(--font-playfair)" }}>
              {t("emptyTitle")}
            </h1>
            <p className="text-sm text-zinc-500 mb-4">{t("emptySubtitle")}</p>
            <EmptyStateCreateOrganization />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <OrganizerTopNav
        organizations={organizations}
        activeOrganizationId={active.organization.id}
        role={active.role}
        userName={session.user.name ?? ""}
        userEmail={session.user.email ?? ""}
        userImage={session.user.image ?? null}
      />
      <div className="flex flex-1 min-h-[calc(100vh-4rem)]">
        <OrganizerSidebar
          organizationName={active.organization.name}
          organizationLogoUrl={active.organization.logoUrl}
          role={active.role}
          userName={session.user.name ?? ""}
          completeness={computeCompleteness(active.organization)}
        />
        <main className="flex-1 bg-zinc-50 overflow-auto pb-16 md:pb-0">{children}</main>
      </div>
    </>
  );
}
