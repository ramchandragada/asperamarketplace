/**
 * Curated laptop enrichment sourced primarily from MD Computers public
 * specification tables (Flipkart blocked/incomplete for several SKUs).
 * Prose is rewritten in Aspera voice — not copied verbatim from MD/Flipkart.
 */
import type { ProductEnrichment } from "@/modules/catalogue/product-enrichment-types";

function laptop(
  partial: Omit<ProductEnrichment, "highlightMap" | "cardBullets"> & {
    cardBullets?: string[];
  },
): ProductEnrichment {
  const highlightMap: Record<string, string> = {};
  for (const row of partial.highlights) {
    highlightMap[row.label] = row.benefit ?? row.label;
  }
  return {
    ...partial,
    highlightMap,
    cardBullets:
      partial.cardBullets ??
      partial.highlights.slice(0, 5).map((h) => h.label),
  };
}

export const LAPTOP_ENRICHMENT_OVERRIDES: Record<string, ProductEnrichment> = {
  "acer-travellite-tl14-52m-laptop-i3-1315ulinux": laptop({
    source: "mdcomputers",
    summary:
      "14″ business ultraportable with Intel Core i3-1315U, 8GB DDR4, 512GB NVMe, and Linux — 1.34 kg metal chassis.",
    description:
      "Acer TravelLite TL14-52M is built for professionals who need a light, durable notebook for work and video calls. The Intel Core i3-1315U handles everyday multitasking, while 8GB DDR4 and a 512GB NVMe SSD keep apps snappy. A 14″ anti-glare FHD panel, HD webcam, and 180° hinge make sharing and conferencing easy. Ships Express from verified Aspera sellers.",
    highlights: [
      { label: "Intel Core i3-1315U (13th Gen)", benefit: "Everyday speed for work and browsing" },
      { label: "8 GB DDR4 | 512 GB SSD", benefit: "Smooth multitasking and fast boot" },
      { label: "14 Inch | FHD anti-glare", benefit: "Clear visuals with less reflection" },
      { label: "Integrated graphics", benefit: "Efficient for office and streaming" },
      { label: "1.34 Kg metal body", benefit: "Easy to carry all day" },
    ],
    descriptionBlocks: [
      {
        title: "Built for professionals on the move",
        body: "Metal outer body, narrow bezels, and a starting weight of 1.34 kg make TravelLite easy to take between meetings. The 180° hinge and large touchpad improve collaboration when you need to share the screen.",
      },
      {
        title: "Responsive everyday performance",
        body: "Intel Core i3-1315U with 8GB DDR4 and a 512GB M.2 NVMe SSD keeps documents, browsers, and video calls responsive without waiting on a spinning drive.",
      },
      {
        title: "Clear FHD display & HD webcam",
        body: "14″ anti-glare Full HD panel is comfortable for long work sessions. An HD webcam covers video conferencing out of the box.",
      },
    ],
    specificationGroups: [
      {
        name: "General",
        rows: [
          { key: "Brand", value: "Acer" },
          { key: "Model", value: "TravelLite TL14-52M" },
          { key: "Color", value: "Grey" },
          { key: "Type", value: "Thin and Light Laptop" },
          { key: "Sales Package", value: "Laptop, Power Adapter, User Manual" },
          { key: "Battery", value: "3-cell Li-ion" },
          { key: "MS Office Provided", value: "No" },
        ],
      },
      {
        name: "Processor And Memory Features",
        rows: [
          { key: "Processor Brand", value: "Intel" },
          { key: "Processor Name", value: "Core i3" },
          { key: "Processor Generation", value: "13th Gen" },
          { key: "Processor Variant", value: "1315U" },
          { key: "SSD", value: "Yes" },
          { key: "SSD Capacity", value: "512 GB M.2 NVMe" },
          { key: "RAM", value: "8 GB" },
          { key: "RAM Type", value: "DDR4" },
          { key: "Graphic Processor", value: "Integrated Graphics" },
          { key: "Storage Type", value: "SSD" },
        ],
      },
      {
        name: "Operating System",
        rows: [{ key: "Operating System", value: "Linux" }],
      },
      {
        name: "Display And Audio Features",
        rows: [
          { key: "Screen Size", value: "35.56 cm (14 Inch)" },
          { key: "Screen Resolution", value: "1920 × 1080 Pixel" },
          { key: "Screen Type", value: "Anti-glare FHD" },
          { key: "Speakers", value: "Built-in speaker" },
        ],
      },
      {
        name: "Port And Slot Features",
        rows: [
          { key: "USB Port", value: "USB 3.2 Gen 2, USB 3.2 Gen 1" },
          { key: "HDMI Port", value: "Yes" },
        ],
      },
      {
        name: "Connectivity Features",
        rows: [
          { key: "Wireless LAN", value: "Wi-Fi" },
          { key: "Bluetooth", value: "Yes" },
        ],
      },
      {
        name: "Dimensions",
        rows: [{ key: "Weight", value: "1.34 Kg" }],
      },
      {
        name: "Additional Features",
        rows: [
          { key: "Web Camera", value: "HD camera" },
          { key: "Keyboard", value: "Chiclet" },
          { key: "Disk Drive", value: "Not Available" },
        ],
      },
    ],
    warranty: {
      summary: "1 Year manufacturer warranty",
      covered: "Manufacturing defects",
      notCovered: "Physical damage, liquid spill, burn",
      serviceType: "Carry-in / brand support as applicable",
    },
  }),

  "asus-vivobook-15-x1504vap-in005ws-laptop-intel-core-3-100uintel-graphics-windows":
    laptop({
      source: "mdcomputers",
      summary:
        "15.6″ Vivobook with Intel Core 3 100U, 8GB DDR5, 512GB NVMe, Windows 11 Home and Office Home 2024.",
      description:
        "ASUS Vivobook 15 X1504VAP-IN005WS is a daily-driver notebook for students and professionals. Intel Core 3 100U, 8GB DDR5, and a 512GB PCIe 4.0 SSD handle browsing, Office, and media smoothly. The 15.6″ FHD NanoEdge display, Wi-Fi 6, and backlit keyboard keep you productive. Includes Office Home 2024 + Microsoft 365 Basic (1 year). Express delivery from Aspera hubs.",
      highlights: [
        { label: "Intel Core 3 100U", benefit: "Efficient everyday performance" },
        { label: "8 GB DDR5 | 512 GB SSD", benefit: "Fast apps and storage" },
        { label: "15.6 Inch | FHD 60Hz", benefit: "Clear, bright visuals" },
        { label: "Intel Graphics", benefit: "Smooth streaming and light creative work" },
        { label: "1.70 Kg · Office 2024", benefit: "Portable with lifetime Office Home" },
      ],
      descriptionBlocks: [
        {
          title: "Productivity that travels with you",
          body: "Vivobook 15 pairs a Series 1 Intel Core 3 100U with expandable DDR5 memory and a Gen4 NVMe SSD so everyday tasks stay responsive at home or on campus.",
        },
        {
          title: "FHD NanoEdge display",
          body: "15.6″ Full HD panel at 250 nits with a 16:9 aspect ratio gives a clean workspace for documents, video, and browsing.",
        },
        {
          title: "Ready for Office work",
          body: "Windows 11 Home ships with Office Home 2024 (lifetime) and Microsoft 365 Basic with 100GB cloud storage for one year.",
        },
      ],
      specificationGroups: [
        {
          name: "General",
          rows: [
            { key: "Brand", value: "ASUS" },
            { key: "Model Number", value: "X1504VAP-IN005WS" },
            { key: "Series", value: "Vivobook 15" },
            { key: "Color", value: "Cool Silver" },
            { key: "Type", value: "Thin and Light Laptop" },
            { key: "Battery", value: "3-cell Li-ion" },
            { key: "MS Office Provided", value: "Office Home 2024 + M365 Basic (1 Yr)" },
          ],
        },
        {
          name: "Processor And Memory Features",
          rows: [
            { key: "Processor Brand", value: "Intel" },
            { key: "Processor Name", value: "Core 3" },
            { key: "Processor Generation", value: "Series 1" },
            { key: "Processor Variant", value: "100U" },
            { key: "Clock Speed", value: "1.2 GHz base, up to 4.7 GHz" },
            { key: "Number of Cores", value: "6 cores / 8 threads" },
            { key: "Cache", value: "10 MB" },
            { key: "SSD", value: "Yes" },
            { key: "SSD Capacity", value: "512 GB M.2 NVMe PCIe 4.0" },
            { key: "RAM", value: "8 GB" },
            { key: "RAM Type", value: "DDR5 (expandable up to 24 GB)" },
            { key: "Graphic Processor", value: "Intel Graphics" },
          ],
        },
        {
          name: "Operating System",
          rows: [{ key: "Operating System", value: "Windows 11 Home" }],
        },
        {
          name: "Display And Audio Features",
          rows: [
            { key: "Screen Size", value: "39.62 cm (15.6 Inch)" },
            { key: "Screen Resolution", value: "1920 × 1080 Pixel" },
            { key: "Screen Type", value: "FHD, 60Hz, 250 nits" },
            { key: "Speakers", value: "Built-in speaker" },
          ],
        },
        {
          name: "Port And Slot Features",
          rows: [
            {
              key: "USB Port",
              value: "USB 2.0, USB 3.2 Gen 1, USB-C 3.2 Gen 1",
            },
            { key: "HDMI Port", value: "Yes" },
            { key: "Audio Jack", value: "Combo jack" },
          ],
        },
        {
          name: "Connectivity Features",
          rows: [
            { key: "Wireless LAN", value: "Wi-Fi 6" },
            { key: "Bluetooth", value: "v5.2" },
          ],
        },
        {
          name: "Dimensions",
          rows: [{ key: "Weight", value: "1.70 Kg" }],
        },
        {
          name: "Additional Features",
          rows: [
            { key: "Web Camera", value: "720p HD camera" },
            { key: "Keyboard", value: "Backlit Chiclet" },
            { key: "Disk Drive", value: "Not Available" },
          ],
        },
      ],
      warranty: {
        summary: "1 Year manufacturer warranty",
        covered: "Manufacturing defects",
        notCovered: "Physical damage, liquid spill, burn",
        serviceType: "Carry-in / brand support as applicable",
      },
    }),

  "acer-aspire-3-a325-53-laptop-i5-1334u8gb-ddr4": laptop({
    source: "mdcomputers",
    summary:
      "15.6″ Aspire 3 with Intel Core i5-1334U, 8GB DDR4, 512GB NVMe, FHD IPS, and Windows 11 Home.",
    description:
      "Acer Aspire 3 A325-53 is a value thin-and-light for home and college. The 13th Gen Intel Core i5-1334U with 8GB DDR4 and 512GB NVMe SSD covers classes, Office, and streaming. A 15.6″ anti-glare FHD IPS display delivers wide viewing angles. Express delivery across Pune hubs.",
    highlights: [
      { label: "Intel Core i5-1334U (13th Gen)", benefit: "Strong everyday multitasking" },
      { label: "8 GB DDR4 | 512 GB SSD", benefit: "Fast boot and storage" },
      { label: "15.6 Inch | FHD IPS", benefit: "Wide-angle clear visuals" },
      { label: "Integrated graphics", benefit: "Efficient for daily apps" },
      { label: "1.5 Kg · Silver", benefit: "Light enough for a backpack" },
    ],
    descriptionBlocks: [
      {
        title: "13th Gen Core i5 performance",
        body: "Intel Core i5-1334U keeps browsing, documents, and video calls fluid — a solid step up from entry-level student machines.",
      },
      {
        title: "FHD IPS anti-glare panel",
        body: "15.6″ Full HD IPS display with anti-glare coating is comfortable for long study sessions and movie nights.",
      },
    ],
    specificationGroups: [
      {
        name: "General",
        rows: [
          { key: "Brand", value: "Acer" },
          { key: "Model", value: "Aspire 3 A325-53" },
          { key: "Color", value: "Silver" },
          { key: "Type", value: "Thin and Light Laptop" },
          { key: "Battery", value: "3-cell Li-ion" },
          { key: "MS Office Provided", value: "No" },
        ],
      },
      {
        name: "Processor And Memory Features",
        rows: [
          { key: "Processor Brand", value: "Intel" },
          { key: "Processor Name", value: "Core i5" },
          { key: "Processor Generation", value: "13th Gen" },
          { key: "Processor Variant", value: "1334U" },
          { key: "SSD", value: "Yes" },
          { key: "SSD Capacity", value: "512 GB M.2 NVMe" },
          { key: "RAM", value: "8 GB" },
          { key: "RAM Type", value: "DDR4" },
          { key: "Graphic Processor", value: "Integrated Graphics" },
        ],
      },
      {
        name: "Operating System",
        rows: [{ key: "Operating System", value: "Windows 11 Home" }],
      },
      {
        name: "Display And Audio Features",
        rows: [
          { key: "Screen Size", value: "39.62 cm (15.6 Inch)" },
          { key: "Screen Resolution", value: "1920 × 1080 Pixel" },
          { key: "Screen Type", value: "Anti-glare FHD IPS" },
          { key: "Speakers", value: "Built-in speaker" },
        ],
      },
      {
        name: "Port And Slot Features",
        rows: [
          { key: "USB Port", value: "USB 3.2" },
          { key: "HDMI Port", value: "Yes" },
        ],
      },
      {
        name: "Connectivity Features",
        rows: [
          { key: "Wireless LAN", value: "Wi-Fi" },
          { key: "Bluetooth", value: "Yes" },
        ],
      },
      {
        name: "Dimensions",
        rows: [{ key: "Weight", value: "1.5 Kg" }],
      },
      {
        name: "Additional Features",
        rows: [
          { key: "Web Camera", value: "HD camera" },
          { key: "Keyboard", value: "Non-Backlit" },
          { key: "Disk Drive", value: "Not Available" },
        ],
      },
    ],
    warranty: {
      summary: "1 Year manufacturer warranty",
      covered: "Manufacturing defects",
      notCovered: "Physical damage, liquid spill, burn",
      serviceType: "Carry-in / brand support as applicable",
    },
  }),

  "asus-vivobook-15-x1504vap-in011ws-laptop-intel-core-5-120uintel-graphics-windows":
    laptop({
      source: "mdcomputers",
      summary:
        "15.6″ Vivobook with Intel Core 5 120U, 8GB DDR5, 512GB NVMe, Windows 11 Home and Office Home 2024.",
      description:
        "ASUS Vivobook 15 X1504VAP-IN011WS steps up to Intel Core 5 120U for heavier multitasking. 8GB DDR5 (expandable), 512GB Gen4 SSD, 15.6″ FHD display, Wi-Fi 6, and a backlit keyboard. Includes Office Home 2024 + Microsoft 365 Basic. Aspera Express when you’re in a hub zone.",
      highlights: [
        { label: "Intel Core 5 120U", benefit: "Faster multitasking and creation" },
        { label: "8 GB DDR5 | 512 GB SSD", benefit: "Snappy storage and memory" },
        { label: "15.6 Inch | FHD 60Hz", benefit: "Full HD everyday display" },
        { label: "Intel Graphics", benefit: "Efficient visuals for work and media" },
        { label: "1.70 Kg · Office 2024", benefit: "Portable with lifetime Office Home" },
      ],
      descriptionBlocks: [
        {
          title: "Core 5 power for daily work",
          body: "Intel Core 5 120U (up to 5.0 GHz, 10 cores) keeps tabs, docs, and light creative apps moving without the bulk of a gaming laptop.",
        },
        {
          title: "Expandable DDR5 memory",
          body: "8GB DDR5 on board with a SO-DIMM slot for expansion up to 24GB when your workload grows.",
        },
        {
          title: "Office-ready out of the box",
          body: "Windows 11 Home with Office Home 2024 lifetime and one year of Microsoft 365 Basic cloud storage.",
        },
      ],
      specificationGroups: [
        {
          name: "General",
          rows: [
            { key: "Brand", value: "ASUS" },
            { key: "Model Number", value: "X1504VAP-IN011WS" },
            { key: "Series", value: "Vivobook 15" },
            { key: "Color", value: "Cool Silver" },
            { key: "Type", value: "Thin and Light Laptop" },
            { key: "Battery", value: "3-cell Li-ion" },
            { key: "MS Office Provided", value: "Office Home 2024 + M365 Basic (1 Yr)" },
          ],
        },
        {
          name: "Processor And Memory Features",
          rows: [
            { key: "Processor Brand", value: "Intel" },
            { key: "Processor Name", value: "Core 5" },
            { key: "Processor Variant", value: "120U" },
            { key: "Clock Speed", value: "1.4 GHz base, up to 5.0 GHz" },
            { key: "Number of Cores", value: "10 cores / 12 threads" },
            { key: "Cache", value: "12 MB" },
            { key: "SSD Capacity", value: "512 GB M.2 NVMe PCIe 4.0" },
            { key: "RAM", value: "8 GB" },
            { key: "RAM Type", value: "DDR5 (expandable up to 24 GB)" },
            { key: "Graphic Processor", value: "Intel Graphics" },
          ],
        },
        {
          name: "Operating System",
          rows: [{ key: "Operating System", value: "Windows 11 Home" }],
        },
        {
          name: "Display And Audio Features",
          rows: [
            { key: "Screen Size", value: "39.62 cm (15.6 Inch)" },
            { key: "Screen Resolution", value: "1920 × 1080 Pixel" },
            { key: "Screen Type", value: "FHD, 60Hz, 250 nits" },
          ],
        },
        {
          name: "Port And Slot Features",
          rows: [
            {
              key: "USB Port",
              value: "USB 2.0, USB 3.2 Gen 1, USB-C 3.2 Gen 1",
            },
            { key: "HDMI Port", value: "Yes" },
          ],
        },
        {
          name: "Connectivity Features",
          rows: [
            { key: "Wireless LAN", value: "Wi-Fi 6" },
            { key: "Bluetooth", value: "v5.2" },
          ],
        },
        {
          name: "Dimensions",
          rows: [{ key: "Weight", value: "1.70 Kg" }],
        },
        {
          name: "Additional Features",
          rows: [
            { key: "Web Camera", value: "720p HD camera" },
            { key: "Keyboard", value: "Backlit Chiclet" },
          ],
        },
      ],
      warranty: {
        summary: "1 Year manufacturer warranty",
        covered: "Manufacturing defects",
        notCovered: "Physical damage, liquid spill, burn",
        serviceType: "Carry-in / brand support as applicable",
      },
    }),

  "acer-aspire-lite-al15-53-laptop-i5-1334u16gb-ddr4": laptop({
    source: "mdcomputers",
    summary:
      "15.6″ Aspire Lite with Intel Core i5-1334U, 16GB DDR4, 512GB NVMe, FHD display, and backlit keyboard.",
    description:
      "Acer Aspire Lite AL15-53 doubles the memory vs the Aspire 3 twin — 16GB DDR4 with an i5-1334U and 512GB NVMe for heavier tabs and Office work. 15.6″ FHD panel, backlit keyboard, and Windows 11 Home. Ideal student/home Express pick.",
    highlights: [
      { label: "Intel Core i5-1334U (13th Gen)", benefit: "Reliable everyday performance" },
      { label: "16 GB DDR4 | 512 GB SSD", benefit: "More headroom for multitasking" },
      { label: "15.6 Inch | FHD", benefit: "Full HD for work and media" },
      { label: "Integrated graphics", benefit: "Efficient daily visuals" },
      { label: "1.59 Kg · Backlit keyboard", benefit: "Comfortable typing day or night" },
    ],
    descriptionBlocks: [
      {
        title: "16GB memory for real multitasking",
        body: "With 16GB DDR4 you can keep more browser tabs, Office docs, and streaming apps open without swapping to disk as often.",
      },
      {
        title: "Backlit keyboard & FHD display",
        body: "Type comfortably in low light and enjoy a 15.6″ Full HD panel for classes, spreadsheets, and video.",
      },
    ],
    specificationGroups: [
      {
        name: "General",
        rows: [
          { key: "Brand", value: "Acer" },
          { key: "Model", value: "Aspire Lite AL15-53" },
          { key: "Color", value: "Steel Gray" },
          { key: "Type", value: "Thin and Light Laptop" },
          { key: "Battery", value: "3-cell Li-ion" },
          { key: "MS Office Provided", value: "Yes (pre-installed)" },
        ],
      },
      {
        name: "Processor And Memory Features",
        rows: [
          { key: "Processor Brand", value: "Intel" },
          { key: "Processor Name", value: "Core i5" },
          { key: "Processor Generation", value: "13th Gen" },
          { key: "Processor Variant", value: "1334U" },
          { key: "SSD Capacity", value: "512 GB M.2 NVMe" },
          { key: "RAM", value: "16 GB" },
          { key: "RAM Type", value: "DDR4" },
          { key: "Graphic Processor", value: "Integrated Graphics" },
        ],
      },
      {
        name: "Operating System",
        rows: [{ key: "Operating System", value: "Windows 11 Home" }],
      },
      {
        name: "Display And Audio Features",
        rows: [
          { key: "Screen Size", value: "39.62 cm (15.6 Inch)" },
          { key: "Screen Resolution", value: "1920 × 1080 Pixel" },
          { key: "Screen Type", value: "Full HD 16:9" },
        ],
      },
      {
        name: "Port And Slot Features",
        rows: [
          {
            key: "USB Port",
            value: "USB 2.0, USB 3.2 Gen 1, USB 3.2 Gen 2, USB-C",
          },
          { key: "HDMI Port", value: "Yes" },
        ],
      },
      {
        name: "Connectivity Features",
        rows: [
          { key: "Wireless LAN", value: "Wi-Fi" },
          { key: "Bluetooth", value: "Yes" },
        ],
      },
      {
        name: "Dimensions",
        rows: [{ key: "Weight", value: "1.59 Kg" }],
      },
      {
        name: "Additional Features",
        rows: [
          { key: "Web Camera", value: "HD camera" },
          { key: "Keyboard", value: "Backlit" },
        ],
      },
    ],
    warranty: {
      summary: "1 Year manufacturer warranty",
      covered: "Manufacturing defects",
      notCovered: "Physical damage, liquid spill, burn",
      serviceType: "Carry-in / brand support as applicable",
    },
  }),

  "asus-vivobook-go-15-laptop-amd-ryzen-3-30-radeon-graphics-8gb-lpddr5-ram-512gb-s":
    laptop({
      source: "mdcomputers",
      summary:
        "15.6″ Vivobook Go with AMD Ryzen 3 7320U, Radeon Graphics, 8GB LPDDR5, 512GB SSD, and Windows 11 Home.",
      description:
        "ASUS Vivobook Go 15 is a light student laptop powered by AMD Ryzen 3 7320U and Radeon Graphics. 8GB LPDDR5, 512GB NVMe, and a 15.6″ FHD panel cover classes, streaming, and light creative work. Windows 11 Home with Office bundle options as listed. Express when in hub range.",
      highlights: [
        { label: "AMD Ryzen 3 7320U", benefit: "Efficient quad-core performance" },
        { label: "8 GB LPDDR5 | 512 GB SSD", benefit: "Responsive memory and storage" },
        { label: "15.6 Inch | FHD 60Hz", benefit: "Full HD for study and entertainment" },
        { label: "AMD Radeon Graphics", benefit: "Smooth everyday visuals" },
        { label: "Windows 11 Home", benefit: "Ready for school and home" },
      ],
      descriptionBlocks: [
        {
          title: "Ryzen efficiency for students",
          body: "AMD Ryzen 3 7320U (up to 4.1 GHz) with Radeon Graphics balances battery life and enough power for coursework and streaming.",
        },
        {
          title: "FHD panel, light chassis",
          body: "15.6″ Full HD display at 250 nits keeps notes and video clear, while the slim Vivobook Go body fits easily in a backpack.",
        },
      ],
      specificationGroups: [
        {
          name: "General",
          rows: [
            { key: "Brand", value: "ASUS" },
            { key: "Series", value: "Vivobook Go 15" },
            { key: "Color", value: "Cool Silver" },
            { key: "Type", value: "Thin and Light Laptop" },
            { key: "MS Office Provided", value: "Office Home 2024 + M365 Basic (typical config)" },
          ],
        },
        {
          name: "Processor And Memory Features",
          rows: [
            { key: "Processor Brand", value: "AMD" },
            { key: "Processor Name", value: "Ryzen 3" },
            { key: "Processor Variant", value: "7320U" },
            { key: "Clock Speed", value: "2.4 GHz base, up to 4.1 GHz" },
            { key: "Number of Cores", value: "4 cores / 8 threads" },
            { key: "SSD Capacity", value: "512 GB M.2 NVMe" },
            { key: "RAM", value: "8 GB" },
            { key: "RAM Type", value: "LPDDR5" },
            { key: "Graphic Processor", value: "AMD Radeon Graphics" },
          ],
        },
        {
          name: "Operating System",
          rows: [{ key: "Operating System", value: "Windows 11 Home" }],
        },
        {
          name: "Display And Audio Features",
          rows: [
            { key: "Screen Size", value: "39.62 cm (15.6 Inch)" },
            { key: "Screen Resolution", value: "1920 × 1080 Pixel" },
            { key: "Screen Type", value: "FHD, 60Hz, 250 nits" },
          ],
        },
        {
          name: "Connectivity Features",
          rows: [
            { key: "Wireless LAN", value: "Wi-Fi" },
            { key: "Bluetooth", value: "Yes" },
          ],
        },
        {
          name: "Additional Features",
          rows: [{ key: "Disk Drive", value: "Not Available" }],
        },
      ],
      warranty: {
        summary: "1 Year manufacturer warranty",
        covered: "Manufacturing defects",
        notCovered: "Physical damage, liquid spill, burn",
        serviceType: "Carry-in / brand support as applicable",
      },
    }),

  "msi-prestige-13-evo-a12m-laptop-i5-1240pintel-iris-xe": laptop({
    source: "mdcomputers",
    summary:
      "13.3″ Intel Evo ultraportable with i5-1240P, Iris Xe, 8GB DDR5, 512GB Gen4 SSD — just 0.9 kg.",
    description:
      "MSI Prestige 13 Evo A12M is an Intel Evo certified business ultraportable. 12th Gen Core i5-1240P, Iris Xe graphics, 8GB DDR5, and 512GB Gen4 NVMe in a 0.9 kg chassis with a 13.3″ 16:10 FHD+ 100% sRGB IPS panel. Built for all-day productivity with Express delivery from Aspera.",
    highlights: [
      { label: "Intel Core i5-1240P (12th Gen)", benefit: "Evo-class productivity performance" },
      { label: "8 GB DDR5 | 512 GB SSD", benefit: "Fast memory and Gen4 storage" },
      { label: "13.3 Inch | FHD+ 100% sRGB", benefit: "Sharp 16:10 IPS visuals" },
      { label: "Intel Iris Xe Graphics", benefit: "Smooth creative and media work" },
      { label: "0.9 Kg ultraportable", benefit: "True go-anywhere mobility" },
    ],
    descriptionBlocks: [
      {
        title: "Intel Evo productivity",
        body: "Certified for responsive performance, instant wake, and all-day battery expectations — Prestige 13 Evo is tuned for work that moves with you.",
      },
      {
        title: "16:10 FHD+ IPS display",
        body: "13.3″ 1920×1200 Micro Edge IPS panel with 100% sRGB gives more vertical space for documents and code than classic 16:9 screens.",
      },
      {
        title: "Mobility without compromise",
        body: "At about 0.9 kg with Wi-Fi 6E and a backlit keyboard, it is one of the lightest productivity machines in the Aspera laptop range.",
      },
    ],
    specificationGroups: [
      {
        name: "General",
        rows: [
          { key: "Brand", value: "MSI" },
          { key: "Model Number", value: "Prestige 13 Evo A12M" },
          { key: "Part Number", value: "9S7-13Q111-085" },
          { key: "Color", value: "White" },
          { key: "Type", value: "Thin and Light Laptop" },
          { key: "Battery", value: "4-cell Li-ion" },
          { key: "Suitable For", value: "Processing & Multitasking" },
        ],
      },
      {
        name: "Processor And Memory Features",
        rows: [
          { key: "Processor Brand", value: "Intel" },
          { key: "Processor Name", value: "Core i5" },
          { key: "Processor Generation", value: "12th Gen" },
          { key: "Processor Variant", value: "1240P" },
          { key: "Clock Speed", value: "Up to 4.40 GHz" },
          { key: "Number of Cores", value: "12 cores / 16 threads" },
          { key: "Cache", value: "12 MB" },
          { key: "SSD Capacity", value: "512 GB M.2 NVMe PCIe Gen4" },
          { key: "RAM", value: "8 GB" },
          { key: "RAM Type", value: "DDR5" },
          { key: "Graphic Processor", value: "Intel Iris Xe Graphics" },
        ],
      },
      {
        name: "Operating System",
        rows: [{ key: "Operating System", value: "Windows 11 Home" }],
      },
      {
        name: "Display And Audio Features",
        rows: [
          { key: "Screen Size", value: "33.78 cm (13.3 Inch)" },
          { key: "Screen Resolution", value: "1920 × 1200 Pixel" },
          { key: "Screen Type", value: "IPS, 100% sRGB, Micro Edge" },
          { key: "Speakers", value: "Built-in speaker" },
        ],
      },
      {
        name: "Port And Slot Features",
        rows: [
          { key: "USB Port", value: "USB 3.2, Type-A" },
          { key: "HDMI Port", value: "Yes" },
        ],
      },
      {
        name: "Connectivity Features",
        rows: [
          { key: "Wireless LAN", value: "Wi-Fi 6E" },
          { key: "Bluetooth", value: "v5.2" },
        ],
      },
      {
        name: "Dimensions",
        rows: [{ key: "Weight", value: "0.9 Kg" }],
      },
      {
        name: "Additional Features",
        rows: [
          { key: "Web Camera", value: "1080p FHD camera" },
          { key: "Keyboard", value: "Backlit" },
          { key: "Finger Print Sensor", value: "Yes (typical Prestige config)" },
        ],
      },
    ],
    warranty: {
      summary: "1 Year manufacturer warranty",
      covered: "Manufacturing defects",
      notCovered: "Physical damage, liquid spill, burn",
      serviceType: "Carry-in / brand support as applicable",
    },
  }),

  "msi-prestige-14-h-b12ucx-gaming-laptop-i5-12450hrtx-2050-4gb-gddr6": laptop({
    source: "mdcomputers",
    summary:
      "14″ creator/gaming Prestige with i5-12450H, RTX 2050 4GB, 16GB DDR5, 512GB Gen4 SSD — 1.4 kg.",
    description:
      "MSI Prestige 14 H B12UCX blends thin-and-light design with discrete RTX 2050 graphics. Intel Core i5-12450H, 16GB DDR5, 512GB Gen4 NVMe, and a 14″ FHD+ IPS 100% sRGB panel. Wi-Fi 6E, backlit keyboard, and Windows 11 Home. Creator-friendly Express SKU from Aspera.",
    highlights: [
      { label: "Intel Core i5-12450H (12th Gen)", benefit: "8-core punch for create and play" },
      { label: "16 GB DDR5 | 512 GB SSD", benefit: "Room for projects and games" },
      { label: "14 Inch | FHD+ 100% sRGB IPS", benefit: "Colour-accurate creator display" },
      { label: "RTX 2050 4GB GDDR6", benefit: "Discrete GPU for light gaming & creatives" },
      { label: "1.4 Kg · Wi-Fi 6E", benefit: "Portable with modern wireless" },
    ],
    descriptionBlocks: [
      {
        title: "Discrete RTX graphics in a slim chassis",
        body: "NVIDIA GeForce RTX 2050 4GB GDDR6 unlocks smoother creative apps and entry gaming without jumping to a bulky gaming laptop.",
      },
      {
        title: "12th Gen H-series CPU",
        body: "Intel Core i5-12450H (8 cores / 12 threads, up to 4.40 GHz) with 16GB DDR5 keeps exports, browsers, and multitasking fluid.",
      },
      {
        title: "Creator-ready 14″ IPS panel",
        body: "14″ 1920×1200 IPS display with 100% sRGB coverage is tuned for photo and video work on the go.",
      },
    ],
    specificationGroups: [
      {
        name: "General",
        rows: [
          { key: "Brand", value: "MSI" },
          { key: "Model", value: "Prestige 14 H B12UCX" },
          { key: "Part Number", value: "9S7-14F122-412" },
          { key: "Color", value: "Silver" },
          { key: "Type", value: "Thin and Light / Creator Laptop" },
          { key: "Battery", value: "4-cell Li-ion" },
        ],
      },
      {
        name: "Processor And Memory Features",
        rows: [
          { key: "Processor Brand", value: "Intel" },
          { key: "Processor Name", value: "Core i5" },
          { key: "Processor Generation", value: "12th Gen" },
          { key: "Processor Variant", value: "12450H" },
          { key: "Clock Speed", value: "Up to 4.40 GHz" },
          { key: "Number of Cores", value: "8 cores / 12 threads" },
          { key: "Cache", value: "12 MB" },
          { key: "SSD Capacity", value: "512 GB M.2 NVMe PCIe Gen4" },
          { key: "RAM", value: "16 GB" },
          { key: "RAM Type", value: "DDR5" },
          { key: "Graphic Processor", value: "NVIDIA GeForce RTX 2050 4GB GDDR6" },
          { key: "Dedicated Graphic Memory Capacity", value: "4 GB" },
        ],
      },
      {
        name: "Operating System",
        rows: [{ key: "Operating System", value: "Windows 11 Home" }],
      },
      {
        name: "Display And Audio Features",
        rows: [
          { key: "Screen Size", value: "35.56 cm (14 Inch)" },
          { key: "Screen Resolution", value: "1920 × 1200 Pixel" },
          { key: "Screen Type", value: "IPS, 100% sRGB" },
          { key: "Speakers", value: "Built-in speaker" },
        ],
      },
      {
        name: "Port And Slot Features",
        rows: [
          { key: "USB Port", value: "USB 3.2, Type-A" },
          { key: "HDMI Port", value: "Yes" },
        ],
      },
      {
        name: "Connectivity Features",
        rows: [
          { key: "Wireless LAN", value: "Wi-Fi 6E" },
          { key: "Bluetooth", value: "v5.3" },
        ],
      },
      {
        name: "Dimensions",
        rows: [{ key: "Weight", value: "1.4 Kg" }],
      },
      {
        name: "Additional Features",
        rows: [
          { key: "Web Camera", value: "1080p FHD camera" },
          { key: "Keyboard", value: "Backlit" },
          { key: "Disk Drive", value: "Not Available" },
        ],
      },
    ],
    warranty: {
      summary: "2 Year manufacturer warranty",
      covered: "Manufacturing defects",
      notCovered: "Physical damage, liquid spill, burn",
      serviceType: "Carry-in / brand support as applicable",
    },
  }),
};
