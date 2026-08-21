// Landing page for an org-staff invitation email link (/invite/[token]).
// Looks up the invite server-side to show who's inviting and to what org
// before the user commits to accepting (InviteAcceptClient does the actual
// accept action) — also prompts sign-in/sign-up first if not authenticated.
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { auth } from "@/lib/auth";
import { getInvitationByToken } from "@/app/actions/organizer-people";
import InviteAcceptClient from "@/components/organizer/InviteAcceptClient";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-zinc-50 flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm px-8 py-10 text-center">
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default async function InviteAcceptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const [lookup, session, t] = await Promise.all([
    getInvitationByToken(token),
    auth.api.getSession({ headers: await headers() }),
    getTranslations("Organizer"),
  ]);

  if ("error" in lookup) {
    const messageKey =
      lookup.error === "cancelled"
        ? "inviteErrorCancelled"
        : lookup.error === "accepted"
          ? "inviteErrorAccepted"
          : lookup.error === "expired"
            ? "inviteErrorExpired"
            : "inviteErrorInvalid";
    return (
      <Shell>
        <p className="text-sm font-bold tracking-wide uppercase text-[#e21d12] mb-2">{t("inviteEyebrow")}</p>
        <h1 className="text-2xl font-extrabold text-zinc-900 mb-3" style={{ fontFamily: "var(--font-playfair)" }}>
          {t("inviteErrorTitle")}
        </h1>
        <p className="text-sm text-zinc-500">{t(messageKey)}</p>
      </Shell>
    );
  }

  const { invitation } = lookup;

  if (!session) {
    const callbackUrl = `/invite/${token}`;
    return (
      <Shell>
        <p className="text-sm font-bold tracking-wide uppercase text-[#e21d12] mb-2">{t("inviteEyebrow")}</p>
        <h1 className="text-2xl font-extrabold text-zinc-900 mb-3" style={{ fontFamily: "var(--font-playfair)" }}>
          {t("inviteSignInTitle", { organizationName: invitation.organizationName })}
        </h1>
        <p className="text-sm text-zinc-500 mb-6">{t("inviteSignInSubtitle", { email: invitation.email })}</p>
        <div className="flex flex-col gap-3">
          <Link
            href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="w-full py-3 text-sm font-semibold text-white rounded-lg bg-[#e21d12] hover:bg-[#d41810] transition-colors shadow-sm"
          >
            {t("inviteSignInButton")}
          </Link>
          <Link
            href={`/auth/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="w-full py-3 text-sm font-semibold text-zinc-700 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
          >
            {t("inviteSignUpButton")}
          </Link>
        </div>
      </Shell>
    );
  }

  if (session.user.email.toLowerCase() !== invitation.email.toLowerCase()) {
    return (
      <Shell>
        <p className="text-sm font-bold tracking-wide uppercase text-[#e21d12] mb-2">{t("inviteEyebrow")}</p>
        <h1 className="text-2xl font-extrabold text-zinc-900 mb-3" style={{ fontFamily: "var(--font-playfair)" }}>
          {t("inviteMismatchTitle")}
        </h1>
        <p className="text-sm text-zinc-500">
          {t("inviteMismatchBody", { invitedEmail: invitation.email, sessionEmail: session.user.email })}
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      <p className="text-sm font-bold tracking-wide uppercase text-[#e21d12] mb-2">{t("inviteEyebrow")}</p>
      <h1 className="text-2xl font-extrabold text-zinc-900 mb-3" style={{ fontFamily: "var(--font-playfair)" }}>
        {t("inviteAcceptTitle", { organizationName: invitation.organizationName })}
      </h1>
      <p className="text-sm text-zinc-500 mb-6">
        {t("inviteAcceptSubtitle", { role: t(`role_${invitation.role}`) })}
      </p>
      <InviteAcceptClient token={token} />
    </Shell>
  );
}
