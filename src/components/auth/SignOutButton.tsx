"use client";

// Plain sign-out button, redirects to /auth/signin after.
import { signOut } from "@/lib/auth-client";
import { useRouter } from "@/i18n/routing";

export default function SignOutButton({ label }: { label: string }) {
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/auth/signin");
  }

  return (
    <button
      onClick={handleSignOut}
      className="px-4 py-2 text-sm font-semibold text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-100 transition-colors"
    >
      {label}
    </button>
  );
}
