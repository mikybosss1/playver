// Thin per-doc wrapper — see legal/terms/page.tsx for the shared pattern.
import LegalPage from "@/components/legal/LegalPage";
import acceptableUse from "@/content/legal/acceptable-use";

export default async function AcceptableUsePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const doc = locale === "fr" ? acceptableUse.fr : acceptableUse.en;

  return <LegalPage doc={doc} slug="acceptable-use" locale={locale} />;
}
