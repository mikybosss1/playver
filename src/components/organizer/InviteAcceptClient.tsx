"use client";

// Accept button for the org-staff invitation link (see
// organizer-people.ts's createInvitation/acceptOrganizationInvitation — a
// 7-day-expiry token). email_mismatch means the invite's target email
// doesn't match the signed-in user's account.
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { acceptOrganizationInvitation } from "@/app/actions/organizer-people";
import { setActiveOrganization } from "@/app/actions/organization";

export default function InviteAcceptClient({ token }: { token: string }) {
  const t = useTranslations("Organizer");
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleAccept() {
    setError("");
    startTransition(async () => {
      const result = await acceptOrganizationInvitation(token);
      if (result.error || !result.organizationId) {
        setError(
          result.error === "email_mismatch"
            ? t("inviteAcceptEmailMismatch")
            : t("inviteAcceptGenericError")
        );
        return;
      }
      await setActiveOrganization(result.organizationId);
      router.push("/organizer/overview");
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
      <button
        type="button"
        onClick={handleAccept}
        disabled={isPending}
        className="w-full py-3 text-sm font-semibold text-white rounded-lg bg-[#e21d12] hover:bg-[#d41810] disabled:opacity-60 transition-colors shadow-sm"
      >
        {isPending ? t("inviteAccepting") : t("inviteAcceptButton")}
      </button>
    </div>
  );
}
