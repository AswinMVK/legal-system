import React, { useEffect, useRef } from "react";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { Timeline } from "primereact/timeline";
import { Button } from "primereact/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import gsap from "gsap";

export default function About() {
  const pageRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".about-header", {
        y: -30,
        opacity: 0,
        duration: 0.6,
        ease: "power3.out",
      });
      gsap.from(".about-section-card", {
        y: 30,
        opacity: 0,
        duration: 0.5,
        stagger: 0.08,
        delay: 0.1,
        ease: "power2.out",
      });
    }, pageRef);
    return () => ctx.revert();
  }, []);

  const handleBack = () => {
    if (user) {
      navigate("/");
    } else {
      navigate("/login");
    }
  };

  const lifecycleEvents = [
    {
      status: "1. Case Creation & Digitization",
      icon: "pi pi-file-plus",
      color: "#FF9933",
      bg: "rgba(255,153,51,0.15)",
      description: "Standardized case intake is recorded by Court Writers. Details like FIR descriptions, accused/victim demographics, and vulnerability markers are digitized instantly."
    },
    {
      status: "2. AI Section Selection",
      icon: "pi pi-list",
      color: "#000F89",
      bg: "rgba(0,15,137,0.15)",
      description: "Unstructured case narratives are parsed by Google Gemini AI. The model matches factual details to the most relevant IPC/BNS legal sections, suggesting them to the clerk."
    },
    {
      status: "3. AI Case Summarization",
      icon: "pi pi-align-left",
      color: "#138808",
      bg: "rgba(19,136,8,0.15)",
      description: "Gemini AI distills verbose legal text into concise 3-5 sentence summaries. This provides judges with an instant factual overview of the offense and key parties."
    },
    {
      status: "4. Dynamic Prioritization",
      icon: "pi pi-sort-amount-down",
      color: "#FF9933",
      bg: "rgba(255,153,51,0.15)",
      description: "An advanced algorithm computes a real-time urgency score. It flags overstaying undertrials, incorporates case age, and raises the priority for vulnerable litigants."
    },
    {
      status: "5. Smart Scheduling",
      icon: "pi pi-calendar-times",
      color: "#000F89",
      bg: "rgba(0,15,137,0.15)",
      description: "Prioritized cases are dynamically mapped to open time slots, taking into account specific judge specializations and court caseload, optimizing courtroom usage."
    },
    {
      status: "6. Unified Communication",
      icon: "pi pi-comments",
      color: "#138808",
      bg: "rgba(19,136,8,0.15)",
      description: "Facilitates transparency with real-time notifications, chat assistant lookups, and secure updates between Judges, Clerks, Advocates, and Victims."
    }
  ];

  const features = [
    {
      icon: "pi pi-chart-line",
      title: "AI-Driven Case Prioritization",
      desc: "Automatically scores and clusters cases (Critical, High, Medium, Low) based on detention ratio, pending days, adjournments, severity, and vulnerability. Helps judges address case backlog efficiently.",
      color: "#FF9933",
      bg: "rgba(255, 153, 51, 0.1)"
    },
    {
      icon: "pi pi-link",
      title: "Immutable Blockchain Ledger",
      desc: "Logs vital events (case registration, assignment changes, updates) to a secure cryptographically linked blockchain. Enables full audit trials and prevents database tampering.",
      color: "#000F89",
      bg: "rgba(0, 15, 137, 0.1)"
    },
    {
      icon: "pi pi-sparkles",
      title: "Google Gemini AI Co-Pilot",
      desc: "Leverages cutting-edge LLMs (Gemini 2.5 Flash / Ollama) to analyze unstructured FIR texts, recommend relevant IPC/BNS legal sections, generate case summaries, and provide role-specific chat assistance.",
      color: "#138808",
      bg: "rgba(19, 136, 8, 0.1)"
    },
    {
      icon: "pi pi-users",
      title: "Role-Based Judiciary Portal",
      desc: "Provides customized, secure, and isolated dashboard workflows for Judges, Advocates, Court Writers/Clerks, and System Administrators, aligning with strict security protocols.",
      color: "#6b7280",
      bg: "rgba(107, 114, 128, 0.1)"
    }
  ];

  const customizedMarker = (item) => {
    return (
      <span className="flex align-items-center justify-content-center border-circle z-1" style={{
        backgroundColor: item.bg,
        width: "38px",
        height: "38px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        border: `2px solid ${item.color}`
      }}>
        <i className={item.icon} style={{ color: item.color, fontSize: "0.95rem" }} />
      </span>
    );
  };

  const customizedContent = (item) => {
    return (
      <Card title={item.status} style={{ marginBottom: "1rem", boxShadow: "0 2px 6px rgba(0,0,0,0.04)" }}>
        <p style={{ margin: 0, lineHeight: "1.5", fontSize: "0.95rem", color: "#475569" }}>
          {item.description}
        </p>
      </Card>
    );
  };

  return (
    <div ref={pageRef} className="about-container" style={{ padding: "3rem 2.5rem 5.5rem", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header Banner */}
      <div className="about-header banner-saffron" style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "2rem", position: "relative" }}>
        <Button 
          icon="pi pi-arrow-left" 
          label={user ? "Back to Dashboard" : "Back to Login"} 
          onClick={handleBack} 
          className="p-button-text p-button-plain" 
          style={{ position: "absolute", top: "10px", right: "10px", color: "#fff", border: "1px solid rgba(255,255,255,0.4)", borderRadius: "4px", backgroundColor: "rgba(255,255,255,0.1)" }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px" }}>
          <i className="pi pi-info-circle" style={{ fontSize: "1.8rem", color: "#fff" }} />
          <h1 style={{ color: "#fff", margin: 0, fontSize: "1.8rem", fontWeight: 700 }}>About Legira</h1>
        </div>
        <p style={{ color: "rgba(255,255,255,0.9)", margin: 0, fontSize: "1.05rem", lineHeight: "1.5" }}>
          A Smart, Secure, and Intelligent Legal Case Management System powered by AI and Blockchain.
        </p>
      </div>

      <div className="grid">
        {/* Project Vision Card */}
        <div className="col-12 md:col-8 about-section-card" style={{ marginBottom: "1.5rem" }}>
          <Card title="Project Vision & Motivation" style={{ height: "100%", borderLeft: "4px solid #FF9933", padding: "1.5rem" }}>
            <p style={{ lineHeight: "1.6", color: "var(--text-color)", fontSize: "1.05rem" }}>
              The Indian judicial system is heavily burdened by a massive backlog of over <strong>4.5 crore pending cases</strong>. This leads to severe operational inefficiencies and human rights crises where thousands of undertrials languish in prisons for periods longer than the maximum sentence of their alleged offenses, directly violating the right to a speedy trial under <strong>Article 21</strong> of the Constitution.
            </p>
            <p style={{ lineHeight: "1.6", color: "var(--text-color)", fontSize: "1.05rem" }}>
              <strong>Legira</strong> (derived from <em>Legal Integrity & Rapid Assistance</em>) was engineered as a comprehensive digital framework to solve this crisis. By combining intelligent automation with cryptographic logs, the system supports the <strong>e-Courts Mission Mode Project</strong>. It automates statutory overstay detection (under Section 436A of CrPC/BNSS), safeguards case event histories from unauthorized changes, and optimizes daily schedules to ensure courtrooms operate at peak capacity.
            </p>
          </Card>
        </div>

        {/* Project Architect / Developer Card */}
        <div className="col-12 md:col-4 about-section-card" style={{ marginBottom: "1.5rem" }}>
          <Card style={{ height: "100%", borderLeft: "4px solid #138808", padding: "1.5rem" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "1.2rem" }}>
              <img 
                src="/aswin.png" 
                alt="Aswin MVK" 
                style={{ 
                  width: "120px", 
                  height: "120px", 
                  borderRadius: "50%", 
                  objectFit: "cover", 
                  border: "4px solid #000F89",
                  boxShadow: "0 6px 12px rgba(0,0,0,0.15)"
                }} 
              />
              <div>
                <h2 style={{ margin: "0 0 0.3rem 0", fontSize: "1.3rem", fontWeight: "800", color: "var(--text-color)" }}>
                  Developed by Aswin MVK
                </h2>
                <h4 style={{ margin: "0 0 0.8rem 0", fontSize: "0.95rem", color: "#FF9933", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px" }}>
                  Lead Project Architect
                </h4>
                <p style={{ lineHeight: "1.5", color: "var(--text-secondary-color)", fontSize: "0.88rem", textAlign: "justify", margin: 0 }}>
                  <strong>Cause:</strong> Resolving the massive judicial case backlog, preventing statutory undertrial overstay violations (under Section 436A of CrPC/BNSS), and bringing secure digital transparency via blockchain.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* System Tech Stack Card */}
        <div className="col-12 md:col-4 about-section-card" style={{ marginBottom: "1.5rem" }}>
          <Card title="Technology Stack" style={{ height: "100%", borderLeft: "4px solid #000F89", padding: "1.5rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
              <div>
                <span style={{ fontWeight: "bold", display: "block", fontSize: "0.9rem", color: "var(--text-secondary-color)" }}>Frontend Architecture</span>
                <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginTop: "4px" }}>
                  <Tag value="React.js (SPA)" severity="info" />
                  <Tag value="PrimeReact UI Components" severity="success" />
                  <Tag value="GSAP Animation Engine" severity="warning" />
                </div>
              </div>
              <div>
                <span style={{ fontWeight: "bold", display: "block", fontSize: "0.9rem", color: "var(--text-secondary-color)" }}>Service Layer Backends</span>
                <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginTop: "4px" }}>
                  <Tag value="Node.js / Express API" severity="info" />
                  <Tag value="Python 3.10 / Flask Service" severity="success" />
                </div>
              </div>
              <div>
                <span style={{ fontWeight: "bold", display: "block", fontSize: "0.9rem", color: "var(--text-secondary-color)" }}>Data Ledger & Cryptography</span>
                <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginTop: "4px" }}>
                  <Tag value="MySQL (Relational Schema)" severity="danger" />
                  <Tag value="SHA-256 Blockchain Ledger" valueTemplate={() => <span style={{ padding: "0.2rem 0.5rem", borderRadius: "4px", fontSize: "0.8rem", backgroundColor: "rgba(0,15,137,0.15)", color: "#000F89", fontWeight: "bold" }}>Custom Ledger</span>} />
                </div>
              </div>
              <div>
                <span style={{ fontWeight: "bold", display: "block", fontSize: "0.9rem", color: "var(--text-secondary-color)" }}>Intelligence Layer</span>
                <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginTop: "4px" }}>
                  <Tag value="Google Gemini 2.5 API" severity="warning" />
                  <Tag value="Ollama (Local Fallback)" severity="info" />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* AI specifications */}
        <div className="col-12 md:col-4 about-section-card" style={{ marginBottom: "1.5rem" }}>
          <Card title="AI Engine & Prompt Engineering" style={{ height: "100%", borderLeft: "4px solid #138808", padding: "1.5rem" }}>
            <p style={{ lineHeight: "1.5", fontSize: "0.9rem", margin: "0 0 0.8rem 0" }}>
              Legira utilizes a hybrid AI orchestrator that routes requests to either cloud-hosted LLMs or local server nodes:
            </p>
            <ul style={{ paddingLeft: "1.1rem", lineHeight: "1.5", fontSize: "0.88rem", margin: 0 }}>
              <li>
                <strong>Cloud LLM Engine</strong>: Google Gemini API (<code>gemini-2.5-flash</code>) manages standard summarizations and legal code recommendations.
              </li>
              <li>
                <strong>Local Fallback Nodes</strong>: Ollama client integration running <code>qwen2.5:latest</code> allows secure offline processing and air-gapped system operations.
              </li>
              <li>
                <strong>Context Engineering</strong>: Prompt templates enforce output formatting through structured JSON schemas.
              </li>
              <li>
                <strong>Parameter Optimization</strong>: Run with <code>temperature=0.2</code> for factual summaries and <code>temperature=0.1</code> for IPC/BNS recommendations to restrict hallucinations.
              </li>
            </ul>
          </Card>
        </div>

        {/* Blockchain specifications */}
        <div className="col-12 md:col-4 about-section-card" style={{ marginBottom: "1.5rem" }}>
          <Card title="Blockchain Ledger Specifications" style={{ height: "100%", borderLeft: "4px solid #000F89", padding: "1.5rem" }}>
            <p style={{ lineHeight: "1.5", fontSize: "0.9rem", margin: "0 0 0.8rem 0" }}>
              To ensure absolute transparency and prevent internal database tampering, Legira records critical case milestones on a custom cryptographically linked ledger:
            </p>
            <ul style={{ paddingLeft: "1.1rem", lineHeight: "1.5", fontSize: "0.88rem", margin: 0 }}>
              <li>
                <strong>Block Structure</strong>: Stores Block Index, Timestamp, Transactions (logs of registration, assignments, outcomes), Previous Block Hash, and Current Hash.
              </li>
              <li>
                <strong>Consensus & Proof of Work</strong>: Automatically mines transactions when actions occur. Block generation runs with a target difficulty level of 3 (requiring 3 leading zeros in the SHA-256 hash).
              </li>
              <li>
                <strong>Integrity Validation</strong>: A public verification engine recalculates SHA-256 hashes sequentially. If any transaction or database record has been altered, the block link breaks, triggering a security alert.
              </li>
            </ul>
          </Card>
        </div>

        {/* Mathematical priority scoring model */}
        <div className="col-12 about-section-card" style={{ marginBottom: "1.5rem" }}>
          <Card title="Automated Priority Scoring Model (Mathematical Specification)" style={{ borderLeft: "4px solid #FF9933", padding: "2rem" }}>
            <p style={{ lineHeight: "1.6", fontSize: "0.98rem", marginBottom: "1.5rem" }}>
              Legira's scheduling priority is governed by an objective mathematical model designed to balance legal urgency, human rights considerations, and operational constraints. The **Urgency Priority Score (\(S\))** of a case is computed dynamically using a weighted linear combination:
            </p>
            
            <div style={{ 
              backgroundColor: "var(--surface-b)", 
              padding: "1.5rem", 
              borderRadius: "8px", 
              border: "1px dashed var(--border-color)", 
              textAlign: "center",
              marginBottom: "1.5rem"
            }}>
              <span style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#FF6B00", display: "block" }}>
                \[S = (W_d \cdot D) + (W_a \cdot A) + (W_v \cdot V) + (W_p \cdot P)\]
              </span>
            </div>

            <div className="grid">
              <div className="col-12 md:col-6" style={{ padding: "0.5rem 1.5rem" }}>
                <h5 style={{ margin: "0 0 0.5rem 0", color: "#1e293b", fontWeight: "bold" }}>Variable Component Mapping</h5>
                <ul style={{ paddingLeft: "1.2rem", lineHeight: "1.6", fontSize: "0.92rem", color: "#475569", margin: 0 }}>
                  <li>
                    <strong>Detention Overstay Ratio (\(D\))</strong>: Calculated as \(\min\left(1.0, \frac{\text{detention\_days}}{\text{expected\_sentence\_days}}\right)\). Triggers immediate urgency when custody duration approaches statutory limits.
                  </li>
                  <li>
                    <strong>Case Pending Age (\(A\))</strong>: Normalized duration that the case has remained unresolved: \(\min\left(1.0, \frac{\text{days\_pending}}{365 \times 5}\right)\).
                  </li>
                  <li>
                    <strong>Litigant Vulnerability Index (\(V\))</strong>: A score between \(0\) and \(1.0\) computed based on demographic vulnerability markers (elderly, minors, female, or physically challenged litigants).
                  </li>
                  <li>
                    <strong>Adjournment Penalty (\(P\))</strong>: Normalized ratio of case delays: \(\min\left(1.0, \frac{\text{adjournment\_count}}{10}\right)\).
                  </li>
                </ul>
              </div>

              <div className="col-12 md:col-6" style={{ padding: "0.5rem 1.5rem" }}>
                <h5 style={{ margin: "0 0 0.5rem 0", color: "#1e293b", fontWeight: "bold" }}>Weight Distributions & Priority Thresholds</h5>
                <ul style={{ paddingLeft: "1.2rem", lineHeight: "1.6", fontSize: "0.92rem", color: "#475569", margin: 0 }}>
                  <li>
                    <strong>Detention Weight (\(W_d = 0.40\))</strong>: The primary factor, ensuring that the prevention of undertrial overstay violations takes utmost precedence.
                  </li>
                  <li>
                    <strong>Age Weight (\(W_a = 0.25\))</strong>: Ensures long-pending cases do not get pushed back indefinitely in the system.
                  </li>
                  <li>
                    <strong>Vulnerability Weight (\(W_v = 0.20\))</strong>: Speeds up scheduling for vulnerable litigants.
                  </li>
                  <li>
                    <strong>Adjournment Weight (\(W_p = 0.15\))</strong>: penalizes frequent delays, ensuring stalled cases receive a higher scheduling priority.
                  </li>
                  <li>
                    <strong>Urgency Classification</strong>:
                    <ul>
                      <li>\(S \ge 0.75\) &rarr; <strong>CRITICAL</strong> status (triggers immediate hearing slot).</li>
                      <li>\(0.50 \le S < 0.75\) &rarr; <strong>HIGH</strong> priority.</li>
                      <li>\(0.25 \le S < 0.50\) &rarr; <strong>MEDIUM</strong> priority.</li>
                      <li>\(S < 0.25\) &rarr; <strong>LOW</strong> priority.</li>
                    </ul>
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </div>

        {/* Database & Section Relations */}
        <div className="col-12 md:col-6 about-section-card" style={{ marginBottom: "1.5rem" }}>
          <Card title="Database Schema & Relational Integrity" style={{ height: "100%", borderLeft: "4px solid #FF9933", padding: "1.5rem" }}>
            <p style={{ lineHeight: "1.5", fontSize: "0.9rem", margin: "0 0 0.8rem 0" }}>
              Legira's core database relations map the case lifecycle directly to legal statutes to protect civil liberties:
            </p>
            <ul style={{ paddingLeft: "1.1rem", lineHeight: "1.5", fontSize: "0.88rem", margin: 0 }}>
              <li>
                <strong>Entity Relationships</strong>: The <code>cases</code> table represents registered disputes. Through the junction table <code>case_sections</code>, cases are linked to multiple records in the <code>legal_sections</code> catalog, which holds predefined details (<code>max_sentence_days</code>, <code>bailability</code>).
              </li>
              <li>
                <strong>Custody Logic Integration</strong>: The maximum statutory sentence determines the <code>expected_sentence_days</code> inside the <code>detention_details</code> registry.
              </li>
              <li>
                <strong>Overstay Flags</strong>: By comparing the accused's actual time in custody (<code>detention_days</code>) to this maximum, the system calculates the <code>detention_ratio</code>. When this ratio is \(\ge 0.5\) (under Section 436A), the <code>overstay_flag</code> triggers, bumping the case to <strong>CRITICAL</strong> status.
              </li>
            </ul>
          </Card>
        </div>

        {/* System Roadmap and Future Scale */}
        <div className="col-12 md:col-6 about-section-card" style={{ marginBottom: "1.5rem" }}>
          <Card title="Future Scale & System Integrations" style={{ height: "100%", borderLeft: "4px solid #138808", padding: "1.5rem" }}>
            <p style={{ lineHeight: "1.5", fontSize: "0.9rem", margin: "0 0 0.8rem 0" }}>
              To transition Legira from a single-court deployment to a nationally distributed judicial framework, the roadmap defines several key integrations:
            </p>
            <ul style={{ paddingLeft: "1.1rem", lineHeight: "1.5", fontSize: "0.88rem", margin: 0 }}>
              <li>
                <strong>Police Database Linkages (CCTNS)</strong>: Direct API mapping to the Crime and Criminal Tracking Network & Systems to ingest FIRs and charge sheets automatically upon filing.
              </li>
              <li>
                <strong>e-Prisons Integration</strong>: Real-time sync of undertrial entry dates and custody tracking logs directly from correctional facilities to keep detention data perfectly synchronized.
              </li>
              <li>
                <strong>Speech-to-Text Transcription</strong>: Local, offline Whisper-based transcription clusters deployed inside courtrooms to compile immediate, accurate hearing logs.
              </li>
              <li>
                <strong>Distributed Blockchain Ledger</strong>: Migrating the cryptographic auditing engine to a consortium-based network (Hyperledger Fabric) shared between high courts, prison facilities, and the Ministry of Law & Justice.
              </li>
            </ul>
          </Card>
        </div>

        {/* End-to-End Court Case Lifecycle Timeline */}
        <div className="col-12 about-section-card" style={{ marginTop: "1rem", marginBottom: "1rem" }}>
          <Card title="End-to-End Court Case Lifecycle" style={{ borderLeft: "4px solid #138808", padding: "2rem" }}>
            <p style={{ marginBottom: "2rem", color: "var(--text-secondary-color)", fontSize: "1rem" }}>
              Legira manages the entire lifecycle of a court case seamlessly. Below is the workflow from case filing to scheduling and stakeholder communication:
            </p>
            <Timeline 
              value={lifecycleEvents} 
              align="alternate" 
              className="customized-timeline"
              marker={customizedMarker} 
              content={customizedContent} 
            />
          </Card>
        </div>

        {/* User Roles & Benefits Section */}
        <div className="col-12 about-section-card" style={{ marginTop: "1.5rem", marginBottom: "1rem" }}>
          <Card title="User Roles & Benefits" style={{ borderLeft: "4px solid #000F89", padding: "2rem" }}>
            <p style={{ marginBottom: "2rem", color: "var(--text-secondary-color)", fontSize: "1rem" }}>
              Legira connects all key stakeholders of the judicial system, providing tailored features and benefits to optimize court efficiency:
            </p>
            <div className="grid">
              {/* Judges */}
              <div className="col-12 md:col-6" style={{ marginBottom: "1.5rem" }}>
                <div style={{ padding: "1.5rem", border: "1px solid #e2e8f0", borderRadius: "8px", height: "100%", backgroundColor: "rgba(255, 107, 0, 0.03)", borderLeft: "4px solid #FF6B00" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "0.8rem" }}>
                    <i className="pi pi-star-fill" style={{ color: "#FF6B00", fontSize: "1.2rem" }} />
                    <h4 style={{ margin: 0, fontWeight: "bold", fontSize: "1.1rem", color: "#FF6B00" }}>Judges & Magistrates</h4>
                  </div>
                  <ul style={{ paddingLeft: "1.2rem", lineHeight: "1.5", fontSize: "0.92rem", color: "#475569", margin: 0 }}>
                    <li><strong>How they work:</strong> Review case details, manage scheduling priority queues, schedule hearings, and upload final judgments.</li>
                    <li><strong>Key Benefits:</strong> Automated priority sorting highlights long-detained undertrials (Sec 436A) and vulnerable litigants, reducing case backlogs and case congestion.</li>
                  </ul>
                </div>
              </div>

              {/* Clerks / Writers */}
              <div className="col-12 md:col-6" style={{ marginBottom: "1.5rem" }}>
                <div style={{ padding: "1.5rem", border: "1px solid #e2e8f0", borderRadius: "8px", height: "100%", backgroundColor: "rgba(6, 88, 10, 0.03)", borderLeft: "4px solid #06580A" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "0.8rem" }}>
                    <i className="pi pi-pencil" style={{ color: "#06580A", fontSize: "1.2rem" }} />
                    <h4 style={{ margin: 0, fontWeight: "bold", fontSize: "1.1rem", color: "#06580A" }}>Court Writers & Clerks</h4>
                  </div>
                  <ul style={{ paddingLeft: "1.2rem", lineHeight: "1.5", fontSize: "0.92rem", color: "#475569", margin: 0 }}>
                    <li><strong>How they work:</strong> Enter new FIR/case filings, transcribe narratives, and manage document attachments.</li>
                    <li><strong>Key Benefits:</strong> Integrated Google Gemini AI co-pilot automatically suggests relevant legal sections (IPC/BNS) and generates instant 3-sentence case summaries, saving hours of manual parsing.</li>
                  </ul>
                </div>
              </div>

              {/* Advocates */}
              <div className="col-12 md:col-6" style={{ marginBottom: "1.5rem" }}>
                <div style={{ padding: "1.5rem", border: "1px solid #e2e8f0", borderRadius: "8px", height: "100%", backgroundColor: "rgba(0, 15, 137, 0.03)", borderLeft: "4px solid #000F89" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "0.8rem" }}>
                    <i className="pi pi-user-edit" style={{ color: "#000F89", fontSize: "1.2rem" }} />
                    <h4 style={{ margin: 0, fontWeight: "bold", fontSize: "1.1rem", color: "#000F89" }}>Advocates & Legal Representatives</h4>
                  </div>
                  <ul style={{ paddingLeft: "1.2rem", lineHeight: "1.5", fontSize: "0.92rem", color: "#475569", margin: 0 }}>
                    <li><strong>How they work:</strong> Register victims/litigants, track assigned cases, upload documentation, and check priority cues.</li>
                    <li><strong>Key Benefits:</strong> Complete visibility into the scheduling timeline and priority scoring. Quick links to victim profiles allow transparent tracking of client status.</li>
                  </ul>
                </div>
              </div>

              {/* System Admin */}
              <div className="col-12 md:col-6" style={{ marginBottom: "1.5rem" }}>
                <div style={{ padding: "1.5rem", border: "1px solid #e2e8f0", borderRadius: "8px", height: "100%", backgroundColor: "rgba(0, 0, 128, 0.03)", borderLeft: "4px solid #000080" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "0.8rem" }}>
                    <i className="pi pi-shield" style={{ color: "#000080", fontSize: "1.2rem" }} />
                    <h4 style={{ margin: 0, fontWeight: "bold", fontSize: "1.1rem", color: "#000080" }}>System Administrators</h4>
                  </div>
                  <ul style={{ paddingLeft: "1.2rem", lineHeight: "1.5", fontSize: "0.92rem", color: "#475569", margin: 0 }}>
                    <li><strong>How they work:</strong> Maintain user accounts, manage roles, audit database tables, and verify blockchain ledger integrity.</li>
                    <li><strong>Key Benefits:</strong> Dedicated blockchain audit portal displays real-time block validation reports, keeping security airtight and tamper-proof.</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Feature Cards Grid */}
        <div className="col-12" style={{ marginTop: "1rem" }}>
          <h3 className="about-section-card" style={{ marginBottom: "1.5rem", borderBottom: "2px solid #e2e8f0", paddingBottom: "0.5rem", color: "#334155" }}>
            Core Capabilities & System Highlights
          </h3>
          <div className="grid">
            {features.map((feat, index) => (
              <div key={index} className="col-12 md:col-6 about-section-card" style={{ marginBottom: "1.5rem" }}>
                <div className="p-card p-component" style={{ padding: "2rem", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0", display: "flex", gap: "1.5rem", height: "100%" }}>
                  <div style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "8px",
                    backgroundColor: feat.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}>
                    <i className={feat.icon} style={{ fontSize: "1.4rem", color: feat.color }} />
                  </div>
                  <div>
                    <h4 style={{ margin: "0 0 0.5rem", fontSize: "1.1rem", fontWeight: "bold", color: "#1e293b" }}>{feat.title}</h4>
                    <p style={{ margin: 0, lineHeight: "1.5", fontSize: "0.95rem", color: "#64748b" }}>{feat.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed Bottom Marquee */}
      <div style={{ 
        position: "fixed", 
        bottom: 0, 
        left: 0, 
        width: "100%", 
        overflow: "hidden", 
        zIndex: 9999, 
        backgroundColor: "rgba(0, 15, 137, 0.95)", 
        padding: "8px 0",
        borderTop: "2px solid #FF9933",
        boxShadow: "0 -4px 12px rgba(0,0,0,0.15)",
        backdropFilter: "blur(4px)"
      }}>
        <marquee behavior="scroll" direction="left" style={{ color: "#FF9933", fontWeight: "bold", fontSize: "1.05rem", margin: 0 }}>
          Developed by &nbsp;
          <a href="https://aswin-portfoli.netlify.app/" target="_blank" rel="noopener noreferrer" style={{ color: "#FFFFFF", textDecoration: "underline", fontWeight: "800" }}>
            Aswin MVK
          </a> 
          &nbsp; — Click to view my portfolio repository and digital showcases!
        </marquee>
      </div>
    </div>
  );
}
