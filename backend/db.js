// MongoDB via Mongoose. Set MONGODB_URI to your database connection string
// (e.g. a free MongoDB Atlas cluster). Defaults to a local MongoDB.

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { menu as seedMenu } from "./data/menu.js";
import { Category, Dish, Staff, Counter } from "./models.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/savora";

export async function connectDB() {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  console.log("Connected to MongoDB");
  await seedIfEmpty();
}

// Atomic sequential numbers (orders start at #201, help requests at #1).
export async function nextSequence(name) {
  const counter = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { returnDocument: "after", upsert: true, setDefaultsOnInsert: true }
  );
  return counter.seq;
}

async function seedIfEmpty() {
  // Menu: only on a fresh database, so Menu Manager edits are never overwritten.
  if ((await Category.countDocuments()) === 0) {
    for (const [index, category] of seedMenu.entries()) {
      await Category.create({ _id: category.id, name: category.name, sortOrder: index });
      await Dish.insertMany(
        category.dishes.map((dish) => ({
          _id: dish.id,
          categoryId: category.id,
          name: dish.name,
          description: dish.description || "",
          price: dish.price,
          prepMinutes: dish.prepMinutes || 10,
          image: dish.image || "",
          soldOut: !!dish.soldOut,
          ingredients: (dish.ingredients || []).map((i) => ({
            id: i.id,
            name: i.name,
            removable: !!i.removable
          }))
        }))
      );
    }
  }

  // Order numbers start at #201 (first call to nextSequence returns 201).
  await Counter.updateOne({ _id: "orderNumber" }, { $setOnInsert: { seq: 200 } }, { upsert: true });

  // No built-in default accounts. On a brand-new database, a first manager is
  // created only if MANAGER_USER and MANAGER_PASS are both set in the
  // environment. Otherwise run `npm run set-manager` (see README) to create it.
  // Either way, further staff are added from the Manager dashboard's Staff tab.
  if ((await Staff.countDocuments()) === 0) {
    const { MANAGER_USER, MANAGER_PASS } = process.env;
    if (MANAGER_USER && MANAGER_PASS) {
      await Staff.create({
        _id: `staff-${nanoid(8)}`,
        username: MANAGER_USER,
        passwordHash: bcrypt.hashSync(MANAGER_PASS, 10),
        role: "manager",
        createdAt: new Date().toISOString()
      });
      console.log(`Created first manager account "${MANAGER_USER}".`);
    } else {
      console.warn('No staff accounts exist yet — nobody can log in. Run "npm run set-manager" (see README).');
    }
  }
}
