"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import CreateTeamModal from "./CreateTeamModal";
import SuccessToast from "./SuccessToast";

export default function CreateTeamButton({ label }: { label: string }) {
  const [open, setOpen] = useState(false);
  const [toastKey, setToastKey] = useState(0);
  const t = useTranslations("CreateTeam");
  const router = useRouter();

  function handleSuccess() {
    setOpen(false);
    setToastKey((key) => key + 1);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-5 py-2.5 text-sm font-semibold text-white rounded-lg bg-[#e21d12] hover:bg-[#d41810] transition-colors shadow-sm"
      >
        {label}
      </button>

      {open && (
        <CreateTeamModal onClose={() => setOpen(false)} onSuccess={handleSuccess} />
      )}

      {toastKey > 0 && <SuccessToast key={toastKey} message={t("success")} />}
    </>
  );
}
