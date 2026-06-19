import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TabView, TabPanel } from "primereact/tabview";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Toast } from "primereact/toast";
import { Timeline } from "primereact/timeline";
import { Divider } from "primereact/divider";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Badge } from "primereact/badge";
import {
  casesAPI,
  advocatesAPI,
  judgesAPI,
  courtsAPI,
  priorityAPI,
  personsAPI,
} from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import StatusBadge from "../../components/common/StatusBadge";
import PersonForm from "../../components/cases/PersonForm";

const STATUS_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "Pending", value: "pending" },
  { label: "Adjourned", value: "adjourned" },
  { label: "Closed", value: "closed" },
];

const STAGE_OPTIONS = [
  { label: "Registered", value: "registered" },
  { label: "Under Investigation", value: "under_investigation" },
  { label: "Charge Framing", value: "charge_framing" },
  { label: "Trial", value: "trial" },
  { label: "Arguments", value: "arguments" },
  { label: "Judgment", value: "judgment" },
  { label: "Judgment Delivered", value: "judgment_delivered" },
  { label: "Appeal", value: "appeal" },
];

const HEARING_TYPES = [
  { label: "Bail Hearing", value: "bail" },
  { label: "Preliminary", value: "preliminary" },
  { label: "Evidence", value: "evidence" },
  { label: "Arguments", value: "arguments" },
  { label: "Judgment", value: "judgment" },
  { label: "Final Hearing", value: "final" },
];

export default function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useRef(null);
  const isJudge = user?.role === "judge" || user?.role === "admin";
  const isWriter = user?.role === "writer" || user?.role === "clerk";
  const isAdvocate = user?.role === "advocate";
  const canManagePersons = isJudge || isWriter || isAdvocate;
  const canAssignAdvocate = isJudge || isWriter;

  const [caseData, setCaseData] = useState(null);
  const [advocates, setAdvocates] = useState([]);
  const [priority, setPriority] = useState(null);
  const [loading, setLoading] = useState(true);

  // Dialogs
  const [statusDlg, setStatusDlg] = useState(false);
  const [scheduleDlg, setScheduleDlg] = useState(false);
  const [hearingDlg, setHearingDlg] = useState(false);
  const [advocateDlg, setAdvocateDlg] = useState(false);
  const [judgmentDlg, setJudgmentDlg] = useState(false);
  const [judgeAssignDlg, setJudgeAssignDlg] = useState(false);
  const [selfAssignSide, setSelfAssignSide] = useState("defense");

  const [statusForm, setStatusForm] = useState({
    current_status: "",
    current_stage: "",
  });
  const [scheduleForm, setScheduleForm] = useState({
    scheduled_date: null,
    time_slot: "",
    scheduling_reason: "",
  });
  const [hearingForm, setHearingForm] = useState({
    hearing_date: null,
    hearing_type: "",
    outcome: "",
    next_action: "",
    remarks: "",
  });
  const [advocateForm, setAdvocateForm] = useState({
    advocate_id: "",
    side: "prosecution",
  });
  const [judgmentForm, setJudgmentForm] = useState({
    judgment_date: null,
    verdict: "",
    sentence_given_days: "",
    fine_amount: "",
    remarks: "",
  });

  const [allAdvocates, setAllAdvocates] = useState([]);
  const [courts, setCourts] = useState([]);
  const [allJudges, setAllJudges] = useState([]);
  const [judgeAssignForm, setJudgeAssignForm] = useState({ judge_id: "" });

  // ── Person status verification ──
  const [pendingStatusUpdates, setPendingStatusUpdates] = useState([]);
  const [verifyRemarks, setVerifyRemarks] = useState("");

  const fetchPendingStatusUpdates = async () => {
    try {
      const res = await personsAPI.getPendingUpdates();
      // Filter to only this case's updates
      setPendingStatusUpdates(
        res.data.filter((u) => u.case_id === parseInt(id)),
      );
    } catch {
      /* ignore */
    }
  };

  const handleVerifyStatus = async (updateId, status) => {
    try {
      await personsAPI.verifyStatusUpdate(updateId, {
        verification_status: status,
        verification_remarks: verifyRemarks,
      });
      toast.current?.show({
        severity: "success",
        summary: `Status ${status}.`,
      });
      setVerifyRemarks("");
      fetchPendingStatusUpdates();
      fetchCase();
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: err.response?.data?.message || "Verification failed.",
      });
    }
  };

  const fetchCase = async () => {
    setLoading(true);
    try {
      const [caseRes, prioRes] = await Promise.all([
        casesAPI.getById(id),
        priorityAPI.getByCase(id).catch(() => ({ data: null })),
      ]);
      setCaseData(caseRes.data);
      setPriority(prioRes.data);
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Failed to load case.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCase();
    if (isJudge) fetchPendingStatusUpdates();
    advocatesAPI.getAll().then((r) =>
      setAllAdvocates(
        r.data.map((a) => ({
          label: `${a.name} (${a.bar_registration_no})`,
          value: a.advocate_id,
        })),
      ),
    );
    courtsAPI
      .getAll()
      .then((r) =>
        setCourts(
          r.data.map((c) => ({ label: c.court_name, value: c.court_id })),
        ),
      );
    judgesAPI.getAll().then((r) =>
      setAllJudges(
        r.data.map((j) => ({
          label: `${j.name} (${j.specialization || "General"})`,
          value: j.judge_id,
        })),
      ),
    );
  }, [id]);

  if (loading)
    return (
      <Card>
        <div style={{ padding: "2rem", textAlign: "center" }}>
          Loading case…
        </div>
      </Card>
    );
  if (!caseData)
    return (
      <Card>
        <div style={{ padding: "2rem" }}>Case not found.</div>
      </Card>
    );

  const judgeId = user?.judge_id || caseData.judge_id;

  // ── Status Update ──
  const handleUpdateStatus = async () => {
    try {
      await casesAPI.update(id, statusForm);
      toast.current.show({ severity: "success", summary: "Status updated." });
      setStatusDlg(false);
      fetchCase();
    } catch {
      toast.current.show({ severity: "error", summary: "Update failed." });
    }
  };

  // ── Schedule Hearing ──
  const handleSchedule = async () => {
    try {
      await casesAPI.scheduleHearing(id, {
        ...scheduleForm,
        scheduled_date:
          scheduleForm.scheduled_date instanceof Date
            ? scheduleForm.scheduled_date.toISOString().split("T")[0]
            : scheduleForm.scheduled_date,
        court_id: caseData.court_id,
        judge_id: judgeId,
      });
      toast.current.show({
        severity: "success",
        summary: "Hearing scheduled.",
      });
      setScheduleDlg(false);
      fetchCase();
    } catch {
      toast.current.show({ severity: "error", summary: "Scheduling failed." });
    }
  };

  // ── Record Hearing ──
  const handleHearing = async () => {
    try {
      await casesAPI.addHearing(id, {
        ...hearingForm,
        judge_id: judgeId,
        hearing_date:
          hearingForm.hearing_date instanceof Date
            ? hearingForm.hearing_date.toISOString().split("T")[0]
            : hearingForm.hearing_date,
      });
      toast.current.show({ severity: "success", summary: "Hearing recorded." });
      setHearingDlg(false);
      fetchCase();
    } catch {
      toast.current.show({
        severity: "error",
        summary: "Failed to record hearing.",
      });
    }
  };

  // ── Assign Advocate ──
  const handleAssignAdvocate = async () => {
    try {
      await casesAPI.assignAdvocate(id, advocateForm);
      toast.current.show({
        severity: "success",
        summary: "Advocate assigned.",
      });
      setAdvocateDlg(false);
      fetchCase();
    } catch {
      toast.current.show({ severity: "error", summary: "Assignment failed." });
    }
  };

  // ── Add Judgment ──
  const handleJudgment = async () => {
    confirmDialog({
      message: "This will close the case. Proceed?",
      header: "Confirm Judgment",
      icon: "pi pi-exclamation-triangle",
      accept: async () => {
        try {
          await casesAPI.addJudgment(id, {
            ...judgmentForm,
            judgment_date:
              judgmentForm.judgment_date instanceof Date
                ? judgmentForm.judgment_date.toISOString().split("T")[0]
                : judgmentForm.judgment_date,
          });
          toast.current.show({
            severity: "success",
            summary: "Judgment delivered. Case closed.",
          });
          setJudgmentDlg(false);
          fetchCase();
        } catch {
          toast.current.show({
            severity: "error",
            summary: "Failed to record judgment.",
          });
        }
      },
    });
  };

  // ── Assign Judge (writer) ──
  const handleAssignJudge = async () => {
    try {
      await casesAPI.update(id, { judge_id: judgeAssignForm.judge_id });
      toast.current.show({ severity: "success", summary: "Judge assigned." });
      setJudgeAssignDlg(false);
      fetchCase();
    } catch {
      toast.current.show({
        severity: "error",
        summary: "Failed to assign judge.",
      });
    }
  };

  // ── Advocate Self-Assign ──
  const handleSelfAssign = async () => {
    try {
      await casesAPI.assignAdvocate(id, { side: selfAssignSide });
      toast.current.show({
        severity: "success",
        summary: "You have been assigned to this case.",
      });
      fetchCase();
    } catch (err) {
      const msg = err.response?.data?.message || "Assignment failed.";
      toast.current.show({ severity: "error", summary: msg });
    }
  };

  const CLUSTER_MAP = {
    0: { label: "CRITICAL", severity: "danger" },
    1: { label: "HIGH", severity: "warning" },
    2: { label: "MEDIUM", severity: "info" },
    3: { label: "LOW", severity: "success" },
  };

  const clusterInfo = priority
    ? CLUSTER_MAP[priority.cluster]
    : caseData.features
      ? CLUSTER_MAP[caseData.features.priority_cluster]
      : null;

  return (
    <div>
      <Toast ref={toast} />
      <ConfirmDialog />

      {/* Header */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: "1.25rem 1.5rem",
          marginBottom: "1.5rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "0.5rem",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "1.3rem" }}>
              Case #{caseData.case_id}
            </h2>
            <StatusBadge status={caseData.current_status} />
            {clusterInfo && (
              <Tag value={clusterInfo.label} severity={clusterInfo.severity} />
            )}
          </div>
          <div style={{ fontSize: "0.9rem", color: "#64748b" }}>
            <span>
              <i className="pi pi-tag" style={{ marginRight: 4 }} />
              {caseData.case_type} · {caseData.offense_type}
            </span>
            <span style={{ margin: "0 0.75rem" }}>·</span>
            <span>
              <i className="pi pi-building" style={{ marginRight: 4 }} />
              {caseData.court_name}
            </span>
            {caseData.judge_name && (
              <>
                <span style={{ margin: "0 0.75rem" }}>·</span>
                <span>
                  <i className="pi pi-user" style={{ marginRight: 4 }} />
                  {caseData.judge_name}
                </span>
              </>
            )}
          </div>
          {priority && (
            <div
              style={{
                marginTop: "0.4rem",
                fontSize: "0.8rem",
                color: "#64748b",
              }}
            >
              Priority Score:{" "}
              <strong style={{ color: "#2563eb" }}>
                {priority.priority_score}
              </strong>
              /100
            </div>
          )}
        </div>

        {isJudge && (
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <Button
              label="Update Status"
              icon="pi pi-pencil"
              size="small"
              outlined
              onClick={() => {
                setStatusForm({
                  current_status: caseData.current_status,
                  current_stage: caseData.current_stage,
                });
                setStatusDlg(true);
              }}
            />
            <Button
              label="Schedule Hearing"
              icon="pi pi-calendar-plus"
              size="small"
              outlined
              onClick={() => setScheduleDlg(true)}
            />
            <Button
              label="Record Hearing"
              icon="pi pi-microphone"
              size="small"
              outlined
              onClick={() => setHearingDlg(true)}
            />
            <Button
              label="Assign Advocate"
              icon="pi pi-user-plus"
              size="small"
              outlined
              onClick={() => setAdvocateDlg(true)}
            />
            {caseData.is_active && (
              <Button
                label="Deliver Judgment"
                icon="pi pi-gavel"
                size="small"
                severity="warning"
                outlined
                onClick={() => setJudgmentDlg(true)}
              />
            )}
          </div>
        )}

        {isWriter && (
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <Button
              label="Assign Judge"
              icon="pi pi-user"
              size="small"
              outlined
              onClick={() => {
                setJudgeAssignForm({ judge_id: caseData.judge_id || "" });
                setJudgeAssignDlg(true);
              }}
            />
            <Button
              label="Assign Advocate"
              icon="pi pi-user-plus"
              size="small"
              outlined
              onClick={() => setAdvocateDlg(true)}
            />
          </div>
        )}

        {isAdvocate &&
          !caseData.advocates?.some(
            (a) =>
              a.user_id === user?.user_id ||
              a.advocate_id === user?.advocate_id,
          ) && (
            <div
              style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
            >
              <Dropdown
                value={selfAssignSide}
                options={[
                  { label: "Prosecution", value: "prosecution" },
                  { label: "Defense", value: "defense" },
                ]}
                onChange={(e) => setSelfAssignSide(e.value)}
                style={{ width: 150 }}
              />
              <Button
                label="Join This Case"
                icon="pi pi-plus-circle"
                size="small"
                severity="warning"
                onClick={handleSelfAssign}
              />
            </div>
          )}
      </div>

      {/* Tabs */}
      <TabView>
        {/* Overview */}
        <TabPanel header="Overview" leftIcon="pi pi-info-circle">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1.5rem",
            }}
          >
            <div>
              <div className="section-title">Case Details</div>
              <table
                style={{
                  width: "100%",
                  fontSize: "0.875rem",
                  borderCollapse: "collapse",
                }}
              >
                {[
                  ["Case ID", `#${caseData.case_id}`],
                  ["Case Type", caseData.case_type],
                  ["Offense Type", caseData.offense_type],
                  ["Legal Status", caseData.legal_status],
                  ["Trial Status", caseData.trial_status],
                  ["Current Stage", caseData.current_stage],
                  ["Filing Date", caseData.filing_date?.split("T")[0] || "—"],
                  [
                    "Last Hearing",
                    caseData.last_hearing_date?.split("T")[0] || "—",
                  ],
                  ["Registered By", caseData.created_by_name],
                  ["Court", caseData.court_name],
                  ["Judge", caseData.judge_name || "Unassigned"],
                  ["Created At", caseData.created_at?.split("T")[0]],
                ].map(([label, value]) => (
                  <tr key={label}>
                    <td
                      style={{
                        padding: "0.4rem 0",
                        color: "#64748b",
                        fontWeight: 600,
                        width: "45%",
                      }}
                    >
                      {label}
                    </td>
                    <td style={{ padding: "0.4rem 0" }}>{value || "—"}</td>
                  </tr>
                ))}
              </table>
            </div>

            <div>
              {caseData.detention && (
                <>
                  <div className="section-title">Detention Info</div>
                  <table
                    style={{
                      width: "100%",
                      fontSize: "0.875rem",
                      borderCollapse: "collapse",
                      marginBottom: "1rem",
                    }}
                  >
                    {[
                      ["Detention Days", caseData.detention.detention_days],
                      [
                        "Expected Sentence",
                        `${caseData.detention.expected_sentence_days}d`,
                      ],
                      [
                        "Detention Ratio",
                        caseData.detention.detention_ratio?.toFixed(2),
                      ],
                      [
                        "Overstay",
                        caseData.detention.overstay_flag ? "⚠️ YES" : "No",
                      ],
                      [
                        "Life Sentence",
                        caseData.detention.life_sentence_flag ? "Yes" : "No",
                      ],
                    ].map(([label, value]) => (
                      <tr key={label}>
                        <td
                          style={{
                            padding: "0.4rem 0",
                            color: "#64748b",
                            fontWeight: 600,
                            width: "50%",
                          }}
                        >
                          {label}
                        </td>
                        <td style={{ padding: "0.4rem 0" }}>{value ?? "—"}</td>
                      </tr>
                    ))}
                  </table>
                </>
              )}

              {caseData.trial_data && (
                <>
                  <div className="section-title">Trial Data</div>
                  <table
                    style={{
                      width: "100%",
                      fontSize: "0.875rem",
                      borderCollapse: "collapse",
                    }}
                  >
                    {[
                      ["Days Pending", caseData.trial_data.days_pending],
                      [
                        "Number of Trials",
                        caseData.trial_data.number_of_trials,
                      ],
                      ["Adjournments", caseData.trial_data.no_of_adjournments],
                      [
                        "Last Hearing Gap",
                        caseData.trial_data.last_hearing_gap,
                      ],
                    ].map(([label, value]) => (
                      <tr key={label}>
                        <td
                          style={{
                            padding: "0.4rem 0",
                            color: "#64748b",
                            fontWeight: 600,
                            width: "50%",
                          }}
                        >
                          {label}
                        </td>
                        <td style={{ padding: "0.4rem 0" }}>{value ?? "—"}</td>
                      </tr>
                    ))}
                  </table>
                </>
              )}
            </div>
          </div>

          <Divider />
          <div className="section-title">FIR Text</div>
          <div
            style={{
              background: "#f8fafc",
              borderRadius: 8,
              padding: "1rem",
              fontSize: "0.875rem",
              lineHeight: 1.7,
            }}
          >
            {caseData.fir_text || "No FIR text provided."}
          </div>

          {caseData.summary && (
            <>
              <Divider />
              <div className="section-title">Summary</div>
              <div
                style={{
                  background: "#f0fdf4",
                  borderRadius: 8,
                  padding: "1rem",
                  fontSize: "0.875rem",
                  lineHeight: 1.7,
                }}
              >
                {caseData.summary}
              </div>
            </>
          )}

          {caseData.sections?.length > 0 && (
            <>
              <Divider />
              <div className="section-title">Legal Sections</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {caseData.sections.map((s) => (
                  <Tag
                    key={s.section_id}
                    value={`${s.law_code} §${s.section} — ${s.description?.substring(0, 40)}`}
                    severity={
                      s.bailability === "Non-Bailable" ? "danger" : "info"
                    }
                  />
                ))}
              </div>
            </>
          )}

          {caseData.judgment && (
            <>
              <Divider />
              <div className="section-title">⚖️ Judgment</div>
              <div
                style={{
                  background: "#fffbeb",
                  borderRadius: 8,
                  padding: "1rem",
                  border: "1px solid #fcd34d",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.5rem",
                    fontSize: "0.875rem",
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600 }}>Verdict:</span>{" "}
                    {caseData.judgment.verdict}
                  </div>
                  <div>
                    <span style={{ fontWeight: 600 }}>Date:</span>{" "}
                    {caseData.judgment.judgment_date?.split("T")[0]}
                  </div>
                  <div>
                    <span style={{ fontWeight: 600 }}>Sentence:</span>{" "}
                    {caseData.judgment.sentence_given_days} days
                  </div>
                  <div>
                    <span style={{ fontWeight: 600 }}>Fine:</span> ₹
                    {caseData.judgment.fine_amount || 0}
                  </div>
                </div>
                {caseData.judgment.remarks && (
                  <div
                    style={{
                      marginTop: "0.5rem",
                      color: "#64748b",
                      fontSize: "0.8rem",
                    }}
                  >
                    Remarks: {caseData.judgment.remarks}
                  </div>
                )}
              </div>
            </>
          )}
        </TabPanel>

        {/* Persons */}
        <TabPanel
          header={`Persons (${caseData.persons?.length || 0})`}
          leftIcon="pi pi-users"
        >
          {canManagePersons && (
            <div style={{ marginBottom: "1rem" }}>
              <PersonForm
                onAdd={async (data) => {
                  await casesAPI.addPerson(id, data);
                  toast.current.show({
                    severity: "success",
                    summary: "Person added.",
                  });
                  fetchCase();
                }}
                toast={toast}
              />
              <Divider />
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "1rem",
            }}
          >
            {(caseData.persons || []).map((p) => (
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
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "0.75rem",
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
                      <span
                        title="Vulnerable"
                        style={{ color: "#dc2626", fontWeight: 700 }}
                      >
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
                    Vulnerability Score:{" "}
                    <strong>{p.vulnerability_score}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {(!caseData.persons || caseData.persons.length === 0) && (
            <div
              style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}
            >
              No persons recorded.
            </div>
          )}
        </TabPanel>

        {/* Advocates */}
        <TabPanel
          header={`Advocates (${caseData.advocates?.length || 0})`}
          leftIcon="pi pi-briefcase"
        >
          {canAssignAdvocate && (
            <Button
              label="Assign Advocate"
              icon="pi pi-plus"
              style={{ marginBottom: "1rem" }}
              onClick={() => setAdvocateDlg(true)}
            />
          )}
          <DataTable
            value={caseData.advocates || []}
            emptyMessage="No advocates assigned."
          >
            <Column field="name" header="Name" />
            <Column field="bar_registration_no" header="Bar No." />
            <Column field="contact_info" header="Contact" />
            <Column
              field="side"
              header="Side"
              body={(r) => (
                <Tag
                  value={r.side}
                  severity={r.side === "prosecution" ? "danger" : "info"}
                />
              )}
            />
            {(isJudge || isWriter) && (
              <Column
                header="Remove"
                body={(r) => (
                  <Button
                    icon="pi pi-times"
                    size="small"
                    text
                    severity="danger"
                    onClick={() => {
                      confirmDialog({
                        message: `Remove ${r.name}?`,
                        header: "Confirm",
                        accept: async () => {
                          await casesAPI.removeAdvocate(id, r.advocate_id);
                          fetchCase();
                        },
                      });
                    }}
                  />
                )}
              />
            )}
          </DataTable>
        </TabPanel>

        {/* Hearings */}
        <TabPanel
          header={`Hearings (${caseData.hearings?.length || 0})`}
          leftIcon="pi pi-microphone"
        >
          {isJudge && (
            <div
              style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}
            >
              <Button
                label="Schedule Hearing"
                icon="pi pi-calendar-plus"
                size="small"
                outlined
                onClick={() => setScheduleDlg(true)}
              />
              <Button
                label="Record Hearing"
                icon="pi pi-microphone"
                size="small"
                outlined
                onClick={() => setHearingDlg(true)}
              />
            </div>
          )}

          <div className="section-title" style={{ marginBottom: "0.75rem" }}>
            Hearing Schedule
          </div>
          <DataTable
            value={caseData.schedule || []}
            size="small"
            style={{ marginBottom: "1.5rem" }}
            emptyMessage="No hearings scheduled."
          >
            <Column
              field="scheduled_date"
              header="Date"
              body={(r) => r.scheduled_date?.split("T")[0]}
            />
            <Column field="time_slot" header="Time" />
            <Column field="court_name" header="Court" />
            <Column field="judge_name" header="Judge" />
            <Column field="priority_rank" header="Priority Rank" />
            <Column
              field="scheduling_status"
              header="Status"
              body={(r) => <StatusBadge status={r.scheduling_status} />}
            />
            <Column
              field="scheduling_reason"
              header="Reason"
              style={{ maxWidth: 200 }}
            />
          </DataTable>

          <div className="section-title" style={{ marginBottom: "0.75rem" }}>
            Hearing Records
          </div>
          <DataTable
            value={caseData.hearings || []}
            size="small"
            emptyMessage="No hearing records."
          >
            <Column
              field="hearing_date"
              header="Date"
              body={(r) => r.hearing_date?.split("T")[0]}
            />
            <Column field="hearing_type" header="Type" />
            <Column field="judge_name" header="Judge" />
            <Column field="outcome" header="Outcome" />
            <Column field="next_action" header="Next Action" />
            <Column
              field="remarks"
              header="Remarks"
              style={{ maxWidth: 200 }}
            />
          </DataTable>
        </TabPanel>

        {/* Timeline */}
        <TabPanel header="Timeline" leftIcon="pi pi-history">
          <Timeline
            value={caseData.events || []}
            align="left"
            content={(item) => (
              <div
                style={{
                  background: "#f8fafc",
                  borderRadius: 8,
                  padding: "0.75rem",
                  marginBottom: "0.5rem",
                }}
              >
                <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                  {item.event_type} · {item.event_subtype}
                </div>
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "#64748b",
                    marginTop: "0.25rem",
                  }}
                >
                  {item.description}
                </div>
                {item.previous_status && (
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "#94a3b8",
                      marginTop: "0.25rem",
                    }}
                  >
                    {item.previous_status} → {item.new_status}
                  </div>
                )}
                <div
                  style={{
                    fontSize: "0.7rem",
                    color: "#94a3b8",
                    marginTop: "0.25rem",
                  }}
                >
                  By {item.performed_by} · {item.event_date?.split("T")[0]}
                </div>
              </div>
            )}
            marker={(item) => (
              <span
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background:
                    item.event_type === "judgment"
                      ? "#dc2626"
                      : item.event_type === "hearing"
                        ? "#2563eb"
                        : item.event_type === "status_change"
                          ? "#d97706"
                          : "#6b7280",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 12,
                }}
              >
                <i
                  className={
                    item.event_type === "judgment"
                      ? "pi pi-gavel"
                      : item.event_type === "hearing"
                        ? "pi pi-microphone"
                        : "pi pi-circle"
                  }
                />
              </span>
            )}
          />
          {(!caseData.events || caseData.events.length === 0) && (
            <div
              style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}
            >
              No events recorded.
            </div>
          )}

          <Divider />
          <div className="section-title">Case History</div>
          <DataTable
            value={caseData.history?.slice(0, 10) || []}
            size="small"
            emptyMessage="No history."
          >
            <Column
              field="status"
              header="Status"
              body={(r) => <StatusBadge status={r.status} />}
            />
            <Column field="remarks" header="Remarks" />
            <Column
              field="updated_at"
              header="When"
              body={(r) => r.updated_at?.replace("T", " ")?.split(".")[0]}
            />
          </DataTable>
        </TabPanel>

        {/* Person Status Verification — Judge only */}
        {isJudge && (
          <TabPanel
            header={`Status Verification${pendingStatusUpdates.length ? ` (${pendingStatusUpdates.length})` : ""}`}
            leftIcon="pi pi-heart mr-2"
          >
            {pendingStatusUpdates.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "2rem",
                  color: "#94a3b8",
                }}
              >
                No pending person status updates for this case.
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {pendingStatusUpdates.map((u) => (
                  <Card
                    key={u.update_id}
                    style={{
                      border: `2px solid ${u.status_type === "deceased" ? "#fee2e2" : u.status_type === "hospitalized" ? "#fef3c7" : "#dbeafe"}`,
                      borderRadius: 10,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                        gap: "1rem",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div
                          style={{
                            display: "flex",
                            gap: "0.5rem",
                            alignItems: "center",
                            marginBottom: "0.5rem",
                          }}
                        >
                          <Tag
                            value={u.status_type?.toUpperCase()}
                            severity={
                              u.status_type === "deceased"
                                ? "danger"
                                : u.status_type === "hospitalized"
                                  ? "warning"
                                  : "info"
                            }
                            icon={
                              u.status_type === "deceased"
                                ? "pi pi-times-circle"
                                : "pi pi-heart"
                            }
                          />
                          <Tag
                            value={u.person_role?.toUpperCase()}
                            severity={
                              u.person_role === "victim"
                                ? "danger"
                                : u.person_role === "accused"
                                  ? "warning"
                                  : "info"
                            }
                          />
                          <span
                            style={{ fontSize: "0.75rem", color: "#94a3b8" }}
                          >
                            {u.case_number}
                          </span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: "1rem" }}>
                          {u.person_name}
                        </div>
                        <div
                          style={{
                            fontSize: "0.8rem",
                            color: "#64748b",
                            marginTop: "0.3rem",
                          }}
                        >
                          {u.age && `Age: ${u.age}`}
                          {u.gender && ` • ${u.gender}`}
                        </div>
                        {u.description && (
                          <div
                            style={{
                              fontSize: "0.85rem",
                              marginTop: "0.5rem",
                              background: "#f8fafc",
                              padding: "0.5rem 0.75rem",
                              borderRadius: 6,
                            }}
                          >
                            {u.description}
                          </div>
                        )}
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "#94a3b8",
                            marginTop: "0.4rem",
                          }}
                        >
                          Submitted by: {u.submitted_by_name} •{" "}
                          {u.created_at
                            ? new Date(u.created_at).toLocaleString("en-IN")
                            : ""}
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.5rem",
                          minWidth: 220,
                        }}
                      >
                        {u.certificate_path && (
                          <a
                            href={`http://localhost:5000${u.certificate_path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.3rem",
                              background: "#eef0fb",
                              color: "#000080",
                              padding: "0.4rem 0.75rem",
                              borderRadius: 6,
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              textDecoration: "none",
                            }}
                          >
                            <i className="pi pi-file" />
                            View{" "}
                            {u.certificate_type === "death_certificate"
                              ? "Death"
                              : "Medical"}{" "}
                            Certificate
                          </a>
                        )}
                        <InputTextarea
                          value={verifyRemarks}
                          onChange={(e) => setVerifyRemarks(e.target.value)}
                          rows={2}
                          placeholder="Remarks (optional)"
                          style={{ width: "100%", fontSize: "0.8rem" }}
                        />
                        <div style={{ display: "flex", gap: "0.4rem" }}>
                          <Button
                            label="Verify"
                            icon="pi pi-check"
                            size="small"
                            style={{
                              background: "#138808",
                              border: "none",
                              flex: 1,
                            }}
                            onClick={() =>
                              handleVerifyStatus(u.update_id, "verified")
                            }
                          />
                          <Button
                            label="Reject"
                            icon="pi pi-times"
                            size="small"
                            severity="danger"
                            style={{ flex: 1 }}
                            onClick={() =>
                              handleVerifyStatus(u.update_id, "rejected")
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabPanel>
        )}
      </TabView>
      <Dialog
        header="Update Case Status"
        visible={statusDlg}
        style={{ width: 420 }}
        onHide={() => setStatusDlg(false)}
        footer={
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.5rem",
            }}
          >
            <Button
              label="Cancel"
              outlined
              onClick={() => setStatusDlg(false)}
            />
            <Button
              label="Update"
              icon="pi pi-check"
              onClick={handleUpdateStatus}
            />
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label className="field-label">Current Status</label>
            <Dropdown
              value={statusForm.current_status}
              options={STATUS_OPTIONS}
              onChange={(e) =>
                setStatusForm((p) => ({ ...p, current_status: e.value }))
              }
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <label className="field-label">Case Stage</label>
            <Dropdown
              value={statusForm.current_stage}
              options={STAGE_OPTIONS}
              onChange={(e) =>
                setStatusForm((p) => ({ ...p, current_stage: e.value }))
              }
              style={{ width: "100%" }}
            />
          </div>
        </div>
      </Dialog>

      {/* ── SCHEDULE DIALOG ── */}
      <Dialog
        header="Schedule Hearing"
        visible={scheduleDlg}
        style={{ width: 460 }}
        onHide={() => setScheduleDlg(false)}
        footer={
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.5rem",
            }}
          >
            <Button
              label="Cancel"
              outlined
              onClick={() => setScheduleDlg(false)}
            />
            <Button
              label="Schedule"
              icon="pi pi-check"
              onClick={handleSchedule}
            />
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label className="field-label">Hearing Date *</label>
            <Calendar
              value={scheduleForm.scheduled_date}
              onChange={(e) =>
                setScheduleForm((p) => ({ ...p, scheduled_date: e.value }))
              }
              dateFormat="dd/mm/yy"
              showIcon
              minDate={new Date()}
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <label className="field-label">Time Slot</label>
            <InputText
              value={scheduleForm.time_slot}
              onChange={(e) =>
                setScheduleForm((p) => ({ ...p, time_slot: e.target.value }))
              }
              placeholder="e.g. 10:00–10:30"
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <label className="field-label">Scheduling Reason</label>
            <InputTextarea
              value={scheduleForm.scheduling_reason}
              onChange={(e) =>
                setScheduleForm((p) => ({
                  ...p,
                  scheduling_reason: e.target.value,
                }))
              }
              rows={2}
              style={{ width: "100%" }}
            />
          </div>
        </div>
      </Dialog>

      {/* ── HEARING RECORD DIALOG ── */}
      <Dialog
        header="Record Hearing Outcome"
        visible={hearingDlg}
        style={{ width: 480 }}
        onHide={() => setHearingDlg(false)}
        footer={
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.5rem",
            }}
          >
            <Button
              label="Cancel"
              outlined
              onClick={() => setHearingDlg(false)}
            />
            <Button label="Save" icon="pi pi-check" onClick={handleHearing} />
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="form-grid-2">
            <div>
              <label className="field-label">Hearing Date *</label>
              <Calendar
                value={hearingForm.hearing_date}
                onChange={(e) =>
                  setHearingForm((p) => ({ ...p, hearing_date: e.value }))
                }
                dateFormat="dd/mm/yy"
                showIcon
                style={{ width: "100%" }}
              />
            </div>
            <div>
              <label className="field-label">Hearing Type</label>
              <Dropdown
                value={hearingForm.hearing_type}
                options={HEARING_TYPES}
                onChange={(e) =>
                  setHearingForm((p) => ({ ...p, hearing_type: e.value }))
                }
                style={{ width: "100%" }}
              />
            </div>
          </div>
          <div>
            <label className="field-label">Outcome</label>
            <InputText
              value={hearingForm.outcome}
              onChange={(e) =>
                setHearingForm((p) => ({ ...p, outcome: e.target.value }))
              }
              placeholder="e.g. Adjourned, Bail Granted, Evidence Admitted"
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <label className="field-label">Next Action</label>
            <InputText
              value={hearingForm.next_action}
              onChange={(e) =>
                setHearingForm((p) => ({ ...p, next_action: e.target.value }))
              }
              placeholder="e.g. Next hearing on 15 May"
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <label className="field-label">Remarks</label>
            <InputTextarea
              value={hearingForm.remarks}
              onChange={(e) =>
                setHearingForm((p) => ({ ...p, remarks: e.target.value }))
              }
              rows={2}
              style={{ width: "100%" }}
            />
          </div>
        </div>
      </Dialog>

      {/* ── ADVOCATE DIALOG ── */}
      <Dialog
        header="Assign Advocate"
        visible={advocateDlg}
        style={{ width: 420 }}
        onHide={() => setAdvocateDlg(false)}
        footer={
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.5rem",
            }}
          >
            <Button
              label="Cancel"
              outlined
              onClick={() => setAdvocateDlg(false)}
            />
            <Button
              label="Assign"
              icon="pi pi-check"
              onClick={handleAssignAdvocate}
            />
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label className="field-label">Advocate</label>
            <Dropdown
              value={advocateForm.advocate_id}
              options={allAdvocates}
              onChange={(e) =>
                setAdvocateForm((p) => ({ ...p, advocate_id: e.value }))
              }
              filter
              placeholder="Search advocate..."
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <label className="field-label">Side</label>
            <Dropdown
              value={advocateForm.side}
              options={[
                { label: "Prosecution", value: "prosecution" },
                { label: "Defense", value: "defense" },
              ]}
              onChange={(e) =>
                setAdvocateForm((p) => ({ ...p, side: e.value }))
              }
              style={{ width: "100%" }}
            />
          </div>
        </div>
      </Dialog>

      {/* ── JUDGMENT DIALOG ── */}
      <Dialog
        header="⚖️ Deliver Judgment"
        visible={judgmentDlg}
        style={{ width: 500 }}
        onHide={() => setJudgmentDlg(false)}
        footer={
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.5rem",
            }}
          >
            <Button
              label="Cancel"
              outlined
              onClick={() => setJudgmentDlg(false)}
            />
            <Button
              label="Deliver Judgment"
              icon="pi pi-gavel"
              severity="warning"
              onClick={handleJudgment}
            />
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="form-grid-2">
            <div>
              <label className="field-label">Judgment Date *</label>
              <Calendar
                value={judgmentForm.judgment_date}
                onChange={(e) =>
                  setJudgmentForm((p) => ({ ...p, judgment_date: e.value }))
                }
                dateFormat="dd/mm/yy"
                showIcon
                style={{ width: "100%" }}
              />
            </div>
            <div>
              <label className="field-label">Verdict *</label>
              <Dropdown
                value={judgmentForm.verdict}
                options={[
                  { label: "Guilty", value: "Guilty" },
                  { label: "Not Guilty", value: "Not Guilty" },
                  { label: "Acquitted", value: "Acquitted" },
                  { label: "Convicted", value: "Convicted" },
                  { label: "Dismissed", value: "Dismissed" },
                  { label: "Bail Granted", value: "Bail Granted" },
                  { label: "Bail Rejected", value: "Bail Rejected" },
                  { label: "Discharged", value: "Discharged" },
                  { label: "Settled", value: "Settled" },
                ]}
                onChange={(e) =>
                  setJudgmentForm((p) => ({ ...p, verdict: e.value }))
                }
                placeholder="Select verdict"
                style={{ width: "100%" }}
              />
            </div>
          </div>
          <div className="form-grid-2">
            <div>
              <label className="field-label">Sentence (days)</label>
              <InputText
                value={judgmentForm.sentence_given_days}
                onChange={(e) =>
                  setJudgmentForm((p) => ({
                    ...p,
                    sentence_given_days: e.target.value,
                  }))
                }
                type="number"
                style={{ width: "100%" }}
              />
            </div>
            <div>
              <label className="field-label">Fine Amount (₹)</label>
              <InputText
                value={judgmentForm.fine_amount}
                onChange={(e) =>
                  setJudgmentForm((p) => ({
                    ...p,
                    fine_amount: e.target.value,
                  }))
                }
                type="number"
                style={{ width: "100%" }}
              />
            </div>
          </div>
          <div>
            <label className="field-label">Remarks</label>
            <InputTextarea
              value={judgmentForm.remarks}
              onChange={(e) =>
                setJudgmentForm((p) => ({ ...p, remarks: e.target.value }))
              }
              rows={3}
              style={{ width: "100%" }}
            />
          </div>
        </div>
      </Dialog>

      {/* ── JUDGE ASSIGNMENT DIALOG (writer) ── */}
      <Dialog
        header="Assign Judge"
        visible={judgeAssignDlg}
        style={{ width: 420 }}
        onHide={() => setJudgeAssignDlg(false)}
        footer={
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.5rem",
            }}
          >
            <Button
              label="Cancel"
              outlined
              onClick={() => setJudgeAssignDlg(false)}
            />
            <Button
              label="Assign"
              icon="pi pi-check"
              onClick={handleAssignJudge}
            />
          </div>
        }
      >
        <div>
          <label className="field-label">Select Judge</label>
          <Dropdown
            value={judgeAssignForm.judge_id}
            options={allJudges}
            onChange={(e) =>
              setJudgeAssignForm((p) => ({ ...p, judge_id: e.value }))
            }
            filter
            placeholder="Search judge..."
            style={{ width: "100%" }}
          />
        </div>
      </Dialog>
    </div>
  );
}
