import type { ButtonHTMLAttributes, ReactNode } from "react";

const variants = {
  primary:
    "bg-accent text-accent-foreground hover:opacity-95 shadow-[var(--shadow-soft)]",
  secondary:
    "border border-border bg-surface text-foreground hover:bg-accent-soft/40",
  ghost: "text-foreground hover:bg-accent-soft/50",
  danger: "bg-danger text-white hover:opacity-95",
} as const;

const sizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
} as const;

export function Button({
  children,
  className = "",
  variant = "primary",
  size = "md",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] font-medium transition disabled:cursor-not-allowed disabled:opacity-55 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
