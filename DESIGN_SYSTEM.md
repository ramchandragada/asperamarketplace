# Design system

This is the first token set for the foundation page. It is not a component library. shadcn/ui components are added when a real screen needs them.

## Tokens

Defined in `src/app/globals.css`.

| Token | Light | Dark |
| --- | --- | --- |
| `--background` | `#f7f5f2` | `#1c1917` |
| `--foreground` | `#1c1917` | `#fafaf9` |
| `--muted` | `#44403c` | `#d6d3d1` |
| `--accent` | `#0f3d3e` | `#5eead4` |
| `--accent-foreground` | `#f8faf9` | `#042f2e` |
| `--surface` | `#ffffff` | `#292524` |
| `--border` | `#e7e5e4` | `#44403c` |
| `--focus` | `#0f766e` | `#5eead4` |
| `--radius` | `12px` | `12px` |

Type uses `next/font` Geist Sans and Geist Mono. Copy on this page is English. Later templates need a locale field. Text is UTF-8.

## Accessibility on the foundation page

The page has one main landmark, a skip link, a visible focus style, and a reduced-motion rule that removes animation and transition. The primary action is the health-check link. Colour pairs are dark text on a light surface in the light theme, and light text on a dark surface in the dark theme. WCAG 2.2 AA remains a product quality goal. This page has not had a formal audit.
