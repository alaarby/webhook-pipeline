# Webhook Pipeline

A webhook-driven task processing pipeline — a simplified Zapier.  
Receive webhooks, process them through a job queue, and deliver results to registered subscribers.

## Architecture
```
Webhook → API Server → BullMQ Queue → Worker → Action → Delivery → Subscribers
```

### Layers

| Layer | Responsibility |
|---|---|
| API Server | Receive webhooks, CRUD pipelines, job status |
| BullMQ + Redis | Job queue with retry and backoff |
| Worker | Pick up jobs and execute actions |
| Actions | Transform, enrich, or delay the payload |
| Delivery | POST result to subscribers with retry logic |
| PostgreSQL | Persist pipelines, jobs, delivery attempts |

### Project Structure
```
src/
├── actions/            # Processing action types
│   ├── transform.action.ts
│   ├── enrich.action.ts
│   ├── delay.action.ts
│   └── index.ts
├── api/routes/         # Express routes
│   ├── pipelines.routes.ts
│   ├── webhooks.routes.ts
│   ├── jobs.routes.ts
│   └── api-keys.routes.ts
├── controllers/        # Request handlers
├── services/           # Business logic
├── repositories/       # Database queries
├── middleware/         # Auth, rate limiting, signature
│   ├── auth.middleware.ts
│   ├── rateLimiter.ts
│   └── verify-signature.ts
├── delivery/           # Subscriber delivery + retry
│   └── deliver.ts
├── db/                 # Database
│   ├── schema.ts
│   └── client.ts
├── types/              # Shared TypeScript types
│   └── index.ts
├── queue.ts            # BullMQ setup
├── index.ts            # Express app
└── worker.ts           # Background worker
server.ts               # API entry point
worker.ts               # Worker entry point
```

---

## Setup

### Requirements

- Docker Desktop

### Run
```bash
git clone https://github.com/your-username/webhook-pipeline.git
cd webhook-pipeline

cp .env.example .env
# edit .env with your values

docker compose up --build
```

That's it. The following runs automatically:
- PostgreSQL + Redis start
- Migrations apply
- API server starts on port 3000
- Worker starts in background

---

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `POSTGRES_USER` | Database user | `user` |
| `POSTGRES_PASSWORD` | Database password | `pass` |
| `POSTGRES_DB` | Database name | `pipeline_db` |
| `PORT` | API server port | `3000` |

---

## Security

### API Key Authentication

All management endpoints (`/pipelines`, `/jobs`) require an API key passed in the request header:
```
x-api-key: your-api-key-here
```

Create an API key first:
```bash
curl -X POST http://localhost:3000/api-keys \
  -H "Content-Type: application/json" \
  -d '{"name": "production"}'
```

Response:
```json
{
  "id": "...",
  "key": "your-api-key-here",
  "name": "production",
  "created_at": "2026-01-01T00:00:00.000Z"
}
```

Requests without a valid API key return `401 Unauthorized`.

---

### Webhook Signature Verification

Every pipeline has a unique `signingSecret` generated at creation time. Webhook senders must sign their requests using HMAC-SHA256.

**How to sign a request:**
```bash
PAYLOAD='{"name":"Ali","email":"ali@example.com"}'
SECRET="your-signing-secret"
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')

curl -X POST http://localhost:3000/wh/SOURCE_PATH \
  -H "Content-Type: application/json" \
  -H "x-signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

Requests without a valid signature return `401 Unauthorized`.

---

### Rate Limiting

| Endpoint | Limit |
|---|---|
| `/pipelines`, `/jobs`, `/api-keys` | 100 requests / minute per IP |
| `/wh/*` (webhook ingestion) | 30 requests / minute per IP |

Requests exceeding the limit return `429 Too Many Requests`.

---

## API

### API Keys

#### Create API key
```
POST /api-keys
```
```json
{ "name": "production" }
```

#### Get all API keys
```
GET /api-keys
```

---

### Pipelines

> All pipeline endpoints require `x-api-key` header.

#### Create pipeline
```
POST /pipelines
```
```json
{
  "name": "My Pipeline",
  "actionType": "FILTER_SENSITIVE",
  "subscriberUrls": ["https://your-subscriber.com/webhook"]
}
```

Response includes `signingSecret` — store it securely, used to sign webhook requests.
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "My Pipeline",
  "sourcePath": "abc123",
  "signingSecret": "3f2a1b...",
  "actionType": "FILTER_SENSITIVE",
  "created_at": "2026-01-01T00:00:00.000Z"
}
```

#### Get all pipelines
```
GET /pipelines
x-api-key: your-key
```

#### Get pipeline by ID
```
GET /pipelines/:id
x-api-key: your-key
```

#### Update pipeline
```
PATCH /pipelines/:id
x-api-key: your-key
```

#### Delete pipeline
```
DELETE /pipelines/:id
x-api-key: your-key
```

---

### Webhooks

Webhook ingestion does **not** require an API key — it uses signature verification instead.

#### Send webhook
```
POST /wh/:sourcePath
x-signature: hmac-sha256-signature
```
```json
{
  "name": "Ali",
  "email": "ali@example.com",
  "password": "secret123"
}
```

Response:
```json
{
  "jobId": "123e4567-e89b-12d3-a456-426614174000",
  "status": "queued"
}
```

The webhook is queued immediately — processing happens in the background.

---

### Jobs

> All job endpoints require `x-api-key` header.

#### Get job status
```
GET /jobs/:id
x-api-key: your-key
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "pipeline_id": "550e8400-e29b-41d4-a716-446655440000",
  "payload": { "name": "Ali", "email": "ali@example.com", "password": "secret123" },
  "status": "completed",
  "result": { "name": "Ali", "email": "ali@example.com" },
  "created_at": "2026-01-01T00:00:00.000Z",
  "updated_at": "2026-01-01T00:00:00.000Z"
}
```

Job status values:

| Status | Meaning |
|---|---|
| `pending` | Waiting in queue |
| `processing` | Worker picked it up |
| `completed` | Completed successfully |
| `failed` | Failed after all retries |

#### Get all jobs
```
GET /jobs
GET /jobs?pipelineId=550e8400-e29b-41d4-a716-446655440000
x-api-key: your-key
```

---

## Action Types

### `FILTER_SENSITIVE`
Removes sensitive fields from the payload before delivery.
```
password, secret, token → removed automatically
```

Input:
```json
{ "name": "Ali", "email": "ali@example.com", "password": "secret123" }
```

Output:
```json
{ "name": "Ali", "email": "ali@example.com" }
```

---

### `TRANSFORM_UPPERCASE`
Converts all string values in the payload to uppercase.

Input:
```json
{ "name": "ali", "city": "nablus" }
```

Output:
```json
{ "NAME": "ALI", "CITY": "NABLUS" }
```

---

### `ADD_TIMESTAMP`
Adds a `processedAt` timestamp to the payload.

Input:
```json
{ "name": "Ali" }
```

Output:
```json
{ "name": "Ali", "processedAt": "2026-01-01T00:00:00.000Z" }
```

---

## Design Decisions

### Why BullMQ + Redis for the queue?
Webhooks are ingested synchronously but processed asynchronously. BullMQ provides reliable job queuing with built-in retry logic, exponential backoff, and concurrency control — without needing a separate job scheduler.

### Why separate API and Worker processes?
Running them as separate Docker services means a worker crash does not affect the API, and each can be scaled independently.

### Why Drizzle ORM?
Drizzle gives full TypeScript type safety derived directly from the schema. Types are inferred automatically — no manual interface definitions that can drift out of sync with the database.

### Why layered architecture (controller / service / repository)?
Each layer has a single responsibility. Controllers handle HTTP, services contain business logic, repositories handle database queries. This makes the codebase easier to navigate, test, and extend.

### Why signature verification instead of API keys for webhooks?
Webhook senders are external services — requiring them to manage an API key is impractical. HMAC-SHA256 signature verification is the industry standard (used by GitHub, Stripe, Shopify) and proves the request came from a trusted source without exposing credentials.

### Why rate limiting on webhook ingestion?
Webhooks are a public-facing endpoint. Without rate limiting, a single bad actor could flood the queue with thousands of jobs, degrading performance for all pipelines. The webhook limiter (30 req/min) is intentionally stricter than the API limiter (100 req/min).

### Retry logic
Failed deliveries are retried up to 3 times with increasing delays (2s, 5s, 10s). Every attempt is logged in `delivery_attempts` regardless of success or failure, giving full visibility into delivery history.

---

## CI/CD

GitHub Actions runs on every push to `main`:

- Installs dependencies
- Runs database migrations
- Type checks with TypeScript

See `.github/workflows/ci.yml`.