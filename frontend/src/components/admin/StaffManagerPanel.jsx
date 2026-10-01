import { useEffect, useState } from "react";
import { Plus, Trash2, UserPlus } from "lucide-react";
import { getStaffList, addStaffMember, deleteStaffMember } from "../../api.js";

const EMPTY_FORM = { username: "", password: "", role: "kitchen" };

export default function StaffManagerPanel() {
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    loadStaff();
  }, []);

  async function loadStaff() {
    setStaff(await getStaffList());
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await addStaffMember(form.username, form.password, form.role);
      setForm(null);
      loadStaff();
    } catch (err) {
      setError(err.response?.data?.error || "Couldn't add that account — try again.");
    }
  }

  async function handleDelete(member) {
    setDeleteError("");
    if (!confirm(`Remove ${member.username} (${member.role})? They'll be logged out immediately.`)) return;
    try {
      await deleteStaffMember(member.id);
      loadStaff();
    } catch (err) {
      setDeleteError(err.response?.data?.error || "Couldn't remove that account.");
    }
  }

  return (
    <div className="mm-container">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 className="mm-category-title" style={{ margin: 0 }}>
          Staff Accounts
        </h2>
        {!form && (
          <button className="mm-icon-btn" onClick={() => setForm({ ...EMPTY_FORM })} title="Add staff account">
            <Plus size={16} />
          </button>
        )}
      </div>

      {deleteError && (
        <p style={{ color: "var(--alert)", fontSize: 13.5, marginBottom: 14 }}>{deleteError}</p>
      )}

      {form && (
        <form className="mm-form" onSubmit={handleSubmit}>
          <p style={{ fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <UserPlus size={16} /> Add Staff Account
          </p>

          <div className="mm-form-grid">
            <div>
              <label>Username</label>
              <input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
                autoFocus
              />
            </div>
            <div>
              <label>Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="kitchen">Kitchen</option>
                <option value="manager">Manager</option>
              </select>
            </div>
          </div>

          <div className="mm-form-grid full">
            <div>
              <label>Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                minLength={6}
                required
              />
              <p style={{ fontSize: 12, color: "var(--kb-ink-soft)", marginTop: 4 }}>At least 6 characters.</p>
            </div>
          </div>

          {error && <p style={{ color: "var(--alert)", fontSize: 13.5, marginBottom: 10 }}>{error}</p>}

          <div style={{ display: "flex", gap: 10 }}>
            <button type="submit" className="btn btn-primary" style={{ minHeight: 44 }}>
              Add Account
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ minHeight: 44, borderColor: "var(--kb-border)", color: "var(--kb-ink)" }}
              onClick={() => {
                setForm(null);
                setError("");
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {staff.map((member) => (
        <div className="mm-row" key={member.id}>
          <div className="mm-row-body">
            <p className="mm-row-name">{member.username}</p>
            <span
              className="mm-row-price"
              style={{ textTransform: "capitalize", color: member.role === "manager" ? "var(--accent-dark)" : "var(--kb-ink-soft)" }}
            >
              {member.role}
            </span>
          </div>
          <div className="mm-row-actions">
            <span style={{ fontSize: 12, color: "var(--kb-ink-soft)" }}>
              Added {new Date(member.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
            </span>
            <button className="mm-icon-btn danger" onClick={() => handleDelete(member)} title="Remove">
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
