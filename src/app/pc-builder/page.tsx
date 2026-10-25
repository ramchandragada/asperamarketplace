import type { Metadata } from "next";
import { PcBuilderClient } from "@/components/pc-builder-client";
import type { BuilderPresetId, BuilderSlotId } from "@/lib/pc-builder";
import { BUILDER_PRESETS, BUILDER_SLOTS } from "@/lib/pc-builder";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "PC Builder — Aspera Express",
  description:
    "Build a compatible PC from live Aspera stock. Socket, RAM, and PSU checks with Express delivery usually within 75–90 minutes in hub zones.",
};

type SearchParams = Record<string, string | string[] | undefined>;

function slugFrom(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value || undefined;
}

export default async function PcBuilderPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const initialSlugs: Partial<Record<BuilderSlotId, string>> = {};
  for (const slot of BUILDER_SLOTS) {
    const slug = slugFrom(params[slot.id]);
    if (slug) initialSlugs[slot.id] = slug;
  }
  const presetRaw = slugFrom(params.preset);
  const initialPreset = BUILDER_PRESETS.some((entry) => entry.id === presetRaw)
    ? (presetRaw as BuilderPresetId)
    : null;

  return (
    <main className="min-h-[70vh] bg-background">
      <PcBuilderClient
        initialSlugs={initialSlugs}
        initialPreset={initialPreset}
      />
    </main>
  );
}
