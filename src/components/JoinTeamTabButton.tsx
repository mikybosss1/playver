"use client";

import { useTranslations } from "next-intl";

export default function JoinTeamTabButton() {
  const t = useTranslations("EventDetails");

  function handleClick() {
    const tab = document.getElementById("event-tab-teams");
    const section = document.getElementById("event-tabs");
    if (tab) tab.click();
    if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full px-4 py-2.5 text-sm font-semibold rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 transition-colors"
    >
      {t("joinATeam")}
    </button>
  );
}
