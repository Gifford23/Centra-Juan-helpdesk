import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  CheckCircle2,
  Wrench,
  Loader2,
  Bell,
  Clock,
  Activity,
  Search,
  RefreshCw,
  UserCircle2,
  Camera, // <-- IMPORTED CAMERA ICON
} from "lucide-react";
import { supabase } from "../lib/supabase";
import technician from "../assets/technician.png";
import ticket1 from "../assets/icons/ticket1.png";
import ticket2 from "../assets/icons/ticket2.png";

type Ticket = {
  id: string | number;
  status: string;
  brand?: string;
  model?: string;
  created_at: string;
  job_order_no?: string | number;
  complaint_notes?: string;
  assigned_tech?: string | null;
};

const COMPLETED_STATUSES = ["Ready for Pickup", "Ready", "Released"];

const isCompletedTicket = (status: string) =>
  COMPLETED_STATUSES.includes(status);

export default function CustomerDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "completed"
  >("all");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Profile Upload States
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();

  // Use state for customer so the UI updates instantly when avatar changes
  const [customerProfile, setCustomerProfile] = useState(
    JSON.parse(localStorage.getItem("central_juan_customer") || "{}"),
  );
  const customerId = customerProfile.id;

  const fetchMyTickets = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setIsLoading(true);
        const { data, error } = await supabase
          .from("job_orders")
          .select("*")
          .eq("customer_id", customerId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (data) {
          setTickets(data);
          setLastUpdated(new Date());
        }
      } catch (err) {
        console.error("Error fetching tickets:", err);
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [customerId],
  );

  useEffect(() => {
    if (!customerId) return;
    fetchMyTickets();

    // REAL-TIME NOTIFICATIONS
    const channel = supabase
      .channel("customer_updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "job_orders",
          filter: `customer_id=eq.${customerId}`,
        },
        (payload) => {
          const newStatus = payload.new.status;
          const ticketId = payload.new.job_order_no;
          setNotifications((prev) => [
            `Ticket #${ticketId} status updated to: ${newStatus}`,
            ...prev,
          ]);
          fetchMyTickets(true); // Refresh without blocking UI
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [customerId, fetchMyTickets]);

  const handleLogout = async () => {
    setIsSigningOut(true);
    await new Promise((resolve) => setTimeout(resolve, 650));
    localStorage.removeItem("central_juan_customer");
    navigate("/portal-login");
  };

  // --- AVATAR UPLOAD LOGIC ---
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploadingAvatar(true);

      // Upload to 'avatars' bucket
      const fileExt = file.name.split(".").pop();
      const fileName = `customer-${customerProfile.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get Public URL
      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      const newAvatarUrl = publicUrlData.publicUrl;

      // Update customers table
      const { error: dbError } = await supabase
        .from("customers")
        .update({ avatar_url: newAvatarUrl })
        .eq("id", customerProfile.id);

      if (dbError) throw dbError;

      // Update local storage and UI
      const updatedCustomer = { ...customerProfile, avatar_url: newAvatarUrl };
      setCustomerProfile(updatedCustomer);
      localStorage.setItem(
        "central_juan_customer",
        JSON.stringify(updatedCustomer),
      );
    } catch (error) {
      console.error("Error uploading avatar:", error);
      alert("Failed to upload profile picture. Please try again.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const activeTickets = tickets.filter((t) => !isCompletedTicket(t.status));
  const completedTickets = tickets.filter((t) => isCompletedTicket(t.status));
  const pendingAssignmentCount = activeTickets.filter(
    (t) => !t.assigned_tech,
  ).length;

  const filteredTickets = tickets.filter((ticket) => {
    if (statusFilter === "active" && isCompletedTicket(ticket.status))
      return false;
    if (statusFilter === "completed" && !isCompletedTicket(ticket.status))
      return false;

    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;

    return [
      ticket.brand,
      ticket.model,
      ticket.status,
      ticket.job_order_no?.toString(),
      ticket.complaint_notes,
      ticket.assigned_tech || "",
    ]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-100 via-white to-amber-50/50 font-sans">
      {/* Top Navbar */}
      <header className="bg-white/90 backdrop-blur border-b border-stone-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-16 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src={technician} alt="Logo" className="w-9 h-9 rounded-xl" />
            <div>
              <p className="font-black text-lg sm:text-xl text-stone-900 tracking-tight">
                My Portal
              </p>
              <p className="text-xs text-stone-500 font-medium -mt-0.5">
                Central Juan Service Center
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-end">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-stone-600 hover:bg-stone-100 rounded-full relative transition-colors"
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-[88vw] max-w-80 bg-white rounded-2xl shadow-xl border border-stone-200 p-4 z-50">
                  <h4 className="text-sm font-bold text-stone-900 mb-3">
                    Recent Updates
                  </h4>
                  {notifications.length === 0 ? (
                    <p className="text-xs text-stone-500">
                      No new notifications.
                    </p>
                  ) : (
                    <ul className="space-y-2 max-h-48 overflow-y-auto">
                      {notifications.map((note, i) => (
                        <li
                          key={i}
                          className="text-xs font-medium text-blue-700 bg-blue-50 p-2 rounded-lg border border-blue-100"
                        >
                          {note}
                        </li>
                      ))}
                    </ul>
                  )}
                  <button
                    onClick={() => setNotifications([])}
                    className="mt-3 w-full text-xs font-bold text-stone-400 hover:text-stone-700 text-center"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>

            {/* Profile Section with Avatar Upload */}
            <div className="flex items-center gap-3 pl-3 sm:pl-4 border-l border-stone-200">
              {/* CLICKABLE AVATAR */}
              <div
                className="relative group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                title="Change Profile Picture"
              >
                {isUploadingAvatar ? (
                  <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center border border-stone-200">
                    <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
                  </div>
                ) : customerProfile.avatar_url ? (
                  <img
                    src={customerProfile.avatar_url}
                    alt="Profile"
                    className="w-9 h-9 rounded-full object-cover border border-stone-200 shadow-sm group-hover:opacity-80 transition-opacity"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm shadow-sm group-hover:bg-amber-200 transition-colors">
                    {customerProfile.full_name?.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Tiny Camera Hover Icon */}
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow border border-stone-200 hidden group-hover:block transition-all">
                  <Camera className="w-3 h-3 text-stone-600" />
                </div>
              </div>

              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />

              <div className="hidden md:block">
                <p className="text-sm font-bold text-stone-900 leading-none">
                  {customerProfile.full_name}
                </p>
              </div>
              <button
                onClick={handleLogout}
                disabled={isSigningOut}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-stone-200 text-sm font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-70 disabled:cursor-not-allowed transition-colors ml-1"
                title="Sign out"
              >
                {isSigningOut ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">
                  {isSigningOut ? "Signing out..." : "Sign Out"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        <section className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 rounded-3xl p-5 sm:p-7 text-white shadow-lg">
          <div className="flex flex-col lg:flex-row gap-6 lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-00/80 mb-2">
                Welcome back
              </p>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                {customerProfile.full_name || "Valued Customer"}
              </h1>
              <p className="mt-2 text-sm text-gray-100 max-w-xl">
                Customer Dashboard Monitoring Status
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => fetchMyTickets(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-semibold border border-white/20 transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
              <span className="inline-flex items-center px-4 py-2 rounded-xl bg-white/10 text-xs font-semibold border border-white/20">
                Last updated:{" "}
                {lastUpdated ? lastUpdated.toLocaleTimeString() : "--"}
              </span>
            </div>
          </div>
        </section>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-3 sm:gap-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <Wrench className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">
                Active Repairs
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-stone-900">
                {activeTickets.length}
              </h3>
            </div>
          </div>
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-3 sm:gap-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">
                Completed Jobs
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-stone-900">
                {completedTickets.length}
              </h3>
            </div>
          </div>
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-3 sm:gap-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <UserCircle2 className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">
                Pending Tech
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-stone-900">
                {pendingAssignmentCount}
              </h3>
            </div>
          </div>
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-3 sm:gap-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center">
              <img
                src={ticket1}
                alt="Total tickets"
                className="w-7 h-7 object-contain"
              />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">
                Total Tickets
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-stone-900">
                {tickets.length}
              </h3>
            </div>
          </div>
        </div>

        {/* Ticket History */}
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-5 border-b border-stone-100 bg-white">
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-bold text-stone-900">
                  My Repair History
                </h2>
                <p className="text-sm text-stone-500 mt-1 font-medium">
                  Track your current and past device repairs.
                </p>
              </div>

              <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
                <div className="relative w-full lg:max-w-sm">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by model, issue, status, ticket #"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300"
                  />
                </div>

                <div className="inline-flex w-full lg:w-auto rounded-xl bg-stone-100 p-1 gap-1">
                  <button
                    onClick={() => setStatusFilter("all")}
                    className={`flex-1 lg:flex-none px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors ${statusFilter === "all" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800"}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setStatusFilter("active")}
                    className={`flex-1 lg:flex-none px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors ${statusFilter === "active" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800"}`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => setStatusFilter("completed")}
                    className={`flex-1 lg:flex-none px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors ${statusFilter === "completed" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800"}`}
                  >
                    Completed
                  </button>
                </div>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-14">
              <Loader2 className="w-8 h-8 text-amber-600 animate-spin mb-3" />
              <p className="text-stone-500 font-medium">
                Loading your tickets...
              </p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 px-4">
              <img
                src={ticket2}
                alt="No tickets"
                className="w-12 h-12 object-contain mb-3 opacity-70"
              />
              <p className="text-stone-500 font-medium text-center max-w-sm">
                You don't have any repair tickets yet.
              </p>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 px-4">
              <Search className="w-12 h-12 text-stone-300 mb-3" />
              <p className="text-stone-600 font-semibold text-center">
                No matching tickets found.
              </p>
              <p className="text-stone-500 text-sm text-center mt-1">
                Try a different keyword or ticket filter.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="p-4 sm:p-6 hover:bg-stone-50/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                    <div
                      className={`p-3 rounded-full flex-shrink-0 ${isCompletedTicket(ticket.status) ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"}`}
                    >
                      {isCompletedTicket(ticket.status) ? (
                        <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                      ) : (
                        <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-stone-900 text-base sm:text-lg break-words">
                        {ticket.brand} {ticket.model}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1.5 text-xs sm:text-sm font-medium text-stone-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </span>
                        <span className="text-stone-300">•</span>
                        <span>Ticket #{ticket.job_order_no}</span>
                      </div>
                      <p className="text-sm text-stone-600 mt-3 bg-white border border-stone-200 p-3 rounded-lg">
                        <span className="font-bold text-stone-900 text-xs uppercase tracking-wider block mb-1">
                          Reported Issue:
                        </span>
                        {ticket.complaint_notes ||
                          "No complaint notes provided."}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-start lg:items-end gap-2 lg:pl-4">
                    <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                      Current Status
                    </span>
                    <span
                      className={`px-4 py-1.5 rounded-full text-sm font-bold border ${isCompletedTicket(ticket.status) ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}
                    >
                      {ticket.status}
                    </span>
                    <span className="text-xs font-bold text-stone-500 mt-1 sm:mt-2 flex items-center gap-1">
                      Tech:
                      <span className="text-stone-900">
                        {ticket.assigned_tech || "Pending Assignment"}
                      </span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
