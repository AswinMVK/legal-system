import React, { useEffect, useState, useRef } from "react";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { Toolbar } from "primereact/toolbar";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { ProgressSpinner } from "primereact/progressspinner";
import { TabView, TabPanel } from "primereact/tabview";
import { Divider } from "primereact/divider";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import gsap from "gsap";
import {
  authAPI,
  usersAPI,
  courtsAPI,
  judgesAPI,
  priorityAPI,
} from "../../services/api";

const ROLE_COLORS = ["#000080", "#FF6B00", "#138808", "#0047AB", "#DC2626"];
const PRIORITY_BAR_COLORS = ["#DC2626", "#FF6B00", "#CA8A04", "#138808"];

const roleSeverity = {
  admin: "danger",
  judge: "info",
  writer: "success",
  clerk: "warning",
};

export default function AdminDashboard() {
  const toast = useRef(null);
  const pageRef = useRef(null);

  // Stats
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Users tab
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userDialog, setUserDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "writer",
    phone: "",
  });
  const [savingUser, setSavingUser] = useState(false);

  // Courts tab
  const [courts, setCourts] = useState([]);
  const [loadingCourts, setLoadingCourts] = useState(false);
  const [courtDialog, setCourtDialog] = useState(false);
  const [newCourt, setNewCourt] = useState({
    court_name: "",
    location: "",
    court_type: "",
  });
  const [savingCourt, setSavingCourt] = useState(false);

  // Judges tab
  const [judges, setJudges] = useState([]);
  const [loadingJudges, setLoadingJudges] = useState(false);

  useEffect(() => {
    loadStats();
    loadUsers();
    loadCourts();
    loadJudges();
  }, []);

  /* GSAP entrance animation */
  useEffect(() => {
    if (loadingStats) return;
    const ctx = gsap.context(() => {
      gsap.from(".banner-navy", {
        y: -30,
        opacity: 0,
        duration: 0.6,
        ease: "power3.out",
      });
      gsap.from(".p-card", {
        y: 25,
        opacity: 0,
        duration: 0.5,
        stagger: 0.08,
        delay: 0.2,
        ease: "back.out(1.4)",
      });
    }, pageRef);
    return () => ctx.revert();
  }, [loadingStats]);

  const loadStats = async () => {
    try {
      const res = await priorityAPI.getStats();
      setStats(res.data);
    } catch {
      setStats({ total: 0, CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 });
    } finally {
      setLoadingStats(false);
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await usersAPI.getAll();
      setUsers(res.data);
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to load users",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadCourts = async () => {
    setLoadingCourts(true);
    try {
      const res = await courtsAPI.getAll();
      setCourts(res.data);
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to load courts",
      });
    } finally {
      setLoadingCourts(false);
    }
  };

  const loadJudges = async () => {
    setLoadingJudges(true);
    try {
      const res = await judgesAPI.getAll();
      setJudges(res.data);
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to load judges",
      });
    } finally {
      setLoadingJudges(false);
    }
  };

  const saveUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.current?.show({
        severity: "warn",
        summary: "Validation",
        detail: "Name, email and password are required",
      });
      return;
    }
    setSavingUser(true);
    try {
      await authAPI.register(newUser);
      toast.current?.show({
        severity: "success",
        summary: "Created",
        detail: `User "${newUser.name}" created`,
      });
      setUserDialog(false);
      setNewUser({
        name: "",
        email: "",
        password: "",
        role: "writer",
        phone: "",
      });
      loadUsers();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to create user";
      toast.current?.show({ severity: "error", summary: "Error", detail: msg });
    } finally {
      setSavingUser(false);
    }
  };

  const saveCourt = async () => {
    if (!newCourt.court_name) {
      toast.current?.show({
        severity: "warn",
        summary: "Validation",
        detail: "Court name is required",
      });
      return;
    }
    setSavingCourt(true);
    try {
      await courtsAPI.create(newCourt);
      toast.current?.show({
        severity: "success",
        summary: "Created",
        detail: `Court "${newCourt.court_name}" created`,
      });
      setCourtDialog(false);
      setNewCourt({ court_name: "", location: "", court_type: "" });
      loadCourts();
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to create court",
      });
    } finally {
      setSavingCourt(false);
    }
  };

  const confirmDeleteUser = (u) => {
    confirmDialog({
      message: `Delete user "${u.name}"? This cannot be undone.`,
      header: "Confirm Delete",
      icon: "pi pi-trash",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          await usersAPI.delete(u.user_id);
          toast.current?.show({
            severity: "success",
            summary: "Deleted",
            detail: "User removed",
          });
          loadUsers();
        } catch {
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: "Failed to delete user",
          });
        }
      },
    });
  };

  // ── Template helpers ─────────────────────────────────────────
  const roleBadge = (row) => (
    <Tag
      value={row.role?.toUpperCase()}
      severity={roleSeverity[row.role] || "secondary"}
    />
  );

  const userActions = (row) => (
    <Button
      icon="pi pi-trash"
      rounded
      text
      severity="danger"
      tooltip="Delete"
      onClick={() => confirmDeleteUser(row)}
    />
  );

  const statsCards = [
    {
      label: "Total Cases",
      value: stats?.total ?? "—",
      icon: "pi-briefcase",
      color: "#000080",
      bg: "#eef0fb",
    },
    {
      label: "Critical",
      value: stats?.CRITICAL ?? "—",
      icon: "pi-exclamation-circle",
      color: "#c0392b",
      bg: "#fde8e8",
    },
    {
      label: "High Priority",
      value: stats?.HIGH ?? "—",
      icon: "pi-arrow-up",
      color: "#FF6B00",
      bg: "#fff5e8",
    },
    {
      label: "Medium / Low",
      value: (stats?.MEDIUM ?? 0) + (stats?.LOW ?? 0) || "—",
      icon: "pi-info-circle",
      color: "#138808",
      bg: "#e9f7e9",
    },
    {
      label: "Total Users",
      value: users.length,
      icon: "pi-users",
      color: "#003087",
      bg: "#e8ecff",
    },
    {
      label: "Courts",
      value: courts.length,
      icon: "pi-building",
      color: "#06580A",
      bg: "#e9f7e9",
    },
  ];

  const courtTypes = [
    { label: "Supreme Court", value: "Supreme Court" },
    { label: "High Court", value: "High Court" },
    { label: "District Court", value: "District Court" },
    { label: "Sessions Court", value: "Sessions Court" },
    { label: "Magistrate Court", value: "Magistrate Court" },
  ];

  const roleOptions = [
    { label: "Writer / Clerk", value: "writer" },
    { label: "Judge", value: "judge" },
    { label: "Admin", value: "admin" },
  ];

  return (
    <div className="p-3" ref={pageRef}>
      <Toast ref={toast} />
      <ConfirmDialog />

      {/* Header banner */}
      <div className="banner-navy p-4 border-round-lg mb-4">
        <div className="flex align-items-center gap-3">
          <i className="pi pi-shield text-4xl" />
          <div>
            <h2 className="m-0">Administration Panel</h2>
            <p className="m-0 mt-1" style={{ opacity: 0.85 }}>
              Manage users, courts, and system settings
            </p>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      {loadingStats ? (
        <div className="flex justify-content-center p-4">
          <ProgressSpinner style={{ width: 50, height: 50 }} />
        </div>
      ) : (
        <div className="grid mb-4">
          {statsCards.map((s) => (
            <div key={s.label} className="col-12 sm:col-6 lg:col-4 xl:col-2">
              <Card className="h-full shadow-1">
                <div className="flex align-items-center gap-3">
                  <div
                    className="flex align-items-center justify-content-center border-round-lg"
                    style={{ width: 48, height: 48, background: s.bg }}
                  >
                    <i
                      className={`pi ${s.icon} text-2xl`}
                      style={{ color: s.color }}
                    />
                  </div>
                  <div>
                    <div
                      className="text-2xl font-bold"
                      style={{ color: s.color }}
                    >
                      {s.value}
                    </div>
                    <div className="text-500 text-sm">{s.label}</div>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <TabView>
        {/* Users tab */}
        <TabPanel header="Users" leftIcon="pi pi-users mr-2">
          <Toolbar
            className="mb-3 p-2"
            start={<span className="font-semibold text-lg">System Users</span>}
            end={
              <Button
                label="New User"
                icon="pi pi-plus"
                onClick={() => setUserDialog(true)}
              />
            }
          />
          <DataTable
            value={users}
            loading={loadingUsers}
            paginator
            rows={10}
            stripedRows
            emptyMessage="No users found"
            className="shadow-1"
          >
            <Column field="user_id" header="ID" style={{ width: 70 }} />
            <Column field="name" header="Name" sortable />
            <Column field="email" header="Email" sortable />
            <Column header="Role" body={roleBadge} sortable sortField="role" />
            <Column field="phone" header="Phone" />
            <Column
              field="created_at"
              header="Created"
              body={(r) =>
                r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"
              }
            />
            <Column header="Actions" body={userActions} style={{ width: 80 }} />
          </DataTable>
        </TabPanel>

        {/* Courts tab */}
        <TabPanel header="Courts" leftIcon="pi pi-building mr-2">
          <Toolbar
            className="mb-3 p-2"
            start={<span className="font-semibold text-lg">Courts</span>}
            end={
              <Button
                label="New Court"
                icon="pi pi-plus"
                onClick={() => setCourtDialog(true)}
              />
            }
          />
          <DataTable
            value={courts}
            loading={loadingCourts}
            paginator
            rows={10}
            stripedRows
            emptyMessage="No courts found"
            className="shadow-1"
          >
            <Column field="court_id" header="ID" style={{ width: 70 }} />
            <Column field="court_name" header="Court Name" sortable />
            <Column field="location" header="Location" sortable />
            <Column
              field="court_type"
              header="Type"
              body={(r) => <Tag value={r.court_type} severity="info" />}
            />
          </DataTable>
        </TabPanel>

        {/* Judges tab */}
        <TabPanel header="Judges" leftIcon="pi pi-user mr-2">
          <DataTable
            value={judges}
            loading={loadingJudges}
            paginator
            rows={10}
            stripedRows
            emptyMessage="No judges found"
            className="shadow-1"
          >
            <Column field="judge_id" header="ID" style={{ width: 70 }} />
            <Column field="name" header="Name" sortable />
            <Column field="court_name" header="Court" sortable />
            <Column field="experience_years" header="Experience (yrs)" />
            <Column field="specialization" header="Specialization" />
            <Column
              field="active_cases"
              header="Active Cases"
              body={(r) => (
                <Tag
                  value={r.active_cases ?? 0}
                  severity={
                    r.active_cases > 10
                      ? "danger"
                      : r.active_cases > 5
                        ? "warning"
                        : "success"
                  }
                />
              )}
            />
          </DataTable>
        </TabPanel>

        {/* Analytics tab */}
        <TabPanel header="Analytics" leftIcon="pi pi-chart-bar mr-2">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1.5rem",
            }}
          >
            {/* Priority distribution bar chart */}
            <Card title="Case Priority Distribution">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={[
                    { name: "Critical", value: stats?.CRITICAL || 0 },
                    { name: "High", value: stats?.HIGH || 0 },
                    { name: "Medium", value: stats?.MEDIUM || 0 },
                    { name: "Low", value: stats?.LOW || 0 },
                  ]}
                  margin={{ top: 10, right: 20, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0E8" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 13, fontWeight: 600 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1.5px solid #C8CADC",
                      fontSize: 13,
                    }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {PRIORITY_BAR_COLORS.map((fill, i) => (
                      <Cell key={i} fill={fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Users by role pie chart */}
            <Card title="Users by Role">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={Object.entries(
                      users.reduce((acc, u) => {
                        acc[u.role] = (acc[u.role] || 0) + 1;
                        return acc;
                      }, {}),
                    ).map(([name, value]) => ({
                      name: name.charAt(0).toUpperCase() + name.slice(1),
                      value,
                    }))}
                    cx="50%"
                    cy="45%"
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, value }) => `${name} (${value})`}
                    labelLine
                  >
                    {ROLE_COLORS.map((fill, i) => (
                      <Cell key={i} fill={fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1.5px solid #C8CADC",
                      fontSize: 13,
                    }}
                  />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            {/* System overview — full width */}
            <Card title="System Overview" style={{ gridColumn: "1 / -1" }}>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={[
                    { name: "Total Cases", value: stats?.total || 0 },
                    { name: "Users", value: users.length },
                    { name: "Courts", value: courts.length },
                    { name: "Judges", value: judges.length },
                  ]}
                  margin={{ top: 8, right: 20, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0E8" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 13, fontWeight: 600 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1.5px solid #C8CADC",
                      fontSize: 13,
                    }}
                  />
                  <Bar dataKey="value" fill="#003087" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </TabPanel>
      </TabView>

      {/* New User Dialog */}
      <Dialog
        header="Create New User"
        visible={userDialog}
        style={{ width: 480 }}
        onHide={() => setUserDialog(false)}
        footer={
          <div className="flex gap-2 justify-content-end">
            <Button
              label="Cancel"
              icon="pi pi-times"
              text
              onClick={() => setUserDialog(false)}
            />
            <Button
              label="Create User"
              icon="pi pi-check"
              loading={savingUser}
              onClick={saveUser}
            />
          </div>
        }
      >
        <div className="flex flex-column gap-3 mt-2">
          <div className="field">
            <label className="font-medium mb-1 block">Full Name *</label>
            <InputText
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              placeholder="Enter full name"
              className="w-full"
            />
          </div>
          <div className="field">
            <label className="font-medium mb-1 block">Email *</label>
            <InputText
              type="email"
              value={newUser.email}
              onChange={(e) =>
                setNewUser({ ...newUser, email: e.target.value })
              }
              placeholder="user@legal.gov.in"
              className="w-full"
            />
          </div>
          <div className="field">
            <label className="font-medium mb-1 block">Password *</label>
            <InputText
              type="password"
              value={newUser.password}
              onChange={(e) =>
                setNewUser({ ...newUser, password: e.target.value })
              }
              placeholder="Min 6 characters"
              className="w-full"
            />
          </div>
          <div className="grid">
            <div className="col-6 field">
              <label className="font-medium mb-1 block">Role *</label>
              <Dropdown
                value={newUser.role}
                options={roleOptions}
                onChange={(e) => setNewUser({ ...newUser, role: e.value })}
                className="w-full"
              />
            </div>
            <div className="col-6 field">
              <label className="font-medium mb-1 block">Phone</label>
              <InputText
                value={newUser.phone}
                onChange={(e) =>
                  setNewUser({ ...newUser, phone: e.target.value })
                }
                placeholder="+91 XXXXXXXXXX"
                className="w-full"
              />
            </div>
          </div>
        </div>
      </Dialog>

      {/* New Court Dialog */}
      <Dialog
        header="Add New Court"
        visible={courtDialog}
        style={{ width: 440 }}
        onHide={() => setCourtDialog(false)}
        footer={
          <div className="flex gap-2 justify-content-end">
            <Button
              label="Cancel"
              icon="pi pi-times"
              text
              onClick={() => setCourtDialog(false)}
            />
            <Button
              label="Add Court"
              icon="pi pi-check"
              loading={savingCourt}
              onClick={saveCourt}
            />
          </div>
        }
      >
        <div className="flex flex-column gap-3 mt-2">
          <div className="field">
            <label className="font-medium mb-1 block">Court Name *</label>
            <InputText
              value={newCourt.court_name}
              onChange={(e) =>
                setNewCourt({ ...newCourt, court_name: e.target.value })
              }
              placeholder="e.g. District Court Mumbai"
              className="w-full"
            />
          </div>
          <div className="field">
            <label className="font-medium mb-1 block">Location</label>
            <InputText
              value={newCourt.location}
              onChange={(e) =>
                setNewCourt({ ...newCourt, location: e.target.value })
              }
              placeholder="City / State"
              className="w-full"
            />
          </div>
          <div className="field">
            <label className="font-medium mb-1 block">Court Type</label>
            <Dropdown
              value={newCourt.court_type}
              options={courtTypes}
              onChange={(e) =>
                setNewCourt({ ...newCourt, court_type: e.value })
              }
              placeholder="Select type"
              className="w-full"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
