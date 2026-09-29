"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error boundary", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
          background:
            "linear-gradient(160deg, #f4faf9 0%, #e8f3f1 45%, #f7fafc 100%)",
          color: "#0f172a",
          minHeight: "100vh",
        }}
      >
        <main
          style={{
            maxWidth: 560,
            margin: "0 auto",
            padding: "4rem 1.25rem",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#0f766e",
            }}
          >
            Aspera Marketplace
          </p>
          <h1
            style={{
              margin: "0.75rem 0 0",
              fontSize: "1.875rem",
              lineHeight: 1.2,
            }}
          >
            Something went wrong
          </h1>
          <p style={{ margin: "0.75rem 0 0", color: "#64748b", lineHeight: 1.6 }}>
            We hit a temporary problem loading the site. Please try again, or
            return home to keep shopping.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 24 }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                border: 0,
                borderRadius: 8,
                background: "#0f766e",
                color: "#fff",
                padding: "0.6rem 1rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                background: "#fff",
                color: "#0f172a",
                padding: "0.6rem 1rem",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Go to homepage
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
