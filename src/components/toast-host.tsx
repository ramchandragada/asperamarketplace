"use client";

import { useEffect, useState } from "react";

export function ToastHost() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    function onToast(event: Event) {
      const detail = (event as CustomEvent<string>).detail;
      if (!detail) return;
      setMessage(detail);
      window.setTimeout(() => setMessage(null), 2200);
    }
    window.addEventListener("aspera-toast", onToast);
    return () => window.removeEventListener("aspera-toast", onToast);
  }, []);

  if (!message) return null;
  return (
    <div
      role="status"
      className="fixed bottom-20 left-1/2 z-[60] max-w-sm -translate-x-1/2 rounded-[var(--radius)] bg-foreground px-4 py-2.5 text-sm font-medium text-background shadow-[var(--shadow-mega)] md:bottom-8"
    >
      {message}
    </div>
  );
}

export function showToast(message: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("aspera-toast", { detail: message }));
}
