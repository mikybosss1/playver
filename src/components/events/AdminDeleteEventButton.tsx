"use client";

// Super-admin-only permanent delete (adminDeleteEvent, gated by
// requireSuperAdmin() — see admin.ts). Distinct from the organizer-facing
// EventCancelPostponeButton, which cancels/postpones instead of deleting.
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminDeleteEvent } from "@/app/actions/admin";

export default function AdminDeleteEventButton({
  eventId,
  eventTitle,
}: {
  eventId: string;
  eventTitle: string;
}) {
  const [showModal, setShowModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const router = useRouter();

  function handleConfirm() {
    setError("");
    startTransition(async () => {
      try {
        await adminDeleteEvent(eventId);
        router.push("/events");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to delete event. Please try again.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="mt-3 w-full px-4 py-2.5 text-sm font-semibold rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
      >
        Delete Event
      </button>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-5">
            <div>
              <h2 className="text-lg font-extrabold text-zinc-900">Delete Event</h2>
              <p className="mt-1.5 text-sm text-zinc-500">
                Are you sure you want to delete <span className="font-semibold text-zinc-800">{eventTitle}</span>? This will remove all participants and cannot be undone.
              </p>
            </div>
            {error && (
              <p className="text-sm font-semibold text-red-600">{error}</p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={isPending}
                className="flex-1 py-2.5 text-sm font-semibold text-zinc-700 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isPending}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-[#e21d12] rounded-lg hover:bg-[#d41810] transition-colors disabled:opacity-60"
              >
                {isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
