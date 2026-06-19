import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { Skeleton } from "primereact/skeleton";
import gsap from "gsap";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { advocateAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import StatusBadge from "../../components/common/StatusBadge";

const SIDE_COLORS = { prosecution: "#FF6B00", defense: "#003087" };
const STATUS_COLORS = ["#138808", "#6B7280", "#003087", "#FF6B00"];

export default function AdvocateDashboard() {
  const [cases, setCases] = useState([]);
  const [victims, setVictims] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useRef(null);
  const pageRef = useRef(null);

  useEffect(() => {
    if (loading) return;
    const ctx = gsap.context(() => {
      gsap.from(".banner-advocate", {
        y: -30,
        opacity: 0,
        duration: 0.6,
        ease: "power3.out",
      });
      gsap.from(".stat-card", {
        y: 30,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        delay: 0.2,
        ease: "back.out(1.4)",
      });
      gsap.from(".p-card", {
        y: 20,
        opacity: 0,
        duration: 0.5,
        stagger: 0.15,
        delay: 0.45,
        ease: "power2.out",
      });
    }, pageRef);
    return () => ctx.revert();
  }, [loading]);

  useEffect(() => {
    (async () => {
      try {
        const [casesRes, victimsRes] = await Promise.all([
          advocateAPI.getMyCases(),
          advocateAPI.getMyVictims(),
        ]);
        setCases(casesRes.data.cases || casesRes.data || []);
        setVictims(victimsRes.data.victims || victimsRes.data || []);
      } catch {
        toast.current?.show({
          severity: "error",
          summary: "Failed to load dashboard data.",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const activeCases = cases.filter(
    (c) => c.status !== "closed" && c.status !== "disposed",
  );
  const defenseCases = cases.filter((c) => c.side === "defense");
  const prosecutionCases = cases.filter((c) => c.side === "prosecution");
  const vulnerableVictims = victims.filter(
    (v) => v.vulnerability_score >= 5 || v.health_flag || v.disability_flag,
  );

  const statusData = (() => {
    const map = {};
    cases.forEach((c) => {
      const s = c.status || "unknown";
      map[s] = (map[s] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  })();

  const sideData = [
    { name: "Defense", value: defenseCases.length },
    { name: "Prosecution", value: prosecutionCases.length },
  ];

  const STAT_CARDS = [
    {
      label: "Total Cases",
      value: cases.length,
      icon: "pi pi-briefcase",
      color: "#000080",
      bg: "#eef0fb",
    },
    {
      label: "Active Cases",
      value: activeCases.length,
      icon: "pi pi-circle-fill",
      color: "#138808",
      bg: "#e9f7e9",
    },
    {
      label: "Victims Represented",
      value: victims.length,
      icon: "pi pi-users",
      color: "#FF6B00",
      bg: "#fff5e8",
    },
    {
      label: "Vulnerable Victims",
      value: vulnerableVictims.length,
      icon: "pi pi-exclamation-triangle",
      color: "#D32F2F",
      bg: "#fdecea",
    },
  ];

  if (loading) {
    return (
      <div ref={pageRef} style={{ padding: "1.5rem" }}>
        <Skeleton width="100%" height="90px" className="mb-3" />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: "1rem",
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height="100px" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={pageRef}>
      <Toast ref={toast} />

      {/* Banner */}
      <div
        className="banner-advocate"
        style={{
          background:
            "linear-gradient(135deg, #000080 0%, #003087 50%, #138808 100%)",
          color: "#fff",
          padding: "1.5rem 2rem",
          borderRadius: "12px",
          marginBottom: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: "1.4rem" }}>
            <i className="pi pi-user-edit" style={{ marginRight: "0.5rem" }} />
            Welcome, {user?.name || "Advocate"}
          </h2>
          <p
            style={{ margin: "0.3rem 0 0", opacity: 0.85, fontSize: "0.85rem" }}
          >
            Manage your cases and represent victims effectively
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Button
            label="My Cases"
            icon="pi pi-folder-open"
            className="p-button-outlined"
            style={{ color: "#fff", borderColor: "#fff" }}
            onClick={() => navigate("/advocate/cases")}
          />
          <Button
            label="Victim Requests"
            icon="pi pi-users"
            className="p-button-outlined"
            style={{ color: "#fff", borderColor: "#fff" }}
            onClick={() => navigate("/advocate/victims")}
          />
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
        className="advocate-stat-grid"
      >
        {STAT_CARDS.map((sc) => (
          <div
            key={sc.label}
            className="stat-card"
            style={{
              background: sc.bg,
              borderRadius: "12px",
              padding: "1.2rem",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              border: `1px solid ${sc.color}20`,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: sc.color + "18",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <i
                className={sc.icon}
                style={{ fontSize: "1.2rem", color: sc.color }}
              />
            </div>
            <div>
              <div
                style={{ fontSize: "1.5rem", fontWeight: 700, color: sc.color }}
              >
                {sc.value}
              </div>
              <div style={{ fontSize: "0.78rem", color: "#6B7280" }}>
                {sc.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.5fr 1fr",
          gap: "1.5rem",
          marginBottom: "1.5rem",
        }}
        className="advocate-main-grid"
      >
        {/* Recent Cases Table */}
        <Card title="My Active Cases" className="shadow-1">
          <DataTable
            value={activeCases.slice(0, 8)}
            size="small"
            stripedRows
            emptyMessage="No active cases assigned."
            rowHover
            onRowClick={(e) => navigate(`/advocate/cases/${e.data.case_id}`)}
            style={{ cursor: "pointer" }}
          >
            <Column
              field="case_number"
              header="Case #"
              style={{ width: "120px" }}
            />
            <Column field="case_title" header="Title" />
            <Column
              field="side"
              header="Side"
              body={(row) => (
                <Tag
                  value={row.side}
                  style={{
                    background: SIDE_COLORS[row.side] || "#6B7280",
                    color: "#fff",
                    fontSize: "0.7rem",
                  }}
                />
              )}
              style={{ width: "100px" }}
            />
            <Column
              field="status"
              header="Status"
              body={(row) => <StatusBadge status={row.status} />}
              style={{ width: "120px" }}
            />
          </DataTable>
        </Card>

        {/* Charts */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Card title="Case Distribution" className="shadow-1">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={sideData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  <Cell fill="#003087" />
                  <Cell fill="#FF6B00" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Cases by Status" className="shadow-1">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {statusData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={STATUS_COLORS[i % STATUS_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>

      {/* Vulnerable Victims Alert */}
      {vulnerableVictims.length > 0 && (
        <Card
          title={
            <span>
              <i
                className="pi pi-exclamation-triangle"
                style={{ color: "#D32F2F", marginRight: "0.5rem" }}
              />
              Vulnerable Victims — Immediate Attention
            </span>
          }
          className="shadow-1"
          style={{ marginBottom: "1.5rem" }}
        >
          <DataTable value={vulnerableVictims} size="small" stripedRows>
            <Column field="name" header="Name" />
            <Column
              field="case_number"
              header="Case #"
              body={(row) => row.case_number || `Case ${row.case_id}`}
            />
            <Column field="age" header="Age" style={{ width: "60px" }} />
            <Column field="gender" header="Gender" style={{ width: "80px" }} />
            <Column
              field="vulnerability_score"
              header="Vulnerability"
              body={(row) => (
                <Tag
                  value={`Score: ${row.vulnerability_score}`}
                  severity={row.vulnerability_score >= 7 ? "danger" : "warning"}
                />
              )}
              style={{ width: "120px" }}
            />
            <Column
              header="Flags"
              body={(row) => (
                <div style={{ display: "flex", gap: "0.3rem" }}>
                  {row.health_flag && (
                    <Tag
                      value="Health"
                      severity="danger"
                      style={{ fontSize: "0.65rem" }}
                    />
                  )}
                  {row.disability_flag && (
                    <Tag
                      value="Disability"
                      severity="warning"
                      style={{ fontSize: "0.65rem" }}
                    />
                  )}
                </div>
              )}
              style={{ width: "140px" }}
            />
            <Column
              header="Action"
              body={(row) => (
                <Button
                  icon="pi pi-eye"
                  className="p-button-text p-button-sm"
                  tooltip="View Details"
                  onClick={() => navigate("/advocate/victims")}
                />
              )}
              style={{ width: "80px" }}
            />
          </DataTable>
        </Card>
      )}
    </div>
  );
}
