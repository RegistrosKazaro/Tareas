import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Forbidden from "./pages/Forbidden";

import RequireAuth from "./auth/RequireAuth";
import { getUser, isLoggedIn } from "./auth/auth";

// ADMIN
import AdminDashboard from "./pages/AdminDashboard";
import AdminHome from "./pages/admin/AdminHome";
import UsersPage from "./pages/admin/UsersPage";
import NominaPage from "./pages/admin/NominaPage";
import ServicesPage from "./pages/admin/ServicesPage";
import TasksPage from "./pages/admin/TasksPage";

// SUPERVISOR
import SupervisorDashboard from "./pages/supervisor/SupervisorDashboard";
import SupervisorHome from "./pages/supervisor/SupervisorHome";
import SupervisorTasksPage from "./pages/supervisor/SupervisorTasksPage";

// WORKER / OPERARIO
import WorkerDashboard from "./pages/worker/WorkerDashboard";
import WorkerHome from "./pages/worker/WorkerHome";
import WorkerTasksPage from "./pages/worker/WorkerTasksPage";

function RoleRedirect() {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;

  const user = getUser();
  const role = user?.role;

  if (role === "ADMIN") return <Navigate to="/admin" replace />;
  if (role === "SUPERVISOR") return <Navigate to="/supervisor" replace />;
  return <Navigate to="/worker" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/forbidden" element={<Forbidden />} />

        {/* Entrada por rol */}
        <Route path="/" element={<RoleRedirect />} />

        {/* ADMIN */}
        <Route
          path="/admin"
          element={
            <RequireAuth roles={["ADMIN"]}>
              <AdminDashboard />
            </RequireAuth>
          }
        >
          <Route index element={<AdminHome />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="nomina" element={<NominaPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="tasks" element={<TasksPage />} />
        </Route>

        {/* SUPERVISOR */}
        <Route
          path="/supervisor"
          element={
            <RequireAuth roles={["SUPERVISOR"]}>
              <SupervisorDashboard />
            </RequireAuth>
          }
        >
          <Route index element={<SupervisorHome />} />
          <Route path="tasks" element={<SupervisorTasksPage />} />
        </Route>

        {/* WORKER / OPERARIO */}
        <Route
          path="/worker"
          element={
            <RequireAuth roles={["OPERARIO"]}>
              <WorkerDashboard />
            </RequireAuth>
          }
        >
          <Route index element={<WorkerHome />} />
          <Route path="tasks" element={<WorkerTasksPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}