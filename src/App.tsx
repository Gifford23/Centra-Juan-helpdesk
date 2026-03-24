import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminLayout from "./components/AdminLayout";
import DashboardContent from "./components/DashboardContent";
import LiveQueueContent from "./components/LiveQueueContent";
import CustomersContent from "./components/CustomersContent";
import PersonnelContent from "./components/PersonnelContent";
import AdminLogin from "./components/AdminLogin"; // <-- Don't forget to import this!
import TrackRepair from "./components/TrackRepair"; // 1. Import the Tracker!

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ==========================================
            PUBLIC ROUTE (No Sidebar/Layout)
        ========================================== */}
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/track" element={<TrackRepair />} />{" "}
        {/* ==========================================
            SECURE ADMIN ROUTES (Wrapped in the Sidebar Layout)
        ========================================== */}
        <Route
          path="/"
          element={
            <AdminLayout>
              <DashboardContent />
            </AdminLayout>
          }
        />
        <Route
          path="/queue"
          element={
            <AdminLayout>
              <LiveQueueContent />
            </AdminLayout>
          }
        />
        <Route
          path="/customers"
          element={
            <AdminLayout>
              <CustomersContent />
            </AdminLayout>
          }
        />
        <Route
          path="/personnel"
          element={
            <AdminLayout>
              <PersonnelContent />
            </AdminLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
