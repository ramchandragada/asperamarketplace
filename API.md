# API

Phase 1 slice 1 exposes one read endpoint. There is no mutation, authentication, or database.

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

Returns HTTP 200 when the application process can serve the route.

```json
{
  "data": {
    "status": "ok",
    "service": "aspera-marketplace",
    "phase": "foundations",
    "database": "not_configured"
  },
  "error": null,
  "code": "OK",
  "message": "Service is ready",
  "fieldErrors": null,
  "requestId": "4f1c2a10-6b7d-4e8f-9a11-223344556677"
}
```

`database` is `not_configured` because this slice has no PostgreSQL connection. The response is not a marketplace readiness claim. `cache-control` is `no-store`.
