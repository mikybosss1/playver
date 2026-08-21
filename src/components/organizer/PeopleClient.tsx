"use client";

// Staff roster + pending invitations table for /organizer/people. Role
// changes/removals/invites all go through organizer-people.ts actions,
// which re-check canAssignRole() server-side — the client-side
// assignableRoles() filter below is a UX nicety, not the real gate.
import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import {
  changeOrganizationMemberRole,
  removeOrganizationMember,
  resendOrganizationInvitation,
  cancelOrganizationInvitation,
  type MemberRow,
  type InvitationRow,
} from "@/app/actions/organizer-people";
import { ORG_ROLES, canAssignRole, type OrgRole } from "@/lib/organizer-permissions";
import InvitePersonModal from "@/components/organizer/InvitePersonModal";

function roleBadgeClass(role: OrgRole) {
  if (role === "OWNER" || role === "ADMINISTRATOR") return "bg-[#e21d12]/10 text-[#e21d12] border border-[#e21d12]/20";
  if (role === "OPERATIONS_MANAGER") return "bg-amber-50 text-amber-700 border border-amber-200";
  if (role === "COACH") return "bg-blue-50 text-blue-700 border border-blue-200";
  return "bg-zinc-100 text-zinc-600 border border-zinc-200";
}

function statusBadgeClass(status: "active" | "pending" | "expired") {
  if (status === "active") return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  if (status === "pending") return "bg-blue-50 text-blue-700 border border-blue-200";
  return "bg-zinc-100 text-zinc-500 border border-zinc-200";
}

// Roles the viewer is allowed to hand out — hides OWNER/ADMINISTRATOR from the
// role picker entirely for anyone without MANAGE_ADMINISTRATORS, mirroring the
// server-side canAssignRole gate so the UI never offers an option the backend
// would reject.
function assignableRoles(viewerRole: OrgRole): OrgRole[] {
  return ORG_ROLES.filter((role) => canAssignRole(viewerRole, role));
}

export default function PeopleClient({
  members,
  invitations,
  currentUserId,
}: {
  members: MemberRow[];
  invitations: InvitationRow[];
  currentUserId: string;
}) {
  const t = useTranslations("Organizer");
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<OrgRole | "ALL">("ALL");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<MemberRow | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const viewerRole = members.find((m) => m.userId === currentUserId)?.role;
  const assignable = viewerRole ? assignableRoles(viewerRole) : [];

  const filteredMembers = useMemo(
    () =>
      members.filter((m) => {
        if (roleFilter !== "ALL" && m.role !== roleFilter) return false;
        const q = search.toLowerCase();
        return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
      }),
    [members, search, roleFilter]
  );

  const filteredInvitations = useMemo(
    () =>
      invitations.filter((i) => {
        if (roleFilter !== "ALL" && i.role !== roleFilter) return false;
        return i.email.toLowerCase().includes(search.toLowerCase());
      }),
    [invitations, search, roleFilter]
  );

  function handleRoleChange(membershipId: string, newRole: OrgRole) {
    setError("");
    setPendingId(membershipId);
    startTransition(async () => {
      const result = await changeOrganizationMemberRole(membershipId, newRole);
      setPendingId(null);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleRemoveConfirm() {
    if (!removeTarget) return;
    const membershipId = removeTarget.membershipId;
    setRemoveTarget(null);
    setError("");
    setPendingId(membershipId);
    startTransition(async () => {
      const result = await removeOrganizationMember(membershipId);
      setPendingId(null);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleResend(invitationId: string) {
    setError("");
    setPendingId(invitationId);
    startTransition(async () => {
      const result = await resendOrganizationInvitation(invitationId);
      setPendingId(null);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleCancelInvitation(invitationId: string) {
    setError("");
    setPendingId(invitationId);
    startTransition(async () => {
      const result = await cancelOrganizationInvitation(invitationId);
      setPendingId(null);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <svg
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("peopleSearchPlaceholder")}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-red-200 placeholder:text-zinc-400 text-zinc-800"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowInviteModal(true)}
          className="px-4 py-2.5 text-sm font-semibold text-white rounded-lg bg-[#e21d12] hover:bg-[#d41810] transition-colors shrink-0"
        >
          {t("invitePersonButton")}
        </button>
      </div>

      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <button
          type="button"
          onClick={() => setRoleFilter("ALL")}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
            roleFilter === "ALL" ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
          }`}
        >
          {t("peopleFilterAll")}
        </button>
        {ORG_ROLES.map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => setRoleFilter(role)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              roleFilter === role ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
            }`}
          >
            {t(`role_${role}`)}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm font-semibold text-red-600">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {filteredMembers.map((member) => {
          const isMe = member.userId === currentUserId;
          const isRowPending = isPending && pendingId === member.membershipId;
          const initial = member.name[0]?.toUpperCase() ?? "?";
          const canManageThisMember = viewerRole ? canAssignRole(viewerRole, member.role) : false;

          return (
            <div key={member.membershipId} className="flex items-center gap-4 bg-white rounded-2xl border border-zinc-200 px-5 py-4 shadow-sm">
              <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-100 font-bold text-zinc-500">
                {member.image ? (
                  <Image src={member.image} alt={member.name} width={44} height={44} className="size-11 object-cover" />
                ) : (
                  initial
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-extrabold text-zinc-900 text-sm truncate">{member.name}</p>
                  {isMe && (
                    <span className="text-xs font-semibold text-zinc-400 border border-zinc-200 rounded-full px-2 py-0.5">
                      {t("peopleYou")}
                    </span>
                  )}
                  <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${roleBadgeClass(member.role)}`}>
                    {t(`role_${member.role}`)}
                  </span>
                  <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${statusBadgeClass("active")}`}>
                    {t("peopleStatusActive")}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 truncate mt-0.5">{member.email}</p>
              </div>

              {!isMe && canManageThisMember && (
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={member.role}
                    disabled={isRowPending}
                    onChange={(e) => handleRoleChange(member.membershipId, e.target.value as OrgRole)}
                    className="text-sm bg-white border border-zinc-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-red-200 text-zinc-700 disabled:opacity-50 cursor-pointer"
                  >
                    {(assignable.includes(member.role) ? assignable : [...assignable, member.role]).map((role) => (
                      <option key={role} value={role}>
                        {t(`role_${role}`)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setRemoveTarget(member)}
                    disabled={isRowPending}
                    className="px-3 py-1.5 text-sm font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {t("peopleRemove")}
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {filteredInvitations.map((invitation) => {
          const isRowPending = isPending && pendingId === invitation.id;
          const canManageThisInvite = viewerRole ? canAssignRole(viewerRole, invitation.role) : false;

          return (
            <div key={invitation.id} className="flex items-center gap-4 bg-white rounded-2xl border border-dashed border-zinc-200 px-5 py-4 shadow-sm">
              <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-100 text-zinc-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-6l-2 3h-4l-2-3H2" />
                  <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-extrabold text-zinc-900 text-sm truncate">{invitation.email}</p>
                  <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${roleBadgeClass(invitation.role)}`}>
                    {t(`role_${invitation.role}`)}
                  </span>
                  <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${statusBadgeClass(invitation.status)}`}>
                    {invitation.status === "pending" ? t("peopleStatusInvited") : t("peopleStatusExpired")}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {t("peopleInvitedBy", { name: invitation.invitedByName ?? t("peopleUnknownInviter") })}
                </p>
              </div>

              {canManageThisInvite && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleResend(invitation.id)}
                    disabled={isRowPending}
                    className="px-3 py-1.5 text-sm font-semibold text-zinc-700 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors disabled:opacity-50"
                  >
                    {t("peopleResend")}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCancelInvitation(invitation.id)}
                    disabled={isRowPending}
                    className="px-3 py-1.5 text-sm font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {t("peopleCancelInvite")}
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {filteredMembers.length === 0 && filteredInvitations.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 py-16 text-center">
            <p className="text-zinc-500 font-semibold">{t("peopleNoResults")}</p>
          </div>
        )}
      </div>

      {removeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-5">
            <div>
              <h2 className="text-lg font-extrabold text-zinc-900">{t("peopleRemoveTitle")}</h2>
              <p className="mt-1.5 text-sm text-zinc-500">{t("peopleRemoveConfirm", { name: removeTarget.name })}</p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setRemoveTarget(null)}
                className="flex-1 py-2.5 text-sm font-semibold text-zinc-700 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
              >
                {t("peopleCancelButton")}
              </button>
              <button
                type="button"
                onClick={handleRemoveConfirm}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-[#e21d12] rounded-lg hover:bg-[#d41810] transition-colors"
              >
                {t("peopleRemoveConfirmButton")}
              </button>
            </div>
          </div>
        </div>
      )}

      {showInviteModal && (
        <InvitePersonModal
          assignableRoles={assignable}
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            setShowInviteModal(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
