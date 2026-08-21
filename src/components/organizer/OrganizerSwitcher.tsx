"use client";

// Dropdown for switching between the orgs the signed-in user belongs to.
// Calls setActiveOrganization() (writes the active_org_id cookie) then
// router.refresh() so every server component under organizer/layout.tsx
// re-fetches scoped to the newly active org.
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { setActiveOrganization } from "@/app/actions/organization";
import type { OrganizationSummary } from "@/app/actions/organization";

export default function OrganizerSwitcher({
  organizations,
  activeOrganizationId,
  onSwitched,
}: {
  organizations: OrganizationSummary[];
  activeOrganizationId: string;
  onSwitched?: (organizationId: string) => void;
}) {
  const t = useTranslations("Organizer");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const active = organizations.find((o) => o.id === activeOrganizationId) ?? organizations[0];

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  async function handleSelect(organizationId: string) {
    if (organizationId === active?.id) {
      setOpen(false);
      return;
    }
    setIsSwitching(true);
    const result = await setActiveOrganization(organizationId);
    setIsSwitching(false);
    setOpen(false);
    if (!result.error) {
      onSwitched?.(organizationId);
      router.refresh();
    }
  }

  if (!active) return null;

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        disabled={organizations.length <= 1}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-zinc-200 bg-white text-left hover:bg-zinc-50 transition-colors disabled:opacity-70 disabled:hover:bg-white"
      >
        <span className="w-8 h-8 rounded-lg bg-[#e21d12] flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
          {active.logoUrl ? (
            <Image src={active.logoUrl} alt="" width={32} height={32} className="w-full h-full object-cover" />
          ) : (
            active.name[0]?.toUpperCase() ?? "?"
          )}
        </span>
        <span className="min-w-0 flex-1 flex items-center gap-1.5">
          <span className="block text-sm font-semibold text-zinc-900 truncate">{active.name}</span>
          {active.publicationStatus !== "published" && (
            <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wide">
              {t("draftBadge")}
            </span>
          )}
        </span>
        {organizations.length > 1 && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        )}
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={t("switcherLabel")}
          className="absolute left-0 right-0 mt-1.5 py-1.5 bg-white border border-zinc-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
        >
          {organizations.map((org) => (
            <li key={org.id} role="option" aria-selected={org.id === active.id}>
              <button
                type="button"
                disabled={isSwitching}
                onClick={() => handleSelect(org.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors disabled:opacity-60 ${
                  org.id === active.id ? "bg-red-50 text-[#e21d12] font-semibold" : "text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                <span className="truncate">{org.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
