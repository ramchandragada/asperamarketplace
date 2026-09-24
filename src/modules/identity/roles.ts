export const ROLE_KEYS = [
  "customer",
  "seller_owner",
  "seller_operations",
  "seller_finance",
  "seller_support",
  "marketplace_support",
  "catalogue_moderator",
  "finance_operator",
  "risk_operator",
  "admin",
  "super_admin",
  "auditor",
] as const;

export type RoleKey = (typeof ROLE_KEYS)[number];

export const ROLE_DEFINITIONS: Record<
  RoleKey,
  { name: string; description: string }
> = {
  customer: {
    name: "Customer",
    description: "Buys from the marketplace",
  },
  seller_owner: {
    name: "Seller owner",
    description: "Owns a seller account",
  },
  seller_operations: {
    name: "Seller operations",
    description: "Manages seller catalogue and fulfilment",
  },
  seller_finance: {
    name: "Seller finance",
    description: "Views seller settlements and invoices",
  },
  seller_support: {
    name: "Seller support",
    description: "Handles seller-side support tickets",
  },
  marketplace_support: {
    name: "Marketplace support",
    description: "Handles customer and seller support for the platform",
  },
  catalogue_moderator: {
    name: "Catalogue moderator",
    description: "Reviews listings and catalogue issues",
  },
  finance_operator: {
    name: "Finance operator",
    description: "Reviews settlements and reconciliation",
  },
  risk_operator: {
    name: "Risk and trust operator",
    description: "Reviews fraud and trust cases",
  },
  admin: {
    name: "Admin",
    description: "Approves sellers and operates the platform",
  },
  super_admin: {
    name: "Super admin",
    description: "Full platform administration",
  },
  auditor: {
    name: "Read-only auditor",
    description: "Reads privileged records without mutation",
  },
};

export function isRoleKey(value: string): value is RoleKey {
  return (ROLE_KEYS as readonly string[]).includes(value);
}
