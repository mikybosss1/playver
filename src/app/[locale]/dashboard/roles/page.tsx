// /dashboard/roles: super-admin-only user management. dashboard/layout.tsx
// only checks for a session, not the role, so this page does its own
// super_admin check and redirects everyone else back to /dashboard.
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { getUserRole, getAllUsers } from "@/app/actions/admin";
import RolesClient from "@/components/dashboard/RolesClient";

export default async function RolesPage() {
  const [session, t] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    getTranslations("AdminRoles"),
  ]);

  if (!session) redirect("/auth/signin");

  const role = await getUserRole(session.user.id);
  if (role !== "super_admin") redirect("/dashboard");

  const users = await getAllUsers();

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="mb-8">
        <p className="text-sm font-bold tracking-wide uppercase text-[#e21d12] mb-2">
          {t("eyebrow")}
        </p>
        <h1
          className="text-3xl font-extrabold text-zinc-900 mb-1"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          {t("title")}
        </h1>
        <p className="text-zinc-500 text-sm">{t("subtitle")} — {users.length} {t("usersCount")}</p>
      </div>

      <RolesClient users={users} currentUserId={session.user.id} />
    </div>
  );
}
