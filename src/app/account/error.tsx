"use client";

import { DashboardError } from "@/components/dashboard-error";

export default function AccountError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <DashboardError {...props} homeHref="/account" homeLabel="Your account" />
  );
}
