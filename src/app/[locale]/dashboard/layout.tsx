import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";
import Navbar from "@/components/Navbar";
import DashboardSidebar from "@/components/DashboardSidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/auth/signin");
  }

  const roleResult = await pool.query(
    `SELECT role FROM "user" WHERE id = $1`,
    [session.user.id]
  );

  const user = {
    name: session.user.name ?? "",
    email: session.user.email ?? "",
    role: (roleResult.rows[0]?.role ?? "player") as string,
  };

  return (
    <>
      <Navbar />
      <div className="flex flex-1 min-h-[calc(100vh-4rem)]">
        <DashboardSidebar user={user} />
        <main className="flex-1 bg-zinc-50 overflow-auto">
          {children}
        </main>
      </div>
    </>
  );
}
