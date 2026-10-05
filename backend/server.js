import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);


import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { nanoid } from "nanoid";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./db.js";
import { getMenu, addDish, updateDish, deleteDish } from "./menuStore.js";
import { getSalesAnalytics } from "./analyticsStore.js";
import { findStaffByUsername, verifyPassword, listStaff, createStaff, deleteStaff, findStaffById } from "./staffStore.js";
import {
  createHelpRequest,
  listPendingHelpRequests,
  resolveHelpRequest
} from "./helpStore.js";
import {
  createOrder,
  getOrder,
  getOrderByToken,
  updatePaymentStatus,
  updateKitchenStatus,
  cancelOrder,
  listTodayOrders,
  getTodayStats
} from "./store.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Express 4 doesn't catch rejected promises from async handlers, so every
// route is wrapped: any database error becomes a clean 500 instead of a hang.
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch((err) => {
    console.error(err);
    if (!res.headersSent) res.status(500).json({ error: "Server error" });
  });

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(UPLOADS_DIR));

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

async function broadcastStats() {
  io.emit("stats-updated", await getTodayStats());
}

// Resolves a cancelled order's raw cancelledByStaffId into a display-ready
// username, so "who cancelled this" survives a page reload — not just the
// live socket broadcast at the moment it happened. Returns the order
// unchanged if it was never cancelled. If the staff account has since been
// deleted, cancelledByUsername comes back null rather than breaking.
async function withCancellerInfo(order) {
  if (!order.cancelledByStaffId) return order;
  const canceller = await findStaffById(order.cancelledByStaffId);
  return { ...order, cancelledByUsername: canceller?.username || null };
}

// --- Menu (public) ---
app.get("/api/menu", asyncHandler(async (req, res) => {
  res.json(await getMenu());
}));

// --- Staff auth (multiple roles, real accounts) ---
// Accounts live in the `staff` table (backend/staffStore.js) with bcrypt-
// hashed passwords — not a hardcoded array. Two are seeded automatically on
// a fresh database (see db.js), and managers can add/remove more via the
// Staff tab. Tokens are random per-login and mapped to the account that
// issued them (role + staffId), so a manager token can't be used to bypass
// kitchen-only or manager-only routes and vice versa, and removing someone's
// account can immediately revoke whatever session they're currently using.
const activeTokens = new Map(); // token -> { role, staffId }, in-memory sessions cleared on server restart

function revokeTokensForStaff(staffId) {
  for (const [token, session] of activeTokens.entries()) {
    if (session.staffId === staffId) activeTokens.delete(token);
  }
}

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  const session = token && activeTokens.get(token);
  if (!session) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  req.staffRole = session.role;
  req.staffId = session.staffId;
  next();
}

// Chain after requireAdmin on routes only the manager role should reach
// (revenue figures, sales analytics, menu edits, staff management) — a
// valid kitchen token still gets rejected here, with 403 rather than 401
// since they ARE authenticated, just not authorized for this route.
function requireManager(req, res, next) {
  if (req.staffRole !== "manager") {
    return res.status(403).json({ error: "Manager access required" });
  }
  next();
}

// The inverse boundary: actually running the kitchen (advancing an order
// through Received → Preparing → Ready → Served) is kitchen-only. Manager
// gets to watch the same board update live, but not operate it — keeps
// one clear owner for "is this order actually being cooked" instead of
// both roles being able to click the same buttons.
function requireKitchen(req, res, next) {
  if (req.staffRole !== "kitchen") {
    return res.status(403).json({ error: "Kitchen access required" });
  }
  next();
}

app.post("/api/admin/login", asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const account = await findStaffByUsername(username);
  if (!account || !verifyPassword(password, account.passwordHash)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = nanoid(32);
  activeTokens.set(token, { role: account.role, staffId: account.id });
  res.json({ token, role: account.role });
}));

app.post("/api/admin/logout", requireAdmin, asyncHandler(async (req, res) => {
  const token = req.headers.authorization.slice(7);
  activeTokens.delete(token);
  res.json({ ok: true });
}));

// --- Staff management (manager only) ---
app.get("/api/admin/staff", requireAdmin, requireManager, asyncHandler(async (req, res) => {
  res.json(await listStaff());
}));

app.post("/api/admin/staff", requireAdmin, requireManager, asyncHandler(async (req, res) => {
  const { username, password, role } = req.body;
  const result = await createStaff({ username, password, role });
  if (result.error) return res.status(400).json({ error: result.error });
  res.json(result.staff);
}));

app.delete("/api/admin/staff/:id", requireAdmin, requireManager, asyncHandler(async (req, res) => {
  const result = await deleteStaff(req.params.id);
  if (result.error) return res.status(400).json({ error: result.error });
  revokeTokensForStaff(req.params.id); // immediately end any session that account is currently using
  res.json({ deleted: true });
}));

app.get("/api/admin/orders", requireAdmin, asyncHandler(async (req, res) => {
  res.json(await Promise.all((await listTodayOrders()).map(withCancellerInfo)));
}));

// Revenue is manager-only — kitchen staff can see order counts and prep
// times (computed client-side from the order list they already have) but
// not the money.
app.get("/api/admin/stats", requireAdmin, requireManager, asyncHandler(async (req, res) => {
  res.json(await getTodayStats());
}));

app.get("/api/admin/analytics", requireAdmin, requireManager, asyncHandler(async (req, res) => {
  res.json(await getSalesAnalytics());
}));

// --- Menu management (admin) ---
const imageUpload = multer({
  storage: multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
      cb(null, `${nanoid(12)}${ext}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    cb(null, allowed.includes(file.mimetype));
  }
});

app.post("/api/admin/menu/upload-image", requireAdmin, requireManager, asyncHandler(async (req, res) => {
  imageUpload.single("image")(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "Image must be under 5MB" });
    }
    if (err) return res.status(400).json({ error: "Upload failed" });
    if (!req.file) return res.status(400).json({ error: "Only JPEG, PNG, WEBP, or GIF images are allowed" });
    res.json({ path: `/uploads/${req.file.filename}` });
  });
}));

app.post("/api/admin/menu/dishes", requireAdmin, requireManager, asyncHandler(async (req, res) => {
  const { categoryId, ...dish } = req.body;
  const created = await addDish(categoryId, dish);
  if (!created) return res.status(400).json({ error: "Unknown category" });
  res.json(created);
}));

app.patch("/api/admin/menu/dishes/:dishId", requireAdmin, requireManager, asyncHandler(async (req, res) => {
  const updated = await updateDish(req.params.dishId, req.body);
  if (!updated) return res.status(404).json({ error: "Dish not found" });
  res.json(updated);
}));

app.delete("/api/admin/menu/dishes/:dishId", requireAdmin, requireManager, asyncHandler(async (req, res) => {
  const removed = await deleteDish(req.params.dishId);
  if (!removed) return res.status(404).json({ error: "Dish not found" });
  res.json({ deleted: true });
}));

app.patch("/api/admin/orders/:id/status", requireAdmin, requireKitchen, asyncHandler(async (req, res) => {
  const { status } = req.body; // "preparing" | "ready" | "served"
  const order = await updateKitchenStatus(req.params.id, status);
  if (!order) return res.status(404).json({ error: "Order not found" });
  io.emit("order-updated", order); // for the kitchen dashboard's live board
  io.to(`order-${order.id}`).emit("track-update", order); // for that one customer's tracking page only
  await broadcastStats();
  res.json(order);
}));

// Manager-only: void a paid order. This is deliberately separate from the
// kitchen-status endpoint above and gated to the opposite role — cancelling
// is a financial/business call (it changes revenue reporting and may need a
// real-world refund), not a kitchen-cooking one (see store.js "cancelOrder").
// Broadcasts the same way status updates do, so the kitchen board and the
// customer's tracking page both reflect it live.
app.patch("/api/admin/orders/:id/cancel", requireAdmin, requireManager, asyncHandler(async (req, res) => {
  const reason = (req.body.reason || "").trim();
  if (reason.length < 3) {
    return res.status(400).json({ error: "A cancellation reason (at least 3 characters) is required" });
  }

  const result = await cancelOrder(req.params.id, reason, req.staffId);
  if (result.error) return res.status(400).json({ error: result.error });

  const orderWithCanceller = await withCancellerInfo(result.order);

  io.emit("order-updated", orderWithCanceller);
  io.to(`order-${orderWithCanceller.id}`).emit("track-update", orderWithCanceller);
  await broadcastStats();
  res.json(orderWithCanceller);
}));

// --- Orders ---
app.post("/api/orders", asyncHandler(async (req, res) => {
  const { items, orderType, tableNumber, customerName, customerPhone, paymentMethod } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: "Order must contain at least one item" });
  }

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const order = await createOrder({
    items,
    orderType,
    tableNumber,
    customerName,
    customerPhone,
    paymentMethod,
    total
  });

  res.json(order);
}));

app.get("/api/orders/:id", asyncHandler(async (req, res) => {
  const order = await getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json(await withCancellerInfo(order));
}));

// --- Customer order tracking (public, no login) ---
// Looked up by an unguessable random token (not the sequential order id) so a
// tracking link a customer shares or bookmarks can't be used to enumerate or
// view other customers' orders.
app.get("/api/track/:token", asyncHandler(async (req, res) => {
  const order = await getOrderByToken(req.params.token);
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json(await withCancellerInfo(order));
}));

// --- Call for help (public — customer taps a button, no login needed) ---
app.post("/api/help", asyncHandler(async (req, res) => {
  const { orderType, tableNumber } = req.body;
  if (orderType !== "dine-in" && orderType !== "takeaway") {
    return res.status(400).json({ error: "orderType must be 'dine-in' or 'takeaway'" });
  }

  const request = await createHelpRequest({ orderType, tableNumber });
  io.emit("new-help-request", request); // admin dashboard listens globally, regardless of active tab
  res.json(request);
}));

app.get("/api/admin/help", requireAdmin, asyncHandler(async (req, res) => {
  res.json(await listPendingHelpRequests());
}));

app.patch("/api/admin/help/:id/resolve", requireAdmin, asyncHandler(async (req, res) => {
  const resolved = await resolveHelpRequest(req.params.id);
  if (!resolved) return res.status(404).json({ error: "Help request not found" });
  io.emit("help-request-resolved", resolved);
  res.json(resolved);
}));

// --- Mock payments ---
// Replace these handlers with real calls to the MTN MoMo API, Airtel Money
// API, and a real card payment gateway (Stripe, Flutterwave, etc.). MoMo and
// Airtel push a USSD prompt to the customer's phone and confirm success via
// a callback/webhook — mirror that shape here: 1) kick off the request,
// 2) return "pending" immediately, 3) the real provider calls you back, and
// you update paymentStatus + emit "new-order". Card payments would instead
// call the gateway's charge/confirm API and get a near-immediate result.
function mockPaymentRequest(order, res) {
  // Simulate the customer confirming the USSD prompt (or a card gateway
  // authorizing the charge) after ~3s.
  setTimeout(async () => {
    try {
      const updated = await updatePaymentStatus(order.id, "paid");
      if (updated) {
        io.emit("new-order", updated);
        await broadcastStats();
      }
    } catch (err) {
      console.error("Mock payment confirmation failed:", err);
    }
  }, 3000);

  res.json({ status: "pending", message: "Payment request sent" });
}

app.post("/api/payments/momo/:orderId", asyncHandler(async (req, res) => {
  const order = await getOrder(req.params.orderId);
  if (!order) return res.status(404).json({ error: "Order not found" });
  mockPaymentRequest(order, res);
}));

app.post("/api/payments/airtel/:orderId", asyncHandler(async (req, res) => {
  const order = await getOrder(req.params.orderId);
  if (!order) return res.status(404).json({ error: "Order not found" });
  mockPaymentRequest(order, res);
}));

app.post("/api/payments/card/:orderId", asyncHandler(async (req, res) => {
  const order = await getOrder(req.params.orderId);
  if (!order) return res.status(404).json({ error: "Order not found" });
  mockPaymentRequest(order, res);
}));

app.post("/api/payments/cash/:orderId", asyncHandler(async (req, res) => {
  // Cash-at-counter: mark paid immediately, staff reconciles physically.
  const order = await updatePaymentStatus(req.params.orderId, "paid");
  if (!order) return res.status(404).json({ error: "Order not found" });
  io.emit("new-order", order);
  await broadcastStats();
  res.json({ status: "paid" });
}));

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // A customer's tracking page joins its own order's room so it only ever
  // receives updates for that one order — never the full order stream the
  // kitchen dashboard sees.
  socket.on("join-order", (orderId) => {
    socket.join(`order-${orderId}`);
  });
});

const PORT = process.env.PORT || 4000;
try {
  await connectDB();
  httpServer.listen(PORT, () => {
    console.log(`Savora backend running on http://localhost:${PORT}`);
  });
} catch (err) {
  console.error("Failed to connect to MongoDB — the server did not start.");
  console.error("Check MONGODB_URI and that the database is reachable:", err.message);
  process.exit(1);
}
