"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { setUserRole, deleteUser } from "@/app/actions/admin";
import type { AdminUser, UserRole } from "@/app/actions/admin";

const ROLES: UserRole[] = ["player", "organizer", "super_admin"];

function roleBadgeClass(role: UserRole) {
  if (role === "super_admin") return "bg-[#e21d12]/10 text-[#e21d12] border border-[#e21d12]/20";
  if (role === "organizer") return "bg-amber-50 text-amber-700 border border-amber-200";
  return "bg-zinc-100 text-zinc-600 border border-zinc-200";
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));
}

export default function RolesClient({
  users: initialUsers,
  currentUserId,
}: {
  users: AdminUser[];
  currentUserId: string;
}) {
  const t = useTranslations("AdminRoles");
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  function handleRoleChange(userId: string, role: UserRole) {
    setPendingUserId(userId);
    startTransition(async () => {
      try {
        await setUserRole(userId, role);
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
      } catch {
        // keep current state
      }
      setPendingUserId(null);
    });
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
    startTransition(async () => {
      try {
        await deleteUser(id);
        setUsers((prev) => prev.filter((u) => u.id !== id));
      } catch {
        // keep current state
      }
    });
  }

  return (
    <>
      {/* Search */}
      <div className="relative mb-6">
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
          placeholder={t("searchPlaceholder")}
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-red-200 placeholder:text-zinc-400 text-zinc-800"
        />
      </div>

      {/* User list */}
      <div className="flex flex-col gap-3">
        {filtered.map((user) => {
          const isMe = user.id === currentUserId;
          const isUpdating = isPending && pendingUserId === user.id;
          const initial = user.name[0]?.toUpperCase() ?? "?";

          return (
            <div
              key={user.id}
              className="flex items-center gap-4 bg-white rounded-2xl border border-zinc-200 px-5 py-4 shadow-sm"
            >
              {/* Avatar */}
              <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-100 font-bold text-zinc-500">
                {user.image ? (
                  <Image src={user.image} alt={user.name} width={44} height={44} className="size-11 object-cover" />
                ) : (
                  initial
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-extrabold text-zinc-900 text-sm truncate">{user.name}</p>
                  {isMe && (
                    <span className="text-xs font-semibold text-zinc-400 border border-zinc-200 rounded-full px-2 py-0.5">
                      You
                    </span>
                  )}
                  <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${roleBadgeClass(user.role)}`}>
                    {t(`role${user.role.split("_").map((w: string) => w[0].toUpperCase() + w.slice(1)).join("")}` as "rolePlayer" | "roleOrganizer" | "roleSuperAdmin")}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 truncate mt-0.5">{user.email}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{t("memberSince")} {formatDate(user.createdAt)}</p>
              </div>

              {/* Role selector */}
              {!isMe && (
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={user.role}
                    disabled={isUpdating}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                    className="text-sm bg-white border border-zinc-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-red-200 text-zinc-700 disabled:opacity-50 cursor-pointer"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {t(`role${r.split("_").map((w: string) => w[0].toUpperCase() + w.slice(1)).join("")}` as "rolePlayer" | "roleOrganizer" | "roleSuperAdmin")}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(user)}
                    disabled={isPending}
                    className="px-3 py-1.5 text-sm font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {t("deleteUser")}
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 py-16 text-center">
            <p className="text-zinc-500 font-semibold">No users match your search.</p>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-5">
            <div>
              <h2 className="text-lg font-extrabold text-zinc-900">{t("deleteTitle")}</h2>
              <p className="mt-1.5 text-sm text-zinc-500">
                {t("deleteConfirm", { name: deleteTarget.name })}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 text-sm font-semibold text-zinc-700 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
              >
                {t("cancelButton")}
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-[#e21d12] rounded-lg hover:bg-[#d41810] transition-colors"
              >
                {t("deleteConfirmButton")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
