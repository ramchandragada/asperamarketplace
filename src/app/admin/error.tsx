"use client";

import { DashboardError } from "@/components/dashboard-error";

export default function AdminError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <DashboardError {...props} homeHref="/admin" homeLabel="Admin dashboard" />
  );
}
