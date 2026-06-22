import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const WRITER_LINKS = [
  { to: "/writer/dashboard", icon: "pi pi-home", label: "Dashboard" },
  {
    to: "/writer/cases/create",
    icon: "pi pi-file-plus",
    label: "Register Case",
  },
  { to: "/writer/cases", icon: "pi pi-folder-open", label: "My Cases" },
  { to: "/blockchain", icon: "pi pi-link", label: "Blockchain" },
  { to: "/about", icon: "pi pi-info-circle", label: "About" },
];

const JUDGE_LINKS = [
  { to: "/judge/dashboard", icon: "pi pi-home", label: "Dashboard" },
  { to: "/judge/priority", icon: "pi pi-chart-line", label: "Priority Queue" },
  { to: "/judge/schedule", icon: "pi pi-calendar", label: "My Schedule" },
  { to: "/blockchain", icon: "pi pi-link", label: "Blockchain" },
  { to: "/about", icon: "pi pi-info-circle", label: "About" },
];

const ADMIN_LINKS = [
  { to: "/admin/dashboard", icon: "pi pi-shield", label: "Dashboard" },
  { to: "/writer/cases", icon: "pi pi-folder-open", label: "All Cases" },
  { to: "/judge/priority", icon: "pi pi-chart-line", label: "Priority Queue" },
  {
    to: "/writer/cases/create",
    icon: "pi pi-file-plus",
    label: "Register Case",
  },
  { to: "/blockchain", icon: "pi pi-link", label: "Blockchain" },
  { to: "/about", icon: "pi pi-info-circle", label: "About" },
];

const ADVOCATE_LINKS = [
  { to: "/advocate/dashboard", icon: "pi pi-home", label: "Dashboard" },
  { to: "/advocate/cases", icon: "pi pi-briefcase", label: "My Cases" },
  { to: "/advocate/victims", icon: "pi pi-users", label: "Victim Management" },
  { to: "/blockchain", icon: "pi pi-link", label: "Blockchain" },
  { to: "/about", icon: "pi pi-info-circle", label: "About" },
];

export default function AppSidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const links =
    user?.role === "judge"
      ? JUDGE_LINKS
      : user?.role === "admin"
        ? ADMIN_LINKS
        : user?.role === "advocate"
          ? ADVOCATE_LINKS
          : WRITER_LINKS;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  const roleLabel =
    user?.role === "judge"
      ? "Judge View"
      : user?.role === "admin"
        ? "Admin View"
        : user?.role === "clerk"
          ? "Clerk View"
          : user?.role === "advocate"
            ? "Advocate View"
            : "Writer View";

  return (
    <aside className={`app-sidebar ${open ? "sidebar-open" : ""}`}>
      <div className="sidebar-header">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2 style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <img
              src="/logo.jpeg"
              alt="Logo"
              style={{
                width: "28px",
                height: "28px",
                objectFit: "contain",
                borderRadius: "50%",
                background:
                  "linear-gradient(180deg, #FF9933 0%, #FFFFFF 50%, #138808 100%)",
                padding: "2px",
                filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.25))",
              }}
            />
            <span>
              <span style={{ color: "#FF9933", fontWeight: 800 }}>Le</span>
              <span
                style={{
                  color: "#FFFFFF",
                  textShadow: "0 0 4px rgba(0,0,0,0.35)",
                }}
              >
                gi
              </span>
              <span style={{ color: "#138808", fontWeight: 800 }}>ra</span>
            </span>
          </h2>
          <button
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <i className="pi pi-times" />
          </button>
        </div>
        <p>{roleLabel}</p>
        <div className="sidebar-flag-bar" />
      </div>

      <ul className="sidebar-nav">
        <li>
          <span className="nav-section-label">Navigation</span>
        </li>
        {links.map((link) => (
          <li key={link.to}>
            <NavLink
              to={link.to}
              className={({ isActive }) => (isActive ? "active" : "")}
              onClick={handleNavClick}
            >
              <i className={link.icon} />
              {link.label}
            </NavLink>
          </li>
        ))}

        <li>
          <span className="nav-section-label">Account</span>
        </li>
        <li>
          <button onClick={handleLogout}>
            <i
              className="pi pi-sign-out"
              style={{ color: "rgba(255,153,51,0.7)" }}
            />
            Sign Out
          </button>
        </li>
      </ul>

      <div className="sidebar-user-panel">
        <div className="sidebar-user-avatar">
          {user?.name?.[0]?.toUpperCase() || "U"}
        </div>
        <div>
          <div className="sidebar-user-name">{user?.name}</div>
          <div className="sidebar-user-email">{user?.email}</div>
        </div>
      </div>
    </aside>
  );
}
