import { nanoid } from "nanoid";
import { Category, Dish } from "./models.js";

function toDishJSON(d) {
  return {
    id: d._id,
    name: d.name,
    description: d.description,
    price: d.price,
    prepMinutes: d.prepMinutes,
    image: d.image,
    soldOut: !!d.soldOut,
    ingredients: d.ingredients.map((i) => ({ id: i.id, name: i.name, removable: !!i.removable }))
  };
}

function cleanIngredients(list) {
  return (list || []).map((ing) => ({
    id: ing.id || `i-${nanoid(6)}`,
    name: ing.name,
    removable: ing.removable !== false
  }));
}

export async function getMenu() {
  const [categories, dishes] = await Promise.all([
    Category.find().sort({ sortOrder: 1 }).lean(),
    Dish.find().lean()
  ]);
  return categories.map((cat) => ({
    id: cat._id,
    name: cat.name,
    dishes: dishes.filter((d) => d.categoryId === cat._id).map(toDishJSON)
  }));
}

export async function addDish(categoryId, dish) {
  const category = await Category.findById(categoryId);
  if (!category) return null;

  const created = await Dish.create({
    _id: `d-${nanoid(6)}`,
    categoryId,
    name: dish.name,
    description: dish.description || "",
    price: Number(dish.price) || 0,
    prepMinutes: Number(dish.prepMinutes) || 10,
    image: dish.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80",
    soldOut: false,
    ingredients: cleanIngredients(dish.ingredients)
  });
  return toDishJSON(created);
}

export async function updateDish(dishId, updates) {
  const existing = await Dish.findById(dishId);
  if (!existing) return null;

  if (updates.name !== undefined && updates.name !== null) existing.name = updates.name;
  if (updates.description !== undefined && updates.description !== null) existing.description = updates.description;
  if (updates.price !== undefined) existing.price = Number(updates.price);
  if (updates.prepMinutes !== undefined) existing.prepMinutes = Number(updates.prepMinutes);
  if (updates.image !== undefined && updates.image !== null) existing.image = updates.image;
  if (updates.soldOut !== undefined) existing.soldOut = !!updates.soldOut;
  if (updates.ingredients) existing.ingredients = cleanIngredients(updates.ingredients);

  await existing.save();
  return toDishJSON(existing);
}

export async function deleteDish(dishId) {
  const result = await Dish.deleteOne({ _id: dishId });
  return result.deletedCount > 0;
}
