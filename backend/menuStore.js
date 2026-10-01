import { nanoid } from "nanoid";
import { db } from "./db.js";

function loadDish(dishId) {
  const row = db.prepare("SELECT * FROM dishes WHERE id = ?").get(dishId);
  if (!row) return null;
  const ingredients = db.prepare("SELECT * FROM ingredients WHERE dish_id = ?").all(dishId);
  return toDishJSON(row, ingredients);
}

function toDishJSON(row, ingredientRows) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    prepMinutes: row.prep_minutes,
    image: row.image,
    soldOut: !!row.sold_out,
    ingredients: ingredientRows.map((i) => ({ id: i.id, name: i.name, removable: !!i.removable }))
  };
}

export function getMenu() {
  const categories = db.prepare("SELECT * FROM categories ORDER BY sort_order").all();
  const dishRows = db.prepare("SELECT * FROM dishes").all();
  const ingredientRows = db.prepare("SELECT * FROM ingredients").all();

  return categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    dishes: dishRows
      .filter((d) => d.category_id === cat.id)
      .map((d) => toDishJSON(d, ingredientRows.filter((i) => i.dish_id === d.id)))
  }));
}

export function addDish(categoryId, dish) {
  const category = db.prepare("SELECT id FROM categories WHERE id = ?").get(categoryId);
  if (!category) return null;

  const id = `d-${nanoid(6)}`;
  db.prepare(
    "INSERT INTO dishes (id, category_id, name, description, price, prep_minutes, image, sold_out) VALUES (?, ?, ?, ?, ?, ?, ?, 0)"
  ).run(
    id,
    categoryId,
    dish.name,
    dish.description || "",
    Number(dish.price) || 0,
    Number(dish.prepMinutes) || 10,
    dish.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80"
  );

  const insertIngredient = db.prepare("INSERT INTO ingredients (id, dish_id, name, removable) VALUES (?, ?, ?, ?)");
  (dish.ingredients || []).forEach((ing) => {
    insertIngredient.run(ing.id || `i-${nanoid(6)}`, id, ing.name, ing.removable === false ? 0 : 1);
  });

  return loadDish(id);
}

export function updateDish(dishId, updates) {
  const existing = db.prepare("SELECT * FROM dishes WHERE id = ?").get(dishId);
  if (!existing) return null;

  const merged = {
    name: updates.name ?? existing.name,
    description: updates.description ?? existing.description,
    price: updates.price !== undefined ? Number(updates.price) : existing.price,
    prep_minutes: updates.prepMinutes !== undefined ? Number(updates.prepMinutes) : existing.prep_minutes,
    image: updates.image ?? existing.image,
    sold_out: updates.soldOut !== undefined ? (updates.soldOut ? 1 : 0) : existing.sold_out
  };

  db.prepare(
    "UPDATE dishes SET name = ?, description = ?, price = ?, prep_minutes = ?, image = ?, sold_out = ? WHERE id = ?"
  ).run(merged.name, merged.description, merged.price, merged.prep_minutes, merged.image, merged.sold_out, dishId);

  if (updates.ingredients) {
    db.prepare("DELETE FROM ingredients WHERE dish_id = ?").run(dishId);
    const insertIngredient = db.prepare("INSERT INTO ingredients (id, dish_id, name, removable) VALUES (?, ?, ?, ?)");
    updates.ingredients.forEach((ing) => {
      insertIngredient.run(ing.id || `i-${nanoid(6)}`, dishId, ing.name, ing.removable === false ? 0 : 1);
    });
  }

  return loadDish(dishId);
}

export function deleteDish(dishId) {
  const result = db.prepare("DELETE FROM dishes WHERE id = ?").run(dishId);
  return result.changes > 0;
}
