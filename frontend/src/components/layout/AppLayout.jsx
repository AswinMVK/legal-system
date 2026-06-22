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
          <div style={{ width: "100%", overflow: "hidden", marginTop: "3rem", borderTop: "1px solid #e2e8f0", paddingTop: "1rem" }}>
            <marquee behavior="scroll" direction="left" style={{ color: "#FF9933", fontWeight: "bold", fontSize: "1.1rem" }}>
              Developed by &nbsp;
              <a href="https://github.com/AswinMVK" target="_blank" rel="noopener noreferrer" style={{ color: "#000F89", textDecoration: "underline", fontWeight: "800" }}>
                Aswin MVK
              </a> 
              &nbsp; — Click to view my portfolio repository and digital showcases!
            </marquee>
          </div>
        </div>
      </div>
      <AIChatPanel />
    </div>
  );
}
