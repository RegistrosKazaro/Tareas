import { Outlet } from "react-router-dom";
import AdminLayout from "../layout/AdminLayout";

export default function AdminDashboard() {
  return (
    <div className="page">
      <div className="container stack">
        <AdminLayout title="Panel Admin">
          <Outlet />
        </AdminLayout>
      </div>
    </div>
  );
}