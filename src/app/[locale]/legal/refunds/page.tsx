import LegalPage from "@/components/legal/LegalPage";
import refunds from "@/content/legal/refunds";

export default async function RefundsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const doc = locale === "fr" ? refunds.fr : refunds.en;

  return <LegalPage doc={doc} slug="refunds" locale={locale} />;
}
