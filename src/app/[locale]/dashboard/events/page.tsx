import { getTranslations } from "next-intl/server";
import CreateEventForm from "@/components/CreateEventForm";

export default async function DashboardEventsPage() {
  const t = await getTranslations("DashboardEvents");

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <p className="text-sm font-bold tracking-wide uppercase text-[#e21d12] mb-1">
        {t("eyebrow")}
      </p>
      <h1
        className="text-3xl font-bold text-zinc-900 mb-2"
        style={{ fontFamily: "var(--font-playfair)" }}
      >
        {t("title")}
      </h1>
      <p className="text-zinc-500 text-sm mb-10">{t("subtitle")}</p>

      <CreateEventForm />
    </div>
  );
}
