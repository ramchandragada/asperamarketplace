# Design system

The source of truth for tokens is `src/app/globals.css` (`:root` + `@theme inline`). This doc describes what's there and how to use it. It is kept in sync with that file.

## Theme

"Studio Bazaar" — a warm-paper storefront so product photos lead, with teal as the trust chrome. The marketplace is **intentionally light-only**: the `prefers-color-scheme: dark` block in `globals.css` re-asserts the light palette on purpose (commercial clarity), so there are **no `dark:` variants** and components must not assume a dark theme.

Font: **Inter** (`--font-inter`) for sans and display; system monospace for mono. (Not Geist.)

## Color tokens

Defined as CSS variables and exposed to Tailwind via `@theme inline`, so each has a utility (`bg-*`, `text-*`, `border-*`).

| Token | Value | Use |
| --- | --- | --- |
| `background` | `#f3eee6` | page background |
| `foreground` | `#172126` | primary text |
| `muted` | `#5c6a70` | secondary text |
| `accent` | `#123b4a` | primary brand (buttons, links, active) |
| `accent-foreground` | `#ffffff` | text on accent |
| `accent-soft` | `#e7eef0` | tinted accent backgrounds |
| `brand-accent` | `#c2410c` | price / sale emphasis |
| `surface` / `surface-raised` | `#fffdf8` | cards, panels |
| `border` | `#e4d9cb` | hairlines, inputs |
| `success` / `success-soft` | `#197a55` / `#e6f5ee` | positive states |
| `warning` / `warning-soft` | `#a86200` / `#fff4e5` | caution banners |
| `danger` / `danger-soft` | `#c63d3d` / `#fdecec` | errors, destructive |
| `info` / `info-soft` | `#123b4a` / `#e8eef0` | neutral info |

Radii: `--radius` 12px (`rounded-card`), `--radius-sm` 8px, `--radius-pill`. Shadows: `shadow-soft`, `shadow-card`, `shadow-mega`.

## Rules (how to stay consistent)

1. **Never hardcode colors.** Use the tokens above — `text-danger`, not `text-red-700`; `bg-warning-soft`, not `bg-amber-50`; `border-border`, not `border-black/10`. Raw Tailwind color scales and hex/`black/*` literals are not allowed in app code.
2. **Use the shared primitives** in `src/components/ui/*`: `Button` (variants: primary/secondary/ghost/danger), `Badge` (tones: neutral/success/warning/danger/info), `EmptyState`, `Skeleton`, `PageShell`. Prefer these over hand-rolling a button or status pill.
3. **One button system.** New UI uses the `Button` component. The legacy `.btn-cta*` CSS classes are being migrated out.
4. **Show people words, not enums.** Render internal status enums through `src/lib/status-labels.ts` (order / payment / refund / fulfilment), never raw keys like `awaiting_payment`.
5. **Money** is always formatted with `formatPaise` (Intl `en-IN`, ₹), never raw paise.
6. **Feedback** should be reachable and announced: error text uses `role="alert"`, async status uses `aria-live`.

## Accessibility

Target WCAG 2.2 AA. `globals.css` provides a visible `:focus-visible` outline and a `prefers-reduced-motion` reset. Tap targets aim for 44px on mobile (`min-h-11`). Custom controls carry `aria-*`; forms use real `<label>`s. Color is never the only signal for state.
