"use client";

// Wizard step 8 of 10: invite additional staff by email + OrgRole before
// publishing (OWNER is excluded — that's the creating user, implicitly).
// Invites are only actually sent on step submit, via persistStep case 8
// calling inviteOrganizationMembers.
import { useTranslations } from "next-intl";
import { ORG_ROLES, type OrgRole } from "@/lib/organizer-permissions";
import type { StepProps } from "./types";

const inputClass =
  "w-full px-4 py-3 text-sm bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 placeholder:text-zinc-400 text-zinc-800";
const labelClass = "text-sm font-semibold text-zinc-700";
const ASSIGNABLE_ROLES = ORG_ROLES.filter((r) => r !== "OWNER");

export default function Step8Admins({ state, update }: StepProps) {
  const t = useTranslations("Organizer");

  function updateAdmin(index: number, patch: Partial<{ email: string; role: OrgRole }>) {
    update({ admins: state.admins.map((a, i) => (i === index ? { ...a, ...patch } : a)) });
  }

  function addAdmin() {
    update({ admins: [...state.admins, { email: "", role: "OPERATIONS_MANAGER" }] });
  }

  function removeAdmin(index: number) {
    update({ admins: state.admins.filter((_, i) => i !== index) });
  }

  return (
    <div>
      <p className="text-xs font-bold tracking-wide uppercase text-[#e21d12] mb-2">
        {t("wizardStepLabel", { current: 8, total: 10 })}
      </p>
      <h2 className="text-2xl font-extrabold text-zinc-900 mb-2" style={{ fontFamily: "var(--font-playfair)" }}>
        {t("wizardAdminsTitle")}
      </h2>
      <p className="text-sm text-zinc-500 mb-8 max-w-md">{t("wizardAdminsSubtitle")}</p>

      <div className="flex flex-col gap-4 max-w-xl">
        {state.admins.map((admin, index) => (
          <div key={index} className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500">{t("wizardAdminN", { n: index + 1 })}</span>
              <button type="button" onClick={() => removeAdmin(index)} className="text-xs font-semibold text-red-500 hover:text-red-600">
                {t("wizardRemoveAdmin")}
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>{t("invitePersonEmailLabel")}</label>
              <input
                type="email"
                value={admin.email}
                onChange={(e) => updateAdmin(index, { email: e.target.value })}
                placeholder={t("invitePersonEmailPlaceholder")}
                className={`${inputClass} bg-white`}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>{t("invitePersonRoleLabel")}</label>
              <select
                value={admin.role}
                onChange={(e) => updateAdmin(index, { role: e.target.value as OrgRole })}
                className={`${inputClass} bg-white`}
              >
                {ASSIGNABLE_ROLES.map((r) => (
                  <option key={r} value={r}>{t(`role_${r}`)}</option>
                ))}
              </select>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addAdmin}
          className="py-3 rounded-lg border-2 border-dashed border-zinc-200 text-sm font-semibold text-zinc-500 hover:border-red-300 hover:text-[#e21d12] transition-colors"
        >
          + {t("wizardAddAnotherAdmin")}
        </button>

        <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
          <p className="text-sm text-blue-800">{t("wizardAdminsNotice")}</p>
        </div>
      </div>
    </div>
  );
}
