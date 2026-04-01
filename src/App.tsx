import { useEffect, useState } from "react";
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
import SystemLogsContent from "./components/SystemLogsContent";
import JobOrderDetails from "./components/JobOrderDetails";
import TermsAndConditions from "./components/TermsAndConditions";
import QuotationsContent from "./components/QuotationsContent";
import AccountsReceivableContent from "./components/AccountsReceivableContent";

// --- NEW CUSTOMER PORTAL IMPORTS ---
import CustomerLogin from "./components/CustomerLogin";
import CustomerDashboard from "./components/CustomerDashboard";
import { supabase } from "./lib/supabase";

const FORCE_LOGOUT_ACTION = "Triggered force logout signal";

const isRevoked = (
  latestForceLogoutAt: string | null,
  sessionStartedAt: string | null,
) => {
  if (!latestForceLogoutAt) return false;
  if (!sessionStartedAt) return true;

  return (
    new Date(latestForceLogoutAt).getTime() >=
    new Date(sessionStartedAt).getTime()
  );
};

const clearAllKnownSessions = () => {
  localStorage.removeItem("central_juan_user");
  localStorage.removeItem("central_juan_customer");
  localStorage.removeItem("central_juan_user_session_started_at");
  localStorage.removeItem("central_juan_customer_session_started_at");
};

// --- Protected Route Wrappers ---
// This component checks if an ADMIN is logged in before rendering the page.
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const validateSession = async () => {
      const savedUser = localStorage.getItem("central_juan_user");
      if (!savedUser) {
        if (isMounted) {
          setIsAuthorized(false);
          setIsChecking(false);
        }
        return;
      }

      try {
        const userSessionStartedAt = localStorage.getItem(
          "central_juan_user_session_started_at",
        );
        const { data, error } = await supabase
          .from("system_logs")
          .select("created_at")
          .eq("action", FORCE_LOGOUT_ACTION)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        const latestForceLogoutAt = data?.created_at || null;
        if (isRevoked(latestForceLogoutAt, userSessionStartedAt)) {
          clearAllKnownSessions();
          window.dispatchEvent(new Event("central_juan_force_logout_applied"));
          if (isMounted) {
            setIsAuthorized(false);
            setIsChecking(false);
          }
          return;
        }

        if (isMounted) {
          setIsAuthorized(true);
          setIsChecking(false);
        }
      } catch (error) {
        console.error("Session validation error (admin):", error);
        if (isMounted) {
          setIsAuthorized(true);
          setIsChecking(false);
        }
      }
    };

    validateSession();

    const channel = supabase
      .channel("force-logout-admin-listener")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "system_logs" },
        (payload) => {
          if (payload.new?.action === FORCE_LOGOUT_ACTION) {
            validateSession();
          }
        },
      )
      .subscribe();

    const intervalId = window.setInterval(validateSession, 15000);
    window.addEventListener("focus", validateSession);
    window.addEventListener("storage", validateSession);
    window.addEventListener("central_juan_force_logout_all", validateSession);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      window.removeEventListener("focus", validateSession);
      window.removeEventListener("storage", validateSession);
      window.removeEventListener(
        "central_juan_force_logout_all",
        validateSession,
      );
      supabase.removeChannel(channel);
    };
  }, []);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 font-medium">
        Verifying session...
      </div>
    );
  }

  if (!isAuthorized) {
    return <Navigate to="/login" replace />;
  }

  const savedUser = localStorage.getItem("central_juan_user");

  if (!savedUser) {
    // If no user is found, teleport them back to the login page
    return <Navigate to="/login" replace />;
  }

  // If they are logged in, let them see the page!
  return <>{children}</>;
};

// This component checks if a CUSTOMER is logged in before rendering the customer dashboard.
const CustomerProtectedRoute = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const validateSession = async () => {
      const savedCustomer = localStorage.getItem("central_juan_customer");
      if (!savedCustomer) {
        if (isMounted) {
          setIsAuthorized(false);
          setIsChecking(false);
        }
        return;
      }

      try {
        const customerSessionStartedAt = localStorage.getItem(
          "central_juan_customer_session_started_at",
        );
        const { data, error } = await supabase
          .from("system_logs")
          .select("created_at")
          .eq("action", FORCE_LOGOUT_ACTION)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        const latestForceLogoutAt = data?.created_at || null;
        if (isRevoked(latestForceLogoutAt, customerSessionStartedAt)) {
          clearAllKnownSessions();
          window.dispatchEvent(new Event("central_juan_force_logout_applied"));
          if (isMounted) {
            setIsAuthorized(false);
            setIsChecking(false);
          }
          return;
        }

        if (isMounted) {
          setIsAuthorized(true);
          setIsChecking(false);
        }
      } catch (error) {
        console.error("Session validation error (customer):", error);
        if (isMounted) {
          setIsAuthorized(true);
          setIsChecking(false);
        }
      }
    };

    validateSession();

    const channel = supabase
      .channel("force-logout-customer-listener")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "system_logs" },
        (payload) => {
          if (payload.new?.action === FORCE_LOGOUT_ACTION) {
            validateSession();
          }
        },
      )
      .subscribe();

    const intervalId = window.setInterval(validateSession, 15000);
    window.addEventListener("focus", validateSession);
    window.addEventListener("storage", validateSession);
    window.addEventListener("central_juan_force_logout_all", validateSession);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      window.removeEventListener("focus", validateSession);
      window.removeEventListener("storage", validateSession);
      window.removeEventListener(
        "central_juan_force_logout_all",
        validateSession,
      );
      supabase.removeChannel(channel);
    };
  }, []);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 font-medium">
        Verifying session...
      </div>
    );
  }

  if (!isAuthorized) {
    return <Navigate to="/portal-login" replace />;
  }

  const savedCustomer = localStorage.getItem("central_juan_customer");

  if (!savedCustomer) {
    return <Navigate to="/portal-login" replace />;
  }

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
        <Route path="/terms" element={<TermsAndConditions />} />

        {/* CUSTOMER PORTAL ROUTES (NEW) */}
        <Route path="/portal-login" element={<CustomerLogin />} />
        <Route
          path="/my-portal"
          element={
            <CustomerProtectedRoute>
              <CustomerDashboard />
            </CustomerProtectedRoute>
          }
        />

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
          path="/job-orders/:id"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <JobOrderDetails />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/quotations"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <QuotationsContent />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ar"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AccountsReceivableContent />
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
        <Route
          path="/logs"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <SystemLogsContent />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
