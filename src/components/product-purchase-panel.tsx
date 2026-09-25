"use client";

import { useMemo, useState } from "react";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { PdpTrustBadgeRow } from "@/components/pdp-trust-badge-row";
import { formatPaise } from "@/modules/catalogue/helpers";

type VariantView = {
  id: string;
  title: string;
  sku: string;
  mrpPaise: number;
  sellingPricePaise: number;
  availableQty: number;
  optionValues?: Record<string, string> | null;
};

export function ProductPurchasePanel({
  variants,
  highlights,
  showMall,
  showOriginal,
}: {
  variants: VariantView[];
  highlights: Array<{ label: string; value: string }>;
  showMall?: boolean;
  showOriginal?: boolean;
}) {
  const [selectedId, setSelectedId] = useState(variants[0]?.id ?? "");
  const [pincode, setPincode] = useState("");
  const [deliveryNote, setDeliveryNote] = useState<string | null>(null);
  const selected = variants.find((variant) => variant.id === selectedId) ?? variants[0];

  const sizeVariants = useMemo(() => {
    return variants.filter((variant) => {
      const opts = variant.optionValues ?? {};
      return Boolean(opts.size || opts.Size) || /^(xs|s|m|l|xl|xxl|standard)$/i.test(variant.title);
    });
  }, [variants]);

  const colorOptions = useMemo(() => {
    const colors = new Map<string, string>();
    for (const variant of variants) {
      const color =
        variant.optionValues?.color ??
        variant.optionValues?.Color ??
        null;
      if (color) colors.set(color, variant.id);
    }
    return [...colors.entries()];
  }, [variants]);

  function checkDelivery() {
    const clean = pincode.replace(/\D/g, "");
    if (clean.length !== 6) {
      setDeliveryNote("Enter a valid 6-digit pincode");
      return;
    }
    const day = new Date();
    day.setDate(day.getDate() + 3 + (Number(clean) % 3));
    const label = day.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
    setDeliveryNote(
      `Delivery by ${label} · Cash on Delivery available · 7 Day Easy Returns`,
    );
  }

  if (!selected) {
    return <p className="text-sm text-muted">No active variants.</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-2xl font-bold">
          {formatPaise(selected.sellingPricePaise)}
          {selected.mrpPaise > selected.sellingPricePaise ? (
            <span className="ml-2 text-base font-normal text-muted line-through">
              {formatPaise(selected.mrpPaise)}
            </span>
          ) : null}
        </p>
        <p className="mt-1 text-sm text-muted">Inclusive of taxes</p>
      </div>

      {colorOptions.length > 0 ? (
        <div>
          <p className="mb-2 text-sm font-semibold">
            Select colour
            {selected.optionValues?.color || selected.optionValues?.Color
              ? `: ${selected.optionValues.color ?? selected.optionValues.Color}`
              : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            {colorOptions.map(([color, variantId]) => (
              <button
                key={color}
                type="button"
                title={color}
                onClick={() => setSelectedId(variantId)}
                className={`h-9 w-9 rounded-full border-2 shadow-sm ${
                  selectedId === variantId
                    ? "border-accent ring-2 ring-accent/30"
                    : "border-border hover:border-accent"
                }`}
                style={{ backgroundColor: colorToCss(color) }}
                aria-label={color}
                aria-pressed={selectedId === variantId}
              />
            ))}
          </div>
        </div>
      ) : null}

      {sizeVariants.length > 1 ? (
        <div>
          <p className="mb-2 text-sm font-semibold">Select size</p>
          <div className="flex flex-wrap gap-2">
            {sizeVariants.map((variant) => {
              const size =
                variant.optionValues?.size ??
                variant.optionValues?.Size ??
                variant.title;
              const active = variant.id === selected.id;
              const soldOut = variant.availableQty <= 0;
              return (
                <button
                  key={variant.id}
                  type="button"
                  disabled={soldOut}
                  onClick={() => setSelectedId(variant.id)}
                  className={`min-w-[2.75rem] rounded-[var(--radius-sm)] border px-3 py-2 text-sm font-medium ${
                    active
                      ? "border-accent bg-accent-soft font-semibold text-accent"
                      : soldOut
                        ? "cursor-not-allowed border-border text-muted line-through opacity-60"
                        : "border-border hover:border-accent"
                  }`}
                  aria-pressed={active}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      ) : variants.length > 1 ? (
        <div>
          <p className="mb-2 text-sm font-semibold">Select option</p>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => {
              const active = variant.id === selected.id;
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setSelectedId(variant.id)}
                  className={`rounded-[var(--radius-sm)] border px-3 py-2 text-sm ${
                    active
                      ? "border-accent bg-accent-soft font-semibold text-accent"
                      : "border-border hover:border-accent"
                  }`}
                  aria-pressed={active}
                >
                  {variant.title}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {highlights.length > 0 ? (
        <div>
          <p className="mb-2 text-sm font-semibold">Product highlights</p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {highlights.map((row) => (
              <div key={row.label} className="contents">
                <dt className="text-muted">{row.label}</dt>
                <dd className="font-medium">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      <div className="rounded-[var(--radius)] border border-border bg-surface p-4">
        <p className="text-sm font-semibold">Delivery & services</p>
        <div className="mt-2 flex gap-2">
          <input
            value={pincode}
            onChange={(event) => setPincode(event.target.value)}
            inputMode="numeric"
            maxLength={6}
            placeholder="Enter pincode"
            className="min-w-0 flex-1 rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm"
            aria-label="Pincode"
          />
          <button
            type="button"
            onClick={checkDelivery}
            className="rounded-[var(--radius-sm)] bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground"
          >
            Check
          </button>
        </div>
        {deliveryNote ? (
          <p className="mt-2 text-sm text-muted">{deliveryNote}</p>
        ) : (
          <p className="mt-2 text-sm text-muted">
            Free Delivery on eligible orders · Cash on Delivery available
          </p>
        )}
      </div>

      <PdpTrustBadgeRow showMall={showMall} showOriginal={showOriginal} />

      <div className="hidden gap-3 sm:flex">
        <AddToCartButton
          variantId={selected.id}
          availableQty={selected.availableQty}
        />
        <a
          href="/checkout"
          className="inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-brand-accent px-4 py-2 text-sm font-semibold text-white"
        >
          Buy now
        </a>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t border-border bg-surface p-3 sm:hidden">
        <div className="flex-1">
          <AddToCartButton
            variantId={selected.id}
            availableQty={selected.availableQty}
          />
        </div>
        <a
          href="/checkout"
          className="inline-flex flex-1 items-center justify-center rounded-[var(--radius-sm)] bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
        >
          Buy now
        </a>
      </div>
    </div>
  );
}

function colorToCss(name: string) {
  const key = name.toLowerCase();
  const map: Record<string, string> = {
    red: "#c62828",
    green: "#2e7d32",
    blue: "#1565c0",
    black: "#212121",
    white: "#f5f5f5",
    beige: "#d7ccc8",
    navy: "#1a237e",
    pink: "#ec407a",
    yellow: "#fbc02d",
    grey: "#9e9e9e",
    gray: "#9e9e9e",
    brown: "#6d4c41",
    orange: "#ef6c00",
  };
  return map[key] ?? "#90a4ae";
}
