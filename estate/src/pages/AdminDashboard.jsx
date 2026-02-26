import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import AdminHome from "./admin/AdminHome";
import AdminHouses from "./admin/AdminHouses";
import AdminTenants from "./admin/AdminTenants";
import AdminPayments from "./admin/AdminPayments";
import AdminNotices from "./admin/AdminNotices";
import AdminEvents from "./admin/AdminEvents";
import AdminMaintenance from "./admin/AdminMaintenance";
import AdminChat from "./admin/AdminChat";

export default function AdminDashboard() {
  return (
    <DashboardLayout role="admin">
      <Routes>
        <Route index element={<AdminHome />} />
        <Route path="houses" element={<AdminHouses />} />
        <Route path="tenants" element={<AdminTenants />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="notices" element={<AdminNotices />} />
        <Route path="events" element={<AdminEvents />} />
        <Route path="maintenance" element={<AdminMaintenance />} />
        <Route path="chat" element={<AdminChat />} />
      </Routes>
    </DashboardLayout>
  );
}
