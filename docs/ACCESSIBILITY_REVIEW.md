# Accessibility review (Phase 10)

This is an engineering self-review, not a WCAG certification.

## Checks performed / required on UI surfaces

| Area | Expectation | Status |
| --- | --- | --- |
| Forms | Labels associated with inputs; errors in text | Implemented on auth, cart, fulfilment, finance, trust panels |
| Focus | Visible focus via browser defaults; no `outline: none` global kill | Pass (no global outline removal) |
| Contrast | Dark text on light backgrounds in current theme | Partial — re-check branded marketing later |
| Keyboard | Primary flows reachable without pointer | Partial — verify admin tables and panels manually |
| Landmarks | Single `main` per page | Pass on reviewed pages |
| Images | Product imagery not yet dominant; alt text required when added | Open |
| Motion | No auto-playing motion beyond CSS bars | Pass |

## Follow-ups before launch

1. Add skip-link to main content.
2. Audit admin dense lists with a screen reader.
3. Confirm error messages are announced (`role="alert"` where needed).
4. Localisation (A-13) must preserve Unicode and reading order.
