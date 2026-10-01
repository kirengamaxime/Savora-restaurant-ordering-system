import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { db } from "./db.js";

function toStaffJSON(row) {
  // Never include password_hash in anything returned to the client.
  return { id: row.id, username: row.username, role: row.role, createdAt: row.created_at };
}

export function findStaffByUsername(username) {
  return db.prepare("SELECT * FROM staff WHERE username = ?").get(username);
}

// Used to resolve "who cancelled this order" for display — returns null
// (not an error) if the account has since been deleted, so an old order's
// history doesn't break just because the staff member who cancelled it is
// no longer around.
export function findStaffById(id) {
  if (!id) return null;
  const row = db.prepare("SELECT * FROM staff WHERE id = ?").get(id);
  return row ? toStaffJSON(row) : null;
}

export function verifyPassword(plainPassword, passwordHash) {
  return bcrypt.compareSync(plainPassword, passwordHash);
}

export function listStaff() {
  return db.prepare("SELECT * FROM staff ORDER BY created_at ASC").all().map(toStaffJSON);
}

export function countByRole(role) {
  return db.prepare("SELECT COUNT(*) as count FROM staff WHERE role = ?").get(role).count;
}

export function createStaff({ username, password, role }) {
  const existing = findStaffByUsername(username);
  if (existing) return { error: "That username is already taken" };
  if (role !== "manager" && role !== "kitchen") return { error: "Role must be 'manager' or 'kitchen'" };
  if (!password || password.length < 6) return { error: "Password must be at least 6 characters" };

  const id = `staff-${nanoid(8)}`;
  const passwordHash = bcrypt.hashSync(password, 10);
  db.prepare("INSERT INTO staff (id, username, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)").run(
    id,
    username,
    passwordHash,
    role,
    new Date().toISOString()
  );

  return { staff: toStaffJSON(db.prepare("SELECT * FROM staff WHERE id = ?").get(id)) };
}

export function deleteStaff(id) {
  const target = db.prepare("SELECT * FROM staff WHERE id = ?").get(id);
  if (!target) return { error: "Staff account not found" };

  // Never allow removing the last manager account — that would lock
  // everyone out of ever creating another one (no other role can reach
  // the Staff tab to undo it).
  if (target.role === "manager" && countByRole("manager") <= 1) {
    return { error: "Can't remove the last manager account" };
  }

  db.prepare("DELETE FROM staff WHERE id = ?").run(id);
  return { deleted: true };
}
