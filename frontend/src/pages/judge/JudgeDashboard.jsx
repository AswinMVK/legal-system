import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Toast } from "primereact/toast";
import { Skeleton } from "primereact/skeleton";
import { Badge } from "primereact/badge";
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
import gsap from "gsap";
import { casesAPI, hearingsAPI, priorityAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import StatusBadge from "../../components/common/StatusBadge";

const PRIORITY_COLORS = {
  CRITICAL: "#DC2626",
  HIGH: "#FF6B00",
  MEDIUM: "#CA8A04",
  LOW: "#138808",
};

export default function JudgeDashboard() {
  const [stats, setStats] = useState(null);
  const [today, setToday] = useState([]);
  const [priority, setPriority] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useRef(null);
  const pageRef = useRef(null);

  /* GSAP entrance animation */
  useEffect(() => {
    if (loading) return;
    const ctx = gsap.context(() => {
      gsap.from(".banner-navy", {
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
    const judgeId = user?.judge_id;
    (async () => {
      try {
        const promises = [
          casesAPI.getStats(),
          priorityAPI
            .getCases({ judge_id: judgeId, limit: 5 })
            .catch(() => ({ data: [] })),
        ];
        if (judgeId)
          promises.push(
            hearingsAPI.getToday(judgeId).catch(() => ({ data: [] })),
          );

        const [statsRes, prioRes, todayRes] = await Promise.all(promises);
        setStats(statsRes.data);
        setPriority(prioRes.data.slice(0, 5));
        setToday(todayRes?.data || []);
      } catch {
        toast.current?.show({
          severity: "error",
          summary: "Failed to load dashboard.",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const STAT_CARDS = [
    {
      label: "My Cases",
      value: stats?.totals?.total || 0,
      icon: "pi pi-folder",
      color: "#000080",
      bg: "#eef0fb",
      statClass: "stat-navy",
    },
    {
      label: "Active",
      value: stats?.totals?.active || 0,
      icon: "pi pi-circle-fill",
      color: "#138808",
      bg: "#e9f7e9",
      statClass: "stat-green",
    },
    {
      label: "Today's Hearings",
      value: today.length,
      icon: "pi pi-calendar",
      color: "#FF6B00",
      bg: "#fff5e8",
      statClass: "stat-saffron",
    },
    {
      label: "Closed",
      value: stats?.totals?.closed || 0,
      icon: "pi pi-check-circle",
      color: "#000F89",
      bg: "#e8ecff",
      statClass: "stat-chakra",
    },
  ];

  const clusterTag = (c) => {
    const map = { 0: "CRITICAL", 1: "HIGH", 2: "MEDIUM", 3: "LOW" };
    const sev = { 0: "danger", 1: "warning", 2: "info", 3: "success" };
    const val = c?.computed_cluster ?? c?.priority_cluster;
    const lbl = c?.cluster_label || map[val] || "LOW";
    return <Tag value={lbl} severity={sev[val] ?? "info"} />;
  };

  return (
    <div ref={pageRef}>
      <Toast ref={toast} />

      {/* Banner */}
      <div className="banner-navy">
        <div>
          <h2 style={{ color: "#fff", margin: 0, fontSize: "1.3rem" }}>
            <i className="pi pi-star" style={{ marginRight: 10 }} />
            Justice {user?.name}
          </h2>
          <p style={{ color: "rgba(255,255,255,0.82)", margin: "0.3rem 0 0" }}>
            Judge Dashboard — You have {today.length} hearing(s) today.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Button
            label="Priority Queue"
            icon="pi pi-sort-amount-up"
            onClick={() => navigate("/judge/priority")}
            className="banner-btn-white"
          />
          <Button
            label="My Schedule"
            icon="pi pi-calendar"
            onClick={() => navigate("/judge/schedule")}
            outlined
            style={{ color: "#fff", borderColor: "rgba(255,255,255,0.5)" }}
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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1.5rem",
        }}
      >
        {/* Top Priority Cases */}
        <Card title="⚡ Top Priority Cases">
          <DataTable
            value={priority}
            loading={loading}
            emptyMessage="No priority data."
            rowHover
            onRowClick={(e) => navigate(`/judge/cases/${e.data.case_id}`)}
            style={{ cursor: "pointer" }}
          >
            <Column field="priority_rank" header="#" style={{ width: 40 }} />
            <Column
              field="case_id"
              header="Case"
              body={(r) => `#${r.case_id}`}
            />
            <Column field="offense_type" header="Offense" />
            <Column
              header="Priority"
              body={clusterTag}
              style={{ width: 100 }}
            />
            <Column
              field="computed_priority_score"
              header="Score"
              body={(r) => (
                <strong style={{ color: "#2563eb" }}>
                  {r.computed_priority_score}
                </strong>
              )}
            />
          </DataTable>
          <div style={{ marginTop: "0.75rem" }}>
            <Button
              label="View Full Queue"
              text
              icon="pi pi-arrow-right"
              iconPos="right"
              onClick={() => navigate("/judge/priority")}
            />
          </div>
        </Card>

        {/* Today's Hearings */}
        <Card title="📅 Today's Hearings">
          {loading ? (
            Array(3)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} height="3rem" style={{ marginBottom: 8 }} />
              ))
          ) : today.length === 0 ? (
            <div
              style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}
            >
              <i
                className="pi pi-calendar"
                style={{ fontSize: "2rem", marginBottom: "0.5rem" }}
              />
              <br />
              No hearings scheduled for today.
            </div>
          ) : (
            today.map((h) => (
              <div
                key={h.schedule_id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.75rem",
                  background: "#f8fafc",
                  borderRadius: 8,
                  marginBottom: 8,
                  border: "1px solid #e2e8f0",
                  cursor: "pointer",
                }}
                onClick={() => navigate(`/judge/cases/${h.case_id}`)}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                    Case #{h.case_id} — {h.case_type}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                    {h.time_slot || "No time set"} · {h.court_name}
                  </div>
                </div>
                <StatusBadge status={h.scheduling_status} />
              </div>
            ))
          )}
          <div style={{ marginTop: "0.75rem" }}>
            <Button
              label="Full Schedule"
              text
              icon="pi pi-arrow-right"
              iconPos="right"
              onClick={() => navigate("/judge/schedule")}
            />
          </div>
        </Card>
      </div>

      {/* ── Analytics row ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1.5rem",
          marginTop: "1.5rem",
        }}
      >
        {/* Top 5 cases by priority score */}
        <Card title="Top 5 Cases by Priority Score">
          {loading ? (
            <Skeleton height="200px" />
          ) : priority.length === 0 ? (
            <div
              style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}
            >
              No priority data available.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={priority.map((p) => ({
                  name: `#${p.case_id}`,
                  score: Number(p.computed_priority_score) || 0,
                  label: p.cluster_label || "LOW",
                }))}
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
                  formatter={(v, _, props) => [
                    `Score: ${v}`,
                    props.payload.label,
                  ]}
                />
                <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                  {priority.map((p, i) => {
                    const lbl = p.cluster_label || "LOW";
                    return (
                      <Cell key={i} fill={PRIORITY_COLORS[lbl] || "#0047AB"} />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Case status pie */}
        <Card title="My Cases — Status Overview">
          {loading ? (
            <Skeleton height="200px" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
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
                  outerRadius={72}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {["#138808", "#6B7280", "#003087"].map((fill, i) => (
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
  );
}
