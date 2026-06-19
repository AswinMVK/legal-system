import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import gsap from "gsap";

import { useAuth } from "../../context/AuthContext";
import { authAPI } from "../../services/api";

const DEMO_ACCOUNTS = [
  {
    role: "Admin",
    email: "admin@legal.gov.in",
    password: "Admin@123",
    icon: "pi-shield",
    color: "#000080",
    bg: "#eef0fb",
    border: "#7B8FD8",
    desc: "Manage users, courts & system",
  },
  {
    role: "Judge",
    email: "judge@legal.gov.in",
    password: "Judge@123",
    icon: "pi-star",
    color: "#FF6B00",
    bg: "#fff5e8",
    border: "#FFB266",
    desc: "Priority queue, hearings & judgments",
  },
  {
    role: "Writer",
    email: "writer@legal.gov.in",
    password: "Writer@123",
    icon: "pi-pencil",
    color: "#06580A",
    bg: "#e9f7e9",
    border: "#6EBF73",
    desc: "Register FIRs & manage cases",
  },
  {
    role: "Advocate",
    email: "advocate@legal.gov.in",
    password: "Advocate@123",
    icon: "pi-user-edit",
    color: "#FF6B00",
    bg: "#fff5e8",
    border: "#FFB266",
    desc: "Manage victims & submit requests",
  },
];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useRef(null);
  const leftRef = useRef(null);
  const formRef = useRef(null);
  const demoRef = useRef(null);

  /* ── GSAP entrance animations ── */
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Left panel slides in
      gsap.from(leftRef.current, {
        x: -80,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
      });
      // Left features stagger
      gsap.from(".lp-feature-item", {
        x: -30,
        opacity: 0,
        duration: 0.5,
        stagger: 0.15,
        delay: 0.4,
        ease: "power2.out",
      });
      // Right form fades in + lifts
      gsap.from(formRef.current, {
        y: 40,
        opacity: 0,
        duration: 0.7,
        delay: 0.25,
        ease: "power3.out",
      });
      // Demo cards stagger
      gsap.from(".lp-demo-card", {
        y: 20,
        opacity: 0,
        duration: 0.4,
        stagger: 0.1,
        delay: 0.6,
        ease: "back.out(1.4)",
      });
    });
    return () => ctx.revert();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await authAPI.login({ email, password });
      login(res.data.user, res.data.token);
      toast.current.show({
        severity: "success",
        summary: "Welcome back!",
        life: 1500,
      });
      setTimeout(() => navigate("/"), 600);
    } catch (err) {
      setError(
        err.response?.data?.message || "Invalid credentials. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (account) => {
    setEmail(account.email);
    setPassword(account.password);
    setError("");
  };

  return (
    <div className="lp-root">
      <Toast ref={toast} />

      {/* ── Left panel ── */}
      <div className="lp-left" ref={leftRef}>
        <div className="lp-brand">
          <div className="lp-brand-icon">
            <img
              src="/logo.jpeg"
              alt="Ashoka Chakra"
              style={{
                width: "90px",
                height: "90px",
                objectFit: "contain",
                filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.35))",
                borderRadius: "50%",
                background:
                  "linear-gradient(180deg, #FF9933 0%, #FFFFFF 50%, #138808 100%)",
                padding: "8px",
              }}
            />
          </div>
          <h1 className="lp-brand-title" style={{ display: "flex", gap: 0 }}>
            <span style={{ color: "#FF9933" }}>Le</span>
            <span
              style={{
                color: "#FFFFFF",
                textShadow: "0 0 6px rgba(0,0,0,0.3)",
              }}
            >
              gi
            </span>
            <span style={{ color: "#138808" }}>ra</span>
          </h1>
          <p className="lp-brand-sub">Judicial Case Management System</p>
          <p className="lp-tagline">Empowering India's Judiciary with AI</p>
        </div>

        <div className="lp-features">
          {[
            {
              icon: "pi-star",
              label: "AI Priority Scoring",
              desc: "Cases ranked by urgency & detention status",
            },
            {
              icon: "pi-calendar",
              label: "Smart Scheduling",
              desc: "Automated hearing calendar & reminders",
            },
            {
              icon: "pi-chart-bar",
              label: "Live Analytics",
              desc: "Real-time dashboards for every role",
            },
          ].map((f) => (
            <div key={f.label} className="lp-feature-item">
              <div className="lp-feature-icon">
                <i className={`pi ${f.icon}`} />
              </div>
              <div>
                <div className="lp-feature-label">{f.label}</div>
                <div className="lp-feature-desc">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="lp-left-footer">© 2026 Ministry of Law & Justice</div>
      </div>

      {/* ── Right panel ── */}
      <div className="lp-right">
        <div className="lp-form-wrap" ref={formRef}>
          {/* Header */}
          <div className="lp-form-header">
            <h2 className="lp-form-title">Welcome back</h2>
            <p className="lp-form-sub">Sign in to your account to continue</p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="lp-error">
              <i
                className="pi pi-exclamation-circle"
                style={{ marginRight: 8 }}
              />
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="lp-field">
              <label className="lp-label">Email Address</label>
              <InputText
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@legal.gov.in"
                className="w-full"
                autoComplete="username"
              />
            </div>

            <div className="lp-field">
              <label className="lp-label">Password</label>
              <Password
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                feedback={false}
                toggleMask
                className="w-full"
                inputClassName="w-full"
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              label="Sign In"
              icon="pi pi-sign-in"
              loading={loading}
              className="w-full lp-submit-btn"
            />
          </form>

          {/* Divider */}
          <div className="lp-divider">
            <span>Quick access — demo accounts</span>
          </div>

          {/* Demo credential cards */}
          <div className="lp-demo-cards">
            {DEMO_ACCOUNTS.map((a) => (
              <button
                key={a.role}
                type="button"
                className="lp-demo-card"
                style={{ "--card-border": a.border, "--card-bg": a.bg }}
                onClick={() => fillCredentials(a)}
                title={`Sign in as ${a.role}`}
              >
                <div
                  className="lp-demo-card-icon"
                  style={{ background: a.color }}
                >
                  <i className={`pi ${a.icon}`} style={{ color: "#fff" }} />
                </div>
                <div className="lp-demo-card-body">
                  <span
                    className="lp-demo-card-role"
                    style={{ color: a.color }}
                  >
                    {a.role}
                  </span>
                  <span className="lp-demo-card-email">{a.email}</span>
                  <span className="lp-demo-card-desc">{a.desc}</span>
                </div>
                <i
                  className="pi pi-arrow-right lp-demo-arrow"
                  style={{ color: a.color }}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
