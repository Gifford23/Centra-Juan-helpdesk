import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./components/AdminLayout";
import DashboardContent from "./components/DashboardContent";
import LiveQueueContent from "./components/LiveQueueContent";
import CustomersContent from "./components/CustomersContent";
import PersonnelContent from "./components/PersonnelContent";
import AdminLogin from "./components/AdminLogin";
import TrackRepair from "./components/TrackRepair";
import JobOrdersContent from "./components/JobOrdersContent";
import CustomerDetails from "./components/CustomerDetails";
import SettingsContent from "./components/SettingsContent";
import SubmitTicket from "./components/SubmitTicket";
import PersonnelDetails from "./components/PersonnelDetails";

// --- NEW: Protected Route Wrapper ---
// This component checks if a user is logged in before rendering the page.
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const savedUser = localStorage.getItem("central_juan_user");

  if (!savedUser) {
    // If no user is found, teleport them back to the login page
    return <Navigate to="/login" replace />;
  }

  // If they are logged in, let them see the page!
  return <>{children}</>;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/track" element={<TrackRepair />} />
        <Route path="/submit-ticket" element={<SubmitTicket />} />

        {/* SECURE ADMIN ROUTES */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <DashboardContent />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/queue"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <LiveQueueContent />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/job-orders"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <JobOrdersContent />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <CustomersContent />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers/:id"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <CustomerDetails />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/personnel"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <PersonnelContent />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/personnel/:id"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <PersonnelDetails />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <SettingsContent />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
