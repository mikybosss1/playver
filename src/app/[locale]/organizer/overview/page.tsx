// Organizer console's landing page (/organizer/overview, default redirect
// target of /organizer). Currently mostly a placeholder — no dashboard
// metrics wired up yet.
import { getTranslations } from "next-intl/server";
import { getActiveOrganization } from "@/app/actions/organization";

export default async function OrganizerOverviewPage() {
  const [active, t] = await Promise.all([
    getActiveOrganization(),
    getTranslations("Organizer"),
  ]);

  if (!active) return null; // layout already redirects/renders the empty state in this case

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <p className="text-sm font-bold tracking-wide uppercase text-[#e21d12] mb-1">{t("overviewEyebrow")}</p>
      <h1 className="text-3xl font-extrabold text-zinc-900 mb-2" style={{ fontFamily: "var(--font-playfair)" }}>
        {active.organization.name}
      </h1>
      <p className="text-zinc-500 text-sm mb-8">
        {t("overviewRoleLabel", { role: t(`role_${active.role}`) })}
      </p>

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-8 max-w-lg">
        <p className="text-sm text-zinc-500">{t("overviewPlaceholder")}</p>
      </div>
    </div>
  );
}
