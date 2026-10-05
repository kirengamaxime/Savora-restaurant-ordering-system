import mongoose from "mongoose";

const { Schema } = mongoose;

// String _ids (e.g. "d-sambusa", "starters") are kept on purpose so the REST
// API returns exactly the same ids the frontend already uses.

const ingredientSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    removable: { type: Boolean, default: true }
  },
  { _id: false }
);

const dishSchema = new Schema({
  _id: String,
  categoryId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: { type: String, default: "" },
  price: { type: Number, required: true },
  prepMinutes: { type: Number, default: 10 },
  image: { type: String, default: "" },
  soldOut: { type: Boolean, default: false },
  ingredients: [ingredientSchema]
});

const categorySchema = new Schema({
  _id: String,
  name: { type: String, required: true },
  sortOrder: { type: Number, default: 0 }
});

const orderItemSchema = new Schema(
  {
    dishId: String,
    image: String,
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    removedIngredients: [String],
    note: { type: String, default: "" }
  },
  { _id: false }
);

const orderSchema = new Schema({
  orderNumber: { type: Number, unique: true, index: true },
  orderType: { type: String, required: true },
  tableNumber: String,
  customerName: String,
  customerPhone: String,
  paymentMethod: String,
  total: { type: Number, required: true },
  paymentStatus: { type: String, default: "pending" },
  kitchenStatus: { type: String, default: "received" },
  createdAt: { type: String, required: true },
  paidAt: String,
  preparingAt: String,
  readyAt: String,
  servedAt: String,
  cancelledAt: String,
  cancellationReason: String,
  cancelledByStaffId: String,
  trackingToken: { type: String, unique: true, sparse: true },
  items: [orderItemSchema]
});

const helpRequestSchema = new Schema({
  requestNumber: { type: Number, unique: true, index: true },
  orderType: { type: String, required: true },
  tableNumber: String,
  status: { type: String, default: "pending" },
  createdAt: { type: String, required: true },
  resolvedAt: String
});

const staffSchema = new Schema({
  _id: String,
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, required: true },
  createdAt: { type: String, required: true }
});

// MongoDB has no auto-increment, so sequential numbers (order #201, #202…)
// come from one atomic counter document per sequence.
const counterSchema = new Schema({ _id: String, seq: { type: Number, default: 0 } });

export const Dish = mongoose.model("Dish", dishSchema);
export const Category = mongoose.model("Category", categorySchema);
export const Order = mongoose.model("Order", orderSchema);
export const HelpRequest = mongoose.model("HelpRequest", helpRequestSchema);
export const Staff = mongoose.model("Staff", staffSchema);
export const Counter = mongoose.model("Counter", counterSchema);
