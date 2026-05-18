"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getEventNonParticipants, adminAddParticipant } from "@/app/actions/admin";

type User = { id: string; name: string; email: string; image: string | null };

export default function AdminAddParticipant({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [addingId, setAddingId] = useState<string | null>(null);

  async function openModal() {
    setSearch("");
    setLoading(true);
    setShowModal(true);
    try {
      const data = await getEventNonParticipants(eventId);
      setUsers(data);
    } catch {
      // keep empty
    }
    setLoading(false);
  }

  function handleAdd(user: User) {
    setAddingId(user.id);
    startTransition(async () => {
      try {
        await adminAddParticipant(eventId, user.id);
        setUsers((prev) => prev.filter((u) => u.id !== user.id));
        router.refresh();
      } catch {
        // keep current state
      }
      setAddingId(null);
    });
  }

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="mt-3 w-full px-4 py-2.5 text-sm font-semibold rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 transition-colors"
      >
        + Add Participant
      </button>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-zinc-100">
              <div>
                <h2 className="text-lg font-extrabold text-zinc-900">Add Participant</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Select a user to add to this event.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Search */}
            <div className="px-6 py-3 border-b border-zinc-100">
              <div className="relative">
                <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-red-200 placeholder:text-zinc-400 text-zinc-800"
                />
              </div>
            </div>

            {/* User list */}
            <div className="flex-1 overflow-y-auto px-6 py-3 flex flex-col gap-2">
              {loading ? (
                <p className="text-sm text-zinc-400 text-center py-8">Loading users...</p>
              ) : filtered.length === 0 ? (
                <p className="text-sm text-zinc-400 text-center py-8">
                  {users.length === 0 ? "All users are already participating." : "No users match your search."}
                </p>
              ) : (
                filtered.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3">
                    <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-200 font-bold text-zinc-500 text-sm">
                      {user.image
                        ? <Image src={user.image} alt={user.name} width={36} height={36} className="size-9 object-cover rounded-full" />
                        : user.name[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-900 truncate">{user.name}</p>
                      <p className="text-xs text-zinc-400 truncate">{user.email}</p>
                    </div>
                    <button
                      type="button"
                      disabled={isPending && addingId === user.id}
                      onClick={() => handleAdd(user)}
                      className="shrink-0 px-3 py-1.5 text-xs font-semibold text-white bg-[#e21d12] rounded-lg hover:bg-[#d41810] transition-colors disabled:opacity-50"
                    >
                      {isPending && addingId === user.id ? "..." : "Add"}
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-full py-2.5 text-sm font-semibold text-zinc-700 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
