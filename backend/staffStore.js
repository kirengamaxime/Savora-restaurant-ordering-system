import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { Staff } from "./models.js";

function toStaffJSON(s) {
  // Never include passwordHash in anything returned to the client.
  return { id: s._id, username: s.username, role: s.role, createdAt: s.createdAt };
}

// Returns { id, username, role, passwordHash } for login checks, or null.
export async function findStaffByUsername(username) {
  if (typeof username !== "string") return null;
  const s = await Staff.findOne({ username }).lean();
  return s ? { id: s._id, username: s.username, role: s.role, passwordHash: s.passwordHash } : null;
}

// Resolves "who cancelled this order" — null (not an error) if the account
// has since been deleted.
export async function findStaffById(id) {
  if (!id) return null;
  const s = await Staff.findById(id).lean();
  return s ? toStaffJSON(s) : null;
}

export function verifyPassword(plainPassword, passwordHash) {
  if (typeof plainPassword !== "string") return false;
  return bcrypt.compareSync(plainPassword, passwordHash);
}

export async function listStaff() {
  const all = await Staff.find().sort({ createdAt: 1 }).lean();
  return all.map(toStaffJSON);
}

export function countByRole(role) {
  return Staff.countDocuments({ role });
}

export async function createStaff({ username, password, role }) {
  if (typeof username !== "string" || !username.trim()) return { error: "Username is required" };
  username = username.trim();
  if (await Staff.exists({ username })) return { error: "That username is already taken" };
  if (role !== "manager" && role !== "kitchen") return { error: "Role must be 'manager' or 'kitchen'" };
  if (!password || password.length < 6) return { error: "Password must be at least 6 characters" };

  const created = await Staff.create({
    _id: `staff-${nanoid(8)}`,
    username,
    passwordHash: bcrypt.hashSync(password, 10),
    role,
    createdAt: new Date().toISOString()
  });
  return { staff: toStaffJSON(created) };
}

export async function deleteStaff(id) {
  const target = await Staff.findById(id);
  if (!target) return { error: "Staff account not found" };

  // Never remove the last manager — nobody else could create accounts again.
  if (target.role === "manager" && (await countByRole("manager")) <= 1) {
    return { error: "Can't remove the last manager account" };
  }

  await Staff.deleteOne({ _id: id });
  return { deleted: true };
}
