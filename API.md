# API

Phase 1 exposes one read endpoint. There is no public mutation, authentication, or marketplace catalogue API.

Every JSON response uses this envelope:

| Field | Success | Failure |
| --- | --- | --- |
| `data` | Result object | `null` |
| `error` | `null` | Short error text |
| `code` | `OK` | Stable machine code |
| `message` | Human-readable status | Human-readable status |
| `fieldErrors` | `null` | Map of field name to messages, or `null` |
| `requestId` | Correlation id | Correlation id |

The server reads `x-request-id`. A UUID is kept. Any other value is replaced with a new UUID. The same id is returned in the `x-request-id` response header and in `requestId`.

## `GET /api/health`

Returns HTTP 200 when the process can serve the route and the database is configured or intentionally absent. Returns HTTP 503 when `DATABASE_URL` is set and the database cannot be reached.

```json
{
  "data": {
    "status": "ok",
    "service": "aspera-marketplace",
    "phase": "foundations",
    "database": "configured"
  },
  "error": null,
  "code": "OK",
  "message": "Service is ready",
  "fieldErrors": null,
  "requestId": "4f1c2a10-6b7d-4e8f-9a11-223344556677"
}
```

`database` values:

| Value | Meaning |
| --- | --- |
| `not_configured` | `DATABASE_URL` is unset |
| `configured` | A `SELECT 1` against PostgreSQL succeeded |
| `unavailable` | `DATABASE_URL` is set and the query failed. Response status is 503 and `data.status` is `degraded` |

`cache-control` is `no-store`. This endpoint is readiness for the foundation process, not a marketplace launch claim.
