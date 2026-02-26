import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import TenantHome from "./tenant/TenantHome";
import TenantPayments from "./tenant/TenantPayments";
import TenantNotices from "./tenant/TenantNotices";
import TenantEvents from "./tenant/TenantEvents";
import TenantMaintenance from "./tenant/TenantMaintenance";
import TenantChat from "./tenant/TenantChat";
import TenantPhotos from "./tenant/TenantPhotos";

export default function TenantDashboard() {
  return (
    <DashboardLayout role="tenant">
      <Routes>
        <Route index element={<TenantHome />} />
        <Route path="payments" element={<TenantPayments />} />
        <Route path="notices" element={<TenantNotices />} />
        <Route path="events" element={<TenantEvents />} />
        <Route path="maintenance" element={<TenantMaintenance />} />
        <Route path="chat" element={<TenantChat />} />
        <Route path="photos" element={<TenantPhotos />} />
      </Routes>
    </DashboardLayout>
  );
}
