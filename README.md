# Blood Donation Backend

A RESTful API for a blood donation platform — connecting requesters in need with eligible, available donors. Built with **Express**, **Prisma ORM**, **PostgreSQL** (Neon), **Stripe**, and deployed on **Vercel**.

**Live API:** `https://blood-donation-backend-virid.vercel.app`
**GitHub:** `https://github.com/mkhaque1/blood-donation-backend`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20+ |
| Framework | Express 5 |
| Language | TypeScript 5 |
| ORM | Prisma 5 |
| Database | PostgreSQL (Neon serverless) |
| Auth | JWT (access + refresh token rotation) |
| Payments | Stripe |
| Validation | Zod 4 |
| Security | Helmet, CORS, express-rate-limit |
| Deploy | Vercel (serverless) |

---

## Features

- Role-based access control — `DONOR`, `REQUESTER`, `ADMIN`
- JWT auth with refresh token rotation and revocation
- Blood request lifecycle: create → verify → match → assign → complete
- Intelligent donor matching by blood group compatibility + city + eligibility (age / weight / 90-day cooldown)
- Priority fee payment via Stripe with webhook-driven status updates
- Soft delete on users and blood requests
- Admin dashboard: user management, stats, audit logs
- Rate limiting on auth endpoints (20 req / 15 min)
- Multi-file Prisma schema with full audit trail

---

## Project Structure

```
src/
├── config/          # env, prisma client, stripe client
├── middlewares/     # authenticate, authorize, validateRequest, errorHandler
├── modules/
│   ├── auth/        # register, login, refresh, logout
│   ├── user/        # GET /me (any role)
│   ├── donor/       # profile, availability toggle, donation history
│   ├── bloodRequest/ # full request lifecycle + matching + search
│   ├── payment/     # Stripe initiation, status, webhook
│   └── admin/       # user management, dashboard stats, audit logs
└── utils/           # ApiError, sendResponse, catchAsync, jwt, bloodCompatibility

prisma/
├── schema/          # multi-file schema (models + enums split)
├── migrations/
└── seed.ts          # admin + donor + requester demo accounts
```

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/mkhaque1/blood-donation-backend.git
cd blood-donation-backend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in all values — see [Environment Variables](#environment-variables) below.

### 3. Run migrations and seed

```bash
npm run prisma:migrate     # creates tables
npm run prisma:seed        # creates demo admin, donor, requester accounts
```

### 4. Start dev server

```bash
npm run dev                # tsx watch — hot reload
```

Server starts on `http://localhost:8000` (or your `PORT`).

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | ✅ | — | Secret for signing access tokens |
| `JWT_ACCESS_EXPIRES_IN` | | `15m` | Access token TTL (e.g. `15m`, `1h`, `1d`) |
| `JWT_REFRESH_SECRET` | ✅ | — | Secret for signing refresh tokens |
| `JWT_REFRESH_EXPIRES_IN` | | `7d` | Refresh token TTL |
| `STRIPE_SECRET_KEY` | ✅ | — | Stripe secret key (`sk_test_...` or `sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | ✅ | — | From `stripe listen` or Stripe dashboard |
| `PRIORITY_REQUEST_FEE_CENTS` | | `500` | Priority fee amount in cents ($5.00) |
| `PORT` | | `5000` | Server port |
| `NODE_ENV` | | `development` | `development` or `production` |
| `CLIENT_URL` | | `*` | CORS allowed origin |
| `ADMIN_SEED_EMAIL` | | `admin@blooddonation.test` | Seed admin email |
| `ADMIN_SEED_PASSWORD` | | `ChangeMe123!` | Seed admin password |

Generate JWT secrets:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Seed Accounts

After running `npm run prisma:seed`:

| Role | Email | Password |
|---|---|---|
| ADMIN | `admin@blooddonation.test` | `ChangeMe123!` |
| DONOR | `seed.donor@test.com` | `DonorPass123` |
| REQUESTER | `seed.requester@test.com` | `RequesterPass123` |

---

## API Documentation

All endpoints are prefixed with `/api/v1`. Protected routes require:
```
Authorization: Bearer <accessToken>
```

---

### Auth — `/api/v1/auth`

#### `POST /register`
Register a new user. Returns a token pair immediately (no email verification).

**Body (DONOR):**
```json
{
  "email": "donor@example.com",
  "password": "password123",
  "role": "DONOR",
  "fullName": "Jane Smith",
  "phone": "01711111111",
  "city": "Dhaka",
  "area": "Mirpur",
  "bloodGroup": "O_POS",
  "dateOfBirth": "1995-06-15T00:00:00Z",
  "weightKg": 65
}
```

**Body (REQUESTER):**
```json
{
  "email": "requester@example.com",
  "password": "password123",
  "role": "REQUESTER",
  "fullName": "City Hospital",
  "phone": "01722222222",
  "city": "Dhaka",
  "area": "Gulshan",
  "organizationType": "HOSPITAL",
  "organizationName": "City General Hospital"
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "role": "DONOR"
  }
}
```

---

#### `POST /login`
**Body:**
```json
{ "email": "donor@example.com", "password": "password123" }
```

**Response `200`:** Same shape as `/register`.

---

#### `POST /refresh-token`
Exchange a valid refresh token for a new token pair. Old token is revoked immediately (rotation).

**Body:**
```json
{ "refreshToken": "eyJ..." }
```

**Response `200`:** Same shape as `/register`.

---

#### `POST /logout`
Revokes the provided refresh token.

**Body:**
```json
{ "refreshToken": "eyJ..." }
```

**Response `200`:**
```json
{ "success": true, "message": "Logged out successfully" }
```

---

### User — `/api/v1/users`

#### `GET /me` 🔒 Any role
Returns the current user's base record plus their profile (donor or requester).

**Response `200`:**
```json
{
  "data": {
    "id": "uuid",
    "email": "...",
    "role": "DONOR",
    "isActive": true,
    "donorProfile": { ... },
    "requesterProfile": null
  }
}
```

---

### Donor — `/api/v1/donors`

All routes require `DONOR` role.

#### `GET /me` 🔒 DONOR
Returns the donor's full profile.

#### `PATCH /me` 🔒 DONOR
Update profile fields. All fields optional.

**Body:**
```json
{
  "fullName": "Jane Smith",
  "phone": "01711111111",
  "city": "Dhaka",
  "area": "Mirpur",
  "latitude": 23.8103,
  "longitude": 90.4125,
  "medicalNotes": "No known conditions"
}
```

#### `PATCH /me/availability` 🔒 DONOR
Toggles `isAvailable` between `true` and `false`. No body needed.

**Response `200`:**
```json
{
  "message": "Availability set to false",
  "data": { "isAvailable": false, ... }
}
```

#### `GET /me/donations` 🔒 DONOR
Returns the donor's full donation history, newest first.

---

### Blood Requests — `/api/v1/blood-requests`

All routes require authentication. Role restrictions noted per endpoint.

#### `POST /` 🔒 REQUESTER
Create a new blood request. Starts in `PENDING_VERIFICATION`.

**Body:**
```json
{
  "patientName": "John Doe",
  "bloodGroup": "O_POS",
  "unitsNeeded": 2,
  "urgency": "URGENT",
  "hospitalName": "City Hospital",
  "city": "Dhaka",
  "area": "Mirpur",
  "neededBy": "2026-10-01T00:00:00Z",
  "notes": "Post-surgery"
}
```

`urgency`: `NORMAL` | `URGENT` | `CRITICAL` (default `NORMAL`)
`bloodGroup`: `A_POS` | `A_NEG` | `B_POS` | `B_NEG` | `AB_POS` | `AB_NEG` | `O_POS` | `O_NEG`

**Response `201`:** Full blood request object.

---

#### `GET /` 🔒 Any role
Paginated list of all non-deleted requests.

**Query params:**
| Param | Type | Description |
|---|---|---|
| `page` | number | Default `1` |
| `limit` | number | Default `10`, max `50` |
| `status` | string | Filter by status |
| `bloodGroup` | string | Filter by blood group |
| `city` | string | Case-insensitive city filter |
| `urgency` | string | `NORMAL` \| `URGENT` \| `CRITICAL` |
| `sortBy` | string | `createdAt` (default) \| `neededBy` |
| `sortOrder` | string | `desc` (default) \| `asc` |

**Response `200`:**
```json
{
  "data": [ ... ],
  "meta": { "page": 1, "limit": 10, "total": 42, "totalPages": 5 }
}
```

---

#### `GET /search` 🔒 Any role
Full-text search across `patientName`, `hospitalName`, `city`, `area`. Returns up to 20 results.

**Query:** `?q=dhaka`

---

#### `GET /:id` 🔒 Any role
Fetch a single blood request by ID. Returns `404` if soft-deleted.

---

#### `PATCH /:id/verify` 🔒 ADMIN
Moves request from `PENDING_VERIFICATION` → `MATCHING`.

**Response `200`:** Updated blood request.

---

#### `GET /:id/matches` 🔒 ADMIN | REQUESTER
Returns eligible donors for this request. Filters by:
- Blood group compatibility
- Same city (case-insensitive)
- `isAvailable: true`
- Age 18–60, weight ≥ 50 kg, last donation ≥ 90 days ago

---

#### `POST /:id/accept` 🔒 DONOR
Donor pledges to donate. Eligibility is checked server-side. Creates a `Donation` record with status `PLEDGED` and moves the request to `DONOR_ASSIGNED`.

**Errors:**
- `400` — donor not eligible (age / weight / 90-day cooldown)
- `409` — already pledged to this request
- `400` — request not accepting donors

---

#### `PATCH /:id/status` 🔒 ADMIN | REQUESTER
Manually update request status.

**Body:**
```json
{ "status": "COMPLETED" }
```

Valid statuses: `PENDING_VERIFICATION` | `VERIFIED` | `MATCHING` | `DONOR_ASSIGNED` | `COMPLETED` | `CANCELLED` | `EXPIRED`

When set to `COMPLETED`:
- All `PLEDGED` donations on this request are marked `COMPLETED` with a `completedAt` timestamp
- Each donor's `totalDonations` is incremented and `lastDonationDate` is set

---

#### `DELETE /:id` 🔒 ADMIN | REQUESTER
Soft-deletes the request — sets `deletedAt` and `status: CANCELLED`. The record remains in the database.

---

### Payments — `/api/v1/payments`

#### `POST /initiate/priority-fee` 🔒 REQUESTER
Pay a small fee ($5.00 by default) to mark a blood request as priority. The requester must own the blood request.

**Body:**
```json
{ "bloodRequestId": "uuid" }
```

**Response `201`:**
```json
{
  "data": {
    "clientSecret": "pi_xxx_secret_xxx",
    "paymentId": "uuid"
  }
}
```

Use `clientSecret` on the frontend with Stripe.js to complete the payment. On success, Stripe sends a webhook that sets `Payment.status → SUCCEEDED` and `BloodRequest.isPriority → true`.

---

#### `GET /:paymentId` 🔒 Owner only
Fetch payment status. Returns `403` if the token belongs to a different user.

**Response `200`:**
```json
{
  "data": {
    "id": "uuid",
    "status": "PENDING",
    "purpose": "PRIORITY_REQUEST_FEE",
    "amountCents": 500,
    "provider": "stripe",
    "providerRef": "pi_xxx"
  }
}
```

---

#### `POST /webhook` — Stripe webhook (no auth)
Receives Stripe events. Must be registered before `express.json()` to preserve the raw body for signature verification.

Set `STRIPE_WEBHOOK_SECRET` from:
```bash
stripe listen --forward-to localhost:8000/api/v1/payments/webhook
```

**Handled events:**
| Event | Action |
|---|---|
| `payment_intent.succeeded` | Sets `Payment.status → SUCCEEDED`, sets `BloodRequest.isPriority → true` |
| `payment_intent.payment_failed` | Sets `Payment.status → FAILED` |

---

### Admin — `/api/v1/admin`

All routes require `ADMIN` role.

#### `GET /dashboard-stats` 🔒 ADMIN

**Response `200`:**
```json
{
  "data": {
    "totalDonors": 4,
    "totalRequesters": 3,
    "pendingRequests": 3,
    "completedRequests": 2,
    "totalDonations": 2,
    "totalRevenueCents": 500
  }
}
```

---

#### `GET /users` 🔒 ADMIN
Paginated user list. Supports `?role=DONOR|REQUESTER|ADMIN`, `?page`, `?limit`.

---

#### `PATCH /users/:id/status` 🔒 ADMIN
Activate or deactivate a user account.

**Body:**
```json
{ "isActive": false }
```

A deactivated user cannot log in and gets `403 This account has been deactivated`.

---

#### `DELETE /users/:id` 🔒 ADMIN
Soft-deletes a user — sets `deletedAt` and `isActive: false`. Writes an audit log entry.

---

#### `GET /audit-logs` 🔒 ADMIN
Paginated audit trail. Includes actor email and role.

**Response `200`:**
```json
{
  "data": [
    {
      "action": "REQUEST_VERIFIED",
      "targetType": "BloodRequest",
      "targetId": "uuid",
      "metadata": { "from": "PENDING_VERIFICATION", "to": "MATCHING" },
      "actor": { "email": "admin@...", "role": "ADMIN" },
      "createdAt": "2026-09-03T..."
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 47, "totalPages": 3 }
}
```

**Audit actions:** `REQUEST_CREATED` | `REQUEST_VERIFIED` | `REQUEST_STATUS_CHANGED` | `USER_STATUS_CHANGED`

---

## Blood Group Compatibility

The matching engine uses standard whole-blood compatibility:

| Recipient | Compatible Donors |
|---|---|
| O_NEG | O_NEG |
| O_POS | O_NEG, O_POS |
| A_NEG | O_NEG, A_NEG |
| A_POS | O_NEG, O_POS, A_NEG, A_POS |
| B_NEG | O_NEG, B_NEG |
| B_POS | O_NEG, O_POS, B_NEG, B_POS |
| AB_NEG | O_NEG, A_NEG, B_NEG, AB_NEG |
| AB_POS | All groups |

---

## Donor Eligibility Rules

A donor is considered eligible when all three conditions are met:
- **Age:** 18–60 years old
- **Weight:** ≥ 50 kg
- **Cooldown:** Last donation was ≥ 90 days ago (or never donated)

Ineligible donors are filtered out of `/matches` results and blocked at `/accept`.

---

## Request Lifecycle

```
PENDING_VERIFICATION
       │
  ADMIN verifies
       │
    MATCHING
       │
  Donor accepts
       │
  DONOR_ASSIGNED
       │
  Requester marks complete
       │
   COMPLETED
```

Can also transition to `CANCELLED` (soft delete) or `EXPIRED` at any stage.

---

## Scripts

```bash
npm run dev              # development server with hot reload
npm run build            # prisma generate + tsc
npm run start            # run compiled output
npm run prisma:migrate   # run migrations
npm run prisma:seed      # seed demo accounts
npm run prisma:studio    # open Prisma Studio (GUI)
npm run prisma:generate  # regenerate Prisma client
```

---

## Deployment

The API is deployed as a serverless function on Vercel via `api/index.ts`.

```bash
vercel --prod   # deploy to production
```

All environment variables are set via `vercel env add` or the Vercel dashboard. See `.env.example` for the full list.

**Note:** The Stripe webhook secret used in production must come from the Stripe dashboard (not the CLI `stripe listen` secret, which is for local development only).
