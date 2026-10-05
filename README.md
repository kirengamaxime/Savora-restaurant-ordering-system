# Savora — Self-Service Restaurant Ordering App

A working MVP for Savora's self-service ordering system: customers order and pay from a
screen (kiosk tablet or their own phone via a table QR code), the kitchen gets a live
notification the instant payment is confirmed, and the screen resets automatically for
the next customer.

## What's included

- **Customer flow** (`frontend/src/pages`): Welcome (dine-in/takeaway) → Menu (dine-in
  first picks a table from a fixed grid of 15, `TABLE_NUMBERS` in `Menu.jsx` — a real
  restaurant has a fixed table count, so customers pick from a list instead of typing an
  arbitrary number that might not exist or have a typo) → Dish Detail (real photo +
  ingredient removal) → Cart → Checkout (styled payment method cards — MTN Mobile Money,
  Airtel Money, Debit/Credit Card, or Cash — each with a brand-colored badge, not a
  bare radio-button list) → Confirmation (with a live order-tracking QR code) →
  auto-reset back to Welcome. Every screen from Menu through Checkout also auto-resets
  after 90 seconds of no interaction (`frontend/src/hooks/useIdleReset.js`), so an
  abandoned cart doesn't sit there blocking the next customer on a shared kiosk.
- **Phone number validation** (`frontend/src/utils.js`, `isValidRwandaPhone`): MTN
  Mobile Money numbers must start with `078` or `079`, Airtel Money numbers with `072`
  or `073` — both 10 digits total, matching real Rwandan mobile number formats. Checkout
  won't let you submit MoMo/Airtel payment with a number that doesn't match, and shows a
  specific error naming the expected format. The Card option skips phone entry
  entirely, since a card charge doesn't need one.
- **Order tracking** (`http://localhost:5173/track/:token`, `frontend/src/pages/TrackOrder.jsx`):
  a public, no-login page reached from the Confirmation screen three ways — scan the QR
  code with another device, tap "Open Tracking Page" to launch it in a new tab on the
  same device (for customers ordering from their own phone, where scanning a QR code on
  their own screen isn't possible), or "Copy Link" to save or share it. Shows a
  live-updating progress tracker (Received → Preparing → Ready → Served/Picked up) — no
  manual refresh needed. Uses a random unguessable token per order (not the sequential
  order number), so a shared or bookmarked tracking link can't be used to look up
  anyone else's order.
- **Staff dashboards** — two separate roles, two separate URLs, each with its own login:
  - **`http://localhost:5173/manager`** — full visibility, but view-only on kitchen
    operations: **Orders** (the same live kanban board the kitchen uses, Received →
    Preparing → Ready → Served → **Cancelled**, pushed over WebSockets the instant a
    payment is confirmed, plus a stats bar with today's order count, revenue, and
    average prep time — but no buttons to advance an order; a "Viewing only" tag and
    plain status text instead. The one action the manager *does* have here is
    **Cancel Order**, on any order that hasn't been served yet — voiding a paid order
    is a financial call, not a kitchen one, so it sits with the role that owns
    revenue, requires a reason, and is excluded from all revenue/analytics figures),
    **Tables** (every dine-in table with something happening — active orders and a
    "Needs Help" badge, unified into one per-table view), **Menu** (add, edit, delete
    dishes, upload real photos, toggle sold-out), **Analytics** (see below), and
    **Staff** (add or remove manager/kitchen accounts — see "Staff authentication &
    roles" below).
  - **`http://localhost:5173/kitchen`** — the one role that actually runs the kitchen:
    the same **Orders** board, but interactive — "Start Preparing," "Mark Ready," and
    "Serve/Picked up" buttons live here and nowhere else, enforced server-side (a
    manager token gets a 403 trying to advance an order, even by calling the API
    directly). Also has **Tables**, with the stats bar showing order count and average
    prep time *without* the revenue figure — kitchen accounts can't see money anywhere,
    same server-side enforcement (see "Staff authentication & roles" below). No Menu or
    Analytics tab.
  Both dashboards share live **Call for Help** alerts (see below) and a shared
  `frontend/src/pages/admin/StaffDashboard.jsx` component — `ManagerHome.jsx` and
  `KitchenHome.jsx` are thin wrappers that just pick which role's rules apply.
  Old links to `/admin`, `/admin/login`, `/admin/dashboard`, and `/admin/menu` still
  work — they redirect to `/manager`.
- **Sales analytics** (Manager dashboard → Analytics tab, `backend/analyticsStore.js`):
  all-time revenue/orders/average order value, a 14-day revenue trend, top-selling
  dishes by quantity and revenue, and a breakdown by payment method (MoMo/Airtel/Card/Cash).
  Computed from the same order data everything else uses — no separate tracking
  needed. Cancelled orders are excluded from every figure here (a voided order isn't
  real business), with a separate cancelled-order count shown instead.
- **Call for Help** (the bell button in the customer nav bar, `frontend/src/components/Navbar.jsx`):
  lets a customer notify staff at any point while browsing the menu, viewing a dish, or
  checking out — no need to physically flag someone down. It sends the table number (or
  "Takeaway customer" if there's no table) straight to both staff dashboards over
  WebSockets, with a sound alert and a pulsing banner staff can dismiss once they've
  helped — visible no matter which tab they're currently on. There's a 30-second
  cooldown after sending to prevent accidental repeat taps.
- **Order history** (`frontend/src/pages/Orders.jsx`): remembers order IDs placed from
  the current device (in `localStorage`) and shows their live status — no login needed.
  Cleared automatically when the kiosk resets for the next customer. Each past order has
  an **"Order Again"** button that re-adds those same items (with their customizations)
  straight into the current cart.
- **Backend** (`backend/`): Express API + Socket.io, backed by MongoDB via Mongoose — see below.

## Database

All data (menu, orders, help requests, staff accounts) lives in **MongoDB**, accessed
through Mongoose (`backend/models.js` has the schemas, `backend/db.js` the connection).
MongoDB runs as its own service, so your data survives redeploys and restarts of the
backend — which is what you need before hosting (hosts like Render/Railway/Fly wipe the
app's local disk, so the old single-file SQLite database would have been lost).

On first start the backend seeds the menu and the order-number
counter (orders start at #201). It never re-seeds a database that already has data.

Design notes:
- Dishes, categories and staff keep readable string ids (`d-sambusa`, `starters`), so the
  REST API returns exactly what the frontend always got — the frontend needed no changes.
- MongoDB has no auto-increment, so order numbers (#201, #202, …) come from an atomic
  counter document (`Counter` collection).
- Order items are embedded in the order document; analytics are computed from the paid,
  non-cancelled orders.

**Connect it with the `MONGODB_URI` environment variable.** If unset it uses a local
MongoDB at `mongodb://127.0.0.1:27017/savora`. If the database can't be reached the
backend exits within ~5 seconds with a clear message instead of hanging.

**Easiest option for hosting — MongoDB Atlas (free M0 tier):**
1. Create an account at [mongodb.com/atlas](https://www.mongodb.com/atlas) and create a free **M0** cluster.
2. *Database Access* → add a database user (username + password).
3. *Network Access* → add an IP allow-list entry. `0.0.0.0/0` ("anywhere") is fine to get
   started; tighten it later to your host's addresses.
4. *Connect* → *Drivers* → copy the connection string, and put your database name
   before the `?`, e.g.
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/savora?retryWrites=true&w=majority`
5. Set it as `MONGODB_URI` (locally, and later in your hosting provider's settings).

**Local alternative:** install [MongoDB Community Edition](https://www.mongodb.com/try/download/community)
and run it; no `MONGODB_URI` needed.

**Testing note:** the migration was tested end-to-end (every API route: menu CRUD, orders,
mock payments, kitchen/manager permissions, cancellation, analytics, help requests, staff
add/remove, restart persistence) against FerretDB, a MongoDB-protocol-compatible server —
not against MongoDB Atlas itself. The queries use standard MongoDB features, but please
run through the "Try it" steps below once against your own Atlas cluster to confirm.

## What's mocked (and needs to be replaced before going live)

1. **Payments** — `backend/server.js` simulates MoMo/Airtel/Card by auto-confirming
   payment after 3 seconds. Replace `mockPaymentRequest` with real calls to the **MTN
   MoMo Rwanda API**, **Airtel Money Rwanda API** ("request to pay" against a phone
   number), and a real card payment gateway (Stripe, Flutterwave, etc.) for the Card
   option, and verify payment via each provider's webhook/callback before marking an
   order paid — never trust the client alone.
2. **Dish photos** — the seed data in `backend/data/menu.js` uses stock photos from
   Unsplash so you can see the flow working. Use the Menu Manager (`/manager`, Menu tab)
   to replace them: click "Upload a photo" to pick a real photo of your dish straight
   from your computer (stored on the backend at `backend/uploads/`, served at
   `/uploads/<filename>` — no cloud account needed), or paste an existing image URL in
   the field below it if you'd rather host photos elsewhere (Cloudinary/S3, etc.).
   Uploads are capped at 5MB and limited to JPEG/PNG/WEBP/GIF.
3. **Staff accounts** — real, individual accounts with bcrypt-hashed passwords, stored
   in the database (not a hardcoded array) — see "Staff authentication & roles" below.
   There are no built-in default accounts: create your first manager with
   `npm run set-manager` (see "Staff authentication & roles"), then add everyone else
   from the Manager dashboard's **Staff** tab.
4. **Kitchen notification sound** — add a real short chime at
   `frontend/public/notify.mp3` (currently missing, so the dashboard just flashes red
   silently).

## Staff authentication & roles

There are two staff roles, each with its own login and its own URL. **There are no
default or demo accounts.** You create the first manager yourself, once, with a command
that reads the credentials from environment variables (so they never end up in the code
or on GitHub). In `backend/`, in PowerShell:

```powershell
$env:MONGODB_URI='mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/savora'
$env:MANAGER_USER='Your Name'
$env:MANAGER_PASS='a-strong-password'
npm run set-manager
```

This **replaces all existing staff accounts** with that one manager (safe to re-run —
it's also how you recover a forgotten manager password). Restart the backend afterwards.
Then log in at `/manager` and add everyone else (kitchen or more managers) from the
**Staff** tab. Usernames are case-sensitive.

(Alternative for a brand-new, empty database: set `MANAGER_USER` and `MANAGER_PASS` as
environment variables on the backend and the first manager is created automatically on
startup. If neither is done, the backend warns that nobody can log in.)

| Role | URL | Can see revenue/analytics? | Can edit menu? | Can advance order status? | Can cancel an order? | Can manage staff? |
|---|---|---|---|---|---|---|
| Manager | `/manager` | Yes | Yes | No — view only | Yes | Yes |
| Kitchen | `/kitchen` | No | No | Yes | No | No |

**Real accounts, not a hardcoded list** (`backend/staffStore.js`, `backend/db.js`):
staff live in a `staff` table with bcrypt-hashed passwords (`backend/db.js` seeds the
two defaults above with real hashes, not plaintext — nothing in the database is ever a
readable password). A manager can add as many accounts as needed, of either role, from
the Staff tab — each with their own username and password, so removing one person's
access doesn't mean changing a password everyone else was using too. Deleting a staff
account **immediately revokes any session token they're currently using** (tested: I
created an account, logged in as it, confirmed it worked, deleted the account from
another session, and confirmed the *original, still-open* session was rejected on its
very next request — not just blocked from logging in again). The one hard safety rail:
you cannot delete the last remaining manager account, since no other role can reach the
Staff tab to fix that mistake.

**How the role boundary is enforced** (`backend/server.js`): logging in via
`/api/admin/login` looks up the submitted username in the `staff` table and verifies the
password against its bcrypt hash. On success it issues a random token mapped to that
account's role and ID — a manager login and a kitchen login are indistinguishable to the
client except for the `role` field in the response. Every `/api/admin/*` route is
wrapped in a `requireAdmin` middleware (valid token required, any role). From there,
more middlewares narrow it further:
- `requireManager` — on `/api/admin/stats`, `/api/admin/analytics`, all menu-editing
  endpoints, and all `/api/admin/staff` endpoints. A kitchen token gets 403.
- `requireKitchen` — on `PATCH /api/admin/orders/:id/status` (the endpoint that
  actually advances an order through Received → Preparing → Ready → Served). A
  **manager** token gets 403 here — the manager dashboard shows the exact same live
  kanban board as the kitchen's, but can't operate it. This keeps one clear owner for
  "is this order actually being cooked" instead of both roles being able to click the
  same buttons and step on each other.
- `requireManager` again — on `PATCH /api/admin/orders/:id/cancel` (voiding a paid
  order). This is the inverse of the point above: cancelling isn't a kitchen-cooking
  decision, it's a financial one (it changes revenue reporting and may need a
  real-world refund), so it sits with the role that already owns "the money." A
  **kitchen** token gets 403 trying to cancel an order, even though it can freely
  advance that same order's status. Cancelling requires a reason (at least 3
  characters), can't be done twice, and can't be done on an order that's already been
  served (the food went out — that's a completed transaction). A cancelled order stays
  visible on the kanban board in its own "Cancelled" column, with the reason and who
  cancelled it shown, but is excluded from revenue, top-dish, and payment-method
  figures everywhere else (Analytics, the daily stats bar) — a voided order shouldn't
  count as real business. The customer's own tracking page and order-history entry
  both update live to show the cancellation and its reason, in whichever language
  they're using.

Every one of these boundaries is checked server-side on every request, not just hidden
in the frontend UI — I tested each direction directly with curl: a kitchen token gets
403 calling `/api/admin/stats`, adding a dish, listing staff, or cancelling an order; a
manager token gets 403 trying to advance an order's status; a brand-new account created
through the Staff tab can immediately log in and is bound by the same rules as any
other account; duplicate usernames, weak passwords (under 6 characters), and invalid roles
are all rejected with clear error messages; cancelling an already-served or
already-cancelled order is rejected; and the revenue math was verified to genuinely
exclude a cancelled order's total, not just hide it visually. Order status changes,
cancellations, and menu edits all broadcast over WebSockets regardless of who made
them, so whichever dashboard is just watching still updates live the instant another
one acts.

The frontend enforces the same boundaries a second time for UX — a kitchen login never
renders the Menu/Analytics/Staff tabs and the stats bar omits revenue; a manager login
sees the Orders board with a "Viewing only" tag and plain status text instead of
clickable buttons — but the *real* boundary is server-side, so someone calling the API
directly can't bypass any of it by skipping the UI.

Sessions are tracked in-memory (`activeTokens`, a `Map` from token → `{role, staffId}`)
and cleared on server restart — everyone gets logged out and needs to log back in.
Logging in on `/manager` with kitchen credentials (or vice versa) is explicitly rejected
client-side before the token is even stored, with a clear "that account doesn't have
Manager access" message. Because both dashboards share the same browser storage keys,
logging into one role in a given browser effectively logs out any other role session in
that same browser — expected behavior for a shared-device client, not a bug, but worth
knowing if you're testing both roles in one browser (use two different browsers, or one
regular + one incognito window, to stay logged into both at once).

What this does *not* do: rate-limit login attempts, support two-factor auth, or survive
a server restart (sessions are in-memory). Worth adding before a real deployment with
sensitive data on the line.

## Running it locally

You'll need [Node.js](https://nodejs.org) **20+** and a MongoDB database (a free Atlas
cluster or a local MongoDB — see "Database" above).

**1. Start the backend:**
```bash
cd backend
export MONGODB_URI="mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/savora"  # skip if using local MongoDB
# Windows PowerShell:  $env:MONGODB_URI="mongodb+srv://..."
npm install
npm run dev
# → Savora backend running on http://localhost:4000
```

**2. Start the frontend (in a new terminal):**
```bash
cd frontend
npm install
npm run dev
# → open the printed http://localhost:5173 URL
```

**3. Try placing an order:**
Pick Dine In, and you'll be asked to pick a table from a grid of 15 (Table 1–15) —
tap one instead of typing a number. Add a few dishes, get to Checkout, and try each
payment method: MoMo/Airtel show a brand-colored badge and expect a 10-digit Rwandan
number — try an invalid one (e.g. `0721234567` while MTN is selected) and confirm you
get a specific "Enter a valid MTN number (078XXXXXXX or 079XXXXXXX)" error, not a
generic one. Card and Cash skip the phone field entirely. Complete the payment and
confirm the order goes through.

**4. Try the manager dashboard:**
Open `http://localhost:5173/manager` in a second browser tab/window and log in with
the manager account you created. Place an order in the first tab and watch it appear live on
the **Orders** tab, with the revenue figure updating in the stats bar. Notice the board
is read-only here — a "Viewing only" tag and plain status text instead of buttons.

**5. Try the kitchen dashboard:**
Open `http://localhost:5173/kitchen` in a third tab (or an incognito window, so you stay
logged into both at once) and create a kitchen account from the manager's **Staff** tab and log in with it. Notice: no Menu or
Analytics tab, and the stats bar shows order count/prep time but no revenue figure. Click
"Start Preparing" on an order here, then flip back to the manager tab — it updates live
there too, still without any button to click. Confirm the server-side boundary directly:
```
fetch('http://localhost:4000/api/admin/orders/201/status', {method:'PATCH', headers:{Authorization:'Bearer <manager token>','Content-Type':'application/json'}, body:'{"status":"preparing"}'})
```
run from a manager session should return 403 — the manager truly cannot advance an
order even by calling the API directly, not just because the button is hidden.

**6. Try the menu manager:**
From `/manager`, switch to the **Menu** tab to add a dish, edit one, or toggle it
sold-out — changes show up immediately in the customer-facing menu.

**7. Try sales analytics:**
From `/manager`, switch to the **Analytics** tab to see all-time revenue, a 14-day
trend, top-selling dishes, and a payment-method breakdown — all computed from whatever
orders you've placed so far.

**8. Try order cancellation:**
Place an order all the way through checkout, and keep its tracking link/QR from the
Confirmation screen open in another tab. On `/manager`'s **Orders** tab, click
"Cancel Order" on it and enter a reason (at least 3 characters). Watch three things
update live: the order moves to a new **Cancelled** column on the board, the customer's
tracking page swaps its progress tracker for a cancellation message showing your
reason, and the Analytics/stats-bar revenue figures drop by that order's amount. Try
the same thing from `/kitchen` — there's no Cancel button there at all, and calling
`PATCH /api/admin/orders/<id>/cancel` with a kitchen token returns 403 even directly.
Also try cancelling an order you've already marked "Served" from the kitchen side —
the manager gets a clear "can't cancel an order that's already been served" error.

**9. Try staff management:**
From `/manager`, switch to the **Staff** tab and add a new account (either role, at
least a 6-character password). Log out, then log in as that brand-new account at
`/kitchen` or `/manager` (whichever role you gave it) — it works immediately, no
restart needed. Back in the Staff tab as manager, remove that test account — if you
were still logged in as it in another tab, its very next action there gets rejected
immediately, not just blocked from a future login.

**10. Try a table QR code:**
Visit `http://localhost:5173/?table=12` to skip straight to a pre-filled dine-in order
for Table 12 — this is the URL you'd encode into each table's physical QR code.

**11. Try order tracking:**
Place an order all the way through checkout. The Confirmation screen gives you three
ways to reach the tracking page — this matters because the customer might be on a
shared kiosk (where scanning the QR code with their own phone makes sense) or ordering
from their own phone via a table QR link (where a QR code is useless — you can't scan
your own phone's screen with its own camera). So it offers: scan the QR code with
*another* device, tap "Open Tracking Page" to launch it in a new tab on the *same*
device, or "Copy Link" to save/share it. "Open" deliberately opens a new tab rather than
navigating the current screen away, so a shared kiosk doesn't get stranded on a
stranger's tracking page and skip its auto-reset. Move the order through Preparing →
Ready on the **Orders** tab (either dashboard) and watch the tracking page update live,
with no refresh. Note: on `localhost`, the QR code and link both encode a `localhost`
URL that only resolves on the same machine — testing the QR-scan-from-another-device
path specifically needs the frontend deployed somewhere reachable from other devices,
or your computer's LAN IP for same-network testing. The "Open"/"Copy" buttons work
immediately on `localhost` regardless, since they don't require a second device.

**12. Try Call for Help:**
On any customer screen (Menu, a dish, Cart, Checkout), tap the bell "Call for Help"
button in the nav bar. Switch to either staff dashboard — a pulsing alert banner should
appear immediately with the table number (or "Takeaway customer"), along with a sound,
no matter which tab is open. Click "Resolve" to dismiss it (visible on both dashboards
at once).

## Suggested next steps

- Get MoMo & Airtel Money merchant/API access (requires business registration) and wire
  up the real request-to-pay + callback flow. This also means wiring up **real refunds**
  when a manager cancels an already-paid order — right now, cancelling only marks the
  order voided in Savora's own records (correctly excluding it from revenue); it doesn't
  call any payment provider to actually return the customer's money, since payments are
  still mocked. Once real MoMo/Airtel integration exists, `cancelOrder` in `store.js` is
  the natural place to trigger that refund call.
- Tighten your MongoDB Atlas Network Access rule from "anywhere" to your host's addresses
  once deployed (see "Database" above).
- Consider moving uploaded dish photos to Cloudinary/S3 instead of the local
  `backend/uploads/` folder once you deploy somewhere the backend's disk isn't
  persistent (some hosts wipe local files on redeploy).
- Add a thermal kitchen-ticket printer alongside the live dashboard.
- Deploy: frontend to Vercel/Netlify, backend to Render/Railway (both have free tiers
  suitable for an MVP), with `MONGODB_URI` set in the host's environment settings.
  Note the in-memory staff login sessions reset on every backend restart/redeploy.
