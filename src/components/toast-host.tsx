"use client";

import { useEffect, useState } from "react";

export function ToastHost() {
  const [message, setMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let hideTimer: number | undefined;
    let clearTimer: number | undefined;
    function onToast(event: Event) {
      const detail = (event as CustomEvent<string>).detail;
      if (!detail) return;
      window.clearTimeout(hideTimer);
      window.clearTimeout(clearTimer);
      setMessage(detail);
      setVisible(true);
      hideTimer = window.setTimeout(() => setVisible(false), 3000);
      clearTimer = window.setTimeout(() => setMessage(null), 3400);
    }
    window.addEventListener("aspera-toast", onToast);
    return () => {
      window.removeEventListener("aspera-toast", onToast);
      window.clearTimeout(hideTimer);
      window.clearTimeout(clearTimer);
    };
  }, []);

  if (!message) return null;
  return (
    <div
      role="status"
      className={`fixed bottom-20 left-1/2 z-[60] max-w-sm -translate-x-1/2 rounded-[var(--radius)] bg-foreground px-4 py-2.5 text-sm font-medium text-background shadow-[var(--shadow-mega)] transition-all duration-300 md:bottom-8 ${
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-3 opacity-0"
      }`}
    >
      {message}
    </div>
  );
}

export function showToast(message: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("aspera-toast", { detail: message }));
}
