"use client";

import { useEffect, useState } from "react";

type ToastPayload = {
  message: string;
  variant?: "success" | "neutral";
};

export function ToastHost() {
  const [toast, setToast] = useState<ToastPayload | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let hideTimer: number | undefined;
    let clearTimer: number | undefined;
    function onToast(event: Event) {
      const detail = (event as CustomEvent<string | ToastPayload>).detail;
      if (!detail) return;
      const next: ToastPayload =
        typeof detail === "string"
          ? { message: detail, variant: "success" }
          : {
              message: detail.message,
              variant: detail.variant ?? "success",
            };
      window.clearTimeout(hideTimer);
      window.clearTimeout(clearTimer);
      setToast(next);
      setVisible(true);
      hideTimer = window.setTimeout(() => setVisible(false), 3000);
      clearTimer = window.setTimeout(() => setToast(null), 3400);
    }
    window.addEventListener("aspera-toast", onToast);
    return () => {
      window.removeEventListener("aspera-toast", onToast);
      window.clearTimeout(hideTimer);
      window.clearTimeout(clearTimer);
    };
  }, []);

  if (!toast) return null;

  const isSuccess = toast.variant !== "neutral";

  return (
    <div
      role="status"
      className={`fixed top-20 right-4 z-[70] max-w-sm rounded-[var(--radius)] px-4 py-3 text-sm font-medium shadow-[var(--shadow-mega)] transition-all duration-300 md:top-24 ${
        isSuccess
          ? "bg-success text-white"
          : "bg-foreground text-background"
      } ${
        visible
          ? "translate-x-0 opacity-100"
          : "translate-x-6 opacity-0"
      }`}
    >
      {toast.message}
    </div>
  );
}

export function showToast(
  message: string,
  options?: { variant?: "success" | "neutral" },
) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("aspera-toast", {
      detail: { message, variant: options?.variant ?? "success" },
    }),
  );
}
