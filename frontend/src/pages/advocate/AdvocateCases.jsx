import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { Skeleton } from "primereact/skeleton";
import gsap from "gsap";
import { advocateAPI } from "../../services/api";
import StatusBadge from "../../components/common/StatusBadge";

const SIDE_OPTIONS = [
  { label: "All Sides", value: "" },
  { label: "Defense", value: "defense" },
  { label: "Prosecution", value: "prosecution" },
];

const STATUS_OPTIONS = [
  { label: "All Status", value: "" },
  { label: "Registered", value: "registered" },
  { label: "Under Investigation", value: "under_investigation" },
  { label: "Chargesheet Filed", value: "chargesheet_filed" },
  { label: "Trial", value: "trial" },
  { label: "Hearing", value: "hearing" },
  { label: "Judgment", value: "judgment" },
  { label: "Closed", value: "closed" },
  { label: "Disposed", value: "disposed" },
];

export default function AdvocateCases() {
  const [cases, setCases] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sideFilter, setSideFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const navigate = useNavigate();
  const toast = useRef(null);
  const pageRef = useRef(null);

  useEffect(() => {
    if (loading) return;
    const ctx = gsap.context(() => {
      gsap.from(".advocate-cases-header", {
        y: -20,
        opacity: 0,
        duration: 0.5,
        ease: "power3.out",
      });
      gsap.from(".p-card", {
        y: 20,
        opacity: 0,
        duration: 0.5,
        delay: 0.2,
        ease: "power2.out",
      });
    }, pageRef);
    return () => ctx.revert();
  }, [loading]);

  useEffect(() => {
    (async () => {
      try {
        const res = await advocateAPI.getMyCases();
        const data = res.data.cases || res.data || [];
        setCases(data);
        setFiltered(data);
      } catch {
        toast.current?.show({
          severity: "error",
          summary: "Failed to load cases.",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    let result = [...cases];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          (c.case_number || "").toLowerCase().includes(q) ||
          (c.case_title || "").toLowerCase().includes(q) ||
          (c.case_type || "").toLowerCase().includes(q),
      );
    }
    if (sideFilter) result = result.filter((c) => c.side === sideFilter);
    if (statusFilter) result = result.filter((c) => c.status === statusFilter);
    setFiltered(result);
  }, [search, sideFilter, statusFilter, cases]);

  if (loading) {
    return (
      <div ref={pageRef} style={{ padding: "1.5rem" }}>
        <Skeleton width="100%" height="60px" className="mb-3" />
        <Skeleton width="100%" height="400px" />
      </div>
    );
  }

  return (
    <div ref={pageRef}>
      <Toast ref={toast} />

      {/* Header */}
      <div
        className="advocate-cases-header"
        style={{
          background: "linear-gradient(135deg, #000080, #003087)",
          color: "#fff",
          padding: "1.2rem 1.5rem",
          borderRadius: "12px",
          marginBottom: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: "1.2rem" }}>
            <i
              className="pi pi-folder-open"
              style={{ marginRight: "0.5rem" }}
            />
            My Cases
          </h2>
          <p style={{ margin: "0.2rem 0 0", opacity: 0.8, fontSize: "0.8rem" }}>
            {cases.length} case{cases.length !== 1 ? "s" : ""} assigned to you
          </p>
        </div>
      </div>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "1rem",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <span
          className="p-input-icon-left"
          style={{ flex: 1, minWidth: "200px" }}
        >
          <i className="pi pi-search" />
          <InputText
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by case number, title, type…"
            className="w-full"
          />
        </span>
        <Dropdown
          value={sideFilter}
          options={SIDE_OPTIONS}
          onChange={(e) => setSideFilter(e.value)}
          placeholder="Filter by Side"
          style={{ minWidth: "160px" }}
        />
        <Dropdown
          value={statusFilter}
          options={STATUS_OPTIONS}
          onChange={(e) => setStatusFilter(e.value)}
          placeholder="Filter by Status"
          style={{ minWidth: "180px" }}
        />
      </div>

      {/* Cases Table */}
      <Card className="shadow-1">
        <DataTable
          value={filtered}
          paginator
          rows={10}
          size="small"
          stripedRows
          emptyMessage="No cases found."
          rowHover
          onRowClick={(e) => navigate(`/advocate/cases/${e.data.case_id}`)}
          style={{ cursor: "pointer" }}
          rowsPerPageOptions={[5, 10, 20]}
        >
          <Column
            field="case_number"
            header="Case Number"
            sortable
            style={{ width: "140px" }}
          />
          <Column field="case_title" header="Case Title" sortable />
          <Column
            field="case_type"
            header="Type"
            sortable
            style={{ width: "130px" }}
          />
          <Column
            field="court_name"
            header="Court"
            sortable
            style={{ width: "160px" }}
          />
          <Column
            field="side"
            header="Side"
            body={(row) => (
              <Tag
                value={row.side || "—"}
                style={{
                  background:
                    row.side === "defense"
                      ? "#003087"
                      : row.side === "prosecution"
                        ? "#FF6B00"
                        : "#6B7280",
                  color: "#fff",
                  fontSize: "0.7rem",
                }}
              />
            )}
            sortable
            style={{ width: "110px" }}
          />
          <Column
            field="status"
            header="Status"
            body={(row) => <StatusBadge status={row.status} />}
            sortable
            style={{ width: "130px" }}
          />
          <Column
            field="priority_cluster"
            header="Priority"
            body={(row) => {
              const labels = {
                0: "CRITICAL",
                1: "HIGH",
                2: "MEDIUM",
                3: "LOW",
              };
              const colors = {
                0: "#D32F2F",
                1: "#FF6B00",
                2: "#FBC02D",
                3: "#388E3C",
              };
              return row.priority_cluster != null ? (
                <Tag
                  value={labels[row.priority_cluster] || "—"}
                  style={{
                    background: colors[row.priority_cluster] || "#6B7280",
                    color: "#fff",
                    fontSize: "0.65rem",
                  }}
                />
              ) : (
                "—"
              );
            }}
            sortable
            style={{ width: "100px" }}
          />
          <Column
            header=""
            body={(row) => (
              <Button
                icon="pi pi-eye"
                className="p-button-text p-button-sm"
                tooltip="View Case"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/advocate/cases/${row.case_id}`);
                }}
              />
            )}
            style={{ width: "60px" }}
          />
        </DataTable>
      </Card>
    </div>
  );
}
