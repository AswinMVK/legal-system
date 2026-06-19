import React, { useState } from "react";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { InputSwitch } from "primereact/inputswitch";
import { Divider } from "primereact/divider";
import { Card } from "primereact/card";

const ROLES = [
  { label: "Victim", value: "victim" },
  { label: "Accused", value: "accused" },
  { label: "Witness", value: "witness" },
];
const GENDERS = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Other", value: "other" },
];

const EMPTY = {
  role: "victim",
  name: "",
  age: "",
  gender: "",
  location: "",
  health_flag: false,
  disability_flag: false,
  vulnerability_score: 0,
};

export default function PersonForm({ onAdd, toast }) {
  const [form, setForm] = useState({ ...EMPTY });
  const [adding, setAdding] = useState(false);

  const f = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const computeVulnerability = (health, disability, age) => {
    let score = 0;
    if (health) score += 3;
    if (disability) score += 3;
    if (age && (parseInt(age) < 18 || parseInt(age) > 60)) score += 4;
    return Math.min(score, 10);
  };

  const handleAdd = async () => {
    if (!form.name || !form.role) {
      toast?.current?.show({
        severity: "warn",
        summary: "Name and role are required.",
      });
      return;
    }
    setAdding(true);
    try {
      await onAdd({
        ...form,
        age: form.age ? parseInt(form.age) : null,
        vulnerability_score: computeVulnerability(
          form.health_flag,
          form.disability_flag,
          form.age,
        ),
      });
      setForm({ ...EMPTY });
    } finally {
      setAdding(false);
    }
  };

  return (
    <div
      style={{
        background: "#f8fafc",
        borderRadius: 8,
        padding: "1rem",
        marginBottom: "1rem",
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: "1rem", color: "#1e293b" }}>
        <i className="pi pi-user-plus" style={{ marginRight: 6 }} />
        Add Person to Case
      </div>

      <div className="form-grid-3" style={{ marginBottom: "0.75rem" }}>
        <div>
          <label className="field-label">Role *</label>
          <Dropdown
            value={form.role}
            options={ROLES}
            onChange={(e) => f("role", e.value)}
            style={{ width: "100%" }}
          />
        </div>
        <div>
          <label className="field-label">Full Name *</label>
          <InputText
            value={form.name}
            onChange={(e) => f("name", e.target.value)}
            placeholder="Full name"
            style={{ width: "100%" }}
          />
        </div>
        <div>
          <label className="field-label">Age</label>
          <InputText
            value={form.age}
            onChange={(e) => f("age", e.target.value)}
            type="number"
            min={0}
            max={120}
            placeholder="Age"
            style={{ width: "100%" }}
          />
        </div>
      </div>

      <div className="form-grid-2" style={{ marginBottom: "0.75rem" }}>
        <div>
          <label className="field-label">Gender</label>
          <Dropdown
            value={form.gender}
            options={GENDERS}
            onChange={(e) => f("gender", e.value)}
            placeholder="Select"
            style={{ width: "100%" }}
          />
        </div>
        <div>
          <label className="field-label">Location / Address</label>
          <InputText
            value={form.location}
            onChange={(e) => f("location", e.target.value)}
            placeholder="City, State"
            style={{ width: "100%" }}
          />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: "2rem",
          marginBottom: "1rem",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <InputSwitch
            checked={form.health_flag}
            onChange={(e) => f("health_flag", e.value)}
          />
          <label style={{ fontSize: "0.85rem", color: "#475569" }}>
            Health Issues
          </label>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <InputSwitch
            checked={form.disability_flag}
            onChange={(e) => f("disability_flag", e.value)}
          />
          <label style={{ fontSize: "0.85rem", color: "#475569" }}>
            Disability
          </label>
        </div>
      </div>

      <Button
        label={adding ? "Adding…" : "Add Person"}
        icon="pi pi-plus"
        loading={adding}
        onClick={handleAdd}
        size="small"
      />
    </div>
  );
}
