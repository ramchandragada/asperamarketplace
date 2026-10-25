import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Shared dashboard presentation kit — stat tiles, sparkline, area chart,
 * cards, and a prioritised attention list. Server-renderable (no client JS).
 * Used by the seller, admin, and buyer dashboards so they read as one system.
 * All colours come from design tokens; light theme only.
 */

/* ---------- Trend ---------- */

export function Trend({
  pct,
  suffix,
}: {
  pct: number | null | undefined;
  suffix?: string;
}) {
  if (pct == null || Number.isNaN(pct)) {
    return <span className="text-xs text-muted">—</span>;
  }
  const up = pct >= 0;
  return (
    <span className="inline-flex items-center gap-2 text-xs text-muted">
      <span
        className={`inline-flex items-center gap-0.5 font-semibold ${
          up ? "text-success" : "text-danger"
        }`}
      >
        {up ? "▲" : "▼"} {Math.abs(pct)}%
      </span>
      {suffix ? <span>{suffix}</span> : null}
    </span>
  );
}

/* ---------- Sparkline ---------- */

export function Sparkline({
  data,
  width = 84,
  height = 28,
  stroke = "var(--accent)",
}: {
  data: number[];
  width?: number;
  height?: number;
  stroke?: string;
}) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const pts = data
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * (height - 2) - 1;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      aria-hidden
    >
      <polyline
        points={pts}
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ---------- Stat tile ---------- */

export function StatTile({
  label,
  value,
  icon,
  trendPct,
  trendSuffix,
  footnote,
  flag,
  series,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
  trendPct?: number | null;
  trendSuffix?: string;
  footnote?: string;
  flag?: { text: string; tone: "danger" | "warning" } | null;
  series?: number[];
}) {
  return (
    <div className="relative overflow-hidden rounded-[var(--radius)] border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted">{label}</span>
        {icon ? (
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft text-accent">
            {icon}
          </span>
        ) : null}
      </div>
      <div className="mt-2.5 text-[26px] font-bold tracking-tight text-foreground">
        {value}
      </div>
      <div className="mt-1.5 min-h-[18px] text-xs">
        {flag ? (
          <span
            className={`font-semibold ${
              flag.tone === "danger" ? "text-danger" : "text-warning"
            }`}
          >
            ● {flag.text}
          </span>
        ) : trendPct !== undefined ? (
          <Trend pct={trendPct} suffix={trendSuffix} />
        ) : footnote ? (
          <span className="text-muted">{footnote}</span>
        ) : null}
      </div>
      {series && series.length > 1 ? (
        <div className="absolute right-3.5 bottom-3">
          <Sparkline data={series} />
        </div>
      ) : null}
    </div>
  );
}

/* ---------- Area chart ---------- */

export function AreaChart({
  data,
  height = 180,
}: {
  data: Array<{ label: string; value: number }>;
  height?: number;
}) {
  const width = 640;
  if (data.length < 2) {
    return (
      <div
        className="flex items-center justify-center text-sm text-muted"
        style={{ height }}
      >
        Not enough data to chart yet.
      </div>
    );
  }
  const max = Math.max(...data.map((d) => d.value), 1);
  const step = width / (data.length - 1);
  const pad = 6;
  const y = (v: number) =>
    height - pad - (v / max) * (height - pad * 2);
  const line = data
    .map((d, i) => `${(i * step).toFixed(1)},${y(d.value).toFixed(1)}`)
    .join(" L");
  const area = `M${line} L${width},${height} L0,${height} Z`;
  const first = data[0]!.label;
  const mid = data[Math.floor(data.length / 2)]!.label;
  const last = data[data.length - 1]!.label;
  return (
    <div>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="Revenue over time"
      >
        <defs>
          <linearGradient id="dk-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--accent)" stopOpacity="0.2" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="0" y1={height * 0.33} x2={width} y2={height * 0.33} stroke="var(--border)" />
        <line x1="0" y1={height * 0.66} x2={width} y2={height * 0.66} stroke="var(--border)" />
        <path d={area} fill="url(#dk-area)" />
        <path
          d={`M${line}`}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="mt-1 flex justify-between px-1 text-[11px] text-muted">
        <span>{first}</span>
        <span>{mid}</span>
        <span>{last}</span>
      </div>
    </div>
  );
}

/* ---------- Card ---------- */

export function DashboardCard({
  title,
  action,
  aside,
  children,
  className = "",
}: {
  title: string;
  action?: { label: string; href: string };
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[var(--radius)] border border-border bg-surface shadow-[var(--shadow-card)] ${className}`}
    >
      <div className="flex items-center justify-between px-5 pt-4 pb-2.5">
        <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
        {action ? (
          <Link
            href={action.href}
            className="text-[12.5px] font-semibold text-accent hover:underline"
          >
            {action.label} →
          </Link>
        ) : aside ? (
          <span className="text-xs text-muted">{aside}</span>
        ) : null}
      </div>
      <div className="px-5 pt-1 pb-5">{children}</div>
    </section>
  );
}

/* ---------- Attention list ---------- */

export type AttentionItem = {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  detail: string;
  cta?: { label: string; href: string };
};

function AttentionIcon({ severity }: { severity: AttentionItem["severity"] }) {
  const tone =
    severity === "critical"
      ? "bg-danger-soft text-danger"
      : severity === "warning"
        ? "bg-warning-soft text-warning"
        : "bg-accent-soft text-accent";
  const glyph = severity === "info" ? "i" : "!";
  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-sm font-bold ${tone}`}
      aria-hidden
    >
      {glyph}
    </span>
  );
}

export function AttentionList({
  items,
  allClear,
}: {
  items: AttentionItem[];
  allClear?: string;
}) {
  if (items.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-[10px] bg-success-soft px-3 py-3 text-[13px] font-semibold text-success">
        ✓ {allClear ?? "You're all caught up."}
      </div>
    );
  }
  return (
    <div className="flex flex-col">
      {items.map((item, index) => (
        <div
          key={item.id}
          className={`flex items-start gap-3 py-3 ${
            index > 0 ? "border-t border-border" : ""
          }`}
        >
          <AttentionIcon severity={item.severity} />
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-semibold text-foreground">
              {item.title}
            </p>
            <p className="mt-0.5 text-[12.5px] text-muted">{item.detail}</p>
          </div>
          {item.cta ? (
            <Link
              href={item.cta.href}
              className="shrink-0 self-center text-[12.5px] font-semibold text-accent hover:underline"
            >
              {item.cta.label} →
            </Link>
          ) : null}
        </div>
      ))}
      {allClear ? (
        <div className="mt-2 flex items-center gap-2 rounded-[10px] bg-success-soft px-3 py-2.5 text-[12.5px] font-semibold text-success">
          ✓ {allClear}
        </div>
      ) : null}
    </div>
  );
}

/* ---------- Quick actions ---------- */

export function QuickAction({
  href,
  label,
  primary = false,
}: {
  href: string;
  label: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-[11px] px-4 py-2.5 text-sm font-semibold shadow-[var(--shadow-card)] ${
        primary
          ? "bg-accent text-accent-foreground"
          : "border border-border bg-surface text-foreground hover:border-accent"
      }`}
    >
      {label}
    </Link>
  );
}
