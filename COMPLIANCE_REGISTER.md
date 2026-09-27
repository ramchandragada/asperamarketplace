# Compliance register

Operational controls and evidence tracking only. **Not a legal approval.** Tax, FDI, PA licensing, DPDP notices, and category licences require qualified counsel (see `ASSUMPTIONS.md` A-20–A-28).

Evidence rows can be drafted in-app at `/admin/trust` (compliance evidence API) and referenced here by `registerKey`.

| Key | Obligation area | Owner role | Due | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| CP-ECOM | Consumer Protection (E-Commerce) Rules disclosures | Admin / counsel | TBD | open | Draft via `registerKey=CP-ECOM` |
| GRIEVANCE | Published grievance officer / contact | Admin | TBD | open | Blocked on A-20 entity |
| SELLER-ID | Seller identity and product disclosures | Catalogue moderator | TBD | partial | Seller KYC + listing fields |
| PRICING | Transparent total pricing, delivery, refunds | Product | TBD | partial | Checkout snapshot + order UI |
| DARK-PATTERN | No fake urgency / manipulated reviews | Trust | TBD | partial | Review moderation queue |
| IT-ACT | Intermediary diligence readiness | Admin / counsel | TBD | open | — |
| DPDP | Notice, consent, retention, principal requests | Privacy owner | TBD | partial | `/privacy` + privacy_requests |
| BREACH | Breach response / CERT-In readiness | Security | TBD | open | Runbook stub in SECURITY.md |
| FDI | Marketplace vs inventory model | Counsel | TBD | blocked | A-22 |
| COMPETITION | Ranking neutrality / self-preferencing review | Counsel | TBD | open | Ranking policy not yet formalized |
| LEGAL-METROLOGY | Packaged commodity declarations | Catalogue | TBD | open | Fields optional today |
| CATEGORY | Launch-category licences | Counsel + ops | TBD | blocked | A-26 |
| IP-TAKEDOWN | Counterfeit / IP takedown | Trust | TBD | partial | Counterfeit cases |
| ACCESSIBILITY | WCAG 2.2 AA goal | Product | TBD | partial | `docs/ACCESSIBILITY_REVIEW.md` |
| RETENTION | Record retention / legal hold | Admin | TBD | open | Audit logs immutable; retention jobs TBD |
| PA-RBI | Payment aggregator posture | Finance + counsel | TBD | blocked | A-23; mock payments only |
| GST-TCS | Tax configuration and TCS reporting | Finance + tax advisor | TBD | blocked | A-21/A-24; tax engine must stay configurable |
| SETTLEMENT | Settlement commercial terms | Finance | TBD | blocked | A-27 |

## Process

1. Open or update a row in this register when scope changes.
2. Attach evidence via `/admin/trust` → compliance evidence (`registerKey` matching this table).
3. Never display a “legally approved” badge in the product UI.
4. Close a row only when counsel and the business owner accept evidence.
