import LegalPage from "@/components/legal/LegalPage";
import privacy from "@/content/legal/privacy";

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const doc = locale === "fr" ? privacy.fr : privacy.en;

  return <LegalPage doc={doc} slug="privacy" locale={locale} />;
}
