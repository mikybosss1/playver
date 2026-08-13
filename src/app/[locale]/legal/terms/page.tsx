import LegalPage from "@/components/legal/LegalPage";
import terms from "@/content/legal/terms";

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const doc = locale === "fr" ? terms.fr : terms.en;

  return <LegalPage doc={doc} slug="terms" locale={locale} />;
}
