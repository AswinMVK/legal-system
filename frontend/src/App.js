import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoadingScreen from "./components/common/LoadingScreen";

// Layout
import AppLayout from "./components/layout/AppLayout";

// Auth
import Login from "./pages/auth/Login";

// Lazy-loaded pages for loading transitions
const WriterDashboard = React.lazy(
  () => import("./pages/writer/WriterDashboard"),
);
const CreateCase = React.lazy(() => import("./pages/writer/CreateCase"));
const MyCases = React.lazy(() => import("./pages/writer/MyCases"));
const JudgeDashboard = React.lazy(() => import("./pages/judge/JudgeDashboard"));
const PriorityQueue = React.lazy(() => import("./pages/judge/PriorityQueue"));
const CaseDetail = React.lazy(() => import("./pages/judge/CaseDetail"));
const JudgeSchedule = React.lazy(() => import("./pages/judge/JudgeSchedule"));
const AdminDashboard = React.lazy(() => import("./pages/admin/AdminDashboard"));
const AdvocateDashboard = React.lazy(
  () => import("./pages/advocate/AdvocateDashboard"),
);
const AdvocateCases = React.lazy(
  () => import("./pages/advocate/AdvocateCases"),
);
const AdvocateCaseDetail = React.lazy(
  () => import("./pages/advocate/AdvocateCaseDetail"),
);
const VictimManagement = React.lazy(
  () => import("./pages/advocate/VictimManagement"),
);
const CaseDetailShared = React.lazy(() => import("./pages/CaseDetailShared"));
const BlockchainLedger = React.lazy(
  () => import("./pages/shared/BlockchainLedger"),
);
const About = React.lazy(() => import("./pages/shared/About"));

// ── Private route guard ──────────────────────────────────────
function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen message="Authenticating…" />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

// ── Role-based dashboard redirect ───────────────────────────
function DashboardRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "judge") return <Navigate to="/judge/dashboard" replace />;
  if (user.role === "admin") return <Navigate to="/admin/dashboard" replace />;
  if (user.role === "advocate")
    return <Navigate to="/advocate/dashboard" replace />;
  return <Navigate to="/writer/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Suspense fallback={<LoadingScreen message="Loading page…" />}>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />
            <Route path="/about" element={<About />} />

            {/* Protected — shared layout */}
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <AppLayout />
                </PrivateRoute>
              }
            >
              <Route index element={<DashboardRedirect />} />

              {/* Writer */}
              <Route
                path="writer/dashboard"
                element={
                  <PrivateRoute roles={["writer", "clerk", "admin"]}>
                    <WriterDashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="writer/cases/create"
                element={
                  <PrivateRoute roles={["writer", "clerk", "admin"]}>
                    <CreateCase />
                  </PrivateRoute>
                }
              />
              <Route
                path="writer/cases"
                element={
                  <PrivateRoute roles={["writer", "clerk", "admin"]}>
                    <MyCases />
                  </PrivateRoute>
                }
              />

              {/* Judge */}
              <Route
                path="judge/dashboard"
                element={
                  <PrivateRoute roles={["judge", "admin"]}>
                    <JudgeDashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="judge/priority"
                element={
                  <PrivateRoute roles={["judge", "admin"]}>
                    <PriorityQueue />
                  </PrivateRoute>
                }
              />
              <Route
                path="judge/schedule"
                element={
                  <PrivateRoute roles={["judge", "admin"]}>
                    <JudgeSchedule />
                  </PrivateRoute>
                }
              />
              <Route
                path="judge/cases/:id"
                element={
                  <PrivateRoute roles={["judge", "admin"]}>
                    <CaseDetail />
                  </PrivateRoute>
                }
              />

              {/* Admin */}
              <Route
                path="admin/dashboard"
                element={
                  <PrivateRoute roles={["admin"]}>
                    <AdminDashboard />
                  </PrivateRoute>
                }
              />

              {/* Advocate */}
              <Route
                path="advocate/dashboard"
                element={
                  <PrivateRoute roles={["advocate", "admin"]}>
                    <AdvocateDashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="advocate/cases"
                element={
                  <PrivateRoute roles={["advocate", "admin"]}>
                    <AdvocateCases />
                  </PrivateRoute>
                }
              />
              <Route
                path="advocate/cases/:id"
                element={
                  <PrivateRoute roles={["advocate", "admin"]}>
                    <AdvocateCaseDetail />
                  </PrivateRoute>
                }
              />
              <Route
                path="advocate/victims"
                element={
                  <PrivateRoute roles={["advocate", "admin"]}>
                    <VictimManagement />
                  </PrivateRoute>
                }
              />

              {/* Blockchain ledger — visible to all roles */}
              <Route
                path="blockchain"
                element={
                  <PrivateRoute>
                    <BlockchainLedger />
                  </PrivateRoute>
                }
              />

              {/* Shared case view */}
              <Route
                path="cases/:id"
                element={
                  <PrivateRoute>
                    <CaseDetailShared />
                  </PrivateRoute>
                }
              />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
