# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Bento & Friends is a school lunch ordering web app: a Vite + React 18 + TypeScript SPA
backed by Firebase (Firestore, Auth, Storage) and Firebase Cloud Functions. Parents create
children, order meals per delivery date, and pay via Stripe Checkout. Admins manage the menu,
schools, coupons, run sheets, and manual orders.

This is a **two-package repo**: the frontend at the root, and Cloud Functions under `functions/`
(each has its own `package.json`, `tsconfig`, and `node_modules`).

## Commands

Frontend (run from repo root):
- `npm run dev` — Vite dev server. Connects to the Functions emulator on `localhost:5001` when
  `NODE_ENV === 'development'` (see `src/firebase.ts`).
- `npm run build` — `tsc -b && vite build` (type-checks all tsconfig project refs, then builds to `dist/`).
- `npm run lint` — ESLint over `ts,tsx`; **`--max-warnings 0`**, so any warning fails the build.
- `npm run email-dev` — react-email preview server for templates in `emails/`.
- `npm run preview` — serve the production build locally.

Cloud Functions (run from `functions/`):
- `firebase emulators:start --only functions` — local Functions (port 5001; Firestore emulator 8081; UI 4000).
- `npm run build` — `tsc` + copies email templates into `lib/`.
- `firebase deploy --only functions` — deploy (predeploy runs lint + build).
- `firebase deploy --only hosting --project default` — build to `dist/` first, then deploy.
- `firebase functions:log` — tail function logs.

Stripe secrets are stored in Firebase Functions secrets (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
`RESEND_API_KEY`), accessed via `firebase functions:secrets:access <NAME>` and defined with
`defineSecret(...)` inside functions.

There is **no test suite** in this repo.

## Architecture

### Global state — `src/context/AppContext.tsx`
A single `useReducer`-based context (`useAppContext()`) is the app's source of truth for the current
user, cart, menu items, schools, and coupons. On mount it loads everything in one `Promise.all`.
Key behaviors to preserve when editing the reducer:
- **Cart is persisted to `localStorage`** — every cart-mutating action calls `saveCartToLocalStorage`.
  If you add a cart action, persist it too.
- **Menu items are stored twice**: per-type arrays (`mains`, `platters`, `sides`, `fruits`, `drinks`,
  `addOns`) *and* a combined `items` array. Any change to a type array must re-run `combineAllItems`
  to keep `items` in sync — the helpers `addItemToArrays` / `updateItemInArrays` do this. Dispatch
  routes by `instanceof` on the model classes, so items must be real class instances, not plain objects.
- **Order details are lazily fetched and cached** in a `Map` (`orderDetails`) via `loadOrderDetails`,
  keyed by orderId, with an in-flight `loadingOrderIds` set to dedupe.

### Data models — `src/models/`
`item.model.ts`, `order.model.ts`, `school.model.ts`, `user.model.ts` define **ES6 classes**
(`Main`, `Side`, `Meal`, `Order`, `User`, `Child`, `Coupon`, …). The `instanceof` checks above depend
on these being instances. Note the distinction between the client `Order`/`Meal` classes and the
persisted `OrderRecord`/`MealRecord`/`UserOrderSummaryRecord` **interfaces** (flattened, denormalized
shapes stored in Firestore).

### Services — `src/services/`
All Firestore/Functions access is funneled through service modules (`item-service`, `order-service`,
`user-service`, `admin-service`, `coupon-service`, `school-operations`, `run-sheet-operations`, `auth`).
Components should call services, not Firestore directly.

> **Firestore collection names:** persisted orders/meals live in `orders-test2` and `meals-test2`
> (test-suffixed names still in production use). Grep for the exact collection string before assuming.

### Ordering & payment flow
1. Client builds a cart of `Meal`s; pricing runs through `src/utils/calculate-discount.ts`.
   **Bundle discount by meal count**: ≥2 → 5%, ≥3 → 10%, ≥5 → 20%. A coupon (percentage or fixed)
   is then applied *on top of* the bundle-discounted total.
2. `createCheckout` (callable function) writes a **pending/temp order** and returns a Stripe Checkout session.
3. `stripeWebhook` (`onRequest`, exposed via a hosting rewrite at `/stripeWebhook`) confirms payment,
   writes the final order + meal records, and sends the confirmation email. `createCheckout` is likewise
   rewritten at `/createCheckout` in `firebase.json`.
   Temp/abandoned orders are cleaned up by `cleanup-temp-orders`.
- Admins can create orders without payment via `manual-order` (`payment.method: "manual"`).

### Routing & access control — `src/utils/AnimatedRoutes.tsx`
All routes are declared here (lazy-loaded, wrapped in `PageTransition` + framer-motion `AnimatePresence`).
- Admin-only routes (`/admin`, `/run-sheet`, `/manual-order`) are wrapped in `AdminRoute`
  (`src/utils/RouteGuard.tsx`), which gates on `state.user.isAdmin`.
- `MAINTENANCE_MODE` is a hardcoded boolean at the top of the file that swaps in a maintenance-only
  route set (admin routes stay reachable).
- Authorization is enforced server-side in `firestore.rules` via the `isAdmin()` helper (reads
  `users/{uid}.isAdmin`). Client-side `isAdmin` is UX only.

### Emails
Two template locations: `emails/` (react-email `.tsx`, previewed with `npm run email-dev`) and
`functions/src/emails/templates/` (what the deployed functions actually render). Sent via **Resend**
(and some legacy SendGrid). The functions `build` script copies templates into `lib/` — if an email
renders blank in production, check that copy step ran.

## Conventions
- **Path alias `@/` → `src/`** (both `import '@/...'` and relative imports appear; either works).
- UI is **Tailwind + shadcn/ui** (Radix primitives under `src/components/ui`, config in `components.json`,
  `cn()` helper in `src/utils/utils.ts`). Follow existing shadcn patterns when adding components.
- Indentation is **tabs**.
- `src/firebase.ts` and `src/firebase.js` both exist; new TS code imports from `@/firebase` (resolves to `.ts`).
- The Firebase web config in `src/firebase.ts` is committed (public client config, not a secret).
