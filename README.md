# 🌸 PetalPure: Cosmetics & Beauty E-Commerce Store

A responsive full-stack online store for a cosmetics retailer (creams, shampoos, lotions, skincare), with a customer storefront and an admin panel.

- **Live app:** https://petalpure.vercel.app
- **Repository:** https://github.com/Dunith-Code/petalpure
- **Admin panel:** https://petalpure.vercel.app/admin (credentials supplied separately with the submission)

## 🧩 Features

**🛍️ Storefront**
- Product browsing with search, category filter, sorting and pagination
- Product pages with size/variant selection, stock status and an image gallery
- Persistent cart that is re-validated against the server (prices, stock, availability)
- Customer accounts and order history

**💳 Checkout (two options)**
1. **PayHere Sandbox:** signed payment request with a server-verified callback.
2. **Order via WhatsApp:** the order is saved first, then a readable message with the full cart and delivery details is sent to the business WhatsApp number.

**🗂️ Admin panel**
- Dashboard with orders today, pending orders, paid revenue and low-stock count
- Category management
- Product management with variants (size, SKU, price, stock) and image upload
- Inventory view with inline stock updates and low-stock highlighting
- Order management: filters, search, detail view, status workflow, payment status

## 🧰 Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, soft pastel theme, mobile-first |
| Database | PostgreSQL (Neon in production, local in development) |
| ORM | Prisma 6 |
| Authentication | Argon2 password hashing, JWT (jose) in an httpOnly cookie |
| Validation | Zod |
| Images | Cloudinary (signed uploads) |
| Payments | PayHere Sandbox |
| Client state | Zustand (cart, persisted in localStorage) |
| Testing and CI | Vitest, GitHub Actions |
| Hosting | Vercel |

## 🏗️ Architecture

![Architecture](docs/diagrams/architecture.png)

A single Next.js application serves the storefront, the admin panel and the REST API routes. Prisma connects to PostgreSQL. PayHere calls back into the API, and the browser uploads product images directly to Cloudinary using a short-lived signature that only admins can request.

```
src/
  app/
    (store)/        storefront pages (home, products, cart, checkout, orders, account)
    (auth)/         login and register
    admin/          admin panel pages
    api/            REST routes (auth, checkout, cart, payhere, admin, cron)
  components/       UI (store, admin, auth)
  lib/              auth, db, validators, checkout, payhere, whatsapp, rate limiting
  store/            cart store
prisma/             schema, migrations, seed scripts
tests/              unit tests for payment, WhatsApp and order-state logic
docs/diagrams/      architecture and design diagrams
```

## 🗄️ Database design

![ER diagram](docs/diagrams/er-diagram.png)

Key decisions:
- **Variants hold price and stock**, so one product can have 50ml and 100ml at different prices.
- **Order items snapshot** product name, variant label and unit price, so later edits never alter past orders.
- **Money is stored as `Decimal(10,2)`**, never floating point.
- **`PaymentLog`** keeps every PayHere callback payload for auditing.
- **Orders can be linked to a user or placed as a guest** (`userId` is nullable).

## 🔄 Order lifecycle

![Order states](docs/diagrams/order-states.png)

`PENDING → PROCESSING → SHIPPED → DELIVERED`, with `CANCELLED` allowed from `PENDING` or `PROCESSING`. Transitions are enforced on the server and applied with a guarded write, so two admins cannot conflict. Payment status (`PENDING`, `PAID`, `FAILED`) is tracked separately.

**Stock** is reserved when an order is created and restored when it is cancelled, in the same database transaction as the status change.

## 💳 Payment flow (PayHere)

![PayHere flow](docs/diagrams/payhere-sequence.png)

1. Checkout creates the order on the server. All prices are recomputed from the database and stock is reserved atomically (`UPDATE ... WHERE stock >= qty`).
2. The server signs the payment request: `MD5(merchant_id + order_id + amount + currency + MD5(secret))`. The secret never reaches the browser.
3. PayHere calls `/api/payhere/notify`. The server verifies the **signature, merchant ID, currency and amount** against its own stored order, then marks the order as paid **idempotently** and logs the payload.
4. The return page only displays the status. It never marks an order as paid.
5. A scheduled job cancels unpaid PayHere orders after one hour and returns their stock.

## 💬 WhatsApp order flow

The order is saved, with stock reserved, before WhatsApp opens. The confirmation page shows a **Send order on WhatsApp** button that opens `wa.me/<number>` with a message built **on the server from stored order data**. Items are grouped per product, for example:

```
🌸 New PetalPure order PP-K7M2XQ

- Rose Hydrating Face Cream — 50ml × 2, 100ml × 1
- Argan Repair Shampoo — 250ml × 1

Subtotal: Rs. 15,100
Delivery: Rs. 350
Total: Rs. 15,450

Name: ...
Phone: ...
Address: ...
```

The admin then confirms the order in the chat and marks payment as received.

## 🔐 Security approach

- **Passwords:** Argon2 hashes. Roles are assigned on the server only, so registration always creates a `CUSTOMER`.
- **Sessions:** JWT in an `httpOnly`, `SameSite=Lax`, `Secure` (in production) cookie.
- **Admin protection in two layers:** `proxy.ts` blocks `/admin` and `/api/admin` for non-admins, and every admin handler calls `requireAdmin()`, which re-checks the role in the database.
- **CSRF defence in depth:** on top of `SameSite=Lax`, state-changing API requests from another origin are rejected.
- **The server never trusts the client:** the cart sends only variant IDs and quantities, and prices, totals and stock are recomputed server-side.
- **Validation:** Zod on every API input. Prisma uses parameterised queries, and React escapes rendered output.
- **Login hardening:** generic error message, equalised timing, and rate limiting on auth, cart, checkout and payment endpoints.
- **Payments:** signed requests, verified callbacks, amount and currency cross-checks, idempotent updates, payload logging.
- **Secrets:** environment variables only. `.env` is git-ignored and `.env.example` documents every variable. Secrets never use the `NEXT_PUBLIC_` prefix.
- **Uploads:** admin-only signed Cloudinary uploads with type and size checks.
- **Headers:** `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`.
- **Errors:** user-facing error pages never expose internals. Details go to server logs.

## 🚀 Local setup

Requirements: Node.js 20+, PostgreSQL, a free Cloudinary account.

```bash
git clone https://github.com/Dunith-Code/petalpure.git
cd petalpure
npm install
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
# fill in the values in .env
npx prisma migrate deploy
npx prisma db seed          # creates the admin, categories and sample products
npm run dev
```

Open http://localhost:3000. Optional sample orders: `npx tsx prisma/seed-orders.ts`.

To change the admin password on any database, set `DATABASE_URL`, `ADMIN_EMAIL` and `ADMIN_PASSWORD` for the session and run `npx tsx prisma/set-admin-password.ts`.

### 🔑 Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Random secret (32+ characters) for session tokens |
| `APP_URL` | Public site URL, used to build PayHere return and notify URLs |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Image uploads |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Business number, country code without `+` |
| `PAYHERE_MERCHANT_ID`, `PAYHERE_MERCHANT_SECRET`, `PAYHERE_SANDBOX` | PayHere credentials (`true` for sandbox) |
| `CRON_SECRET` | Protects the expiry job endpoint |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | Used only by the seed script |

## 🧪 How to test the app

- **Storefront:** browse, search and filter, open a product, choose a variant, add to the cart, review the cart.
- **PayHere (sandbox):** choose *Pay online with PayHere* at checkout and pay with a PayHere sandbox test card (any future expiry and CVV). The order page changes to *Payment received*, and the order shows as Paid in the admin. Cancelling on PayHere's page shows *Try payment again*.
- **WhatsApp:** choose *Order via WhatsApp*, place the order, then use *Send order on WhatsApp*.
- **Admin:** sign in at `/admin` with the supplied credentials, then manage categories, products and images, adjust inventory, and move orders through their statuses.

## ✅ Code quality

```bash
npm run lint        # ESLint
npm run typecheck   # TypeScript, no emit
npm test            # Vitest unit tests (payment hashing, WhatsApp message, order states)
```

GitHub Actions runs all three on every push and pull request. Commits follow the conventional style (`feat:`, `fix:`, `docs:`, `chore:`).

## ☁️ Deployment

Deployed on Vercel with Neon PostgreSQL (function region next to the database). `postinstall` runs `prisma generate`. Migrations are applied with `prisma migrate deploy`. `vercel.json` schedules the unpaid-order expiry job.

## ⚠️ Assumptions and limitations

- **PayHere registration:** the sandbox does not accept `*.vercel.app` as a Domain, so the site is registered as an **App** to obtain a merchant secret. This applies to the sandbox only. A production setup would register a real top-level domain.
- **WhatsApp orders:** payment is arranged in the chat (bank transfer or cash on delivery), and the admin marks it as paid manually.
- **Guest checkout** is allowed. The order confirmation page is reachable through an unguessable order ID.
- **Delivery** is a flat fee (Rs. 350). There are no shipping zones, taxes or discount codes.
- **Rate limiting is in-memory**, so it resets on cold starts and is not shared across serverless instances. Production should use Redis or Upstash.
- **No Content-Security-Policy yet.** It needs careful tuning for the PayHere form post and Cloudinary.
- **Price sorting happens in memory**, which suits a small catalogue. A larger one would store a minimum-price column.
- **The expiry job runs once a day** on Vercel's free plan. A payment that arrives after an order expired is flagged on the order page for manual handling.
- **Sessions are stateless JWTs** (7 days). Logging out clears the cookie, but there is no server-side revocation list. Admin access is re-checked against the database on every request.
- **Not included:** email notifications, refunds, password reset and end-to-end tests. Unit tests cover the pure business logic only.
- Neon's free tier sleeps when idle, so the first request after a quiet period can be slow.