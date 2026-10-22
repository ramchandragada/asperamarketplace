"use client";

import { DashboardError } from "@/components/dashboard-error";

export default function SellerError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <DashboardError {...props} homeHref="/seller" homeLabel="Seller dashboard" />
  );
}
