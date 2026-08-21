// /auth/signup — thin page wrapper around SignUpForm; same ?callbackUrl=
// pass-through pattern as auth/signin/page.tsx.
import { getTranslations } from "next-intl/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SignUpForm from "@/components/auth/SignUpForm";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const [t, { callbackUrl }] = await Promise.all([
    getTranslations("SignUp"),
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

            <SignUpForm callbackUrl={callbackUrl} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
