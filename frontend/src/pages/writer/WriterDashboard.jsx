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
import { casesAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import StatusBadge from "../../components/common/StatusBadge";

const STATUS_COLORS = ["#138808", "#6B7280", "#003087", "#FF6B00"];

export default function WriterDashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useRef(null);
  const pageRef = useRef(null);

  /* GSAP entrance animation */
  useEffect(() => {
    if (loading) return;
    const ctx = gsap.context(() => {
      gsap.from(".banner-saffron", {
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
        const [statsRes, casesRes] = await Promise.all([
          casesAPI.getStats(),
          casesAPI.getAll({ limit: 5 }),
        ]);
        setStats(statsRes.data);
        setRecent(casesRes.data.cases || []);
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

  const STAT_CARDS = [
    {
      label: "Total Cases",
      value: stats?.totals?.total || 0,
      icon: "pi pi-folder",
      color: "#000080",
      bg: "#eef0fb",
      statClass: "stat-navy",
    },
    {
      label: "Active Cases",
      value: stats?.totals?.active || 0,
      icon: "pi pi-circle-fill",
      color: "#138808",
      bg: "#e9f7e9",
      statClass: "stat-green",
    },
    {
      label: "Closed Cases",
      value: stats?.totals?.closed || 0,
      icon: "pi pi-check-circle",
      color: "#FF6B00",
      bg: "#fff5e8",
      statClass: "stat-saffron",
    },
    {
      label: "Registered",
      value: stats?.totals?.registered || 0,
      icon: "pi pi-file-plus",
      color: "#000F89",
      bg: "#e8ecff",
      statClass: "stat-chakra",
    },
  ];

  return (
    <div ref={pageRef}>
      <Toast ref={toast} />

      {/* Welcome banner */}
      <div className="banner-saffron">
        <div>
          <h2 style={{ color: "#fff", margin: 0, fontSize: "1.3rem" }}>
            <i className="pi pi-file-edit" style={{ marginRight: 10 }} />
            Welcome back, {user?.name}
          </h2>
          <p style={{ color: "rgba(255,255,255,0.82)", margin: "0.3rem 0 0" }}>
            Manage and register criminal cases efficiently.
          </p>
        </div>
        <Button
          label="Register New Case"
          icon="pi pi-plus"
          onClick={() => navigate("/writer/cases/create")}
          className="banner-btn-white"
        />
      </div>

      {/* Stats */}
      <div
        className="form-grid-2"
        style={{
          gridTemplateColumns: "repeat(4, 1fr)",
          marginBottom: "1.5rem",
        }}
      >
        {STAT_CARDS.map((card) => (
          <div key={card.label} className={`stat-card ${card.statClass}`}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "0.75rem",
              }}
            >
              <div className="stat-icon" style={{ background: card.bg }}>
                <i className={card.icon} style={{ color: card.color }} />
              </div>
            </div>
            {loading ? (
              <Skeleton height="2rem" />
            ) : (
              <div className="stat-value" style={{ color: card.color }}>
                {card.value}
              </div>
            )}
            <div className="stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
        <Button
          label="Register Case"
          icon="pi pi-plus-circle"
          onClick={() => navigate("/writer/cases/create")}
        />
        <Button
          label="View All Cases"
          icon="pi pi-list"
          outlined
          onClick={() => navigate("/writer/cases")}
        />
      </div>

      {/* Recent Cases + Charts */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.6fr 1fr",
          gap: "1.5rem",
        }}
      >
        <Card
          title="Recently Registered Cases"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
        >
          <DataTable
            value={recent}
            loading={loading}
            emptyMessage="No cases registered yet."
            paginator={false}
            rowHover
            onRowClick={(e) => navigate(`/cases/${e.data.case_id}`)}
            style={{ cursor: "pointer" }}
          >
            <Column
              field="case_id"
              header="Case ID"
              style={{ width: "80px" }}
              body={(r) => `#${r.case_id}`}
            />
            <Column field="case_type" header="Type" />
            <Column
              field="offense_type"
              header="Offense"
              style={{ maxWidth: 200 }}
            />
            <Column field="court_name" header="Court" />
            <Column
              field="filing_date"
              header="Filed On"
              body={(r) => r.filing_date?.split("T")[0] || "—"}
            />
            <Column
              field="current_status"
              header="Status"
              body={(r) => <StatusBadge status={r.current_status} />}
            />
          </DataTable>
        </Card>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
          {/* Bar chart — case status */}
          <Card title="Case Status Breakdown">
            {loading ? (
              <Skeleton height="180px" />
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={[
                    { name: "Active", value: stats?.totals?.active || 0 },
                    { name: "Closed", value: stats?.totals?.closed || 0 },
                    {
                      name: "Registered",
                      value: stats?.totals?.registered || 0,
                    },
                  ]}
                  margin={{ top: 8, right: 10, left: -20, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0E8" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fontWeight: 600 }}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1.5px solid #C8CADC",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {["#138808", "#6B7280", "#003087"].map((fill, i) => (
                      <Cell key={i} fill={fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Pie chart — proportional */}
          <Card title="Case Distribution">
            {loading ? (
              <Skeleton height="190px" />
            ) : (
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Active", value: stats?.totals?.active || 0 },
                      { name: "Closed", value: stats?.totals?.closed || 0 },
                      {
                        name: "Registered",
                        value: stats?.totals?.registered || 0,
                      },
                    ].filter((d) => d.value > 0)}
                    cx="50%"
                    cy="45%"
                    outerRadius={68}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {STATUS_COLORS.map((fill, i) => (
                      <Cell key={i} fill={fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1.5px solid #C8CADC",
                      fontSize: 12,
                    }}
                  />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
