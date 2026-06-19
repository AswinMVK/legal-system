import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { ProgressBar } from "primereact/progressbar";
import { Toolbar } from "primereact/toolbar";
import { priorityAPI, judgesAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import StatusBadge from "../../components/common/StatusBadge";

const CLUSTER_MAP = {
  0: { label: "CRITICAL", severity: "danger", color: "#ef4444" },
  1: { label: "HIGH", severity: "warning", color: "#f97316" },
  2: { label: "MEDIUM", severity: "info", color: "#eab308" },
  3: { label: "LOW", severity: "success", color: "#22c55e" },
};

const FILTER_OPTIONS = [
  { label: "All Clusters", value: "" },
  { label: "Critical", value: 0 },
  { label: "High", value: 1 },
  { label: "Medium", value: 2 },
  { label: "Low", value: 3 },
];

export default function PriorityQueue() {
  const [cases, setCases] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cluster, setCluster] = useState("");
  const [search, setSearch] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useRef(null);

  const fetchPriority = async () => {
    setLoading(true);
    try {
      const params = {};
      if (user?.judge_id) params.judge_id = user.judge_id;
      const res = await priorityAPI.getCases(params);
      setCases(res.data);
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Could not load priority data. Is Flask API running?",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPriority();
  }, []);

  useEffect(() => {
    let data = [...cases];
    if (cluster !== "")
      data = data.filter((c) => c.computed_cluster === cluster);
    if (search)
      data = data.filter((c) =>
        `${c.case_id} ${c.offense_type} ${c.case_type}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      );
    setFiltered(data);
  }, [cases, cluster, search]);

  const leftToolbar = (
    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <InputText
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 220 }}
        />
      </span>
      <Dropdown
        value={cluster}
        options={FILTER_OPTIONS}
        onChange={(e) => setCluster(e.value)}
        style={{ width: 160 }}
      />
    </div>
  );

  const rightToolbar = (
    <Button
      label="Refresh"
      icon="pi pi-refresh"
      outlined
      onClick={fetchPriority}
      loading={loading}
    />
  );

  const scoreBody = (row) => (
    <div style={{ minWidth: 120 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: 2,
        }}
      >
        <strong
          style={{
            color: CLUSTER_MAP[row.computed_cluster]?.color,
            fontSize: "0.9rem",
          }}
        >
          {row.computed_priority_score}
        </strong>
        <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>/100</span>
      </div>
      <ProgressBar
        value={row.computed_priority_score}
        showValue={false}
        style={{ height: 6 }}
        color={CLUSTER_MAP[row.computed_cluster]?.color}
      />
    </div>
  );

  const clusterBody = (row) => {
    const c = CLUSTER_MAP[row.computed_cluster];
    return c ? <Tag value={c.label} severity={c.severity} /> : "—";
  };

  const rankBody = (row) => (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        background: CLUSTER_MAP[row.computed_cluster]?.color,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: "0.8rem",
      }}
    >
      {row.priority_rank}
    </div>
  );

  const overstayBody = (row) =>
    row.overstay_flag ? (
      <Tag value="OVERSTAY ⚠️" severity="danger" />
    ) : (
      <Tag value="Normal" severity="success" />
    );

  return (
    <div>
      <Toast ref={toast} />

      {/* Summary chips */}
      {!loading && (
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            marginBottom: "1rem",
            flexWrap: "wrap",
          }}
        >
          {Object.entries(CLUSTER_MAP).map(([k, v]) => {
            const cnt = cases.filter(
              (c) => c.computed_cluster === parseInt(k),
            ).length;
            return (
              <div
                key={k}
                style={{
                  background: "#fff",
                  border: `2px solid ${v.color}`,
                  borderRadius: 8,
                  padding: "0.5rem 1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  cursor: "pointer",
                }}
                onClick={() =>
                  setCluster(cluster === parseInt(k) ? "" : parseInt(k))
                }
              >
                <span style={{ color: v.color, fontWeight: 700 }}>{cnt}</span>
                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                  {v.label}
                </span>
              </div>
            );
          })}
          <div
            style={{
              background: "#f8fafc",
              borderRadius: 8,
              padding: "0.5rem 1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span style={{ fontWeight: 700, color: "#1e293b" }}>
              {cases.length}
            </span>
            <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Total</span>
          </div>
        </div>
      )}

      <Toolbar
        start={leftToolbar}
        end={rightToolbar}
        style={{ marginBottom: "1rem", borderRadius: 8 }}
      />

      <DataTable
        value={filtered}
        loading={loading}
        paginator
        rows={25}
        rowsPerPageOptions={[10, 25, 50, 100]}
        emptyMessage="No cases in priority queue. Make sure Flask API is running."
        rowHover
        sortField="computed_priority_score"
        sortOrder={-1}
        onRowClick={(e) => navigate(`/judge/cases/${e.data.case_id}`)}
        style={{ cursor: "pointer" }}
      >
        <Column header="Rank" body={rankBody} style={{ width: 60 }} />
        <Column
          field="case_id"
          header="Case #"
          body={(r) => `#${r.case_id}`}
          style={{ width: 80 }}
        />
        <Column field="case_type" header="Type" style={{ width: 120 }} />
        <Column field="offense_type" header="Offense" />
        <Column
          field="judge_name"
          header="Judge"
          body={(r) => r.judge_name || "—"}
        />
        <Column
          header="Priority"
          body={clusterBody}
          style={{ width: 100 }}
          sortable
          field="computed_cluster"
        />
        <Column
          header="Score"
          body={scoreBody}
          style={{ width: 160 }}
          sortable
          field="computed_priority_score"
        />
        <Column header="Overstay" body={overstayBody} style={{ width: 130 }} />
        <Column
          field="detention_days"
          header="Detention"
          body={(r) => (r.detention_days ? `${r.detention_days}d` : "—")}
        />
        <Column
          field="days_pending"
          header="Pending"
          body={(r) => (r.days_pending ? `${r.days_pending}d` : "—")}
        />
        <Column
          header="Status"
          body={(r) => <StatusBadge status={r.current_status} />}
        />
        <Column
          header="Actions"
          style={{ width: 80 }}
          body={(r) => (
            <Button
              icon="pi pi-arrow-right"
              size="small"
              text
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/judge/cases/${r.case_id}`);
              }}
            />
          )}
        />
      </DataTable>
    </div>
  );
}
