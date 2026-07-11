"use client";

import { useRouter } from "next/navigation";

export default function BackButton({ label, fallbackHref }: { label: string; fallbackHref: string }) {
  const router = useRouter();

  function handleClick() {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="mb-6 inline-flex text-sm font-semibold text-[#e21d12] hover:underline"
    >
      ← {label}
    </button>
  );
}
