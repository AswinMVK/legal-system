import React, { useEffect, useState, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { Skeleton } from "primereact/skeleton";
import { TabView, TabPanel } from "primereact/tabview";
import gsap from "gsap";
import { advocateAPI } from "../../services/api";

const REQUEST_TYPES = [
  { label: "Bail Application", value: "bail_application" },
  { label: "Medical Assistance", value: "medical_assistance" },
  { label: "Witness Protection", value: "witness_protection" },
  { label: "Compensation Claim", value: "compensation_claim" },
  { label: "Legal Aid Request", value: "legal_aid" },
  { label: "Restraining Order", value: "restraining_order" },
  { label: "Status Update", value: "status_update" },
  { label: "Other", value: "other" },
];

const REQUEST_STATUS_OPTIONS = [
  { label: "All Status", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Submitted", value: "submitted" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

export default function VictimManagement() {
  const [victims, setVictims] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [selectedVictim, setSelectedVictim] = useState(null);
  const [requestForm, setRequestForm] = useState({
    request_type: "",
    description: "",
    urgency: "normal",
  });
  const [victimNotes, setVictimNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const toast = useRef(null);
  const pageRef = useRef(null);

  useEffect(() => {
    if (loading) return;
    const ctx = gsap.context(() => {
      gsap.from(".victim-header", {
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
        stagger: 0.1,
        ease: "power2.out",
      });
    }, pageRef);
    return () => ctx.revert();
  }, [loading]);

  const fetchData = async () => {
    try {
      const [victimsRes, requestsRes] = await Promise.all([
        advocateAPI.getMyVictims(),
        advocateAPI.getMyRequests(),
      ]);
      setVictims(victimsRes.data.victims || victimsRes.data || []);
      setRequests(requestsRes.data.requests || requestsRes.data || []);
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Failed to load data.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openVictimDetail = (victim) => {
    setSelectedVictim(victim);
    setVictimNotes(victim.advocate_notes || "");
    setShowDialog(true);
  };

  const openRequestForm = (victim) => {
    setSelectedVictim(victim);
    setRequestForm({ request_type: "", description: "", urgency: "normal" });
    setShowRequestDialog(true);
  };

  const saveVictimNotes = async () => {
    if (!selectedVictim) return;
    setSaving(true);
    try {
      await advocateAPI.updateVictimNotes(selectedVictim.person_id, {
        advocate_notes: victimNotes,
      });
      toast.current?.show({
        severity: "success",
        summary: "Notes updated successfully.",
      });
      setShowDialog(false);
      fetchData();
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Failed to save notes.",
      });
    } finally {
      setSaving(false);
    }
  };

  const submitRequest = async () => {
    if (
      !selectedVictim ||
      !requestForm.request_type ||
      !requestForm.description
    ) {
      toast.current?.show({
        severity: "warn",
        summary: "Please fill in all required fields.",
      });
      return;
    }
    setSaving(true);
    try {
      await advocateAPI.submitVictimRequest(
        selectedVictim.person_id,
        requestForm,
      );
      toast.current?.show({
        severity: "success",
        summary: "Request submitted successfully.",
      });
      setShowRequestDialog(false);
      fetchData();
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Failed to submit request.",
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredRequests = statusFilter
    ? requests.filter((r) => r.status === statusFilter)
    : requests;

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
        className="victim-header"
        style={{
          background: "linear-gradient(135deg, #FF6B00, #FF9933)",
          color: "#fff",
          padding: "1.2rem 1.5rem",
          borderRadius: "12px",
          marginBottom: "1.5rem",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "1.2rem" }}>
          <i className="pi pi-users" style={{ marginRight: "0.5rem" }} />
          Victim Management
        </h2>
        <p style={{ margin: "0.2rem 0 0", opacity: 0.85, fontSize: "0.8rem" }}>
          View victim details, update notes, and submit requests on their behalf
        </p>
      </div>

      {/* Stats Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
        className="victim-stat-grid"
      >
        <div
          className="stat-card"
          style={{
            background: "#eef0fb",
            borderRadius: "12px",
            padding: "1rem",
            textAlign: "center",
            border: "1px solid #00008020",
          }}
        >
          <div
            style={{ fontSize: "1.8rem", fontWeight: 700, color: "#000080" }}
          >
            {victims.length}
          </div>
          <div style={{ fontSize: "0.78rem", color: "#6B7280" }}>
            Total Victims
          </div>
        </div>
        <div
          className="stat-card"
          style={{
            background: "#fdecea",
            borderRadius: "12px",
            padding: "1rem",
            textAlign: "center",
            border: "1px solid #D32F2F20",
          }}
        >
          <div
            style={{ fontSize: "1.8rem", fontWeight: 700, color: "#D32F2F" }}
          >
            {victims.filter((v) => v.vulnerability_score >= 5).length}
          </div>
          <div style={{ fontSize: "0.78rem", color: "#6B7280" }}>
            High Vulnerability
          </div>
        </div>
        <div
          className="stat-card"
          style={{
            background: "#fff5e8",
            borderRadius: "12px",
            padding: "1rem",
            textAlign: "center",
            border: "1px solid #FF6B0020",
          }}
        >
          <div
            style={{ fontSize: "1.8rem", fontWeight: 700, color: "#FF6B00" }}
          >
            {requests.filter((r) => r.status === "pending").length}
          </div>
          <div style={{ fontSize: "0.78rem", color: "#6B7280" }}>
            Pending Requests
          </div>
        </div>
      </div>

      <TabView>
        {/* Victims Tab */}
        <TabPanel header="Victims" leftIcon="pi pi-users mr-2">
          <DataTable
            value={victims}
            paginator
            rows={10}
            size="small"
            stripedRows
            emptyMessage="No victims found in your cases."
            rowHover
          >
            <Column field="name" header="Name" sortable />
            <Column
              field="case_number"
              header="Case #"
              body={(row) => row.case_number || `Case ${row.case_id}`}
              sortable
              style={{ width: "130px" }}
            />
            <Column
              field="age"
              header="Age"
              sortable
              style={{ width: "70px" }}
            />
            <Column
              field="gender"
              header="Gender"
              sortable
              style={{ width: "90px" }}
            />
            <Column
              field="location"
              header="Location"
              style={{ width: "150px" }}
            />
            <Column
              field="vulnerability_score"
              header="Vulnerability"
              body={(row) => (
                <Tag
                  value={`${row.vulnerability_score || 0}/10`}
                  severity={
                    row.vulnerability_score >= 7
                      ? "danger"
                      : row.vulnerability_score >= 4
                        ? "warning"
                        : "success"
                  }
                />
              )}
              sortable
              style={{ width: "120px" }}
            />
            <Column
              header="Flags"
              body={(row) => (
                <div style={{ display: "flex", gap: "0.25rem" }}>
                  {row.health_flag ? (
                    <Tag
                      value="Health"
                      severity="danger"
                      style={{ fontSize: "0.6rem" }}
                    />
                  ) : null}
                  {row.disability_flag ? (
                    <Tag
                      value="Disability"
                      severity="warning"
                      style={{ fontSize: "0.6rem" }}
                    />
                  ) : null}
                  {!row.health_flag && !row.disability_flag && (
                    <span style={{ color: "#9CA3AF", fontSize: "0.75rem" }}>
                      None
                    </span>
                  )}
                </div>
              )}
              style={{ width: "130px" }}
            />
            <Column
              header="Actions"
              body={(row) => (
                <div style={{ display: "flex", gap: "0.25rem" }}>
                  <Button
                    icon="pi pi-eye"
                    className="p-button-text p-button-sm"
                    tooltip="View / Edit Notes"
                    onClick={() => openVictimDetail(row)}
                  />
                  <Button
                    icon="pi pi-send"
                    className="p-button-text p-button-sm p-button-warning"
                    tooltip="Submit Request"
                    onClick={() => openRequestForm(row)}
                  />
                </div>
              )}
              style={{ width: "100px" }}
            />
          </DataTable>
        </TabPanel>

        {/* Requests Tab */}
        <TabPanel header="Requests" leftIcon="pi pi-file-edit mr-2">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "1rem",
            }}
          >
            <Dropdown
              value={statusFilter}
              options={REQUEST_STATUS_OPTIONS}
              onChange={(e) => setStatusFilter(e.value)}
              placeholder="Filter by status"
              style={{ minWidth: "180px" }}
            />
            <span style={{ color: "#6B7280", fontSize: "0.85rem" }}>
              {filteredRequests.length} request
              {filteredRequests.length !== 1 ? "s" : ""}
            </span>
          </div>

          <DataTable
            value={filteredRequests}
            paginator
            rows={10}
            size="small"
            stripedRows
            emptyMessage="No requests found."
            rowHover
          >
            <Column field="victim_name" header="Victim" sortable />
            <Column
              field="case_number"
              header="Case #"
              sortable
              style={{ width: "130px" }}
            />
            <Column
              field="request_type"
              header="Type"
              body={(row) => (
                <span style={{ textTransform: "capitalize" }}>
                  {(row.request_type || "").replace(/_/g, " ")}
                </span>
              )}
              sortable
              style={{ width: "160px" }}
            />
            <Column
              field="urgency"
              header="Urgency"
              body={(row) => (
                <Tag
                  value={row.urgency || "normal"}
                  severity={
                    row.urgency === "critical"
                      ? "danger"
                      : row.urgency === "high"
                        ? "warning"
                        : "info"
                  }
                  style={{ fontSize: "0.65rem" }}
                />
              )}
              sortable
              style={{ width: "100px" }}
            />
            <Column
              field="status"
              header="Status"
              body={(row) => (
                <Tag
                  value={row.status || "pending"}
                  severity={
                    row.status === "approved"
                      ? "success"
                      : row.status === "rejected"
                        ? "danger"
                        : row.status === "submitted"
                          ? "info"
                          : "warning"
                  }
                  style={{ fontSize: "0.65rem" }}
                />
              )}
              sortable
              style={{ width: "110px" }}
            />
            <Column
              field="created_at"
              header="Submitted"
              body={(row) =>
                row.created_at
                  ? new Date(row.created_at).toLocaleDateString("en-IN")
                  : "—"
              }
              sortable
              style={{ width: "110px" }}
            />
            <Column
              field="description"
              header="Description"
              body={(row) => (
                <span
                  style={{
                    maxWidth: "200px",
                    display: "inline-block",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  title={row.description}
                >
                  {row.description}
                </span>
              )}
            />
          </DataTable>
        </TabPanel>
      </TabView>

      {/* Victim Detail Dialog */}
      <Dialog
        visible={showDialog}
        header={`Victim: ${selectedVictim?.name || ""}`}
        style={{ width: "550px" }}
        onHide={() => setShowDialog(false)}
        footer={
          <div>
            <Button
              label="Cancel"
              icon="pi pi-times"
              className="p-button-text"
              onClick={() => setShowDialog(false)}
            />
            <Button
              label="Save Notes"
              icon="pi pi-check"
              loading={saving}
              onClick={saveVictimNotes}
            />
          </div>
        }
      >
        {selectedVictim && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.75rem",
              }}
            >
              <div>
                <label
                  style={{
                    fontWeight: 600,
                    fontSize: "0.8rem",
                    color: "#6B7280",
                  }}
                >
                  Age
                </label>
                <p style={{ margin: "0.2rem 0" }}>
                  {selectedVictim.age || "—"}
                </p>
              </div>
              <div>
                <label
                  style={{
                    fontWeight: 600,
                    fontSize: "0.8rem",
                    color: "#6B7280",
                  }}
                >
                  Gender
                </label>
                <p style={{ margin: "0.2rem 0" }}>
                  {selectedVictim.gender || "—"}
                </p>
              </div>
              <div>
                <label
                  style={{
                    fontWeight: 600,
                    fontSize: "0.8rem",
                    color: "#6B7280",
                  }}
                >
                  Location
                </label>
                <p style={{ margin: "0.2rem 0" }}>
                  {selectedVictim.location || "—"}
                </p>
              </div>
              <div>
                <label
                  style={{
                    fontWeight: 600,
                    fontSize: "0.8rem",
                    color: "#6B7280",
                  }}
                >
                  Vulnerability Score
                </label>
                <p style={{ margin: "0.2rem 0" }}>
                  <Tag
                    value={`${selectedVictim.vulnerability_score || 0}/10`}
                    severity={
                      selectedVictim.vulnerability_score >= 7
                        ? "danger"
                        : selectedVictim.vulnerability_score >= 4
                          ? "warning"
                          : "success"
                    }
                  />
                </p>
              </div>
              <div>
                <label
                  style={{
                    fontWeight: 600,
                    fontSize: "0.8rem",
                    color: "#6B7280",
                  }}
                >
                  Health Flag
                </label>
                <p style={{ margin: "0.2rem 0" }}>
                  {selectedVictim.health_flag ? (
                    <Tag value="Yes" severity="danger" />
                  ) : (
                    "No"
                  )}
                </p>
              </div>
              <div>
                <label
                  style={{
                    fontWeight: 600,
                    fontSize: "0.8rem",
                    color: "#6B7280",
                  }}
                >
                  Disability Flag
                </label>
                <p style={{ margin: "0.2rem 0" }}>
                  {selectedVictim.disability_flag ? (
                    <Tag value="Yes" severity="warning" />
                  ) : (
                    "No"
                  )}
                </p>
              </div>
            </div>

            <div>
              <label
                style={{
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  color: "#6B7280",
                }}
              >
                Advocate Notes
              </label>
              <InputTextarea
                value={victimNotes}
                onChange={(e) => setVictimNotes(e.target.value)}
                rows={4}
                className="w-full"
                placeholder="Add notes about the victim's condition, requirements, or updates..."
                style={{ marginTop: "0.3rem" }}
              />
            </div>
          </div>
        )}
      </Dialog>

      {/* Request Dialog */}
      <Dialog
        visible={showRequestDialog}
        header={`Submit Request for: ${selectedVictim?.name || ""}`}
        style={{ width: "500px" }}
        onHide={() => setShowRequestDialog(false)}
        footer={
          <div>
            <Button
              label="Cancel"
              icon="pi pi-times"
              className="p-button-text"
              onClick={() => setShowRequestDialog(false)}
            />
            <Button
              label="Submit Request"
              icon="pi pi-send"
              loading={saving}
              onClick={submitRequest}
            />
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ fontWeight: 600, fontSize: "0.85rem" }}>
              Request Type <span style={{ color: "#D32F2F" }}>*</span>
            </label>
            <Dropdown
              value={requestForm.request_type}
              options={REQUEST_TYPES}
              onChange={(e) =>
                setRequestForm({ ...requestForm, request_type: e.value })
              }
              placeholder="Select request type"
              className="w-full"
              style={{ marginTop: "0.3rem" }}
            />
          </div>
          <div>
            <label style={{ fontWeight: 600, fontSize: "0.85rem" }}>
              Urgency
            </label>
            <Dropdown
              value={requestForm.urgency}
              options={[
                { label: "Normal", value: "normal" },
                { label: "High", value: "high" },
                { label: "Critical", value: "critical" },
              ]}
              onChange={(e) =>
                setRequestForm({ ...requestForm, urgency: e.value })
              }
              className="w-full"
              style={{ marginTop: "0.3rem" }}
            />
          </div>
          <div>
            <label style={{ fontWeight: 600, fontSize: "0.85rem" }}>
              Description <span style={{ color: "#D32F2F" }}>*</span>
            </label>
            <InputTextarea
              value={requestForm.description}
              onChange={(e) =>
                setRequestForm({ ...requestForm, description: e.target.value })
              }
              rows={4}
              className="w-full"
              placeholder="Describe the request in detail…"
              style={{ marginTop: "0.3rem" }}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
