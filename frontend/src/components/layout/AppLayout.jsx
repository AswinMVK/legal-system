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
      <div className="app-main" style={{ minHeight: "100vh", paddingBottom: "3.5rem" }}>
        <AppTopBar onMenuToggle={toggleSidebar} />
        <div className="page-content">
          <Outlet />
        </div>
      </div>
      <AIChatPanel />
      
      {/* Fixed Bottom Marquee */}
      <div style={{ 
        position: "fixed", 
        bottom: 0, 
        left: 0, 
        width: "100%", 
        overflow: "hidden", 
        zIndex: 9999, 
        backgroundColor: "rgba(0, 15, 137, 0.95)", 
        padding: "8px 0",
        borderTop: "2px solid #FF9933",
        boxShadow: "0 -4px 12px rgba(0,0,0,0.15)",
        backdropFilter: "blur(4px)"
      }}>
        <marquee behavior="scroll" direction="left" style={{ color: "#FF9933", fontWeight: "bold", fontSize: "1.05rem", margin: 0 }}>
          Developed by &nbsp;
          <a href="https://aswin-portfoli.netlify.app/" target="_blank" rel="noopener noreferrer" style={{ color: "#FFFFFF", textDecoration: "underline", fontWeight: "800" }}>
            Aswin MVK
          </a> 
          &nbsp; — Click to view my portfolio repository and digital showcases!
        </marquee>
      </div>
    </div>
  );
}
