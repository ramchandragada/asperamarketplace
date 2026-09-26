"use client";

import { useEffect, useState } from "react";

export function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 480);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed right-4 bottom-20 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-lg font-semibold text-foreground shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-accent hover:text-accent md:bottom-6"
      aria-label="Back to top"
    >
      ↑
    </button>
  );
}
