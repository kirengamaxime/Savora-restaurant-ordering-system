import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { Bell, LogOut, ClipboardList, UtensilsCrossed, BellRing, Check, LayoutGrid, BarChart3, Users } from "lucide-react";
import { adminLogin, adminLogout, getPendingHelpRequests, resolveHelpRequest, API_BASE } from "../../api.js";
import KitchenBoard from "../../components/admin/KitchenBoard.jsx";
import MenuManagerPanel from "../../components/admin/MenuManagerPanel.jsx";
import TablesPanel from "../../components/admin/TablesPanel.jsx";
import AnalyticsPanel from "../../components/admin/AnalyticsPanel.jsx";
import StaffManagerPanel from "../../components/admin/StaffManagerPanel.jsx";

const TOKEN_KEY = "savora_admin_token";
const ROLE_KEY = "savora_admin_role";

const ROLE_CONFIG = {
  manager: {
    label: "Manager",
    demoHint: "Demo credentials: manager / manager123",
    tabs: ["orders", "tables", "menu", "analytics", "staff"]
  },
  kitchen: {
    label: "Kitchen",
    demoHint: "Demo credentials: kitchen / kitchen123",
    tabs: ["orders", "tables"]
  }
};

const TAB_META = {
  orders: { label: "Orders", icon: ClipboardList },
  tables: { label: "Tables", icon: LayoutGrid },
  menu: { label: "Menu", icon: UtensilsCrossed },
  analytics: { label: "Analytics", icon: BarChart3 },
  staff: { label: "Staff", icon: Users }
};

// A browser can only hold one active staff session at a time (shared
// localStorage keys) — if the stored role doesn't match what this page
// requires, we treat it as "not logged in here" without touching the
// stored session, so switching back to the other staff URL still works.
function getStoredTokenForRole(requiredRole) {
  const token = localStorage.getItem(TOKEN_KEY);
  const role = localStorage.getItem(ROLE_KEY);
  return role === requiredRole ? token : null;
}

export default function StaffDashboard({ requiredRole }) {
  const config = ROLE_CONFIG[requiredRole];
  const [token, setToken] = useState(() => getStoredTokenForRole(requiredRole));
  const [tab, setTab] = useState(config.tabs[0]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [sessionExpired, setSessionExpired] = useState(false);
  const [helpRequests, setHelpRequests] = useState([]);
  const socketRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    function handleForcedLogout() {
      setToken(null);
      setSessionExpired(true);
    }
    window.addEventListener("savora-admin-logout", handleForcedLogout);
    return () => window.removeEventListener("savora-admin-logout", handleForcedLogout);
  }, []);

  // Help-request alerts are tracked here at the top level (not inside
  // KitchenBoard) so staff see them regardless of which tab they have open.
  useEffect(() => {
    if (!token) return;

    getPendingHelpRequests().then(setHelpRequests).catch(() => {});

    const socket = io(API_BASE);
    socketRef.current = socket;

    socket.on("new-help-request", (request) => {
      setHelpRequests((prev) => [...prev, request]);
      audioRef.current?.play().catch(() => {});
    });

    socket.on("help-request-resolved", (resolved) => {
      setHelpRequests((prev) => prev.filter((r) => r.id !== resolved.id));
    });

    return () => socket.disconnect();
  }, [token]);

  async function handleResolve(id) {
    setHelpRequests((prev) => prev.filter((r) => r.id !== id)); // optimistic — feels instant
    try {
      await resolveHelpRequest(id);
    } catch {
      getPendingHelpRequests().then(setHelpRequests).catch(() => {}); // re-sync on failure
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    try {
      const { token: newToken, role } = await adminLogin(username, password);
      if (role !== requiredRole) {
        setError(`That account doesn't have ${config.label} access.`);
        return;
      }
      localStorage.setItem(TOKEN_KEY, newToken);
      localStorage.setItem(ROLE_KEY, role);
      setToken(newToken);
      setSessionExpired(false);
    } catch {
      setError("Incorrect username or password.");
    }
  }

  function logout() {
    adminLogout(); // best-effort server-side invalidation
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    setToken(null);
    setUsername("");
    setPassword("");
  }

  if (!token) {
    return (
      <div className="screen" style={{ justifyContent: "center", alignItems: "center" }}>
        <form onSubmit={handleLogin} className="card-surface" style={{ padding: 28, width: 320 }}>
          <p className="eyebrow" style={{ color: "var(--accent-dark)" }}>
            Savora {config.label}
          </p>
          <h2 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>{config.label} Login</h2>

          <label htmlFor="u">Username</label>
          <input id="u" type="text" value={username} onChange={(e) => setUsername(e.target.value)} style={{ marginBottom: 14 }} />

          <label htmlFor="p">Password</label>
          <input id="p" type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ marginBottom: 14 }} />

          {sessionExpired && !error && (
            <p style={{ color: "var(--alert)", fontSize: 14 }}>Your session expired — please log in again.</p>
          )}
          {error && <p style={{ color: "var(--alert)", fontSize: 14 }}>{error}</p>}

          <button className="btn btn-primary btn-block" type="submit">
            Log In
          </button>
          <p style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 12 }}>{config.demoHint}</p>
        </form>
      </div>
    );
  }

  return (
    <div className="kitchen-board">
      <audio ref={audioRef} src="/notify.mp3" />

      <div className="kb-header">
        <div className="kb-title">
          Savora {config.label} <span className="live-dot" />
        </div>

        <div className="kb-tabs">
          {config.tabs.map((key) => {
            const meta = TAB_META[key];
            const Icon = meta.icon;
            return (
              <button key={key} className={`kb-tab ${tab === key ? "active" : ""}`} onClick={() => setTab(key)}>
                <Icon size={15} style={{ marginRight: 6, verticalAlign: -3 }} />
                {meta.label}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button className="icon-btn" style={{ borderColor: "var(--kb-border)", color: "var(--kb-ink)", background: "white" }}>
            <Bell size={18} />
            {helpRequests.length > 0 && <span className="icon-badge">{helpRequests.length}</span>}
          </button>
          <button
            className="btn btn-ghost"
            style={{ minHeight: 40, padding: "8px 16px", borderColor: "var(--kb-border)", color: "var(--kb-ink)" }}
            onClick={logout}
          >
            <LogOut size={16} /> Log out
          </button>
        </div>
      </div>

      {helpRequests.length > 0 && (
        <div className="help-alert-bar">
          {helpRequests.map((req) => (
            <div className="help-alert-chip" key={req.id}>
              <BellRing size={16} />
              <span>
                {req.orderType === "dine-in" ? `Table ${req.tableNumber} needs help` : "Takeaway customer needs help"}
              </span>
              <button onClick={() => handleResolve(req.id)} title="Mark resolved">
                <Check size={15} /> Resolve
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === "orders" && (
        <KitchenBoard
          showRevenue={requiredRole === "manager"}
          canManage={requiredRole === "kitchen"}
          canCancel={requiredRole === "manager"}
        />
      )}
      {tab === "tables" && <TablesPanel helpRequests={helpRequests} onResolveHelp={handleResolve} />}
      {tab === "menu" && <MenuManagerPanel />}
      {tab === "analytics" && <AnalyticsPanel />}
      {tab === "staff" && <StaffManagerPanel />}
    </div>
  );
}
