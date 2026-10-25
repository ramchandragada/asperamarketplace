/**
 * Aspera Express PC Builder — slot model, compatibility rules, and wattage.
 * Designed to beat basic part pickers (e.g. BuildMyPC) with live catalogue
 * stock, socket/RAM checks, estimated draw, and Express-ready checkout.
 */

export type BuilderSlotId =
  | "cpu"
  | "motherboard"
  | "memory"
  | "storage"
  | "gpu"
  | "cooler"
  | "case"
  | "psu"
  | "keyboard"
  | "mouse";

export type BuilderSlot = {
  id: BuilderSlotId;
  label: string;
  categorySlug: string;
  required: boolean;
  /** Extra facet filter when browsing this slot (e.g. keyboard vs mouse). */
  facetDefaults?: Record<string, string[]>;
  hint: string;
};

export const BUILDER_SLOTS: BuilderSlot[] = [
  {
    id: "cpu",
    label: "Processor",
    categorySlug: "processors",
    required: true,
    hint: "Pick a socket first — motherboards filter to match",
  },
  {
    id: "motherboard",
    label: "Motherboard",
    categorySlug: "motherboards",
    required: true,
    hint: "Must match CPU socket and RAM generation",
  },
  {
    id: "memory",
    label: "Memory (RAM)",
    categorySlug: "memory-ram",
    required: true,
    hint: "DDR4 vs DDR5 follows the motherboard",
  },
  {
    id: "storage",
    label: "Storage",
    categorySlug: "storage-ssd",
    required: true,
    hint: "NVMe preferred for Express gaming / creator builds",
  },
  {
    id: "gpu",
    label: "Graphics card",
    categorySlug: "graphics-cards",
    required: false,
    hint: "Optional if the CPU has integrated graphics",
  },
  {
    id: "cooler",
    label: "CPU cooler",
    categorySlug: "cpu-coolers",
    required: false,
    hint: "Stock coolers work for many mid-range CPUs",
  },
  {
    id: "case",
    label: "Cabinet",
    categorySlug: "cabinets",
    required: true,
    hint: "Check motherboard form-factor support",
  },
  {
    id: "psu",
    label: "Power supply",
    categorySlug: "power-supplies",
    required: true,
    hint: "Sized from estimated system wattage + headroom",
  },
  {
    id: "keyboard",
    label: "Keyboard",
    categorySlug: "keyboard-mouse",
    required: false,
    facetDefaults: { type: ["Keyboard"] },
    hint: "Optional Express peripheral",
  },
  {
    id: "mouse",
    label: "Mouse",
    categorySlug: "keyboard-mouse",
    required: false,
    facetDefaults: { type: ["Mouse"] },
    hint: "Optional Express peripheral",
  },
];

export type BuilderPart = {
  productId: string;
  variantId: string;
  slug: string;
  title: string;
  imageUrl: string | null;
  pricePaise: number;
  mrpPaise: number | null;
  availableQty: number;
  sellerName: string;
  facets: Record<string, string>;
};

export type BuilderSelection = Partial<Record<BuilderSlotId, BuilderPart>>;

export type CompatIssue = {
  severity: "error" | "warn" | "info";
  message: string;
};

const SOCKET_TO_PLATFORM: Record<string, string> = {
  AM5: "AMD AM5",
  AM4: "AMD AM4",
  "LGA 1700": "Intel LGA 1700",
  "LGA 1851": "Intel LGA 1851",
};

export function platformForSocket(socket?: string | null): string | null {
  if (!socket) return null;
  return SOCKET_TO_PLATFORM[socket] ?? null;
}

export function socketForPlatform(platform?: string | null): string | null {
  if (!platform) return null;
  const entry = Object.entries(SOCKET_TO_PLATFORM).find(
    ([, value]) => value === platform,
  );
  return entry?.[0] ?? null;
}

/** Facet filters applied when browsing a slot given current selections. */
export function compatibilityFacetsForSlot(
  slotId: BuilderSlotId,
  selection: BuilderSelection,
): Record<string, string[]> {
  const cpu = selection.cpu?.facets ?? {};
  const mobo = selection.motherboard?.facets ?? {};
  const filters: Record<string, string[]> = {
    ...(BUILDER_SLOTS.find((s) => s.id === slotId)?.facetDefaults ?? {}),
  };

  if (slotId === "motherboard" && cpu.socket) {
    const platform = platformForSocket(cpu.socket);
    if (platform) filters.cpuPlatform = [platform];
  }

  if (slotId === "cpu" && mobo.cpuPlatform) {
    const socket = socketForPlatform(mobo.cpuPlatform);
    if (socket) filters.socket = [socket];
  }

  if (slotId === "memory") {
    const mem = mobo.memoryType ?? cpu.memoryType;
    if (mem) filters.memoryType = [mem];
  }

  if (slotId === "case" && mobo.formFactor) {
    filters.motherboardSupport = [mobo.formFactor];
  }

  if (slotId === "psu") {
    const est = estimateSystemWattage(selection);
    if (est.recommendedPsuW >= 850) filters.wattageBand = ["850 W & above"];
    else if (est.recommendedPsuW >= 650)
      filters.wattageBand = ["650–849 W", "850 W & above"];
    else if (est.recommendedPsuW >= 500)
      filters.wattageBand = ["500–649 W", "650–849 W", "850 W & above"];
  }

  return filters;
}

export function evaluateCompatibility(
  selection: BuilderSelection,
): CompatIssue[] {
  const issues: CompatIssue[] = [];
  const cpu = selection.cpu;
  const mobo = selection.motherboard;
  const ram = selection.memory;
  const gpu = selection.gpu;
  const psu = selection.psu;
  const cabinet = selection.case;

  if (cpu && mobo) {
    const platform = platformForSocket(cpu.facets.socket);
    if (
      platform &&
      mobo.facets.cpuPlatform &&
      mobo.facets.cpuPlatform !== platform
    ) {
      issues.push({
        severity: "error",
        message: `CPU socket ${cpu.facets.socket ?? "?"} does not match motherboard ${mobo.facets.cpuPlatform}.`,
      });
    } else if (platform && mobo.facets.cpuPlatform === platform) {
      issues.push({
        severity: "info",
        message: `CPU ↔ motherboard socket match (${cpu.facets.socket}).`,
      });
    }
  }

  if (mobo && ram) {
    if (
      mobo.facets.memoryType &&
      ram.facets.memoryType &&
      mobo.facets.memoryType !== ram.facets.memoryType
    ) {
      issues.push({
        severity: "error",
        message: `RAM is ${ram.facets.memoryType} but motherboard expects ${mobo.facets.memoryType}.`,
      });
    } else if (mobo.facets.memoryType && ram.facets.memoryType) {
      issues.push({
        severity: "info",
        message: `RAM generation matches motherboard (${mobo.facets.memoryType}).`,
      });
    }
  }

  if (mobo && cabinet) {
    if (
      mobo.facets.formFactor &&
      cabinet.facets.motherboardSupport &&
      !cabinet.facets.motherboardSupport
        .toUpperCase()
        .includes(mobo.facets.formFactor.toUpperCase().replace("MINI-", "MINI"))
    ) {
      // Soft warn — support strings vary
      issues.push({
        severity: "warn",
        message: `Confirm cabinet supports ${mobo.facets.formFactor} boards.`,
      });
    }
  }

  if (
    cpu?.facets.integratedGraphics === "No (needs GPU)" &&
    !gpu
  ) {
    issues.push({
      severity: "warn",
      message: "This CPU needs a discrete GPU for display output.",
    });
  }

  const power = estimateSystemWattage(selection);
  if (psu) {
    const psuW = parseWattage(psu.facets.wattage ?? psu.title);
    if (psuW && psuW < power.recommendedPsuW) {
      issues.push({
        severity: "error",
        message: `PSU ${psuW} W is below the recommended ${power.recommendedPsuW} W for this build.`,
      });
    } else if (psuW) {
      issues.push({
        severity: "info",
        message: `PSU ${psuW} W covers ~${power.estimatedDrawW} W draw with headroom.`,
      });
    }
  } else if (power.estimatedDrawW > 0) {
    issues.push({
      severity: "warn",
      message: `Estimate ~${power.estimatedDrawW} W draw — pick a ${power.recommendedPsuW} W+ PSU.`,
    });
  }

  const missingRequired = BUILDER_SLOTS.filter(
    (slot) => slot.required && !selection[slot.id],
  );
  if (missingRequired.length > 0) {
    issues.push({
      severity: "info",
      message: `Still need: ${missingRequired.map((s) => s.label).join(", ")}.`,
    });
  }

  return issues;
}

export function parseWattage(raw: string): number | null {
  const m = raw.match(/(\d{3,4})\s*W/i);
  return m ? Number(m[1]) : null;
}

function estimateCpuWatts(title: string, facets: Record<string, string>): number {
  if (/X3D/i.test(title)) return 120;
  if (/Ryzen\s*9|i9|Ultra\s*9|245K|265K|285K/i.test(title)) return 125;
  if (/Ryzen\s*7|i7|Ultra\s*7/i.test(title)) return 105;
  if (/Ryzen\s*5|i5|Ultra\s*5|Core\s*5/i.test(title)) return 65;
  if (facets.integratedGraphics === "Yes") return 65;
  return 75;
}

function estimateGpuWatts(title: string): number {
  if (/4090|5090/i.test(title)) return 450;
  if (/4080|5080/i.test(title)) return 320;
  if (/4070\s*Ti|5070\s*Ti|7900/i.test(title)) return 285;
  if (/4070|5070|7800/i.test(title)) return 200;
  if (/4060\s*Ti|5060\s*Ti|7700/i.test(title)) return 160;
  if (/4060|5060|7600|3060/i.test(title)) return 115;
  if (/3050|1650|RX\s*6/i.test(title)) return 90;
  return 150;
}

export function estimateSystemWattage(selection: BuilderSelection): {
  estimatedDrawW: number;
  recommendedPsuW: number;
} {
  let draw = 40; // board + fans baseline
  if (selection.cpu) {
    draw += estimateCpuWatts(selection.cpu.title, selection.cpu.facets);
  }
  if (selection.gpu) {
    draw += estimateGpuWatts(selection.gpu.title);
  } else {
    draw += 15; // iGPU / no discrete
  }
  if (selection.memory) draw += 10;
  if (selection.storage) draw += 8;
  if (selection.cooler && /AIO|liquid|360|240/i.test(selection.cooler.title)) {
    draw += 15;
  }

  const withHeadroom = Math.ceil(draw * 1.4);
  const recommendedPsuW = Math.max(450, Math.ceil(withHeadroom / 50) * 50);
  return { estimatedDrawW: draw, recommendedPsuW };
}

export function formatPaiseINR(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

export type BuilderPresetId = "gaming" | "creator" | "office";

export type BuilderPreset = {
  id: BuilderPresetId;
  label: string;
  description: string;
  /** Soft hints applied as search queries / facet nudges per slot */
  hints: Partial<
    Record<BuilderSlotId, { q?: string; facets?: Record<string, string[]> }>
  >;
};

export const BUILDER_PRESETS: BuilderPreset[] = [
  {
    id: "gaming",
    label: "Gaming",
    description: "High-refresh play — discrete GPU + solid PSU headroom",
    hints: {
      cpu: { q: "Ryzen 5" },
      gpu: { facets: { generation: ["RTX 40-series", "RTX 50-series"] } },
      memory: { facets: { capacity: ["32 GB", "16 GB"] } },
      storage: { facets: { interface: ["NVMe / PCIe"] } },
    },
  },
  {
    id: "creator",
    label: "Creator",
    description: "Multi-core CPU, fast NVMe, colour-ready workflow",
    hints: {
      cpu: { q: "Ryzen 7" },
      memory: { facets: { capacity: ["32 GB", "64 GB"] } },
      storage: { facets: { capacityBand: ["1–2 TB"] } },
      gpu: { facets: { generation: ["RTX 40-series"] } },
    },
  },
  {
    id: "office",
    label: "Office",
    description: "Reliable CPU + SSD — GPU optional, quieter power",
    hints: {
      cpu: { q: "i5" },
      memory: { facets: { capacity: ["16 GB"] } },
      storage: { facets: { capacityBand: ["500 GB – 1 TB"] } },
    },
  },
];

export function buildShareQuery(selection: BuilderSelection): string {
  const params = new URLSearchParams();
  for (const slot of BUILDER_SLOTS) {
    const part = selection[slot.id];
    if (part) params.set(slot.id, part.slug);
  }
  return params.toString();
}
