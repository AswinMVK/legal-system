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
              The Indian judicial system faces a massive case backlog, leaving many undertrials in detention for periods exceeding their potential sentences. <strong>Legira</strong> (derived from <em>Legal Integrity & Rapid Assistance</em>) was developed to directly address this issue.
            </p>
            <p style={{ lineHeight: "1.6", color: "var(--text-color)", fontSize: "1.05rem" }}>
              By integrating intelligent automation with cryptographic security, Legira provides structural support for the <strong>e-Courts Mission Mode Project</strong>. It automatically flags overstays, detects vulnerable individuals (minors, elderly, differently-abled), prioritizes critical hearings, and secures judicial logs to build public trust in digital governance.
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
                <span style={{ fontWeight: "bold", display: "block", fontSize: "0.9rem", color: "var(--text-secondary-color)" }}>Frontend</span>
                <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginTop: "4px" }}>
                  <Tag value="React" severity="info" />
                  <Tag value="PrimeReact" severity="success" />
                  <Tag value="GSAP Animations" severity="warning" />
                </div>
              </div>
              <div>
                <span style={{ fontWeight: "bold", display: "block", fontSize: "0.9rem", color: "var(--text-secondary-color)" }}>Backends</span>
                <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginTop: "4px" }}>
                  <Tag value="Node.js / Express" severity="info" />
                  <Tag value="Python / Flask" severity="success" />
                </div>
              </div>
              <div>
                <span style={{ fontWeight: "bold", display: "block", fontSize: "0.9rem", color: "var(--text-secondary-color)" }}>Database & Blockchain</span>
                <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginTop: "4px" }}>
                  <Tag value="MySQL" severity="danger" />
                  <Tag value="Custom Ledger" valueTemplate={() => <span style={{ padding: "0.2rem 0.5rem", borderRadius: "4px", fontSize: "0.8rem", backgroundColor: "rgba(0,15,137,0.15)", color: "#000F89", fontWeight: "bold" }}>Custom Ledger</span>} />
                </div>
              </div>
              <div>
                <span style={{ fontWeight: "bold", display: "block", fontSize: "0.9rem", color: "var(--text-secondary-color)" }}>Artificial Intelligence</span>
                <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginTop: "4px" }}>
                  <Tag value="Google Gemini 2.5" severity="warning" />
                  <Tag value="Ollama Fallback" severity="info" />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Detailed Tech Specifications (AI & Blockchain) */}
        <div className="col-12 md:col-4 about-section-card" style={{ marginBottom: "1.5rem" }}>
          <Card title="AI Specifications" style={{ height: "100%", borderLeft: "4px solid #138808", padding: "1.5rem" }}>
            <p style={{ lineHeight: "1.5", fontSize: "0.9rem", margin: "0 0 0.8rem 0" }}>
              Legira utilizes a hybrid AI layout orchestrating both local and cloud LLMs via a Python Flask framework:
            </p>
            <ul style={{ paddingLeft: "1.1rem", lineHeight: "1.5", fontSize: "0.88rem", margin: 0 }}>
              <li>
                <strong>Cloud Engine</strong>: Google Gemini API (<code>gemini-2.5-flash</code>) handles high-concurrency requests, offering rapid reasoning and low-latency token generation.
              </li>
              <li>
                <strong>Local Fallback</strong>: Ollama client running <code>qwen2.5:latest</code> allows secure offline hosting and air-gapped system runs.
              </li>
              <li>
                <strong>Temperature Tuning</strong>: Configured at <code>0.2</code> for factual summaries and <code>0.1</code> for section recommendations to restrict hallucinations.
              </li>
            </ul>
          </Card>
        </div>

        <div className="col-12 md:col-4 about-section-card" style={{ marginBottom: "1.5rem" }}>
          <Card title="Blockchain Audit Trail" style={{ height: "100%", borderLeft: "4px solid #000F89", padding: "1.5rem" }}>
            <p style={{ lineHeight: "1.5", fontSize: "0.9rem", margin: "0 0 0.8rem 0" }}>
              To ensure absolute transparency and prevent internal tampering of record updates, Legira writes critical case milestones to a custom blockchain ledger:
            </p>
            <ul style={{ paddingLeft: "1.1rem", lineHeight: "1.5", fontSize: "0.88rem", margin: 0 }}>
              <li>
                <strong>Block Structure</strong>: Every block stores a Block Index, Timestamp, Transactions, Previous Block Hash, and Current Cryptographic Hash.
              </li>
              <li>
                <strong>Security Hashing</strong>: Case data is transformed into a cryptographic hash (SHA-256), creating a tamper-evident seal.
              </li>
              <li>
                <strong>Integrity Verification</strong>: A public verification engine iterates through the chain to recalculate hashes and detect database tampering.
              </li>
            </ul>
          </Card>
        </div>

        {/* Database & Section Relations */}
        <div className="col-12 about-section-card" style={{ marginBottom: "1.5rem" }}>
          <Card title="Database Architecture & Overstay Alerts" style={{ borderLeft: "4px solid #FF9933", padding: "2rem" }}>
            <p style={{ lineHeight: "1.6", fontSize: "0.98rem", marginBottom: "1rem" }}>
              Legira's core database relations map the case lifecycle directly to legal statutes to protect civil liberties:
            </p>
            <div className="grid" style={{ marginTop: "0.5rem" }}>
              <div className="col-12 md:col-6" style={{ padding: "0.5rem 1.5rem" }}>
                <h5 style={{ margin: "0 0 0.5rem 0", color: "#1e293b", fontWeight: "bold" }}>Relation Schema Mapping</h5>
                <p style={{ lineHeight: "1.5", fontSize: "0.92rem", color: "#475569" }}>
                  The <code>cases</code> table represents registered disputes. Through the junction table <code>case_sections</code>, cases are linked to multiple records in the <code>legal_sections</code> catalog. 
                  This catalog holds predefined details for each IPC/BNS section, including <code>max_sentence_years</code>, <code>max_sentence_days</code>, and <code>bailability</code>.
                </p>
              </div>
              <div className="col-12 md:col-6" style={{ padding: "0.5rem 1.5rem" }}>
                <h5 style={{ margin: "0 0 0.5rem 0", color: "#1e293b", fontWeight: "bold" }}>Overstay & Section 436A CrPC/BNSS Logic</h5>
                <p style={{ lineHeight: "1.5", fontSize: "0.92rem", color: "#475569" }}>
                  The maximum statutory sentence of the associated sections determines the <code>expected_sentence_days</code> inside the <code>detention_details</code> registry. 
                  By comparing the accused's actual time in custody (<code>detention_days</code>) to this maximum, the system calculates the <code>detention_ratio</code>. 
                  When this ratio is <code>&gt;= 1.0</code> (or <code>&gt;= 0.5</code> under Section 436A), the <code>overstay_flag</code> triggers, highlighting an immediate human rights concern and bumping the case to <strong>CRITICAL</strong> status in the Priority Queue.
                </p>
              </div>
            </div>
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
