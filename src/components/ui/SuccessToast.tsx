"use client";

// Self-dismissing (3.2s) success notification. Mount with a changing `key`
// prop (see CreateEventButton/CreateTeamButton) to retrigger it on repeat
// actions, since remounting is what restarts the visible/timeout state.
import { useEffect, useState } from "react";

export default function SuccessToast({ message }: { message: string }) {
  const [visible, setVisible] = useState(Boolean(message));

  useEffect(() => {
    if (!message) return;

    const timeout = window.setTimeout(() => setVisible(false), 3200);
    return () => window.clearTimeout(timeout);
  }, [message]);

  if (!visible) return null;

  return (
    <div className="fixed right-4 top-20 z-50 rounded-lg border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-700 shadow-lg">
      {message}
    </div>
  );
}
