"use client";

// Sticky in-page section jump nav for mobile (distinct from
// MobileBottomNav, which is site-wide) — tracks the current hash to
// highlight the active section as the user scrolls.
import { useEffect, useState } from "react";

export type SectionNavItem = {
  key: string;
  label: string;
  icon: React.ReactNode;
};

export default function MobileSectionNav({ items }: { items: SectionNavItem[] }) {
  const [active, setActive] = useState(items[0]?.key ?? "");

  useEffect(() => {
    function syncFromHash() {
      const hash = window.location.hash.slice(1);
      if (items.some((item) => item.key === hash)) {
        setActive(hash);
      }
    }
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (items.length === 0) return null;

  return (
    <nav className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white">
      <div className="flex items-stretch h-16 overflow-x-auto">
        {items.map((item) => (
          <a
            key={item.key}
            href={`#${item.key}`}
            onClick={() => {
              document.getElementById(item.key)?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className={`flex min-w-[64px] shrink-0 flex-1 flex-col items-center justify-center gap-0.5 py-1 transition-colors ${
              active === item.key ? "text-[#e21d12]" : "text-zinc-400"
            }`}
          >
            {item.icon}
            <span className="whitespace-nowrap text-[10px] font-semibold leading-none">{item.label}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}
