import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Steps } from "primereact/steps";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Toast } from "primereact/toast";
import { Divider } from "primereact/divider";
import { Tag } from "primereact/tag";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Message } from "primereact/message";
import gsap from "gsap";
import { casesAPI, courtsAPI, usersAPI, priorityAPI } from "../../services/api";
import PersonForm from "../../components/cases/PersonForm";

const CASE_TYPES = [
  { label: "Criminal", value: "criminal" },
  { label: "Civil", value: "civil" },
  { label: "POCSO", value: "pocso" },
  { label: "Domestic Violence", value: "domestic_violence" },
  { label: "Cyber Crime", value: "cyber_crime" },
  { label: "Financial Fraud", value: "financial_fraud" },
  { label: "Narcotics", value: "narcotics" },
  { label: "Other", value: "other" },
];

const STEPS = [
  { label: "Case Info" },
  { label: "Persons" },
  { label: "Legal Sections" },
  { label: "Review" },
];

export default function CreateCase() {
  const [step, setStep] = useState(0);
  const [caseId, setCaseId] = useState(null);
  const [courts, setCourts] = useState([]);
  const [sections, setSections] = useState([]);
  const [addedPersons, setAddedPersons] = useState([]);
  const [addedSections, setAddedSections] = useState([]);
  const [nlpResult, setNlpResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [recommendingSections, setRecommendingSections] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [suggestionsLoaded, setSuggestionsLoaded] = useState(false);
  const toast = useRef(null);
  const navigate = useNavigate();

  // Step 1 fields
  const [form, setForm] = useState({
    fir_text: "",
    summary: "",
    case_type: "",
    offense_type: "",
    filing_date: new Date(),
    court_id: "",
  });

  const [sectionSearch, setSectionSearch] = useState("");

  useEffect(() => {
    courtsAPI
      .getAll()
      .then((r) =>
        setCourts(
          r.data.map((c) => ({ label: c.court_name, value: c.court_id })),
        ),
      );
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      usersAPI
        .getLegalSections({ search: sectionSearch })
        .then((r) => setSections(r.data))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [sectionSearch]);

  // ── Auto-suggest IPC sections when entering Step 2 ──────
  useEffect(() => {
    if (step === 2 && !suggestionsLoaded && (form.fir_text || form.summary)) {
      setSuggestionsLoaded(true);
      setRecommendingSections(true);
      priorityAPI
        .recommendSections({ fir_text: form.fir_text, summary: form.summary })
        .then((res) => {
          const recs = res.data?.recommendations || [];
          // Filter out sections already added
          const fresh = recs.filter(
            (r) => !addedSections.some((s) => s.section_id === r.section_id),
          );
          setAiSuggestions(fresh);
          if (fresh.length > 0) {
            toast.current?.show({
              severity: "info",
              summary: `AI suggests ${fresh.length} applicable IPC section(s) based on case classification.`,
              life: 4000,
            });
          }
        })
        .catch(() => {})
        .finally(() => setRecommendingSections(false));
    }
  }, [step]);

  const acceptSuggestion = async (section) => {
    const already = addedSections.find(
      (s) => s.section_id === section.section_id,
    );
    if (already) return;
    if (caseId) {
      try {
        await casesAPI.addSection(caseId, { section_id: section.section_id });
      } catch {
        /* may already exist */
      }
    }
    setAddedSections((prev) => [
      ...prev,
      { ...section, ai_reason: section.reason },
    ]);
    setAiSuggestions((prev) =>
      prev.filter((s) => s.section_id !== section.section_id),
    );
  };

  const dismissSuggestion = (sectionId) => {
    setAiSuggestions((prev) => prev.filter((s) => s.section_id !== sectionId));
  };

  const acceptAllSuggestions = async () => {
    for (const sec of aiSuggestions) {
      if (caseId) {
        try {
          await casesAPI.addSection(caseId, { section_id: sec.section_id });
        } catch {
          /* may already exist */
        }
      }
      setAddedSections((prev) => [...prev, { ...sec, ai_reason: sec.reason }]);
    }
    setAiSuggestions([]);
    toast.current?.show({
      severity: "success",
      summary: "All AI suggestions accepted.",
    });
  };

  // ── Step 1: Submit case info ─────────────────────────────
  const handleGenerateSummary = async () => {
    if (!form.fir_text) {
      toast.current.show({
        severity: "warn",
        summary: "Enter FIR text first.",
      });
      return;
    }
    setGeneratingSummary(true);
    try {
      const res = await priorityAPI.generateSummary({
        fir_text: form.fir_text,
      });
      if (res.data?.summary) {
        f("summary", res.data.summary);
        toast.current.show({
          severity: "success",
          summary: "Summary generated by AI.",
        });
      }
    } catch {
      toast.current.show({
        severity: "error",
        summary: "Failed to generate summary.",
      });
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleRecommendSections = async () => {
    if (!form.fir_text && !form.summary) {
      toast.current.show({
        severity: "warn",
        summary: "Enter FIR text or summary first.",
      });
      return;
    }
    setRecommendingSections(true);
    try {
      const res = await priorityAPI.recommendSections({
        fir_text: form.fir_text,
        summary: form.summary,
      });
      const recs = res.data?.recommendations || [];
      if (recs.length === 0) {
        toast.current.show({
          severity: "info",
          summary: "No matching sections found.",
        });
        return;
      }
      // Auto-add recommended sections that aren't already added
      let added = 0;
      for (const rec of recs) {
        const already = addedSections.find(
          (s) => s.section_id === rec.section_id,
        );
        if (!already && caseId) {
          try {
            await casesAPI.addSection(caseId, { section_id: rec.section_id });
            setAddedSections((prev) => [
              ...prev,
              { ...rec, ai_reason: rec.reason },
            ]);
            added++;
          } catch {
            /* section may already exist */
          }
        } else if (!already && !caseId) {
          setAddedSections((prev) => [
            ...prev,
            { ...rec, ai_reason: rec.reason },
          ]);
          added++;
        }
      }
      toast.current.show({
        severity: "success",
        summary: `AI recommended ${recs.length} section(s), ${added} new added.`,
      });
    } catch {
      toast.current.show({
        severity: "error",
        summary: "Failed to get AI recommendations.",
      });
    } finally {
      setRecommendingSections(false);
    }
  };

  const handleStep1 = async () => {
    if (!form.fir_text || !form.case_type || !form.court_id) {
      toast.current.show({
        severity: "warn",
        summary: "Please fill FIR text, case type and court.",
      });
      return;
    }
    setSubmitting(true);
    try {
      // Analyze text via Flask NLP
      priorityAPI
        .analyzeText({ fir_text: form.fir_text, summary: form.summary })
        .then((r) => setNlpResult(r.data))
        .catch(() => {});

      const res = await casesAPI.create({
        ...form,
        filing_date:
          form.filing_date instanceof Date
            ? form.filing_date.toISOString().split("T")[0]
            : form.filing_date,
      });
      setCaseId(res.data.case_id);
      toast.current.show({
        severity: "success",
        summary: `Case #${res.data.case_id} created.`,
      });
      setStep(1);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: err.response?.data?.message || "Failed to create case.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Step 2: Add person ───────────────────────────────────
  const handleAddPerson = async (personData) => {
    try {
      await casesAPI.addPerson(caseId, personData);
      setAddedPersons((prev) => [...prev, personData]);
      toast.current.show({
        severity: "success",
        summary: `${personData.role} added.`,
      });
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Failed to add person.",
      });
    }
  };

  // ── Step 3: Toggle section ───────────────────────────────
  const toggleSection = async (section) => {
    const already = addedSections.find(
      (s) => s.section_id === section.section_id,
    );
    if (already) {
      await casesAPI.removeSection(caseId, section.section_id);
      setAddedSections((prev) =>
        prev.filter((s) => s.section_id !== section.section_id),
      );
    } else {
      await casesAPI.addSection(caseId, { section_id: section.section_id });
      setAddedSections((prev) => [...prev, section]);
    }
  };

  // ── Finish ───────────────────────────────────────────────
  const handleFinish = () => {
    toast.current.show({
      severity: "success",
      summary: "Case registered successfully!",
      life: 2000,
    });
    setTimeout(() => navigate(`/cases/${caseId}`), 800);
  };

  const f = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const pageRef = useRef(null);

  /* GSAP entrance */
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".cc-header", {
        y: -30,
        opacity: 0,
        duration: 0.6,
        ease: "power3.out",
      });
      gsap.from(".p-steps", {
        y: -15,
        opacity: 0,
        duration: 0.5,
        delay: 0.15,
        ease: "power2.out",
      });
      gsap.from(".cc-card", {
        y: 30,
        opacity: 0,
        duration: 0.5,
        delay: 0.3,
        ease: "back.out(1.4)",
      });
    }, pageRef);
    return () => ctx.revert();
  }, [step]);

  return (
    <div ref={pageRef} className="cc-page">
      <Toast ref={toast} />

      {/* Flag gradient header strip */}
      <div className="cc-header">
        <div className="cc-header-inner">
          <div>
            <h2 className="cc-title">Register New Case</h2>
            <p className="cc-subtitle">
              Follow the steps to file a new case into the system
            </p>
          </div>
          <div className="cc-header-badge">
            <i
              className="pi pi-file-edit"
              style={{ fontSize: "1.8rem", color: "#fff" }}
            />
          </div>
        </div>
      </div>

      <Steps model={STEPS} activeIndex={step} className="cc-steps" />

      {/* ── Step 0: Case Info ── */}
      {step === 0 && (
        <div className="cc-card">
          <Card>
            <h3 className="cc-card-title">
              <i className="pi pi-info-circle" /> Case Information
            </h3>

            <div className="cc-form-grid">
              <div className="cc-field">
                <label className="cc-label">
                  Case Type <span className="cc-req">*</span>
                </label>
                <Dropdown
                  value={form.case_type}
                  options={CASE_TYPES}
                  onChange={(e) => f("case_type", e.value)}
                  placeholder="Select type"
                  className="w-full"
                />
              </div>
              <div className="cc-field">
                <label className="cc-label">
                  Offense Type <span className="cc-req">*</span>
                </label>
                <InputText
                  value={form.offense_type}
                  onChange={(e) => f("offense_type", e.target.value)}
                  placeholder="e.g. Murder, Theft, Fraud"
                  className="w-full"
                />
              </div>
            </div>

            <div className="cc-form-grid">
              <div className="cc-field">
                <label className="cc-label">
                  Court <span className="cc-req">*</span>
                </label>
                <Dropdown
                  value={form.court_id}
                  options={courts}
                  onChange={(e) => f("court_id", e.value)}
                  placeholder="Select court"
                  className="w-full"
                  filter
                />
              </div>
              <div className="cc-field">
                <label className="cc-label">Filing Date</label>
                <Calendar
                  value={form.filing_date}
                  onChange={(e) => f("filing_date", e.value)}
                  dateFormat="dd/mm/yy"
                  className="w-full"
                />
              </div>
            </div>

            <div className="cc-field">
              <label className="cc-label">
                FIR Text <span className="cc-req">*</span>
              </label>
              <InputTextarea
                value={form.fir_text}
                onChange={(e) => f("fir_text", e.target.value)}
                rows={5}
                placeholder="Enter full FIR content here..."
                className="w-full"
                autoResize
              />
            </div>

            <div className="cc-field">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "0.25rem",
                }}
              >
                <label className="cc-label" style={{ marginBottom: 0 }}>
                  Case Summary
                </label>
                <Button
                  label="Generate Summary from FIR"
                  icon="pi pi-bolt"
                  size="small"
                  severity="help"
                  loading={generatingSummary}
                  disabled={!form.fir_text}
                  onClick={handleGenerateSummary}
                  tooltip="AI will analyze the FIR and generate a summary"
                  tooltipOptions={{ position: "left" }}
                />
              </div>
              <InputTextarea
                value={form.summary}
                onChange={(e) => f("summary", e.target.value)}
                rows={3}
                placeholder="Brief summary of the case..."
                className="w-full"
                autoResize
              />
            </div>

            {nlpResult && (
              <Message
                severity="info"
                text={`AI Analysis: Urgency=${nlpResult.urgency_nlp} | Complexity=${nlpResult.case_complexity} | Keywords: ${nlpResult.keywords}`}
                style={{ marginBottom: "1rem", width: "100%" }}
              />
            )}

            <div className="cc-actions">
              <Button
                label="Save Case & Continue"
                icon="pi pi-arrow-right"
                iconPos="right"
                loading={submitting}
                onClick={handleStep1}
                className="cc-btn-primary"
              />
            </div>
          </Card>
        </div>
      )}

      {/* ── Step 1: Persons ── */}
      {step === 1 && (
        <div className="cc-card">
          <Card>
            <h3 className="cc-card-title">
              <i className="pi pi-users" /> Add Persons — Case #{caseId}
            </h3>
            <PersonForm onAdd={handleAddPerson} toast={toast} />

            {addedPersons.length > 0 && (
              <>
                <Divider />
                <h4 style={{ marginBottom: "0.75rem" }}>Added Persons</h4>
                <DataTable value={addedPersons} size="small">
                  <Column
                    field="role"
                    header="Role"
                    body={(r) => (
                      <Tag
                        value={r.role}
                        severity={
                          r.role === "victim"
                            ? "danger"
                            : r.role === "accused"
                              ? "warning"
                              : "info"
                        }
                      />
                    )}
                  />
                  <Column field="name" header="Name" />
                  <Column field="age" header="Age" />
                  <Column field="gender" header="Gender" />
                </DataTable>
              </>
            )}

            <Divider />
            <div className="cc-actions cc-actions-between">
              <Button
                label="Back"
                icon="pi pi-arrow-left"
                outlined
                onClick={() => setStep(0)}
              />
              <Button
                label="Continue"
                icon="pi pi-arrow-right"
                iconPos="right"
                onClick={() => setStep(2)}
                className="cc-btn-primary"
              />
            </div>
          </Card>
        </div>
      )}

      {/* ── Step 2: Legal Sections ── */}
      {step === 2 && (
        <div className="cc-card">
          <Card>
            <h3 className="cc-card-title">
              <i className="pi pi-book" /> Legal Sections / Charges
            </h3>

            {/* AI Auto-Suggestions Panel */}
            {recommendingSections && (
              <div
                style={{
                  background:
                    "linear-gradient(135deg, #ede9fe 0%, #f3e8ff 100%)",
                  borderRadius: 10,
                  padding: "1rem",
                  marginBottom: "1rem",
                  border: "1px solid #c4b5fd",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <i
                  className="pi pi-spin pi-spinner"
                  style={{ fontSize: "1.3rem", color: "#7c3aed" }}
                />
                <span style={{ color: "#5b21b6", fontWeight: 500 }}>
                  AI is analyzing the FIR &amp; summary to suggest applicable
                  IPC sections...
                </span>
              </div>
            )}

            {!recommendingSections && aiSuggestions.length > 0 && (
              <div
                style={{
                  background:
                    "linear-gradient(135deg, #ede9fe 0%, #faf5ff 100%)",
                  borderRadius: 10,
                  padding: "1rem",
                  marginBottom: "1rem",
                  border: "1px solid #c4b5fd",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.75rem",
                  }}
                >
                  <h4
                    style={{
                      margin: 0,
                      color: "#5b21b6",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                    }}
                  >
                    <i className="pi pi-sparkles" /> AI Suggested Sections
                  </h4>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <Button
                      label="Accept All"
                      icon="pi pi-check-circle"
                      size="small"
                      severity="success"
                      onClick={acceptAllSuggestions}
                    />
                    <Button
                      label="Dismiss All"
                      icon="pi pi-times"
                      size="small"
                      severity="secondary"
                      text
                      onClick={() => setAiSuggestions([])}
                    />
                  </div>
                </div>
                {aiSuggestions.map((s) => (
                  <div
                    key={s.section_id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "#fff",
                      borderRadius: 8,
                      padding: "0.6rem 0.8rem",
                      marginBottom: "0.4rem",
                      border: "1px solid #e9d5ff",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 600, color: "#1e1b4b" }}>
                        {s.law_code} §{s.section}
                      </span>
                      <span style={{ color: "#6b7280", margin: "0 0.5rem" }}>
                        —
                      </span>
                      <span style={{ color: "#374151" }}>{s.description}</span>
                      {s.reason && (
                        <div
                          style={{
                            fontSize: "0.8rem",
                            color: "#7c3aed",
                            marginTop: 2,
                          }}
                        >
                          <i
                            className="pi pi-sparkles"
                            style={{ fontSize: "0.7rem" }}
                          />{" "}
                          {s.reason}
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "0.3rem" }}>
                      <Button
                        icon="pi pi-check"
                        severity="success"
                        rounded
                        size="small"
                        tooltip="Accept"
                        onClick={() => acceptSuggestion(s)}
                      />
                      <Button
                        icon="pi pi-times"
                        severity="danger"
                        rounded
                        size="small"
                        text
                        tooltip="Dismiss"
                        onClick={() => dismissSuggestion(s.section_id)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!recommendingSections &&
              aiSuggestions.length === 0 &&
              suggestionsLoaded &&
              addedSections.some((s) => s.ai_reason) && (
                <Message
                  severity="success"
                  text="AI section suggestions have been processed."
                  style={{ marginBottom: "1rem", width: "100%" }}
                />
              )}

            <div className="cc-field">
              <InputText
                value={sectionSearch}
                onChange={(e) => setSectionSearch(e.target.value)}
                placeholder="Search section (e.g. 302, IPC, Murder)"
                className="w-full"
              />
            </div>

            {addedSections.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                  marginBottom: "1rem",
                }}
              >
                {addedSections.map((s) => (
                  <Tag
                    key={s.section_id}
                    value={`${s.law_code} §${s.section}`}
                    severity={s.ai_reason ? "warning" : "info"}
                    icon={s.ai_reason ? "pi pi-sparkles" : "pi pi-times"}
                    onClick={() => toggleSection(s)}
                    style={{ cursor: "pointer" }}
                    title={s.ai_reason || "Click to remove"}
                  />
                ))}
              </div>
            )}

            <DataTable
              value={sections.slice(0, 20)}
              size="small"
              emptyMessage="No sections found."
            >
              <Column
                header="Select"
                style={{ width: 60 }}
                body={(row) => {
                  const selected = addedSections.some(
                    (s) => s.section_id === row.section_id,
                  );
                  return (
                    <Button
                      icon={selected ? "pi pi-check" : "pi pi-plus"}
                      severity={selected ? "success" : "secondary"}
                      rounded
                      size="small"
                      onClick={() => toggleSection(row)}
                    />
                  );
                }}
              />
              <Column field="law_code" header="Act" style={{ width: 70 }} />
              <Column field="section" header="Section" style={{ width: 80 }} />
              <Column field="description" header="Description" />
              <Column
                field="bailability"
                header="Bail"
                style={{ width: 110 }}
                body={(r) => (
                  <Tag
                    value={r.bailability}
                    severity={
                      r.bailability === "Non-Bailable" ? "danger" : "success"
                    }
                  />
                )}
              />
              <Column
                field="max_sentence_years"
                header="Max Yrs"
                style={{ width: 80 }}
              />
            </DataTable>

            <Divider />
            <div className="cc-actions cc-actions-between">
              <Button
                label="Back"
                icon="pi pi-arrow-left"
                outlined
                onClick={() => setStep(1)}
              />
              <Button
                label="Continue"
                icon="pi pi-arrow-right"
                iconPos="right"
                onClick={() => setStep(3)}
                className="cc-btn-primary"
              />
            </div>
          </Card>
        </div>
      )}

      {/* ── Step 3: Review ── */}
      {step === 3 && (
        <div className="cc-card">
          <Card>
            <h3 className="cc-card-title">
              <i className="pi pi-check-circle" /> Review & Submit
            </h3>
            <div className="cc-review-box">
              <div style={{ marginBottom: "0.5rem" }}>
                <span className="field-label">Case ID: </span>
                <strong>#{caseId}</strong>
              </div>
              <div style={{ marginBottom: "0.5rem" }}>
                <span className="field-label">Type: </span>
                {form.case_type}
              </div>
              <div style={{ marginBottom: "0.5rem" }}>
                <span className="field-label">Offense: </span>
                {form.offense_type}
              </div>
              <div style={{ marginBottom: "0.5rem" }}>
                <span className="field-label">Persons: </span>
                {addedPersons.length} added
              </div>
              <div>
                <span className="field-label">Legal Sections: </span>
                {addedSections
                  .map((s) => `${s.law_code} §${s.section}`)
                  .join(", ") || "None"}
              </div>
            </div>

            <div className="cc-actions cc-actions-between">
              <Button
                label="Back"
                icon="pi pi-arrow-left"
                outlined
                onClick={() => setStep(2)}
              />
              <Button
                label="Finish Registration"
                icon="pi pi-check"
                severity="success"
                onClick={handleFinish}
                className="cc-btn-primary"
              />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
