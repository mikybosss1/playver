// Thin per-doc wrapper — see legal/terms/page.tsx for the shared pattern.
import LegalPage from "@/components/legal/LegalPage";
import cookies from "@/content/legal/cookies";

export default async function CookiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const doc = locale === "fr" ? cookies.fr : cookies.en;

  return <LegalPage doc={doc} slug="cookies" locale={locale} />;
}
