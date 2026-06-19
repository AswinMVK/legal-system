import React from "react";
import { Tag } from "primereact/tag";

const STATUS_CONFIG = {
  active: { label: "Active", severity: "success" },
  pending: { label: "Pending", severity: "warning" },
  closed: { label: "Closed", severity: "secondary" },
  adjourned: { label: "Adjourned", severity: "info" },
  scheduled: { label: "Scheduled", severity: "info" },
  rescheduled: { label: "Rescheduled", severity: "warning" },
  cancelled: { label: "Cancelled", severity: "danger" },
  completed: { label: "Completed", severity: "success" },
  registered: { label: "Registered", severity: "info" },
  trial: { label: "Trial", severity: "warning" },
  judgment_delivered: { label: "Judgment Delivered", severity: "success" },
  not_started: { label: "Not Started", severity: "secondary" },
};

export default function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status?.toLowerCase()] || {
    label: status || "—",
    severity: "secondary",
  };
  return <Tag value={cfg.label} severity={cfg.severity} />;
}
