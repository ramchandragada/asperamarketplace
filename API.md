# API

JSON responses use the standard envelope: `data`, `error`, `code`, `message`, `fieldErrors`, `requestId`. Correlation id header: `x-request-id`.

## Health

### `GET /api/health`

Returns process and database readiness. See earlier Phase 1 notes. `database` may be `configured`, `not_configured`, or `unavailable`.

## Auth

### `POST /api/auth/register`

Body: `{ email, password, displayName, intent: "customer" | "seller" }`  
Creates the user, assigns a role, sets an httpOnly `aspera_session` cookie.

### `POST /api/auth/login`

Body: `{ email, password }`  
Creates a session cookie. Failed attempts are recorded in `login_attempts` without storing the password.

### `POST /api/auth/logout`

Revokes the current session cookie.

### `GET /api/auth/me`

Returns the authenticated actor or `{ authenticated: false }`.

## Seller

### `GET /api/seller`

Lists sellers owned by the current user.

### `POST /api/seller`

Creates a seller draft. PAN/GSTIN are validated then stored masked.

### `POST /api/seller/:sellerId/documents`

`multipart/form-data` with `file` and `documentType`. Stores the file through the document storage port.

### `POST /api/seller/submit`

Body: `{ sellerId, acceptAgreement: true }`  
Moves draft → submitted when at least one document exists.

## Admin

### `GET /api/admin/sellers`

Admin-only queue.

### `POST /api/admin/sellers/review`

Body: `{ sellerId, decision: "approve" | "reject", reason, expectedVersion }`  
Optimistic concurrency via `expectedVersion`. Approval writes audit + `SellerApproved` outbox and a seller-scoped `seller_owner` role.
