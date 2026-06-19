import React from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const PAGE_TITLES = {
  "/writer/dashboard": { label: "Dashboard", icon: "pi-home" },
  "/writer/cases/create": { label: "Register New Case", icon: "pi-file-plus" },
  "/writer/cases": { label: "My Cases", icon: "pi-folder-open" },
  "/judge/dashboard": { label: "Judge Dashboard", icon: "pi-home" },
  "/judge/priority": { label: "Priority Queue", icon: "pi-chart-line" },
  "/judge/schedule": { label: "Hearing Schedule", icon: "pi-calendar" },
  "/admin/dashboard": { label: "Admin Dashboard", icon: "pi-shield" },
  "/advocate/dashboard": { label: "Advocate Dashboard", icon: "pi-home" },
  "/advocate/cases": { label: "My Cases", icon: "pi-briefcase" },
  "/advocate/victims": { label: "Victim Management", icon: "pi-users" },
};

const roleMeta = {
  admin: { label: "Administrator", color: "#7c3aed", bg: "#f5f3ff" },
  judge: { label: "Judge", color: "#003087", bg: "#E8EAF6" },
  writer: { label: "Writer/Clerk", color: "#138808", bg: "#E8F5E9" },
  clerk: { label: "Clerk", color: "#138808", bg: "#E8F5E9" },
  advocate: { label: "Advocate", color: "#FF6B00", bg: "#FFF3E0" },
};

export default function AppTopBar() {
  const { user } = useAuth();
  const location = useLocation();

  const pageInfo =
    PAGE_TITLES[location.pathname] ||
    (location.pathname.startsWith("/judge/cases/") ||
    location.pathname.startsWith("/cases/")
      ? { label: "Case Details", icon: "pi-briefcase" }
      : location.pathname.startsWith("/advocate/cases/")
        ? { label: "Case Details", icon: "pi-briefcase" }
        : { label: "Legira", icon: "pi-building" });

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const meta = roleMeta[user?.role] || roleMeta.writer;

  return (
    <div className="app-topbar">
      <div className="topbar-left">
        <h1>
          <img
            src="/logo.jpeg"
            alt="Logo"
            style={{
              width: "24px",
              height: "24px",
              objectFit: "contain",
              verticalAlign: "middle",
              marginRight: "0.5rem",
              borderRadius: "50%",
              background:
                "linear-gradient(180deg, #FF9933 0%, #FFFFFF 50%, #138808 100%)",
              padding: "2px",
              filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.2))",
            }}
          />
          <i
            className={`pi ${pageInfo.icon}`}
            style={{ marginRight: "0.5rem", color: "#FF9933" }}
          />
          {pageInfo.label}
        </h1>
        <div
          style={{ fontSize: "0.72rem", color: "#9090A0", marginTop: "2px" }}
        >
          <i
            className="pi pi-calendar"
            style={{ marginRight: 4, fontSize: "0.65rem" }}
          />
          {today}
        </div>
      </div>
      <div className="topbar-right">
        <span
          className="topbar-role-badge"
          style={{
            background: meta.bg,
            color: meta.color,
            borderColor: meta.color + "30",
          }}
        >
          <i
            className="pi pi-user"
            style={{ marginRight: 5, fontSize: "0.7rem" }}
          />
          {meta.label}
        </span>
      </div>
    </div>
  );
}
