import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { Skeleton } from "primereact/skeleton";
import { TabView, TabPanel } from "primereact/tabview";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Timeline } from "primereact/timeline";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import gsap from "gsap";
import { casesAPI, personsAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import StatusBadge from "../../components/common/StatusBadge";
import PersonForm from "../../components/cases/PersonForm";
import { InputTextarea } from "primereact/inputtextarea";

export default function AdvocateCaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selfAssignSide, setSelfAssignSide] = useState("defense");
  const toast = useRef(null);
  const pageRef = useRef(null);

  // ── person status update dialog ──
  const [statusDialogVisible, setStatusDialogVisible] = useState(false);
  const [statusPerson, setStatusPerson] = useState(null);
  const [statusType, setStatusType] = useState(null);
  const [statusDesc, setStatusDesc] = useState("");
  const [statusFile, setStatusFile] = useState(null);
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  const statusOptions = [
    { label: "Normal", value: "normal" },
    { label: "Medical Condition", value: "medical" },
    { label: "Hospitalized", value: "hospitalized" },
    { label: "Deceased", value: "deceased" },
  ];

  const openStatusDialog = (person) => {
    setStatusPerson(person);
    setStatusType(person.current_health_status || "normal");
    setStatusDesc("");
    setStatusFile(null);
    setStatusDialogVisible(true);
  };

  const handleStatusSubmit = async () => {
    if (!statusType) return;
    if (
      ["medical", "hospitalized", "deceased"].includes(statusType) &&
      !statusFile
    ) {
      toast.current?.show({
        severity: "warn",
        summary: `A ${statusType === "deceased" ? "death" : "medical"} certificate is required.`,
      });
      return;
    }
    setStatusSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("status_type", statusType);
      fd.append("case_id", id);
      fd.append("description", statusDesc);
      fd.append(
        "certificate_type",
        statusType === "deceased" ? "death_certificate" : "medical_certificate",
      );
      if (statusFile) fd.append("certificate", statusFile);
      await personsAPI.submitStatus(statusPerson.person_id, fd);
      toast.current?.show({
        severity: "success",
        summary: "Status update submitted for judge verification.",
      });
      setStatusDialogVisible(false);
      fetchCase();
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: err.response?.data?.message || "Failed to submit status.",
      });
    } finally {
      setStatusSubmitting(false);
    }
  };

  useEffect(() => {
    if (loading) return;
    const ctx = gsap.context(() => {
      gsap.from(".case-detail-header", {
        y: -20,
        opacity: 0,
        duration: 0.5,
        ease: "power3.out",
      });
      gsap.from(".p-tabview", {
        y: 20,
        opacity: 0,
        duration: 0.5,
        delay: 0.2,
        ease: "power2.out",
      });
    }, pageRef);
    return () => ctx.revert();
  }, [loading]);

  const fetchCase = async () => {
    setLoading(true);
    try {
      const res = await casesAPI.getById(id);
      setCaseData(res.data);
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Failed to load case details.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCase();
  }, [id]);

  const isAlreadyAssigned = caseData?.advocates?.some(
    (a) => a.advocate_id === user?.advocate_id,
  );

  const handleSelfAssign = async () => {
    try {
      await casesAPI.assignAdvocate(id, { side: selfAssignSide });
      toast.current?.show({
        severity: "success",
        summary: "You have been assigned to this case.",
      });
      fetchCase();
    } catch (err) {
      const msg = err.response?.data?.message || "Assignment failed.";
      toast.current?.show({ severity: "error", summary: msg });
    }
  };

  const persons = caseData?.persons || [];
  const hearings = caseData?.hearings || [];
  const events = caseData?.history || [];
  const victims = persons.filter((p) => p.role === "victim");
  const accused = persons.filter((p) => p.role === "accused");
  const witnesses = persons.filter((p) => p.role === "witness");

  const caseNumber = caseData
    ? `CASE-${String(caseData.case_id).padStart(4, "0")}`
    : "";
  const caseTitle = caseData
    ? `${caseData.case_type || ""} - ${caseData.offense_type || "N/A"}`
    : "";
  const priorityCluster = caseData?.features?.[0]?.priority_cluster;

  if (loading) {
    return (
      <div ref={pageRef} style={{ padding: "1.5rem" }}>
        <Skeleton width="100%" height="80px" className="mb-3" />
        <Skeleton width="100%" height="500px" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <i
          className="pi pi-exclamation-triangle"
          style={{ fontSize: "3rem", color: "#D32F2F" }}
        />
        <h3>Case Not Found</h3>
        <Button
          label="Back to Cases"
          icon="pi pi-arrow-left"
          onClick={() => navigate("/advocate/cases")}
        />
      </div>
    );
  }

  const priorityLabels = { 0: "CRITICAL", 1: "HIGH", 2: "MEDIUM", 3: "LOW" };
  const priorityColors = {
    0: "#D32F2F",
    1: "#FF6B00",
    2: "#FBC02D",
    3: "#388E3C",
  };

  return (
    <div ref={pageRef}>
      <Toast ref={toast} />

      {/* Header */}
      <div
        className="case-detail-header"
        style={{
          background: "linear-gradient(135deg, #000080, #003087)",
          color: "#fff",
          padding: "1.2rem 1.5rem",
          borderRadius: "12px",
          marginBottom: "1.5rem",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <Button
              icon="pi pi-arrow-left"
              className="p-button-text"
              style={{ color: "#fff", marginBottom: "0.5rem", padding: 0 }}
              onClick={() => navigate("/advocate/cases")}
              label="Back to Cases"
            />
            <h2 style={{ margin: 0, fontSize: "1.3rem" }}>
              {caseNumber} — {caseTitle}
            </h2>
            <p
              style={{
                margin: "0.3rem 0 0",
                opacity: 0.85,
                fontSize: "0.8rem",
              }}
            >
              {caseData.case_type} •{" "}
              {caseData.court_name || "Court not assigned"}
            </p>
          </div>
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <StatusBadge status={caseData.current_status} />
            {priorityCluster != null && (
              <Tag
                value={priorityLabels[priorityCluster]}
                style={{
                  background: priorityColors[priorityCluster],
                  color: "#fff",
                }}
              />
            )}
            {!isAlreadyAssigned && (
              <div
                style={{
                  display: "flex",
                  gap: "0.4rem",
                  alignItems: "center",
                  marginLeft: "0.5rem",
                }}
              >
                <Dropdown
                  value={selfAssignSide}
                  options={[
                    { label: "Prosecution", value: "prosecution" },
                    { label: "Defense", value: "defense" },
                  ]}
                  onChange={(e) => setSelfAssignSide(e.value)}
                  style={{ width: 140 }}
                />
                <Button
                  label="Join Case"
                  icon="pi pi-plus-circle"
                  size="small"
                  style={{
                    background: "#FF6B00",
                    border: "none",
                    color: "#fff",
                  }}
                  onClick={handleSelfAssign}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Cards Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
        className="case-info-grid"
      >
        <div
          className="stat-card"
          style={{
            background: "#eef0fb",
            borderRadius: "10px",
            padding: "1rem",
            textAlign: "center",
          }}
        >
          <div
            style={{ fontSize: "1.5rem", fontWeight: 700, color: "#000080" }}
          >
            {victims.length}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#6B7280" }}>Victims</div>
        </div>
        <div
          className="stat-card"
          style={{
            background: "#fdecea",
            borderRadius: "10px",
            padding: "1rem",
            textAlign: "center",
          }}
        >
          <div
            style={{ fontSize: "1.5rem", fontWeight: 700, color: "#D32F2F" }}
          >
            {accused.length}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#6B7280" }}>Accused</div>
        </div>
        <div
          className="stat-card"
          style={{
            background: "#e9f7e9",
            borderRadius: "10px",
            padding: "1rem",
            textAlign: "center",
          }}
        >
          <div
            style={{ fontSize: "1.5rem", fontWeight: 700, color: "#138808" }}
          >
            {witnesses.length}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#6B7280" }}>Witnesses</div>
        </div>
        <div
          className="stat-card"
          style={{
            background: "#fff5e8",
            borderRadius: "10px",
            padding: "1rem",
            textAlign: "center",
          }}
        >
          <div
            style={{ fontSize: "1.5rem", fontWeight: 700, color: "#FF6B00" }}
          >
            {hearings.length}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#6B7280" }}>Hearings</div>
        </div>
      </div>

      {/* Tabs */}
      <TabView>
        {/* Case Info Tab */}
        <TabPanel header="Case Info" leftIcon="pi pi-info-circle mr-2">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1.5rem",
            }}
          >
            <Card title="Case Details" className="shadow-1">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.75rem",
                }}
              >
                {[
                  {
                    label: "Filing Date",
                    value: caseData.filing_date
                      ? new Date(caseData.filing_date).toLocaleDateString(
                          "en-IN",
                        )
                      : "—",
                  },
                  { label: "Case Type", value: caseData.case_type || "—" },
                  {
                    label: "Offense Type",
                    value: caseData.offense_type || "—",
                  },
                  {
                    label: "Legal Status",
                    value: caseData.legal_status || "—",
                  },
                  {
                    label: "Trial Status",
                    value: caseData.trial_status || "—",
                  },
                  {
                    label: "Current Stage",
                    value: caseData.current_stage || "—",
                  },
                  { label: "Court", value: caseData.court_name || "—" },
                  {
                    label: "Judge",
                    value: caseData.judge_name || "Not assigned",
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "#6B7280",
                      }}
                    >
                      {item.label}
                    </div>
                    <div style={{ fontSize: "0.9rem", marginTop: "0.2rem" }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
              {caseData.summary && (
                <div style={{ marginTop: "1rem" }}>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "#6B7280",
                    }}
                  >
                    Summary
                  </div>
                  <p
                    style={{
                      fontSize: "0.85rem",
                      lineHeight: 1.5,
                      marginTop: "0.3rem",
                    }}
                  >
                    {caseData.summary}
                  </p>
                </div>
              )}
            </Card>

            <Card title="Legal Sections" className="shadow-1">
              {caseData.sections?.length > 0 ? (
                <div
                  style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}
                >
                  {caseData.sections.map((s, i) => (
                    <Tag
                      key={i}
                      value={`${s.law_code || "IPC"} Sec. ${s.section || ""}`}
                      style={{
                        background: "#eef0fb",
                        color: "#000080",
                        fontSize: "0.75rem",
                        border: "1px solid #00008020",
                      }}
                    />
                  ))}
                </div>
              ) : (
                <p style={{ color: "#9CA3AF" }}>No sections recorded.</p>
              )}
            </Card>
          </div>
        </TabPanel>

        {/* Victims Tab */}
        <TabPanel header="Victims" leftIcon="pi pi-users mr-2">
          <PersonForm
            onAdd={async (data) => {
              await casesAPI.addPerson(id, { ...data, role: "victim" });
              toast.current?.show({
                severity: "success",
                summary: "Victim added.",
              });
              fetchCase();
            }}
            toast={toast}
          />
          <DataTable
            value={victims}
            size="small"
            stripedRows
            emptyMessage="No victims recorded."
          >
            <Column field="name" header="Name" />
            <Column field="age" header="Age" style={{ width: "70px" }} />
            <Column field="gender" header="Gender" style={{ width: "90px" }} />
            <Column field="location" header="Location" />
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
                      style={{ fontSize: "0.6rem" }}
                    />
                  )}
                  {row.disability_flag && (
                    <Tag
                      value="Disability"
                      severity="warning"
                      style={{ fontSize: "0.6rem" }}
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
                  icon="pi pi-send"
                  className="p-button-text p-button-sm p-button-warning"
                  tooltip="Submit Request"
                  onClick={() => navigate("/advocate/victims")}
                />
              )}
              style={{ width: "80px" }}
            />
          </DataTable>
        </TabPanel>

        {/* All Persons Tab — add accused, witnesses */}
        <TabPanel
          header={`All Persons (${persons.length})`}
          leftIcon="pi pi-user-plus mr-2"
        >
          <PersonForm
            onAdd={async (data) => {
              await casesAPI.addPerson(id, data);
              toast.current?.show({
                severity: "success",
                summary: `${data.role?.charAt(0).toUpperCase() + data.role?.slice(1)} added.`,
              });
              fetchCase();
            }}
            toast={toast}
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "1rem",
              marginTop: "1rem",
            }}
          >
            {persons.map((p) => (
              <div
                key={p.person_id}
                style={{
                  background: "#fff",
                  borderRadius: 10,
                  padding: "1rem",
                  border: `2px solid ${p.role === "victim" ? "#fee2e2" : p.role === "accused" ? "#fef9c3" : "#e0f2fe"}`,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.5rem",
                  }}
                >
                  <Tag
                    value={p.role?.toUpperCase()}
                    severity={
                      p.role === "victim"
                        ? "danger"
                        : p.role === "accused"
                          ? "warning"
                          : "info"
                    }
                  />
                  <div
                    style={{
                      display: "flex",
                      gap: "0.3rem",
                      alignItems: "center",
                    }}
                  >
                    {p.current_health_status &&
                      p.current_health_status !== "normal" && (
                        <Tag
                          value={p.current_health_status.toUpperCase()}
                          severity={
                            p.current_health_status === "deceased"
                              ? "danger"
                              : "warning"
                          }
                          icon={
                            p.current_health_status === "deceased"
                              ? "pi pi-times-circle"
                              : "pi pi-heart"
                          }
                          style={{ fontSize: "0.6rem" }}
                        />
                      )}
                    {(p.health_flag || p.disability_flag) && (
                      <span style={{ color: "#dc2626", fontWeight: 700 }}>
                        ⚠️
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ fontWeight: 700, marginBottom: "0.3rem" }}>
                  {p.name}
                </div>
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "#64748b",
                    lineHeight: 1.7,
                  }}
                >
                  {p.age && <div>Age: {p.age}</div>}
                  {p.gender && <div>Gender: {p.gender}</div>}
                  {p.location && <div>Location: {p.location}</div>}
                  <div>
                    Vulnerability: <strong>{p.vulnerability_score}</strong>
                  </div>
                </div>
                <Button
                  label="Update Status"
                  icon="pi pi-heart"
                  size="small"
                  className="p-button-outlined p-button-sm mt-2"
                  style={{ width: "100%", fontSize: "0.75rem" }}
                  onClick={() => openStatusDialog(p)}
                />
              </div>
            ))}
          </div>
          {persons.length === 0 && (
            <p
              style={{ textAlign: "center", color: "#94a3b8", padding: "2rem" }}
            >
              No persons recorded.
            </p>
          )}
        </TabPanel>

        {/* Hearings Tab */}
        <TabPanel header="Hearings" leftIcon="pi pi-calendar mr-2">
          <DataTable
            value={hearings}
            size="small"
            stripedRows
            emptyMessage="No hearings scheduled."
            sortField="hearing_date"
            sortOrder={-1}
          >
            <Column
              field="hearing_date"
              header="Date"
              body={(row) =>
                row.hearing_date
                  ? new Date(row.hearing_date).toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "—"
              }
              sortable
              style={{ width: "160px" }}
            />
            <Column
              field="hearing_type"
              header="Type"
              style={{ width: "130px" }}
            />
            <Column field="outcome" header="Outcome" />
            <Column field="next_action" header="Next Action" />
            <Column
              field="judge_name"
              header="Judge"
              style={{ width: "130px" }}
            />
            <Column field="remarks" header="Remarks" />
          </DataTable>
        </TabPanel>

        {/* Timeline Tab */}
        <TabPanel header="Timeline" leftIcon="pi pi-history mr-2">
          {events.length > 0 ? (
            <Timeline
              value={events.map((e) => ({
                ...e,
                date: e.updated_at,
              }))}
              opposite={(item) => (
                <small style={{ color: "#6B7280" }}>
                  {item.date
                    ? new Date(item.date).toLocaleDateString("en-IN")
                    : ""}
                </small>
              )}
              content={(item) => (
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                    {item.status || "Event"}
                  </div>
                  <div
                    style={{
                      fontSize: "0.78rem",
                      color: "#6B7280",
                      marginTop: "0.2rem",
                    }}
                  >
                    {item.remarks || ""}
                  </div>
                </div>
              )}
              marker={(item) => (
                <span
                  style={{
                    display: "flex",
                    width: 24,
                    height: 24,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                    background: "#000080",
                    color: "#fff",
                    fontSize: "0.6rem",
                  }}
                >
                  <i
                    className="pi pi-circle-fill"
                    style={{ fontSize: "0.4rem" }}
                  />
                </span>
              )}
            />
          ) : (
            <p
              style={{ color: "#9CA3AF", textAlign: "center", padding: "2rem" }}
            >
              No timeline events recorded.
            </p>
          )}
        </TabPanel>
      </TabView>

      {/* ── Person Status Update Dialog ── */}
      <Dialog
        header={`Update Status — ${statusPerson?.name || ""}`}
        visible={statusDialogVisible}
        onHide={() => setStatusDialogVisible(false)}
        style={{ width: "480px" }}
        modal
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label
              style={{
                fontWeight: 600,
                fontSize: "0.85rem",
                display: "block",
                marginBottom: "0.3rem",
              }}
            >
              Health Status *
            </label>
            <Dropdown
              value={statusType}
              options={statusOptions}
              onChange={(e) => setStatusType(e.value)}
              placeholder="Select status"
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label
              style={{
                fontWeight: 600,
                fontSize: "0.85rem",
                display: "block",
                marginBottom: "0.3rem",
              }}
            >
              Description / Remarks
            </label>
            <InputTextarea
              value={statusDesc}
              onChange={(e) => setStatusDesc(e.target.value)}
              rows={3}
              style={{ width: "100%" }}
              placeholder="Provide details about the person's condition..."
            />
          </div>

          {["medical", "hospitalized", "deceased"].includes(statusType) && (
            <div>
              <label
                style={{
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  display: "block",
                  marginBottom: "0.3rem",
                }}
              >
                {statusType === "deceased"
                  ? "Death Certificate *"
                  : "Medical Certificate *"}
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setStatusFile(e.target.files[0] || null)}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #dee2e6",
                  borderRadius: "6px",
                  fontSize: "0.85rem",
                }}
              />
              <small style={{ color: "#6B7280" }}>
                Accepted: JPG, PNG, PDF, WEBP (max 10 MB)
              </small>
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.5rem",
              marginTop: "0.5rem",
            }}
          >
            <Button
              label="Cancel"
              className="p-button-text"
              onClick={() => setStatusDialogVisible(false)}
            />
            <Button
              label="Submit for Verification"
              icon="pi pi-check"
              loading={statusSubmitting}
              onClick={handleStatusSubmit}
              style={{ background: "#000080", border: "none" }}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
