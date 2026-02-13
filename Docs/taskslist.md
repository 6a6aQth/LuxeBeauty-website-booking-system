# Lauryn Luxe Beauty Studio — Phase-Based Refactor Tasklist

> **Authority:** Derived from [SDD.md](file:///home/baron/luxebeautyy/Docs/SDD.md) (M.A.S.T.E.R. Framework)
> **Objective:** Controlled architectural enforcement — Entropy → Structure, Drift → Alignment
> **Generated:** 2026-02-13 | **Status:** Execution-Ready

---

## Legend

- **Risk:** 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low
- **Dep:** Dependencies on prior tasks (by number)
- **SDD Ref:** Traceability to SDD section that justifies the task

---

## Phase 0 — Production Hotfixes

**Objective:** Patch immediate critical production bugs identified via incident reports.

---

### 0.1 Fix Friday 3PM Slot (Timezone & Server-side Validation)

> **Risk:** 🟠 High | **Dep:** None

  0.1.1 Update `lib/time-slots.ts` to use explicit timezone-safe day detection (ensure Malawi UTC+2 is the reference).
  — **Files:** `lib/time-slots.ts`

  0.1.2 Add server-side validation to `app/api/paychangu-checkout/route.ts` that verifies the requested `timeSlot` is valid for the selected `date` using `getSlotsForDate()`.
  — **Files:** `app/api/paychangu-checkout/route.ts`

---

### 0.2 Fix Admin Pending Bookings (Default Status Filter)

> **Risk:** 🟢 Low | **Dep:** None

  0.2.1 Change default `statusFilter` state from `'successful'` to `'all'` (or `'pending'`) to ensure admin sees actionable items upon login.
  — **Files:** `app/admin/page.tsx`

---

### 0.3 Fix Price List Upload (Size Limit & Feedback)

> **Risk:** 🟢 Low | **Dep:** None

  0.3.1 Add client-side file size validation (max 4.5MB) to `handleSavePriceList` with a descriptive toast message.
  — **Files:** `app/admin/page.tsx`

---

### 0.4 Improve PayChangu Recovery flow

> **Risk:** 🟡 Medium | **Dep:** None

  0.4.1 Update `app/booking/verifying/page.tsx` to handle persistent failures: if verification still fails after max retries, show a clear "Verification Delayed" message with the user's Ticket ID and instructions to contact support.
  — **Files:** `app/booking/verifying/page.tsx`

---

### 0.5 Unify Booking Confirmation Logic

> **Risk:** 🟠 High | **Dep:** None

  0.5.1 Extract shared confirmation logic (status update, SMS, loyalty) into `lib/booking-service.ts`.
  — **Files:** `lib/booking-service.ts` [NEW]

  0.5.2 refactor `PATCH /api/bookings/[id]` and payment verification routes to use the shared service.
  — **Files:** `app/api/bookings/[id]/route.ts`, `app/api/verify-payment/route.ts`, `app/api/webhook/paychangu/route.ts`

---

### 0.6 Admin Reconciliation Tool

> **Risk:** 🟢 Low | **Dep:** 0.5

  0.6.1 Add "Re-verify with PayChangu" button to Admin dashboard for `pending` bookings.
  — **Files:** `app/admin/page.tsx`

---

## Phase 1 — Stabilization & Build Safety

**Objective:** Eliminate build-time suppression of errors and establish a verifiable baseline. No refactor can be trusted if the compiler is muzzled.

---

### 1.0 Re-enable Build Checks

> **SDD Ref:** TD-07, NFR-07 | **Risk:** 🟠 High | **Dep:** None

  1.1 In `next.config.mjs`, set `eslint.ignoreDuringBuilds` to `false` and `typescript.ignoreBuildErrors` to `false`.
  — **Files:** `next.config.mjs`

  1.2 Run `pnpm build` and capture the full error/warning output.
  — **Files:** Terminal output

  1.3 Fix all TypeScript compilation errors surfaced by 1.2. Do NOT suppress with `@ts-ignore`. Each error must be resolved structurally (correct types, add missing interfaces, fix unreachable code, remove unused imports).
  — **Files:** All files with TS errors (expect: `app/admin/page.tsx`, `components/booking-form.tsx`, API routes)

  1.4 Fix all ESLint errors surfaced by 1.2. Address rule violations; do not disable rules globally unless the rule is provably inapplicable.
  — **Files:** All files with ESLint violations

  1.5 Confirm a clean `pnpm build` with zero errors and zero suppressions. This is the **gate** for all subsequent phases.
  — **Files:** `next.config.mjs` (verification only)

---

### 2.0 Resolve Business Logic Inconsistency: Business Hours

> **SDD Ref:** Appendix §7.4 (Business Hours vs Code) | **Risk:** 🟡 Medium | **Dep:** None

  2.1 Confirm with stakeholder which hours are authoritative: the homepage display (`10 AM–6 PM Mon-Fri`) or the booking code (`8:30 AM–4:30 PM Mon-Thu, 8:30 AM–3:00 PM Fri`). Document the decision.
  — **Files:** None (stakeholder decision)

  2.2 Update the **non-authoritative source** (either `app/page.tsx` Booking Information section or `lib/time-slots.ts` + `components/booking-form.tsx` sidebar) to match the confirmed hours.
  — **Files:** `app/page.tsx` OR (`lib/time-slots.ts` + `components/booking-form.tsx`)

  2.3 Verify that the booking calendar, time slot dropdown, and homepage all display consistent hours.
  — **Files:** Manual / browser verification

---

## Phase 2 — Security Hardening

**Objective:** Remove all plaintext credential exposure, enforce authentication boundaries, and close publicly accessible admin-level APIs. This phase addresses the two 🔴 Critical findings.

---

### 3.0 Remove Hardcoded Admin Password from Client Bundle

> **SDD Ref:** TD-04, NFR-01, FM-07 | **Risk:** 🔴 Critical | **Dep:** 1.0

  3.1 Delete the hardcoded `const ADMIN_PASSWORD = 'luxe'` at line 54 of `app/admin/page.tsx`.
  — **Files:** `app/admin/page.tsx`

  3.2 Create a server-side admin authentication API route `app/api/admin/login/route.ts` that:
  - Accepts `POST` with `{ password }` body
  - Validates against `process.env.ADMIN_PASSWORD`
  - Returns an HTTP-only, secure, SameSite cookie (e.g. `llb_admin_session`) with a signed JWT or opaque token
  - Returns `401` on mismatch
  — **Files:** `app/api/admin/login/route.ts` [NEW]

  3.3 Create a server-side admin logout route `app/api/admin/logout/route.ts` that clears the session cookie.
  — **Files:** `app/api/admin/logout/route.ts` [NEW]

  3.4 Refactor `app/admin/page.tsx` login flow to call `POST /api/admin/login` instead of comparing password locally. Remove all `sessionStorage` auth persistence (`llb_admin_auth`). Auth state should be derived from the presence of the HTTP-only cookie (verified server-side).
  — **Files:** `app/admin/page.tsx`

  3.5 Verify: clear cookies, access `/admin` — should show login. Enter wrong password — should reject. Enter correct password — should authenticate. Refresh page — session should persist via cookie without re-login.
  — **Files:** Browser verification

---

### 4.0 Add API Route Authorization Middleware

> **SDD Ref:** NFR-02, MG-04, MG-05 | **Risk:** 🔴 Critical | **Dep:** 3.0

  4.1 Create `middleware.ts` at the project root (Next.js middleware) that:
  - Intercepts all requests matching `/api/admin/*`
  - Validates the session cookie set in 3.2
  - Returns `401 Unauthorized` if cookie is missing or invalid
  - Passes through if valid
  — **Files:** `middleware.ts` [NEW]

  4.2 Refactor `app/api/admin/verify-payment/route.ts` to remove the inline `ADMIN_PASSWORD` check (lines that compare `req.body.password` to `process.env.ADMIN_PASSWORD`). Auth is now handled by middleware.
  — **Files:** `app/api/admin/verify-payment/route.ts`

  4.3 Verify: unauthenticated `curl` to `/api/admin/verify-payment` should return `401`. Authenticated request (with valid cookie) should proceed normally.
  — **Files:** Terminal / browser verification

---

## Phase 3 — Business Logic Layer Extraction

**Objective:** Eliminate logic duplication by extracting shared business rules into a dedicated service layer (`lib/`). API routes become thin controllers that delegate to service functions.

---

### 5.0 Extract Loyalty Discount Logic

> **SDD Ref:** TD-02, FR-03, §5.2.2 | **Risk:** 🟠 High | **Dep:** 1.0

  5.1 Create `lib/loyalty.ts` with function `calculateLoyaltyEligibility(phone: string): Promise<{ eligible: boolean; bookingCount: number }>` that:
  - Queries `Booking` table for successful bookings matching the phone number
  - Returns `eligible: true` if `(count + 1) % 6 === 0`
  - This consolidates the duplicated logic currently in two places
  — **Files:** `lib/loyalty.ts` [NEW]

  5.2 Refactor `app/api/verify-payment/route.ts` (lines 138–181) to replace inline loyalty calculation with a call to `calculateLoyaltyEligibility()`.
  — **Files:** `app/api/verify-payment/route.ts`

  5.3 Refactor `app/api/webhook/paychangu/route.ts` (lines 111–155) to replace inline loyalty calculation with a call to `calculateLoyaltyEligibility()`.
  — **Files:** `app/api/webhook/paychangu/route.ts`

  5.4 Verify: create a test scenario where the 6th booking triggers a discount. Confirm both the verify-payment path and the webhook path produce identical loyalty results.
  — **Files:** Manual / API testing

---

### 6.0 Extract Booking Confirmation Service

> **SDD Ref:** TD-02, TD-08, §5.2.2 | **Risk:** 🟠 High | **Dep:** 5.0

  6.1 Create `lib/booking-service.ts` with function `confirmBooking(bookingId: string, txRef: string): Promise<Booking>` that:
  - Updates booking status from `pending` to `successful`
  - Calls `calculateLoyaltyEligibility()` and applies discount if eligible
  - Sends SMS confirmation via `sendBookingSMS()`
  - Logs payment event via `logPaymentEvent()`
  - Returns the updated booking
  - Handles the idempotency check (if already `successful`, skip)
  — **Files:** `lib/booking-service.ts` [NEW]

  6.2 Refactor `app/api/verify-payment/route.ts` to call `confirmBooking()` instead of inlining all confirmation logic.
  — **Files:** `app/api/verify-payment/route.ts`

  6.3 Refactor `app/api/webhook/paychangu/route.ts` to call `confirmBooking()` instead of inlining all confirmation logic.
  — **Files:** `app/api/webhook/paychangu/route.ts`

  6.4 Verify: complete a full booking flow (checkout → PayChangu → verify). Confirm SMS is sent, booking is marked successful, payment event is logged. Then simulate a webhook for the same tx_ref — confirm idempotency (no duplicate SMS, no status re-flip).
  — **Files:** Manual / E2E testing

---

### 7.0 Complete Callback Route Stub

> **SDD Ref:** §5.1 Priority Matrix ("Complete callback route stub") | **Risk:** 🟡 Medium | **Dep:** 6.0

  7.1 Determine whether `app/api/callback/route.ts` is required by the PayChangu integration or is redundant given the webhook + verify-payment paths. If redundant, add a clarifying comment and a proper redirect or 410 Gone response. If required, implement transaction verification by calling `confirmBooking()`.
  — **Files:** `app/api/callback/route.ts`

  7.2 Remove the `// TODO` comment and replace with either a proper implementation or an explicit deprecation notice.
  — **Files:** `app/api/callback/route.ts`

---

## Phase 4 — Data Model Normalization

**Objective:** Enforce referential integrity at the database level. Replace string-based linking with proper foreign keys, add missing unique constraints, and run data migrations.

---

### 8.0 Add Service → Category Foreign Key Relation

> **SDD Ref:** TD-03, NFR-03, §5.3.1 | **Risk:** 🟡 Medium | **Dep:** 1.0

  8.1 Update `prisma/schema.prisma` to replace `category String` on the `Service` model with `categoryId String` + `category Category @relation(fields: [categoryId], references: [id])`. Add `services Service[]` to the `Category` model.
  — **Files:** `prisma/schema.prisma`

  8.2 Write a Prisma migration script (`prisma/migrations/...`) that:
  - Adds the `categoryId` column (initially nullable)
  - Queries all existing services and matches their `category` string to the corresponding `Category.name` to populate `categoryId`
  - Sets `categoryId` to NOT NULL after population
  - Drops the old `category` string column
  — **Files:** `prisma/migrations/` [NEW], or a seed/migration script

  8.3 Run `npx prisma migrate dev` and verify the migration completes without data loss.
  — **Files:** Terminal

  8.4 Update `app/api/services/route.ts` (GET, POST, PUT) to use `categoryId` instead of `category` string. Include `category` relation in queries where the category name is needed.
  — **Files:** `app/api/services/route.ts`

  8.5 Update `app/api/services/[id]/route.ts` (GET, PUT, DELETE) for the `categoryId` field.
  — **Files:** `app/api/services/[id]/route.ts`

  8.6 Update `app/api/categories/[id]/route.ts` DELETE handler: category deletion protection now uses the Prisma relation (`_count.services > 0`) instead of the manual string-match query.
  — **Files:** `app/api/categories/[id]/route.ts`

  8.7 Update all frontend components that read `service.category` (string) to read `service.category.name` or `service.categoryId`:
  - `components/booking-form.tsx` (category filtering logic)
  - `app/services/page.tsx` (service grouping logic)
  - `app/admin/page.tsx` (service management, category filter)
  — **Files:** `components/booking-form.tsx`, `app/services/page.tsx`, `app/admin/page.tsx`

  8.8 Update `types/types.ts` `Service` interface to reflect the new schema.
  — **Files:** `types/types.ts`

  8.9 Verify: create a new service via admin, assign it to a category. Confirm service appears in the correct category on the `/services` page and in the booking form. Delete the category — confirm it is blocked because services reference it.
  — **Files:** Browser verification

---

### 9.0 Add Booking Slot Uniqueness Constraint

> **SDD Ref:** FM-08, MG-02 | **Risk:** 🟡 Medium | **Dep:** 1.0

  9.1 Add a `@@unique([date, timeSlot, status])` constraint to the `Booking` model in `prisma/schema.prisma`, scoped to `status = 'successful'` bookings. If Prisma does not support conditional unique constraints, use a partial unique index via raw SQL in the migration.
  — **Files:** `prisma/schema.prisma` or migration SQL

  9.2 Run `npx prisma migrate dev` and verify no conflicts with existing data.
  — **Files:** Terminal

  9.3 Update `app/api/paychangu-checkout/route.ts` to wrap booking creation in a Prisma transaction that checks for existing successful bookings at the same `(date, timeSlot)` before inserting, returning a `409 Conflict` if a race condition is detected.
  — **Files:** `app/api/paychangu-checkout/route.ts`

  9.4 Verify: attempt to book the same slot twice in rapid succession. Confirm the second attempt is rejected with a conflict error (not a duplicate booking).
  — **Files:** Manual testing

---

## Phase 5 — State Management Correction

**Objective:** Eliminate fragile `sessionStorage` dependencies for critical state transfer. Replace with server-derived state where data already exists in the database.

---

### 10.0 Remove sessionStorage Dependency from Verification Flow

> **SDD Ref:** TD-06, FM-05 | **Risk:** 🟡 Medium | **Dep:** 6.0

  10.1 Refactor `app/booking/verifying/page.tsx` to retrieve form data from the database using the `tx_ref` (which is stored on the `Booking` record created during checkout) instead of reading from `sessionStorage('lauryn-luxe-booking-form')`.
  — **Files:** `app/booking/verifying/page.tsx`

  10.2 Update `app/api/verify-payment/route.ts` to no longer require `formData` in the request body. The booking details should come from the existing `Booking` record looked up by `tx_ref`.
  — **Files:** `app/api/verify-payment/route.ts`

  10.3 Refactor `app/booking/confirmation/page.tsx` to retrieve booking details directly from the API using `ticketId` from the URL query parameter (passed from the verify page via redirect) instead of `sessionStorage('lauryn-luxe-booking')`.
  — **Files:** `app/booking/confirmation/page.tsx`

  10.4 Remove `sessionStorage.setItem('lauryn-luxe-booking-form', ...)` from `app/booking/page.tsx` `handlePayment()` function. Remove `sessionStorage.setItem('lauryn-luxe-booking', ...)` from `app/booking/verifying/page.tsx`.
  — **Files:** `app/booking/page.tsx`, `app/booking/verifying/page.tsx`

  10.5 Verify: complete a full booking flow. Close the browser tab after PayChangu payment but before verification completes. Re-open the verification URL — confirm the booking is still recoverable from the database.
  — **Files:** Browser verification

---

### 11.0 Make Deposit Amount Configurable

> **SDD Ref:** TD-05, §5.3.3 | **Risk:** 🟢 Low | **Dep:** 1.0

  11.1 Seed a `SiteSettings` record with `key: 'deposit_amount'` and `value: '10000'` in the database.
  — **Files:** `prisma/seed.ts` or migration

  11.2 Create `lib/settings.ts` with function `getDepositAmount(): Promise<number>` that reads `deposit_amount` from `SiteSettings`, defaulting to `10000` if not found.
  — **Files:** `lib/settings.ts` [NEW]

  11.3 Replace all hardcoded `10000` references in `app/api/paychangu-checkout/route.ts` and `app/api/verify-payment/route.ts` with calls to `getDepositAmount()`.
  — **Files:** `app/api/paychangu-checkout/route.ts`, `app/api/verify-payment/route.ts`

  11.4 Update the booking form UI (`components/booking-form.tsx` line 250: `"A K10,000 non-refundable deposit is required."`) to dynamically display the deposit amount fetched from the API.
  — **Files:** `components/booking-form.tsx`

  11.5 Optionally add a deposit amount editor in the admin dashboard.
  — **Files:** `app/admin/page.tsx` (or future `PriceListPanel.tsx`)

---

## Phase 6 — Component Decomposition & Maintainability

**Objective:** Break the monolithic admin page into modular, independently maintainable components. Reduce the blast radius of changes and enable per-panel code splitting.

---

### 12.0 Decompose Admin Dashboard

> **SDD Ref:** TD-10, B-03, §5.4.1 | **Risk:** 🟡 Medium | **Dep:** 3.0, 4.0, 8.0

  12.1 Create directory `app/admin/components/` and `app/admin/hooks/`.
  — **Files:** Directories [NEW]

  12.2 Extract shared admin data fetching into `app/admin/hooks/useAdminData.ts`. This hook should:
  - Fetch bookings, services, categories, unavailable dates, and price list
  - Expose loading states and refetch functions
  - Accept `statusFilter` as a parameter for bookings
  — **Files:** `app/admin/hooks/useAdminData.ts` [NEW]

  12.3 Extract the Bookings management UI (booking list, search, status filter, edit/delete dialogs, mark-as-successful) from `app/admin/page.tsx` into `app/admin/components/BookingsPanel.tsx`.
  — **Files:** `app/admin/components/BookingsPanel.tsx` [NEW], `app/admin/page.tsx`

  12.4 Extract the Services management UI (service list, category filter, CRUD modal, availability toggle, delete confirmation) into `app/admin/components/ServicesPanel.tsx`.
  — **Files:** `app/admin/components/ServicesPanel.tsx` [NEW], `app/admin/page.tsx`

  12.5 Extract the Categories management UI (category list, CRUD modal, delete confirmation with protection check) into `app/admin/components/CategoriesPanel.tsx`.
  — **Files:** `app/admin/components/CategoriesPanel.tsx` [NEW], `app/admin/page.tsx`

  12.6 Extract the Availability management UI (calendar, date selection, slot checkbox modal, save availability) into `app/admin/components/AvailabilityPanel.tsx`.
  — **Files:** `app/admin/components/AvailabilityPanel.tsx` [NEW], `app/admin/page.tsx`

  12.7 Extract the Newsletter management UI (newsletter compose form, subscriber list) into `app/admin/components/NewsletterPanel.tsx`.
  — **Files:** `app/admin/components/NewsletterPanel.tsx` [NEW], `app/admin/page.tsx`

  12.8 Extract the Price List management UI (URL display, file upload, save) into `app/admin/components/PriceListPanel.tsx`.
  — **Files:** `app/admin/components/PriceListPanel.tsx` [NEW], `app/admin/page.tsx`

  12.9 Refactor `app/admin/page.tsx` to be a shell component that:
  - Handles authentication state (from Phase 2)
  - Renders the tab/navigation structure
  - Lazy-loads each panel component
  - Should be < 200 lines
  — **Files:** `app/admin/page.tsx`

  12.10 Verify: every admin function (booking management, service CRUD, category CRUD, availability, newsletter, price list) works identically to before decomposition. No functional regression.
  — **Files:** Browser verification

---

## Phase 7 — Performance & Scalability Optimization

**Objective:** Reduce server load from unnecessary polling, add pagination to unbounded queries, and add resilience to database connections.

---

### 13.0 Reduce SWR Polling Frequency

> **SDD Ref:** B-01, TD-09, NFR-05, §5.3.2 | **Risk:** 🟡 Medium | **Dep:** 1.0

  13.1 In `components/booking-form.tsx`, change `/api/services` SWR `refreshInterval` from `1000` to `0` (revalidate on focus only). Services rarely change during a user's session.
  — **Files:** `components/booking-form.tsx`

  13.2 In `app/booking/page.tsx`, change `/api/unavailable-dates` SWR `refreshInterval` from `1000` to `30000` (30 seconds).
  — **Files:** `app/booking/page.tsx`

  13.3 In `app/booking/page.tsx`, change `/api/bookings?status=successful` SWR `refreshInterval` from `1000` to `30000` (30 seconds).
  — **Files:** `app/booking/page.tsx`

  13.4 In `app/services/page.tsx`, change `/api/services` SWR `refreshInterval` from `2000` to `0`.
  — **Files:** `app/services/page.tsx`

  13.5 Verify: booking form still reflects correct availability (test by blocking a slot in admin, then checking the booking page after 30 seconds). Confirm no 1-second polling visible in browser DevTools Network tab.
  — **Files:** Browser verification

---

### 14.0 Add Pagination to Booking Queries

> **SDD Ref:** B-02, §5.4.2 | **Risk:** 🟡 Medium | **Dep:** 12.0

  14.1 Update `app/api/bookings/route.ts` GET handler to accept `take`, `skip`, and optional `cursor` query parameters. Default `take` to 50. Return a response shape of `{ data: Booking[], total: number, hasMore: boolean }`.
  — **Files:** `app/api/bookings/route.ts`

  14.2 Update the admin `BookingsPanel.tsx` (post-decomposition) to implement paginated loading — fetch pages on scroll or via explicit "Load More" / page navigation.
  — **Files:** `app/admin/components/BookingsPanel.tsx`

  14.3 For the booking page's slot availability calculation, create a dedicated API endpoint `app/api/bookings/slots/route.ts` that returns only `{ date, timeSlot }` pairs for successful bookings, instead of fetching full booking records. This is more efficient than fetching all bookings and filtering client-side.
  — **Files:** `app/api/bookings/slots/route.ts` [NEW], `app/booking/page.tsx`

  14.4 Verify: admin dashboard loads the first page of bookings quickly. Scrolling/paging loads subsequent pages. Booking form still correctly calculates available slots.
  — **Files:** Browser verification

---

### 15.0 Add Database Connection Resilience

> **SDD Ref:** FM-04, §6.2 | **Risk:** 🟢 Low | **Dep:** 1.0

  15.1 Update `lib/prisma.ts` to configure Neon connection pooling. If using Neon's serverless driver, add `?pgbouncer=true&connect_timeout=15` to the connection string or configure via Prisma's `datasourceUrl` override.
  — **Files:** `lib/prisma.ts`, `.env` (connection string)

  15.2 Add Prisma client extensions or middleware for automatic retry on transient database connection errors (e.g., `P1001`, `P1002` error codes). Limit to 2 retries with exponential backoff.
  — **Files:** `lib/prisma.ts`

  15.3 Verify: application recovers gracefully from a simulated database timeout (e.g., by briefly revoking DB access and restoring it).
  — **Files:** Manual testing

---

### 16.0 Add Input Validation Middleware

> **SDD Ref:** MG-05 | **Risk:** 🟢 Low | **Dep:** 1.0

  16.1 Install `zod` if not already present. Create shared validation schemas in `lib/validators/` for the primary API payloads:
  - `bookingSchema` (name, phone, email, date, timeSlot, services array)
  - `serviceSchema` (name, duration, categoryId)
  - `categorySchema` (name, description?)
  - `rescheduleSchema` (ticketId, newDate, newTimeSlot)
  — **Files:** `lib/validators/` [NEW]

  16.2 Apply Zod validation at the top of each corresponding API route handler, replacing ad-hoc `if (!field)` checks. Return structured `422 Unprocessable Entity` responses with field-level error messages.
  — **Files:** All API route files that accept POST/PUT/PATCH bodies

  16.3 Verify: send malformed payloads (empty body, missing fields, wrong types) to each API endpoint. Confirm 422 responses with clear error messages.
  — **Files:** Terminal / API testing

---

## Dependency Graph

```
Phase 1 (1.0, 2.0) ─────────────────────────────────────────────────┐
    │                                                                │
    ├─► Phase 2 (3.0 → 4.0) ──► Phase 3 (5.0 → 6.0 → 7.0)         │
    │                                                                │
    ├─► Phase 4 (8.0, 9.0) ─────────────────────────┐               │
    │                                                ▼               │
    │                             Phase 6 (12.0) ──► Phase 7 (14.0) │
    │                                                                │
    ├─► Phase 5 (10.0, 11.0)                                        │
    │                                                                │
    └─► Phase 7 (13.0, 15.0, 16.0) ◄───────────────────────────────┘
```

**Critical Path:** 1.0 → 3.0 → 4.0 → 5.0 → 6.0 → 10.0

**Parallelizable:**
- Phase 4 (8.0, 9.0) can run in parallel with Phase 2 + 3
- Tasks 11.0, 13.0, 15.0, 16.0 have no cross-dependencies and can execute in any order after Phase 1

---

## Summary

| Phase | Tasks | Risk Profile | Estimated Effort |
|-------|-------|-------------|-----------------|
| 1 — Stabilization & Build Safety | 1.0, 2.0 | 🟠 High | 0.5–1 day |
| 2 — Security Hardening | 3.0, 4.0 | 🔴 Critical | 1–2 days |
| 3 — Business Logic Extraction | 5.0, 6.0, 7.0 | 🟠 High | 1–2 days |
| 4 — Data Model Normalization | 8.0, 9.0 | 🟡 Medium | 1–2 days |
| 5 — State Management Correction | 10.0, 11.0 | 🟡 Medium | 1 day |
| 6 — Component Decomposition | 12.0 | 🟡 Medium | 2–3 days |
| 7 — Performance & Scalability | 13.0, 14.0, 15.0, 16.0 | 🟡/🟢 Medium-Low | 2–3 days |
| **Total** | **16 parent tasks, 74 subtasks** | | **~8–14 days** |

> This tasklist defines the full remaining refactor scope for the system, derived strictly from the SDD and the current codebase. No features are added. No architecture is invented. Every task is traceable to an SDD finding.
