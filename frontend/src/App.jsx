import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import useAuthStore from "./store/authStore";

// Layout
import AppShell from "./components/layout/AppShell";

// Pages
import LoginPage from "./pages/auth/LoginPage";
import MyGoalsPage from "./pages/employee/MyGoalsPage";
import AchievementEntryPage from "./pages/employee/AchievementEntryPage";
import TeamDashboardPage from "./pages/manager/TeamDashboardPage";
import ApprovalQueuePage from "./pages/manager/ApprovalQueuePage";
import CheckinViewPage from "./pages/manager/CheckinViewPage";
import CycleManagerPage from "./pages/admin/CycleManagerPage";
import SharedGoalsPage from "./pages/admin/SharedGoalsPage";
import CompletionDashPage from "./pages/admin/CompletionDashPage";
import ReportsPage from "./pages/admin/ReportsPage";
import AuditLogPage from "./pages/admin/AuditLogPage";
import EscalationPage from "./pages/admin/EscalationPage";
import AnalyticsPage from "./pages/analytics/AnalyticsPage";

import LandingPage from "./pages/LandingPage";

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const routes = { EMPLOYEE: "/goals", MANAGER: "/team", ADMIN: "/admin/cycles" };
    return <Navigate to={routes[user.role] || "/goals"} replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Authenticated routes */}
        <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
          {/* Employee */}
          <Route path="/goals" element={<ProtectedRoute allowedRoles={["EMPLOYEE", "MANAGER"]}><MyGoalsPage /></ProtectedRoute>} />
          <Route path="/achievements" element={<ProtectedRoute allowedRoles={["EMPLOYEE"]}><AchievementEntryPage /></ProtectedRoute>} />

          {/* Manager */}
          <Route path="/team" element={<ProtectedRoute allowedRoles={["MANAGER"]}><TeamDashboardPage /></ProtectedRoute>} />
          <Route path="/team/approvals" element={<ProtectedRoute allowedRoles={["MANAGER"]}><ApprovalQueuePage /></ProtectedRoute>} />
          <Route path="/team/checkins" element={<ProtectedRoute allowedRoles={["MANAGER"]}><CheckinViewPage /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin/cycles" element={<ProtectedRoute allowedRoles={["ADMIN"]}><CycleManagerPage /></ProtectedRoute>} />
          <Route path="/admin/shared-goals" element={<ProtectedRoute allowedRoles={["ADMIN"]}><SharedGoalsPage /></ProtectedRoute>} />
          <Route path="/admin/completion" element={<ProtectedRoute allowedRoles={["ADMIN"]}><CompletionDashPage /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={["ADMIN", "MANAGER"]}><ReportsPage /></ProtectedRoute>} />
          <Route path="/admin/audit" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AuditLogPage /></ProtectedRoute>} />
          <Route path="/admin/escalations" element={<ProtectedRoute allowedRoles={["ADMIN"]}><EscalationPage /></ProtectedRoute>} />

          {/* Analytics */}
          <Route path="/analytics" element={<ProtectedRoute allowedRoles={["MANAGER", "ADMIN"]}><AnalyticsPage /></ProtectedRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
