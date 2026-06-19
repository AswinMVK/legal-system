import React, { useState, useCallback } from "react";
import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import AppTopBar from "./AppTopBar";
import AIChatPanel from "../chat/AIChatPanel";

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = useCallback(() => setSidebarOpen((p) => !p), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div style={{ display: "flex" }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar} />
      )}
      <AppSidebar open={sidebarOpen} onClose={closeSidebar} />
      <div className="app-main">
        <AppTopBar onMenuToggle={toggleSidebar} />
        <div className="page-content">
          <Outlet />
        </div>
      </div>
      <AIChatPanel />
    </div>
  );
}
