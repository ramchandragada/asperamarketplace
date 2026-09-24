# Assumptions

Each assumption is reversible until a legal, payment-regulatory, inventory-ownership, or data-ownership decision is recorded here as accepted by the business owner. Phase 0 accepted none of the open legal items.

## Accepted for engineering, because the repository is empty

| ID | Assumption | Reversal |
| --- | --- | --- |
| A-01 | This GitHub repository remains the only source of truth. No second application or demo repository will be created. | A later decision could split a worker package inside this repo. A second repo requires an explicit decision. |
| A-02 | The product is a marketplace facilitator. It does not take inventory ownership unless a future contract sets seller-of-record and inventory ownership explicitly. | Legal counsel and the business owner can change the commercial model. Code must read that from configuration, not from a hardcoded branch. |
| A-03 | The first deployable is one Next.js modular monolith. Microservices are out of scope. | Revisit only when a measured operational limit requires a separate process. |
| A-04 | PostgreSQL is the system of record. Prisma is the planned ORM and will be added with the first real migration, not before a non-production database exists. | A different ORM would be a new decision before the first migration. |
| A-05 | Vercel hosts the web application. Railway is the intended host for PostgreSQL and later workers. Neither database nor Railway service is provisioned in Phase 0. | The business can choose another Postgres host before the first migration. |
| A-06 | Development, preview, and production use different databases and credentials. Production is never seeded or reset from a development script. | None. This is a safety constraint. |
| A-07 | Search starts on PostgreSQL. OpenSearch is an adapter that is not deployed in the first catalogue slice. | Add the adapter when query features exceed PostgreSQL. |
| A-08 | Payments start with a local mock provider. A Razorpay-compatible adapter is implemented only behind the same port, with server-side signature checks. No live payment account is used in development. | Production provider selection still needs counsel under the RBI Payment Aggregators Directions in force at that time. |
| A-09 | Money is stored as integer minor units (paise for INR). The ledger is append-only. | A second currency can be added as a currency code on accounts. Floats will not be used for money. |
| A-10 | No launch category is selected. Catalogue, tax, commission, returns, and fulfilment rules are configuration. Phase 1 does not encode a category. | The business owner selects the launch category before catalogue seed data and category-specific compliance rules are built. |
| A-11 | The repository stays public until the owner changes visibility. Sample users, documents, and passwords in future seeds must be obviously fictional. | Making the repository private does not relax the ban on real personal data. |
| A-12 | Node.js on Vercel is currently set to 24.x, while this audit environment has Node.js 22.14.0. Phase 1 will pin one version and align local, CI, and Vercel. | The pin is an implementation choice in Phase 1, recorded in `DECISIONS.md` when made. |
| A-13 | Hindi and other Indian languages are a readiness requirement (Unicode, transliteration hooks, locale fields). Phase 1 copy can be English until a localisation slice. | Content language can expand without a schema rewrite if text fields are UTF-8 and templates carry a locale. |
| A-14 | ONDC is an adapter boundary only. The company is not an ONDC participant. | Participation requires a separate checklist, certification, and an explicit decision. |
| A-15 | Feature work lands on `cursor/<description>-10f6` branches. `main` stays the branch Vercel deploys. | The suffix is specific to this cloud-agent session policy. |

## Open decisions that code must not invent

These change legal entity structure, inventory ownership, the payment-regulatory model, seller-of-record, or data ownership. They stay open.

| ID | Open question | Why it is not assumed |
| --- | --- | --- |
| A-20 | Which legal entity operates the marketplace, and in which states is it established? | Place of supply, grievance officer, and invoice identity depend on it. |
| A-21 | Who is seller of record, and who issues the tax invoice to the buyer? | Determines GST, TCS reporting, returns liability, and customer claims. |
| A-22 | Does any foreign investment apply, and does that restrict inventory or seller equity? | FDI marketplace-versus-inventory rules cannot be guessed. |
| A-23 | Is the platform a payment aggregator, or does a licensed aggregator collect and settle? | The architecture separates orchestration from regulated collection. Production wiring needs professional advice against the RBI directions then in force. |
| A-24 | Which GST, TCS, and Section 9(5) treatments apply, by category? | The engine will store rules and an explanation trace. It will not ship a hardcoded GST calculator as legal truth. |
| A-25 | Who owns customer and seller personal data, and which processors are contracted? | Required before a real data inventory and DPDP notice. |
| A-26 | What is the launch category and its licence regime? | Food, cosmetics, drugs, electronics, toys, jewellery, and other categories carry different controls. |
| A-27 | What are the commercial settlement terms: delivery-based release, return-window hold, reserve, and minimum payout? | The rules engine will be configurable. Default production numbers are a business decision. |
| A-28 | Is cash on delivery offered at launch? | COD changes risk, reconciliation, and logistics. The payment port can represent it later. It is not enabled by Phase 0. |

## Explicit non-claims

- Tax outputs are not reviewed by a qualified Indian tax professional.
- The product is not legally approved and must not show a compliance badge.
- The Vercel production URL is not a working marketplace.
- ONDC participation has not started.
- No feature in the master brief is complete.
