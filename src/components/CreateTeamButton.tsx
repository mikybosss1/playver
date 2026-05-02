"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CreateTeamModal from "./CreateTeamModal";

export default function CreateTeamButton({ label }: { label: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function handleSuccess() {
    setOpen(false);
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
    </>
  );
}
