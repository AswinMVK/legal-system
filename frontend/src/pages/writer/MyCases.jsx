import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { Toolbar } from "primereact/toolbar";
import { casesAPI } from "../../services/api";
import StatusBadge from "../../components/common/StatusBadge";
import { useAuth } from "../../context/AuthContext";

const STATUS_OPTIONS = [
  { label: "All", value: "" },
  { label: "Active", value: "active" },
  { label: "Pending", value: "pending" },
  { label: "Closed", value: "closed" },
];

export default function MyCases() {
  const [cases, setCases] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    page: 1,
    limit: 15,
  });
  const toast = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchCases = async () => {
    setLoading(true);
    try {
      const res = await casesAPI.getAll(filters);
      setCases(res.data.cases);
      setTotal(res.data.total);
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Failed to load cases.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [filters]);

  const onPage = (e) =>
    setFilters((p) => ({ ...p, page: e.page + 1, limit: e.rows }));

  const leftToolbar = (
    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <InputText
          placeholder="Search cases..."
          value={filters.search}
          onChange={(e) =>
            setFilters((p) => ({ ...p, search: e.target.value, page: 1 }))
          }
          style={{ width: 240 }}
        />
      </span>
      <Dropdown
        value={filters.status}
        options={STATUS_OPTIONS}
        onChange={(e) =>
          setFilters((p) => ({ ...p, status: e.value, page: 1 }))
        }
        style={{ width: 140 }}
      />
    </div>
  );

  const rightToolbar = user?.role !== "judge" && (
    <Button
      label="Register New Case"
      icon="pi pi-plus"
      onClick={() => navigate("/writer/cases/create")}
    />
  );

  return (
    <div>
      <Toast ref={toast} />
      <Toolbar
        start={leftToolbar}
        end={rightToolbar}
        style={{ marginBottom: "1rem", borderRadius: 8 }}
      />

      <DataTable
        value={cases}
        loading={loading}
        paginator
        rows={filters.limit}
        totalRecords={total}
        lazy
        onPage={onPage}
        first={(filters.page - 1) * filters.limit}
        rowsPerPageOptions={[10, 15, 25, 50]}
        emptyMessage="No cases found."
        rowHover
        onRowClick={(e) => navigate(`/cases/${e.data.case_id}`)}
        style={{ cursor: "pointer" }}
      >
        <Column
          field="case_id"
          header="#ID"
          style={{ width: 70 }}
          body={(r) => `#${r.case_id}`}
        />
        <Column field="case_type" header="Type" style={{ width: 120 }} />
        <Column
          field="offense_type"
          header="Offense"
          style={{ maxWidth: 200 }}
        />
        <Column field="court_name" header="Court" />
        <Column
          field="judge_name"
          header="Judge"
          body={(r) => r.judge_name || "—"}
        />
        <Column
          field="filing_date"
          header="Filed"
          body={(r) => r.filing_date?.split("T")[0] || "—"}
        />
        <Column
          field="current_status"
          header="Status"
          body={(r) => <StatusBadge status={r.current_status} />}
        />
        <Column
          field="priority_cluster"
          header="Priority"
          body={(r) => {
            const map = {
              0: { label: "CRITICAL", sev: "danger" },
              1: { label: "HIGH", sev: "warning" },
              2: { label: "MEDIUM", sev: "info" },
              3: { label: "LOW", sev: "success" },
            };
            const c = map[r.priority_cluster];
            return c ? <Tag value={c.label} severity={c.sev} /> : "—";
          }}
        />
        <Column
          header="Actions"
          style={{ width: 100 }}
          body={(r) => (
            <Button
              icon="pi pi-eye"
              size="small"
              text
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/cases/${r.case_id}`);
              }}
            />
          )}
        />
      </DataTable>
    </div>
  );
}
