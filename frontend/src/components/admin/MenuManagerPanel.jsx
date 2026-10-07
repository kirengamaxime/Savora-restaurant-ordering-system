import { useEffect, useRef, useState } from "react";
import { Plus, Pencil, Trash2, UploadCloud, Loader2 } from "lucide-react";
import { getMenu, addDish, updateDish, deleteDish, uploadDishImage, API_BASE } from "../../api.js";
import { formatRWF } from "../../utils.js";
import { resolveImageUrl } from "../../api";

const EMPTY_FORM = {
  categoryId: "",
  name: "",
  description: "",
  price: "",
  prepMinutes: "10",
  image: "",
  ingredientsText: ""
};

function toIngredients(text) {
  return text
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((name, i) => ({ id: `i-${name.toLowerCase().replace(/\s+/g, "-")}-${i}`, name, removable: true }));
}

// Uploaded images come back as a relative path like "/uploads/abc123.jpg" —
// resolve it against the backend's own origin so <img> tags load correctly
// (the frontend and backend run on different ports in dev).


export default function MenuManagerPanel() {
  const [menu, setMenu] = useState([]);
  const [form, setForm] = useState(null); // null = closed, { ...EMPTY_FORM } = adding, { id, ... } = editing
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadMenu();
  }, []);

  async function loadMenu() {
    setMenu(await getMenu());
  }

  function openAddForm(categoryId) {
    setForm({ ...EMPTY_FORM, categoryId });
    setUploadError("");
  }

  function openEditForm(categoryId, dish) {
    setForm({
      id: dish.id,
      categoryId,
      name: dish.name,
      description: dish.description,
      price: String(dish.price),
      prepMinutes: String(dish.prepMinutes),
      image: dish.image,
      ingredientsText: dish.ingredients.filter((i) => i.removable).map((i) => i.name).join(", ")
    });
    setUploadError("");
  }

  async function handleDelete(dishId) {
    if (!confirm("Remove this dish from the menu?")) return;
    await deleteDish(dishId);
    loadMenu();
  }

  async function toggleSoldOut(dish) {
    await updateDish(dish.id, { soldOut: !dish.soldOut });
    loadMenu();
  }

  async function handleFileSelected(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError("");
    setUploading(true);
    try {
            const { path: uploadedPath } = await uploadDishImage(file);
      // uploadedPath is already a full Cloudinary URL, so store it as-is.
      // resolveImageUrl (used when rendering) leaves absolute URLs untouched.
      setForm((prev) => ({ ...prev, image: uploadedPath }));
    } catch (err) {
      setUploadError(err.response?.data?.error || "Upload failed — try a smaller JPEG/PNG/WEBP file.");
    } finally {
      setUploading(false);
      e.target.value = ""; // allow re-selecting the same file if needed
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      prepMinutes: Number(form.prepMinutes),
      image: form.image,
      ingredients: toIngredients(form.ingredientsText)
    };

    if (form.id) {
      await updateDish(form.id, payload);
    } else {
      await addDish({ categoryId: form.categoryId, ...payload });
    }

    setForm(null);
    loadMenu();
  }

  return (
    <div className="mm-container">
      {form && (
        <form className="mm-form" onSubmit={handleSubmit}>
          <p style={{ fontWeight: 700, marginBottom: 14 }}>{form.id ? "Edit Dish" : "Add Dish"}</p>

          <div className="mm-form-grid">
            <div>
              <label>Category</label>
              <select
                value={form.categoryId}
                disabled={!!form.id}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                required
              >
                <option value="" disabled>
                  Select a category
                </option>
                {menu.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Dish name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
          </div>

          <div className="mm-form-grid full">
            <div>
              <label>Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>

          <div className="mm-form-grid">
            <div>
              <label>Price (RWF)</label>
              <input
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
              />
            </div>
            <div>
              <label>Prep time (minutes)</label>
              <input
                type="number"
                min="1"
                value={form.prepMinutes}
                onChange={(e) => setForm({ ...form, prepMinutes: e.target.value })}
              />
            </div>
          </div>

          <div className="mm-form-grid full">
            <div>
              <label>Dish photo</label>

              <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                {form.image && (
                  <img
                    src={resolveImageUrl(form.image)}
                    alt="Preview"
                    style={{ width: 72, height: 72, borderRadius: 8, objectFit: "cover", flex: "none", border: "1px solid var(--kb-border)" }}
                  />
                )}

                <div style={{ flex: 1 }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleFileSelected}
                    style={{ display: "none" }}
                  />
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ minHeight: 40, padding: "8px 16px", borderColor: "var(--kb-border)", color: "var(--kb-ink)" }}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? <Loader2 size={15} className="spin" /> : <UploadCloud size={15} />}
                    {uploading ? "Uploading…" : "Upload a photo"}
                  </button>

                  {uploadError && <p style={{ color: "var(--alert)", fontSize: 12.5, marginTop: 6 }}>{uploadError}</p>}

                  <p style={{ fontSize: 12, color: "var(--kb-ink-soft)", marginTop: 8, marginBottom: 4 }}>
                    Or paste an existing image URL:
                  </p>
                  <input
                    value={form.image}
                    placeholder="https://…"
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mm-form-grid full">
            <div>
              <label>Removable ingredients (comma separated)</label>
              <input
                value={form.ingredientsText}
                placeholder="e.g. Onion, Chili sauce, Coriander"
                onChange={(e) => setForm({ ...form, ingredientsText: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button type="submit" className="btn btn-primary" style={{ minHeight: 44 }}>
              {form.id ? "Save Changes" : "Add Dish"}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ minHeight: 44, borderColor: "var(--kb-border)", color: "var(--kb-ink)" }}
              onClick={() => setForm(null)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {menu.map((category) => (
        <div className="mm-category-block" key={category.id}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 className="mm-category-title">{category.name}</h2>
            <button className="mm-icon-btn" onClick={() => openAddForm(category.id)} title="Add dish to this category">
              <Plus size={16} />
            </button>
          </div>

          {category.dishes.length === 0 && (
            <p style={{ color: "var(--kb-ink-soft)", fontSize: 14 }}>No dishes in this category yet.</p>
          )}

          {category.dishes.map((dish) => (
            <div className={`mm-row ${dish.soldOut ? "sold-out-row" : ""}`} key={dish.id}>
              <img src={resolveImageUrl(dish.image)} alt={dish.name} />
              <div className="mm-row-body">
                <p className="mm-row-name">{dish.name}</p>
                <span className="mm-row-price">{dish.soldOut ? "Sold out" : formatRWF(dish.price)}</span>
              </div>
              <div className="mm-row-actions">
                <button
                  className="btn btn-ghost"
                  style={{ minHeight: 34, padding: "6px 12px", fontSize: 12.5, borderColor: "var(--kb-border)", color: "var(--kb-ink)" }}
                  onClick={() => toggleSoldOut(dish)}
                >
                  {dish.soldOut ? "Mark Available" : "Mark Sold Out"}
                </button>
                <button className="mm-icon-btn" onClick={() => openEditForm(category.id, dish)} title="Edit">
                  <Pencil size={15} />
                </button>
                <button className="mm-icon-btn danger" onClick={() => handleDelete(dish.id)} title="Delete">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
