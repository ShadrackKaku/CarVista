# API Reference

All endpoints are Next.js Route Handlers under `/api`. Requests and responses are JSON. Mutating
routes are protected by authentication and/or rate limiting where noted.

Base URL (local): `http://localhost:3000`

---

## Authentication

### `POST /api/auth/register`
Create a new account (rate-limited: 5/min).

```json
// Request
{
  "name": "Kwame Mensah",
  "email": "kwame@email.com",
  "phone": "0201234567",
  "password": "Password123",
  "confirmPassword": "Password123",
  "role": "CUSTOMER"
}
// 201
{ "success": true, "message": "Account created. Check your email to verify." }
```

### `POST /api/auth/[...nextauth]`
NextAuth handler (credentials + Google). Use `signIn()` from `next-auth/react` on the client.

### `POST /api/auth/forgot-password`
Body `{ "email": "..." }` → always returns success (no user enumeration).

### `POST /api/auth/reset-password`
Body `{ "token", "password", "confirmPassword" }`.

### `GET /api/auth/verify-email?token=...`
Verifies an email and redirects to `/login?verified=1`.

---

## Vehicles

### `GET /api/vehicles`
Search & filter active listings.

**Query params:** `q, brand, bodyType, condition, fuelType, minPrice, maxPrice, minYear, maxYear,
sort (price-asc|price-desc|year-desc), page, pageSize`

```json
{ "items": [ /* vehicles with brand, images, dealer */ ], "total": 128, "page": 1, "pageSize": 24 }
```

### `POST /api/vehicles`  🔒 auth
Create a listing. Dealer listings are `ACTIVE`; others are `PENDING`. Body validated by
`vehicleListingSchema`.

---

## Calculators

### `POST /api/calculators/duty`
Compute total landed cost using admin-configured (or default) Ghana rates. Rate-limited 30/min.

```json
// Request
{
  "cifValue": 14000,
  "currency": "USD",
  "exchangeRate": 15.5,
  "manufactureYear": 2021,
  "engineSizeCc": 2500,
  "fuelType": "PETROL",
  "bodyType": "SEDAN",
  "shippingCost": 18000
}
// Response
{ "result": {
  "cifGhs": 217000,
  "lineItems": [ { "key": "importDuty", "label": "Import Duty (20%)", "amount": 43400 }, ... ],
  "taxesSubtotal": ...,
  "logisticsSubtotal": ...,
  "totalLandedCost": ...,
  "ratesUsed": { ... }
} }
```

---

## Import requests

### `POST /api/import-requests`  🔒 auth
Submit a vehicle sourcing / import request. Creates an `ImportRequest` with a `REQUESTED` tracking
event. Body validated by `importRequestSchema`.

---

## Orders

### `POST /api/orders`  🔒 auth
Create a parts order + payment record. Rate-limited 10/min.

```json
// Request
{
  "fullName": "...", "phone": "...", "address": "...", "city": "...", "region": "...",
  "method": "MOBILE_MONEY",
  "items": [ { "partId": "p1", "name": "Brake Pads", "price": 350, "quantity": 2 } ]
}
// 201
{ "success": true, "orderNumber": "CV-XXXX-YYYY" }
```

---

## Saved / wishlist

### `POST /api/saved/vehicles`  🔒 auth
Body `{ "vehicleId": "..." }` → saves a vehicle.

### `DELETE /api/saved/vehicles`  🔒 auth
Body `{ "vehicleId": "..." }` → removes a saved vehicle.

---

## Profile

### `PATCH /api/profile`  🔒 auth
Update `name, phone, city, region, bio`.

---

## Marketing

### `POST /api/newsletter`
Body `{ "email": "..." }` → subscribe (idempotent upsert). Rate-limited.

### `POST /api/contact`
Body `{ name, email, phone?, subject, message }` → stores a contact message. Rate-limited 5/min.

---

## Admin  🔒 admin only

### `GET /api/admin/duty-rates`
List configured duty-rate rows.

### `POST /api/admin/duty-rates`
Create/publish a duty-rate configuration used by the calculator.

```json
{
  "category": "SALOON_SUV_STANDARD",
  "label": "Saloon / SUV (standard)",
  "bodyTypes": ["SEDAN", "SUV"],
  "importDutyRate": 20, "vatRate": 15, "nhilRate": 2.5, "getfundRate": 2.5,
  "covidLevyRate": 1, "ecowasLevyRate": 0.5, "examinationFee": 1, "networkCharge": 0.4
}
```

---

## Error format

Errors return an appropriate HTTP status with:

```json
{ "error": "Human-readable message" }
```

Common statuses: `400` invalid input · `401` unauthenticated · `403` forbidden · `409` conflict ·
`429` rate-limited · `500` server error.
