# 🔐 Redis OTP Service

A production-style **Node.js + Express** OTP verification backend using **Redis** for secure, ephemeral OTP storage and fixed-window rate limiting.

---

## 📁 Project Structure

```
redis-otp/
├── src/
│   ├── config/
│   │   ├── env.js                  # Centralised env var parsing & validation
│   │   └── redis.js                # ioredis singleton client
│   ├── controllers/
│   │   └── otp.controller.js       # Signup & verify-otp business logic
│   ├── middlewares/
│   │   ├── rateLimit.middleware.js # Fixed-window rate limiter (middleware)
│   │   └── validate.middleware.js  # Request body validation
│   ├── routes/
│   │   └── otp.routes.js           # Route definitions
│   ├── services/
│   │   ├── otp.service.js          # OTP generate / hash / store / verify
│   │   └── rateLimiter.service.js  # Redis INCR-based rate limiter
│   ├── utils/
│   │   ├── error.js                # createError() factory
│   │   └── response.js             # sendSuccess() / sendError() helpers
│   ├── app.js                      # Express app (middleware pipeline)
│   └── server.js                   # Entry point — Redis connect + HTTP listen
├── .env                            # Local env vars (never commit!)
├── .env.example                    # Template for env vars
├── Dockerfile                      # Multi-stage production Docker image
├── docker-compose.yml              # API + Redis orchestration
└── package.json
```

---

## 🔑 Redis Key Design

| Purpose            | Key Pattern              | Value          | TTL                  |
|--------------------|--------------------------|----------------|----------------------|
| Store OTP          | `otp:<contact>`          | bcrypt hash    | 120s (2 minutes)     |
| Rate limit counter | `rate_limit:<contact>`   | integer count  | 300s (5 minutes)     |
| Verified contact   | `verified:<contact>`     | `"1"`          | None (persistent)    |

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable                  | Default | Description                          |
|---------------------------|---------|--------------------------------------|
| `PORT`                    | `3000`  | HTTP server port                     |
| `NODE_ENV`                | `development` | App environment                |
| `REDIS_HOST`              | `localhost` | Redis host (`redis` in Docker)   |
| `REDIS_PORT`              | `6379`  | Redis port                           |
| `REDIS_PASSWORD`          | _(empty)_ | Redis AUTH password (optional)     |
| `OTP_EXPIRY_SECONDS`      | `120`   | OTP TTL in seconds                   |
| `OTP_BCRYPT_ROUNDS`       | `10`    | bcrypt cost factor                   |
| `RATE_LIMIT_MAX`          | `3`     | Max OTP requests per window          |
| `RATE_LIMIT_WINDOW_SECONDS` | `300` | Rate limit window in seconds         |

---

## 🚀 Running the Project

### Option 1 — Docker (Recommended)

```bash
# Build and start both API + Redis
docker compose up --build

# Run in background
docker compose up --build -d

# Stop
docker compose down

# Stop and remove volumes (clears Redis data)
docker compose down -v
```

### Option 2 — Local Development

Requires a running Redis instance locally.

```bash
# 1. Install dependencies
npm install

# 2. Set REDIS_HOST=localhost in .env

# 3. Start in dev mode (hot-reload)
npm run dev

# 4. Start in production mode
npm start
```

---

## 📡 API Reference

### `POST /api/v1/signup`

Generate and send an OTP for the given contact.

**Request Body:**
```json
{ "contact": "+8801712345678" }
```
`contact` may be a phone number (E.164 format) or email address.

**Success Response** `200 OK`:
```json
{
  "success": true,
  "message": "OTP sent successfully.",
  "data": {
    "otp": "483921",
    "expiresInSeconds": 120
  },
  "timestamp": "2026-02-24T07:12:00.000Z"
}
```
> ⚠️ `otp` is returned **only in `development` mode**. In production, dispatch via SMS/Email.

**Error Responses:**

| Status | Reason |
|--------|--------|
| `400`  | Missing or invalid `contact` field |
| `409`  | Contact is already verified |
| `429`  | Rate limit exceeded (max 3 requests per 5 min) |

---

### `POST /api/v1/verify-otp`

Verify the OTP submitted by the user.

**Request Body:**
```json
{ "contact": "+8801712345678", "otp": "483921" }
```

**Success Response** `200 OK`:
```json
{
  "success": true,
  "message": "Contact verified successfully.",
  "data": {
    "contact": "+8801712345678",
    "verified": true
  },
  "timestamp": "2026-02-24T07:12:10.000Z"
}
```

**Error Responses:**

| Status | Reason |
|--------|--------|
| `400`  | Missing or invalid `contact` / `otp` fields |
| `401`  | OTP is incorrect |
| `410`  | OTP has expired or was never issued |

---

### `GET /health`

Liveness probe.

```json
{ "status": "ok", "uptime": 42.5 }
```

---

## 🛡️ Security Design

### OTP Hashing
- OTPs are **never stored in plain text**.
- Each OTP is hashed with **bcrypt** (`bcryptjs`) before writing to Redis.
- On verification, `bcrypt.compare()` is used — the plain OTP is never logged or persisted.

### Rate Limiting (Fixed Window Algorithm)
```
Window: 5 minutes (300s)
Max:    3 requests per contact per window

On each request:
  1. INCR rate_limit:<contact>
  2. If count == 1 → EXPIRE key by 300s  (pins the window)
  3. If count > 3  → return HTTP 429
  4. Window resets automatically when Redis TTL expires
```
Redis `INCR` is **atomic** (single-threaded), so no race conditions occur.

### OTP Single-Use
After a successful verification, the OTP key is **immediately deleted** from Redis — it cannot be reused.

### Verification Status Storage
`verified:<contact>` is stored in Redis as a fast-lookup flag.
In a production system with a primary database, you should **also** write to a `users` table:
```sql
UPDATE users SET is_verified = TRUE WHERE contact = ?;
```
Use Redis as a cache/flag and your DB as the authoritative source of truth.

---

## 🐳 Docker Architecture

```
┌─────────────────────────────────┐
│         otp_network (bridge)    │
│                                 │
│   ┌─────────┐   ┌───────────┐  │
│   │  api    │──▶│   redis   │  │
│   │ :3000   │   │   :6379   │  │
│   └─────────┘   └───────────┘  │
│        │               │        │
└────────┼───────────────┼────────┘
         │               │
    Host :3000      Host :6379
```

- Both services share the private `otp_network` bridge.
- `REDIS_HOST=redis` resolves via Docker DNS to the Redis container.
- The API service waits for Redis's `healthcheck` to pass before starting (`depends_on: condition: service_healthy`).
- Redis data is persisted in a named volume (`redis_data`) with both AOF and RDB enabled.
