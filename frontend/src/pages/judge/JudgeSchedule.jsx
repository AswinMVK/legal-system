import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Tag } from "primereact/tag";
import { Badge } from "primereact/badge";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { hearingsAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function JudgeSchedule() {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState([new Date(), null]);
  const [reschedDlg, setReschedDlg] = useState({
    visible: false,
    scheduleId: null,
    oldDate: "",
  });
  const [reschedForm, setReschedForm] = useState({
    new_date: null,
    reason: "",
  });
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useRef(null);

  const fetchSchedule = async () => {
    if (!user?.judge_id) return;
    setLoading(true);
    try {
      const params = {};
      if (dateRange[0])
        params.from_date = dateRange[0].toISOString().split("T")[0];
      if (dateRange[1])
        params.to_date = dateRange[1].toISOString().split("T")[0];
      const res = await hearingsAPI.getSchedule(user.judge_id, params);
      setSchedule(res.data);
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Failed to load schedule.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [user, dateRange]);

  const handleReschedule = async () => {
    if (!reschedForm.new_date || !reschedForm.reason) {
      toast.current.show({
        severity: "warn",
        summary: "New date and reason required.",
      });
      return;
    }
    try {
      await hearingsAPI.reschedule(reschedDlg.scheduleId, {
        new_date:
          reschedForm.new_date instanceof Date
            ? reschedForm.new_date.toISOString().split("T")[0]
            : reschedForm.new_date,
        reason: reschedForm.reason,
      });
      toast.current.show({
        severity: "success",
        summary: "Hearing rescheduled.",
      });
      setReschedDlg({ visible: false });
      setReschedForm({ new_date: null, reason: "" });
      fetchSchedule();
    } catch {
      toast.current.show({
        severity: "error",
        summary: "Failed to reschedule.",
      });
    }
  };

  const groupedByDate = schedule.reduce((acc, item) => {
    const d = item.scheduled_date?.split("T")[0] || "TBD";
    if (!acc[d]) acc[d] = [];
    acc[d].push(item);
    return acc;
  }, {});

  const statusColor = (s) => {
    if (s === "scheduled") return "#2563eb";
    if (s === "rescheduled") return "#d97706";
    if (s === "cancelled") return "#dc2626";
    if (s === "completed") return "#16a34a";
    return "#64748b";
  };

  return (
    <div>
      <Toast ref={toast} />

      {/* Date range filter */}
      <Card style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <label className="field-label" style={{ margin: 0 }}>
            Date Range:
          </label>
          <Calendar
            value={dateRange}
            onChange={(e) => setDateRange(e.value || [new Date(), null])}
            selectionMode="range"
            dateFormat="dd/mm/yy"
            showIcon
            style={{ width: 280 }}
          />
          <Button
            label="Refresh"
            icon="pi pi-refresh"
            outlined
            onClick={fetchSchedule}
            loading={loading}
          />
        </div>
      </Card>

      {/* Calendar-style listing */}
      {loading ? (
        <Card>
          <div
            style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}
          >
            Loading schedule...
          </div>
        </Card>
      ) : Object.entries(groupedByDate).length === 0 ? (
        <Card>
          <div
            style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}
          >
            <i
              className="pi pi-calendar"
              style={{
                fontSize: "3rem",
                marginBottom: "1rem",
                display: "block",
              }}
            />
            No hearings scheduled for the selected date range.
          </div>
        </Card>
      ) : (
        Object.entries(groupedByDate).map(([date, items]) => (
          <Card key={date} style={{ marginBottom: "1rem" }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: "1rem",
                color: "#1e293b",
                background: "#f1f5f9",
                padding: "0.6rem 1rem",
                borderRadius: 6,
                marginBottom: "0.75rem",
                borderLeft: "4px solid #2563eb",
              }}
            >
              📅{" "}
              {new Date(date).toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
              <Badge value={items.length} style={{ marginLeft: "0.5rem" }} />
            </div>

            {items.map((h) => (
              <div
                key={h.schedule_id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.75rem 1rem",
                  borderRadius: 8,
                  marginBottom: 6,
                  border: `1px solid #e2e8f0`,
                  borderLeft: `4px solid ${statusColor(h.scheduling_status)}`,
                  background: "#fafafa",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "1rem" }}
                >
                  <div
                    style={{
                      background: "#eff6ff",
                      color: "#2563eb",
                      padding: "0.3rem 0.6rem",
                      borderRadius: 6,
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      minWidth: 80,
                      textAlign: "center",
                    }}
                  >
                    {h.time_slot || "—:—"}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                      Case #{h.case_id} — {h.case_type}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                      {h.court_name} · {h.offense_type}
                    </div>
                    {h.scheduling_reason && (
                      <div
                        style={{
                          fontSize: "0.7rem",
                          color: "#94a3b8",
                          marginTop: 2,
                        }}
                      >
                        Reason: {h.scheduling_reason}
                      </div>
                    )}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                  }}
                >
                  <Tag
                    value={h.scheduling_status}
                    style={{
                      background: statusColor(h.scheduling_status),
                      color: "#fff",
                      border: "none",
                    }}
                  />
                  <Button
                    icon="pi pi-eye"
                    size="small"
                    text
                    onClick={() => navigate(`/judge/cases/${h.case_id}`)}
                    tooltip="View Case"
                  />
                  {h.scheduling_status === "scheduled" && (
                    <Button
                      icon="pi pi-calendar-times"
                      size="small"
                      text
                      severity="warning"
                      tooltip="Reschedule"
                      onClick={() => {
                        setReschedDlg({
                          visible: true,
                          scheduleId: h.schedule_id,
                          oldDate: date,
                        });
                        setReschedForm({ new_date: null, reason: "" });
                      }}
                    />
                  )}
                </div>
              </div>
            ))}
          </Card>
        ))
      )}

      {/* Reschedule dialog */}
      <Dialog
        header="Reschedule Hearing"
        visible={reschedDlg.visible}
        style={{ width: 420 }}
        onHide={() => setReschedDlg({ visible: false })}
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
              onClick={() => setReschedDlg({ visible: false })}
            />
            <Button
              label="Reschedule"
              icon="pi pi-check"
              onClick={handleReschedule}
            />
          </div>
        }
      >
        <div>
          <div style={{ marginBottom: "1rem" }}>
            <label className="field-label">New Date *</label>
            <Calendar
              value={reschedForm.new_date}
              onChange={(e) =>
                setReschedForm((p) => ({ ...p, new_date: e.value }))
              }
              dateFormat="dd/mm/yy"
              minDate={new Date()}
              showIcon
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <label className="field-label">Reason for Rescheduling *</label>
            <InputTextarea
              value={reschedForm.reason}
              onChange={(e) =>
                setReschedForm((p) => ({ ...p, reason: e.target.value }))
              }
              rows={3}
              style={{ width: "100%" }}
              placeholder="e.g. Witness unavailable, documentation pending..."
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
