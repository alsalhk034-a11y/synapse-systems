# Synapse Systems Worker (Backend API)

This is the Cloudflare Worker backend for Synapse Systems.

## Structure

```
worker/
├── src/
│   └── index.ts          # Hono app with all routes
├── d1/
│   ├── 0001_initial.sql  # Schema (22 tables)
│   └── 0002_seed.sql     # Initial data
├── scripts/
│   └── setup.mjs         # One-command setup
├── package.json
├── tsconfig.json
└── wrangler.toml         # (at project root)
```

## Local Development

```bash
# Terminal 1: Worker with local D1
cd worker
wrangler dev

# Terminal 2: Frontend with proxy
cd ..
npm run dev
```

Visit http://127.0.0.1:5173

## Endpoints

### Public
- `GET  /api/health` — Health check

### Auth
- `POST /api/auth/login` — `{ username, password }` → `{ accessToken, refreshToken, user }`
- `POST /api/auth/refresh` — `{ refreshToken, userId }` → `{ accessToken }`
- `POST /api/auth/logout` — Revoke sessions
- `GET  /api/auth/me` — Current user

### Patients
- `GET    /api/patients?q=&limit=&offset=` — Search
- `GET    /api/patients/:id`
- `POST   /api/patients` — Create
- `PATCH  /api/patients/:id` — Update
- `DELETE /api/patients/:id` — Admin only

### Appointments
- `GET    /api/appointments?date=&doctorId=&patientId=`
- `POST   /api/appointments`
- `PATCH  /api/appointments/:id`
- `DELETE /api/appointments/:id`

### Exams (Clinical)
- `GET    /api/exams?patientId=&doctorId=&status=`
- `GET    /api/exams/:id`
- `POST   /api/exams`
- `PATCH  /api/exams/:id`

### Prescriptions
- `GET    /api/prescriptions?examId=&patientId=`
- `POST   /api/prescriptions`
- `DELETE /api/prescriptions/:id`

### Invoices
- `GET    /api/invoices?patientId=&status=`
- `GET    /api/invoices/:id`
- `POST   /api/invoices`
- `POST   /api/invoices/:id/pay` — Record payment

### Queue
- `GET    /api/queue?date=&doctorId=`
- `POST   /api/queue`
- `PATCH  /api/queue/:id`
- `DELETE /api/queue/:id`

### Accounting
- `GET    /api/accounting/accounts` — Chart of accounts
- `GET    /api/accounting/journal?from=&to=`
- `POST   /api/accounting/journal` — New entry (must balance)
- `GET    /api/accounting/trial-balance?date=`

### Files
- `POST   /api/files/upload` — Get signed R2 URL
- `GET    /api/files/:id` — Get signed download URL

### Reports
- `GET    /api/reports/daily?date=`
- `GET    /api/reports/monthly?year=&month=`
- `GET    /api/reports/patients`
- `GET    /api/reports/revenue?from=&to=`

### Audit
- `GET    /api/audit?from=&to=&userId=&action=`

## Security

- All endpoints (except `/api/health`, `/api/auth/login`) require `Authorization: Bearer <token>`
- JWT access tokens (1h) + refresh tokens (30d)
- bcrypt password hashing (cost 10)
- Account lockout after 5 failed logins (15 min)
- CORS configured from `FRONTEND_URL` env var
- All PII fields encrypted at rest with AES-256-GCM
- SQL injection prevented via parameterized queries
- Rate limiting via CF (Cloudflare built-in)

## Encryption

Fields with `_encrypted` suffix are encrypted using AES-256-GCM with the `ENCRYPTION_KEY` secret.
The encryption is done in `src/crypto.ts` (to be created) using Web Crypto API.

## Database Schema

See `d1/0001_initial.sql` for the full schema.

Key design decisions:
- All clinical data follows FHIR-inspired conventions
- Chart of accounts follows IFRS double-entry bookkeeping
- Audit log is immutable (INSERT only)
- Patients are linked to portal users via `users.linked_patient_id`

## Deploy

```bash
# One-time setup
npm run cf:setup

# Subsequent deploys
npm run cf:deploy:worker
```

See [DEPLOY.md](../DEPLOY.md) at project root for the complete guide.
