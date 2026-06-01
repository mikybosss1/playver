import { getTranslations } from "next-intl/server";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SignInForm from "@/components/SignInForm";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const [t, { callbackUrl }] = await Promise.all([
    getTranslations("SignIn"),
    searchParams,
  ]);

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-zinc-50 flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm px-8 py-10">
            <h1
              className="text-3xl font-bold text-zinc-900 mb-2"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              {t("title")}
            </h1>
            <p className="text-zinc-500 text-sm mb-8">{t("subtitle")}</p>

            <SignInForm callbackUrl={callbackUrl} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
