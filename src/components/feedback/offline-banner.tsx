"use client";

import { useSyncExternalStore } from "react";
import { WifiOff } from "lucide-react";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

/** Aviso no intrusivo cuando el dispositivo pierde conexión. */
export function OfflineBanner() {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
  if (online) return null;
  return (
    <div role="status" className="fixed inset-x-0 top-0 z-[70] flex items-center justify-center gap-2 bg-warning px-4 py-2 text-sm font-medium text-white">
      <WifiOff className="size-4" aria-hidden /> Sin conexión. Algunas acciones no van a funcionar hasta que vuelvas a conectarte.
    </div>
  );
}
