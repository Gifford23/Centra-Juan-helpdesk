import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  Loader2,
  Bell,
  House,
  Clock,
  Activity,
  Search,
  RefreshCw,
  Camera,
  FileText,
  Check,
  MessageSquare,
  Calendar,
  Building2,
  FileSpreadsheet,
  Download,
  ScrollText,
  ArrowRight,
  Menu,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import technician from "../assets/technician.png";
import ticket1 from "../assets/icons/ticket1.png";
import ticket2 from "../assets/icons/ticket2.png";
import checkIcon from "../assets/icons/check.png";
import formIcon from "../assets/icons/form.png";
import toolsIcon from "../assets/icons/tools.png";
import userIcon from "../assets/icons/user.png";
import CustomerProgressDetails from "./CustomerProgressDetails";

type QuoteItem = {
  id: string;
  item: string;
  description: string;
  qty: number;
  rate: number;
  total: number;
};

type Ticket = {
  id: string | number;
  status: string;
  brand?: string;
  model?: string;
  created_at: string;
  job_order_no?: string | number;
  complaint_notes?: string;
  resolution_notes?: string;
  assigned_tech?: string | null;
  quotation_status?: string;
  quotation_amount?: number;
  quotation_message?: string;
  quotation_items?: QuoteItem[];
  payment_status?: string;
  amount_paid?: number; // <-- NEW
  has_purchase_order?: boolean;
};

type RealtimeJobOrderRow = {
  id?: string | number;
  job_order_no?: string | number;
  status?: string;
  assigned_tech?: string | null;
  priority?: string | null;
  quotation_status?: string;
  quotation_amount?: number | null;
  payment_status?: string;
  amount_paid?: number | null;
  has_purchase_order?: boolean;
  resolution_notes?: string | null;
};

const COMPLETED_STATUSES = ["Ready for Pickup", "Ready", "Released"];

const formatPeso = (value?: number | null) =>
  `P${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
  })}`;

const buildUpdateMessages = (
  oldRow: RealtimeJobOrderRow,
  newRow: RealtimeJobOrderRow,
) => {
  const ticketNo = newRow.job_order_no ?? newRow.id ?? "--";
  const messages: string[] = [];

  if (oldRow.status !== newRow.status && newRow.status) {
    messages.push(`Ticket #${ticketNo} status updated to: ${newRow.status}`);
  }

  if (oldRow.assigned_tech !== newRow.assigned_tech) {
    messages.push(
      `Ticket #${ticketNo} technician updated: ${newRow.assigned_tech || "Unassigned"}`,
    );
  }

  if (oldRow.priority !== newRow.priority && newRow.priority) {
    messages.push(`Ticket #${ticketNo} priority set to: ${newRow.priority}`);
  }

  if (
    oldRow.quotation_status !== newRow.quotation_status &&
    newRow.quotation_status
  ) {
    messages.push(
      `Ticket #${ticketNo} quotation status: ${newRow.quotation_status}`,
    );
  }

  if (oldRow.quotation_amount !== newRow.quotation_amount) {
    messages.push(
      `Ticket #${ticketNo} quotation amount updated: ${formatPeso(newRow.quotation_amount)}`,
    );
  }

  if (oldRow.has_purchase_order !== newRow.has_purchase_order) {
    messages.push(
      `Ticket #${ticketNo} purchase order ${newRow.has_purchase_order ? "confirmed" : "updated"}`,
    );
  }

  if (
    oldRow.payment_status !== newRow.payment_status &&
    newRow.payment_status
  ) {
    messages.push(
      `Ticket #${ticketNo} payment status: ${newRow.payment_status}`,
    );
  }

  if (oldRow.amount_paid !== newRow.amount_paid) {
    messages.push(
      `Ticket #${ticketNo} payment recorded: ${formatPeso(newRow.amount_paid)}`,
    );
  }

  if (
    oldRow.resolution_notes !== newRow.resolution_notes &&
    (newRow.resolution_notes || "").trim().length > 0
  ) {
    messages.push(`Ticket #${ticketNo} has a new technician resolution note.`);
  }

  if (messages.length === 0) {
    messages.push(`Ticket #${ticketNo} was updated by admin.`);
  }

  return messages;
};

const isCompletedTicket = (status: string) =>
  COMPLETED_STATUSES.includes(status);

const formatTrackingId = (ticket: Ticket) => {
  const rawId = String(ticket.job_order_no ?? ticket.id ?? "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();
  return `CJ-${rawId || "UNKNOWN"}`;
};

export default function CustomerDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const prevTicketsJson = useRef<string | null>(null);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [newNotificationPulse, setNewNotificationPulse] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "completed"
  >("all");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showMobileMePanel, setShowMobileMePanel] = useState(false);

  const playNotificationSound = useCallback(() => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = 880;
      gain.gain.value = 0.06;
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        ctx.close();
      }, 180);
    } catch (e) {
      console.error("Notification sound error:", e);
    }
  }, []);

  // TABS STATE
  const [activeTab, setActiveTab] = useState<
    "tickets" | "quotations" | "invoices" | "progress"
  >("tickets");

  // MODAL STATES
  const [progressTicket, setProgressTicket] = useState<Ticket | null>(null);
  const [selectedQuotation, setSelectedQuotation] = useState<Ticket | null>(
    null,
  );
  const [selectedInvoice, setSelectedInvoice] = useState<Ticket | null>(null); // <-- NEW

  const [customerReply, setCustomerReply] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();

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
          // Only update tickets state if the payload actually changed
          try {
            const dataJson = JSON.stringify(data);
            if (prevTicketsJson.current !== dataJson) {
              setTickets(data);
              setLastUpdated(new Date());
              prevTicketsJson.current = dataJson;
            }
          } catch {
            // Fallback: if serialization fails, just set normally
            setTickets(data);
            setLastUpdated(new Date());
            prevTicketsJson.current = null;
          }

          // Update selected items only when their content actually changed (deep-compare)
          if (progressTicket) {
            const updatedSelected = data.find(
              (t) => t.id === progressTicket.id,
            );
            if (updatedSelected) {
              try {
                const prev = JSON.stringify(progressTicket);
                const next = JSON.stringify(updatedSelected);
                if (prev !== next) setProgressTicket(updatedSelected as Ticket);
              } catch {
                setProgressTicket(updatedSelected as Ticket);
              }
            }
          }

          if (selectedQuotation) {
            const updatedQuote = data.find(
              (t) => t.id === selectedQuotation.id,
            );
            if (updatedQuote) {
              try {
                const prevQ = JSON.stringify(selectedQuotation);
                const nextQ = JSON.stringify(updatedQuote);
                if (prevQ !== nextQ)
                  setSelectedQuotation(updatedQuote as Ticket);
              } catch {
                setSelectedQuotation(updatedQuote as Ticket);
              }
            }
          }

          if (selectedInvoice) {
            const updatedInvoice = data.find(
              (t) => t.id === selectedInvoice.id,
            );
            if (updatedInvoice) {
              try {
                const prevI = JSON.stringify(selectedInvoice);
                const nextI = JSON.stringify(updatedInvoice);
                if (prevI !== nextI)
                  setSelectedInvoice(updatedInvoice as Ticket);
              } catch {
                setSelectedInvoice(updatedInvoice as Ticket);
              }
            }
          }
        }
      } catch (err) {
        console.error("Error fetching tickets:", err);
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [customerId, progressTicket, selectedQuotation, selectedInvoice],
  );

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await fetchMyTickets(true);
    } catch (err) {
      console.error("Error refreshing tickets:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!customerId) return;
    fetchMyTickets();

    const pushNotifications = (items: string[]) => {
      if (items.length === 0) return;
      setNotifications((prev) => [...items, ...prev].slice(0, 50));
      setNewNotificationPulse(true);
      playNotificationSound();
      setTimeout(() => setNewNotificationPulse(false), 1600);
    };

    const channel = supabase
      .channel("customer_updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "job_orders",
          filter: `customer_id=eq.${customerId}`,
        },
        (payload) => {
          const inserted = payload.new as RealtimeJobOrderRow;
          const ticketNo = inserted.job_order_no ?? inserted.id ?? "--";
          pushNotifications([
            `Ticket #${ticketNo} has been created and is now being processed.`,
          ]);
          fetchMyTickets(true);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "job_orders",
          filter: `customer_id=eq.${customerId}`,
        },
        (payload) => {
          const oldRow = payload.old as RealtimeJobOrderRow;
          const newRow = payload.new as RealtimeJobOrderRow;
          pushNotifications(buildUpdateMessages(oldRow, newRow));
          fetchMyTickets(true);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [customerId, fetchMyTickets, playNotificationSound]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    if (selectedQuotation || selectedInvoice) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = prev;
    }
    return () => {
      document.body.style.overflow = prev;
    };
  }, [selectedQuotation, selectedInvoice]);

  const openProgressView = (ticket: Ticket) => {
    setProgressTicket(ticket);
    setActiveTab("progress");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLogout = async () => {
    setIsSigningOut(true);
    await new Promise((resolve) => setTimeout(resolve, 650));
    localStorage.removeItem("central_juan_customer");
    localStorage.removeItem("central_juan_customer_session_started_at");
    navigate("/portal-login");
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsUploadingAvatar(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `customer-${customerProfile.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);
      const newAvatarUrl = publicUrlData.publicUrl;
      const { error: dbError } = await supabase
        .from("customers")
        .update({ avatar_url: newAvatarUrl })
        .eq("id", customerProfile.id);
      if (dbError) throw dbError;
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

  const handleQuotationResponse = async (
    jobOrderNo: number | string | undefined,
    response: "Accepted" | "Rejected",
  ) => {
    if (!jobOrderNo) return;
    try {
      setIsSubmittingReply(true);
      await supabase
        .from("job_orders")
        .update({
          quotation_status: response,
          customer_reply: customerReply,
        })
        .eq("job_order_no", jobOrderNo);

      fetchMyTickets();
      setCustomerReply("");
      setSelectedQuotation(null);
      alert(`Quotation ${response}!`);
    } catch (error) {
      console.error("Error responding to quotation:", error);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // derived lists
  const activeTickets = tickets.filter((t) => !isCompletedTicket(t.status));
  const completedTickets = tickets.filter((t) => isCompletedTicket(t.status));
  const pendingAssignmentCount = activeTickets.filter(
    (t) => !t.assigned_tech,
  ).length;

  const hasQuotationItems = (ticket: Ticket) =>
    Array.isArray(ticket.quotation_items) && ticket.quotation_items.length > 0;

  const quotationTickets = tickets.filter((t) => hasQuotationItems(t));

  const pendingQuotations = quotationTickets.filter(
    (t) => t.quotation_status === "Pending Confirmation",
  );

  // INVOICES: Any ticket that has an accepted quote is officially an invoice
  const generatedInvoices = quotationTickets.filter(
    (t) => t.quotation_status === "Accepted",
  );

  const hasQuotationProcess = quotationTickets.length > 0;
  const hasInvoiceProcess = generatedInvoices.length > 0;
  const unreadNotificationCount = notifications.length;

  useEffect(() => {
    if (activeTab === "quotations" && !hasQuotationProcess) {
      setActiveTab("tickets");
    }
    if (activeTab === "invoices" && !hasInvoiceProcess) {
      setActiveTab("tickets");
    }
  }, [activeTab, hasQuotationProcess, hasInvoiceProcess]);

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

  // Invoice Print helper
  const handlePrintInvoice = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-100 via-white to-amber-50/50 font-sans print:bg-white print:min-h-0">
      {/* Hide header and UI elements when printing */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-40 shadow-sm print:hidden">
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

          <div className="ml-auto flex items-center gap-2 sm:gap-4 w-auto justify-end">
            <div className="relative md:hidden">
              <button
                onClick={() => {
                  setShowNotifications((s) => !s);
                  setNewNotificationPulse(false);
                }}
                className={`p-2 text-stone-600 hover:bg-stone-100 rounded-full relative transition-colors ${newNotificationPulse ? "animate-pulse" : ""}`}
              >
                <Bell className="w-5 h-5" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-red-500 rounded-full border-2 border-white">
                    {unreadNotificationCount > 99
                      ? "99+"
                      : unreadNotificationCount}
                  </span>
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
                          onClick={() => {
                            const match = note.match(/#(\d+)/);
                            if (match) {
                              const jobNo = match[1];
                              const found = tickets.find(
                                (t) =>
                                  String(t.job_order_no) === jobNo ||
                                  String(t.id) === jobNo,
                              );
                              if (found) openProgressView(found);
                            }
                            setNotifications((prev) =>
                              prev.filter((_, idx) => idx !== i),
                            );
                            setShowNotifications(false);
                          }}
                          className="cursor-pointer text-xs font-medium text-blue-700 bg-blue-50 p-2 rounded-lg border border-blue-100 hover:bg-blue-100"
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

            <div className="relative hidden md:block">
              <button
                onClick={() => {
                  setShowNotifications((s) => !s);
                  setNewNotificationPulse(false);
                }}
                className={`p-2 text-stone-600 hover:bg-stone-100 rounded-full relative transition-colors ${newNotificationPulse ? "animate-pulse" : ""}`}
              >
                <Bell className="w-5 h-5" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-red-500 rounded-full border-2 border-white">
                    {unreadNotificationCount > 99
                      ? "99+"
                      : unreadNotificationCount}
                  </span>
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
                          onClick={() => {
                            const match = note.match(/#(\d+)/);
                            if (match) {
                              const jobNo = match[1];
                              const found = tickets.find(
                                (t) =>
                                  String(t.job_order_no) === jobNo ||
                                  String(t.id) === jobNo,
                              );
                              if (found) openProgressView(found);
                            }
                            setNotifications((prev) =>
                              prev.filter((_, idx) => idx !== i),
                            );
                            setShowNotifications(false);
                          }}
                          className="cursor-pointer text-xs font-medium text-blue-700 bg-blue-50 p-2 rounded-lg border border-blue-100 hover:bg-blue-100"
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

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />

            <div className="hidden md:flex items-center gap-3 pl-3 sm:pl-4 border-l border-stone-200">
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
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow border border-stone-200 hidden group-hover:block transition-all">
                  <Camera className="w-3 h-3 text-stone-600" />
                </div>
              </div>

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

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 pb-24 sm:py-8 sm:pb-8 space-y-6 sm:space-y-8 print:hidden">
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

            <div className="flex flex-col items-start sm:items-end gap-2">
              {progressTicket ? (
                <div className="text-sm font-semibold text-white/90">
                  Tracking ID: {formatTrackingId(progressTicket)}
                </div>
              ) : null}

              <div className="flex flex-wrap w-full sm:w-auto gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-semibold border border-white/20 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
                  />{" "}
                  Refresh
                </button>
                <span className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 rounded-xl bg-white/10 text-xs font-semibold border border-white/20">
                  Last updated:{" "}
                  {lastUpdated ? lastUpdated.toLocaleTimeString() : "--"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-3 sm:gap-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <img
                src={toolsIcon}
                alt="tools"
                className="w-7 h-7 object-contain"
              />
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
              <img
                src={checkIcon}
                alt="check"
                className="w-7 h-7 object-contain"
              />
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
              <img
                src={userIcon}
                alt="user"
                className="w-7 h-7 object-contain"
              />
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

        {/* TABS NAVIGATION */}
        <div className="flex items-center gap-6 border-b border-stone-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab("tickets")}
            className={`pb-4 font-bold text-sm px-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === "tickets" ? "border-blue-600 text-blue-600" : "border-transparent text-stone-500 hover:text-stone-700"}`}
          >
            My Tickets
          </button>
          {hasQuotationProcess && (
            <button
              onClick={() => setActiveTab("quotations")}
              className={`pb-4 font-bold text-sm px-2 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === "quotations" ? "border-blue-600 text-blue-600" : "border-transparent text-stone-500 hover:text-stone-700"}`}
            >
              Quotations
              {pendingQuotations.length > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {pendingQuotations.length}
                </span>
              )}
            </button>
          )}
          {hasInvoiceProcess && (
            <button
              onClick={() => setActiveTab("invoices")}
              className={`pb-4 font-bold text-sm px-2 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === "invoices" ? "border-emerald-600 text-emerald-600" : "border-transparent text-stone-500 hover:text-stone-700"}`}
            >
              Invoices & Billing
            </button>
          )}
          <button
            onClick={() => setActiveTab("progress")}
            className={`pb-4 font-bold text-sm px-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === "progress" ? "border-indigo-600 text-indigo-600" : "border-transparent text-stone-500 hover:text-stone-700"}`}
          >
            Progress View
          </button>
        </div>

        {/* TAB 1: TICKETS HISTORY */}
        {activeTab === "tickets" && (
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden animate-in fade-in">
            <div className="px-4 sm:px-6 py-5 border-b border-stone-100 bg-white">
              <div className="flex flex-col gap-4">
                <div>
                  <h2 className="text-xl font-bold text-stone-900">
                    My Repair History
                  </h2>
                  <p className="text-sm text-stone-500 mt-1 font-medium">
                    Track your current and past device repairs. Click a ticket
                    to view details.
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
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
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
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {filteredTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => openProgressView(ticket)}
                    className="p-4 sm:p-6 hover:bg-stone-50/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer group"
                  >
                    <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                      <div
                        className={`p-3 rounded-full flex-shrink-0 transition-colors ${isCompletedTicket(ticket.status) ? "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100" : "bg-blue-50 text-blue-600 group-hover:bg-blue-100"}`}
                      >
                        {isCompletedTicket(ticket.status) ? (
                          <img
                            src={checkIcon}
                            alt="check"
                            className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
                          />
                        ) : (
                          <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-stone-900 text-base sm:text-lg break-words group-hover:text-blue-600 transition-colors">
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
                        <p className="text-sm text-stone-600 mt-3 bg-white border border-stone-200 p-3 rounded-lg group-hover:border-blue-100 transition-colors">
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: QUOTATIONS LIST */}
        {activeTab === "quotations" && hasQuotationProcess && (
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden p-6 animate-in fade-in">
            <h2 className="text-xl font-bold text-stone-900 mb-6">
              Pending & Past Quotations
            </h2>

            {quotationTickets.length === 0 ? (
              <div className="flex justify-center py-10 text-stone-500 font-medium">
                No quotations available yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quotationTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="border border-stone-200 rounded-2xl p-5 bg-stone-50/50 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full border ${ticket.quotation_status === "Accepted" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : ticket.quotation_status === "Rejected" ? "bg-red-50 text-red-700 border-red-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}
                        >
                          {ticket.quotation_status}
                        </span>
                        <span className="text-xs font-bold text-stone-400">
                          #{ticket.job_order_no}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-1">
                        {ticket.brand} {ticket.model}
                      </p>
                      <h4 className="font-black text-stone-900 text-xl sm:text-3xl mb-4">
                        ₱{" "}
                        {ticket.quotation_amount?.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </h4>
                    </div>

                    <button
                      onClick={() => setSelectedQuotation(ticket)}
                      className="w-full mt-2 py-2.5 bg-white border border-stone-200 text-stone-700 font-bold text-sm rounded-xl hover:bg-stone-100 hover:text-blue-600 transition-colors flex justify-center items-center gap-2 shadow-sm"
                    >
                      <img
                        src={formIcon}
                        alt="form"
                        className="w-4 h-4 object-contain"
                      />{" "}
                      View Quotation Details
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: INVOICES (NEW) */}
        {activeTab === "invoices" && hasInvoiceProcess && (
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden p-6 animate-in fade-in">
            <h2 className="text-xl font-bold text-stone-900 mb-6 flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-emerald-600" /> My
              Invoices
            </h2>

            {generatedInvoices.length === 0 ? (
              <div className="flex justify-center py-10 text-stone-500 font-medium">
                No invoices generated yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {generatedInvoices.map((invoice) => {
                  const total = invoice.quotation_amount || 0;
                  const paid = invoice.amount_paid || 0;
                  const balance = total - paid;

                  return (
                    <div
                      key={invoice.id}
                      className="border border-stone-200 rounded-2xl p-5 bg-stone-50/50 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <span
                            className={`text-xs font-bold px-3 py-1 rounded-full border ${balance <= 0 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : paid > 0 ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}
                          >
                            {balance <= 0
                              ? "Fully Paid"
                              : paid > 0
                                ? "Partial Payment"
                                : "Unpaid"}
                          </span>
                          <span className="text-xs font-bold text-stone-400">
                            INV-#{invoice.job_order_no}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-1">
                          {invoice.brand} {invoice.model}
                        </p>

                        <div className="bg-white p-3 rounded-xl border border-stone-100 my-4 space-y-2">
                          <div className="flex justify-between text-sm font-medium text-stone-500">
                            <span>Total Amount:</span>
                            <span>
                              ₱
                              {total.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm font-medium text-emerald-600">
                            <span>Amount Paid:</span>
                            <span>
                              -₱
                              {paid.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm font-black text-stone-900 pt-2 border-t border-stone-100">
                            <span>Balance Due:</span>
                            <span
                              className={
                                balance > 0
                                  ? "text-rose-600"
                                  : "text-emerald-600"
                              }
                            >
                              ₱
                              {balance.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedInvoice(invoice)}
                        className="w-full mt-2 py-2.5 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-700 transition-colors flex justify-center items-center gap-2 shadow-md shadow-emerald-600/20"
                      >
                        <ScrollText className="w-4 h-4" /> View Full Invoice
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: FULL PROGRESS PAGE */}
        {activeTab === "progress" && (
          <div className="rounded-3xl border border-stone-200 bg-gradient-to-br from-white via-stone-50 to-indigo-50/30 shadow-sm overflow-hidden animate-in fade-in">
            {!progressTicket ? (
              <div className="py-16 px-6 text-center">
                <h2 className="text-2xl font-black text-stone-900 tracking-tight">
                  Repair Progress Page
                </h2>
                <p className="text-stone-500 font-medium mt-2 max-w-lg mx-auto">
                  Select any ticket from My Tickets to open its full progress
                  timeline and status details here.
                </p>
                <button
                  onClick={() => setActiveTab("tickets")}
                  className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors"
                >
                  Go to My Tickets <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="p-5 sm:p-7 lg:p-8 space-y-8">
                <div className="rounded-2xl bg-gradient-to-r from-indigo-700 via-blue-700 to-cyan-600 text-white p-5 sm:p-6 shadow-lg">
                  <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-white/80">
                    Live Progress Monitor
                  </p>
                  <div className="mt-2 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                    <div>
                      <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
                        Ticket #{progressTicket.job_order_no}
                      </h3>
                      <p className="text-sm sm:text-base text-white/90 mt-1 font-medium">
                        {progressTicket.brand} {progressTicket.model}
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab("tickets")}
                      className="inline-flex items-center gap-2 self-start md:self-auto px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-sm font-bold transition-colors"
                    >
                      Change Ticket <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${isCompletedTicket(progressTicket.status) ? "border-emerald-200/60 bg-emerald-500/20 text-emerald-100" : "border-blue-200/60 bg-blue-500/20 text-blue-100"}`}
                    >
                      Status: {progressTicket.status || "Pending"}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white/95">
                      Tech: {progressTicket.assigned_tech || "Unassigned"}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white/95">
                      Quote: {progressTicket.quotation_status || "Not Created"}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white/95">
                      Payment: {progressTicket.payment_status || "Unpaid"}
                    </span>
                  </div>
                </div>

                <CustomerProgressDetails
                  key={String(progressTicket.job_order_no ?? progressTicket.id)}
                  ticket={progressTicket}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {showMobileMePanel && (
        <div className="fixed inset-0 z-[55] md:hidden print:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-stone-900/45"
            onClick={() => setShowMobileMePanel(false)}
            aria-label="Close Me panel"
          />

          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl border border-stone-200 bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-stone-400">
                  Me
                </p>
                <h3 className="text-xl font-black text-stone-900 mt-1">
                  {customerProfile.full_name || "My Profile"}
                </h3>
                <p className="text-sm text-stone-500 font-medium mt-0.5">
                  {customerProfile.email || "Customer account"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowMobileMePanel(false)}
                className="rounded-full p-2 text-stone-500 hover:bg-stone-100"
                aria-label="Close profile menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-3">
              <button
                type="button"
                className="relative group"
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploadingAvatar ? (
                  <div className="w-12 h-12 rounded-full bg-white border border-stone-200 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
                  </div>
                ) : customerProfile.avatar_url ? (
                  <img
                    src={customerProfile.avatar_url}
                    alt="Profile"
                    className="w-12 h-12 rounded-full object-cover border border-stone-200"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-black">
                    {customerProfile.full_name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 rounded-full bg-white border border-stone-200 p-1">
                  <Camera className="w-3 h-3 text-stone-600" />
                </span>
              </button>

              <div className="min-w-0">
                <p className="text-sm font-bold text-stone-900 truncate">
                  {customerProfile.full_name}
                </p>
                <p className="text-xs text-stone-500 font-medium">
                  Tap image to update profile photo
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={isSigningOut}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-rose-600 text-white font-bold text-sm hover:bg-rose-700 disabled:opacity-70"
            >
              {isSigningOut ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
              {isSigningOut ? "Signing out..." : "Sign Out"}
            </button>
          </div>
        </div>
      )}

      {!selectedQuotation && !selectedInvoice && (
        <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-stone-200 bg-white/95 backdrop-blur md:hidden print:hidden">
          <div className="grid grid-cols-5 gap-1 px-2 py-2">
            <button
              type="button"
              onClick={() => setActiveTab("tickets")}
              className={`flex flex-col items-center justify-center rounded-xl py-1.5 text-[11px] font-semibold transition-colors ${activeTab === "tickets" ? "text-blue-600 bg-blue-50" : "text-stone-500"}`}
            >
              <House className="w-5 h-5" />
              Dashboard
            </button>

            <button
              type="button"
              onClick={() => hasQuotationProcess && setActiveTab("quotations")}
              className={`flex flex-col items-center justify-center rounded-xl py-1.5 text-[11px] font-semibold transition-colors ${activeTab === "quotations" ? "text-blue-600 bg-blue-50" : "text-stone-500"} ${!hasQuotationProcess ? "opacity-50" : ""}`}
            >
              <ScrollText className="w-5 h-5" />
              Quotes
            </button>

            <button
              type="button"
              onClick={() => hasInvoiceProcess && setActiveTab("invoices")}
              className={`flex flex-col items-center justify-center rounded-xl py-1.5 text-[11px] font-semibold transition-colors ${activeTab === "invoices" ? "text-emerald-600 bg-emerald-50" : "text-stone-500"} ${!hasInvoiceProcess ? "opacity-50" : ""}`}
            >
              <FileSpreadsheet className="w-5 h-5" />
              Billing
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("progress")}
              className={`flex flex-col items-center justify-center rounded-xl py-1.5 text-[11px] font-semibold transition-colors ${activeTab === "progress" ? "text-indigo-600 bg-indigo-50" : "text-stone-500"}`}
            >
              <Activity className="w-5 h-5" />
              Progress
            </button>

            <button
              type="button"
              onClick={() => setShowMobileMePanel(true)}
              className={`flex flex-col items-center justify-center rounded-xl py-1.5 text-[11px] font-semibold transition-colors ${showMobileMePanel ? "text-stone-900 bg-stone-100" : "text-stone-500"}`}
            >
              <Menu className="w-5 h-5" />
              Me
            </button>
          </div>
        </nav>
      )}

      {/* DETAILED QUOTATION (PDF STYLE) MODAL */}
      {selectedQuotation && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/70 print:hidden">
          <div className="bg-white w-full max-w-3xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[100dvh] sm:h-auto max-h-[100dvh] sm:max-h-[95vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-6 border-b border-stone-100 flex flex-col sm:flex-row justify-between items-start gap-3 bg-white shrink-0">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-sm border border-blue-100">
                  <Building2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-stone-900 leading-tight uppercase tracking-tight">
                    Central Juan
                  </h3>
                  <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mt-0.5">
                    I.T. Solutions Partner
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right w-full sm:w-auto">
                <h2 className="text-2xl font-black text-blue-900 uppercase tracking-wider">
                  Quotation
                </h2>
                <p className="text-sm font-medium text-stone-500 mt-1 flex items-center justify-start sm:justify-end gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {new Date(selectedQuotation.created_at).toLocaleDateString()}
                </p>
                <p className="text-sm font-bold text-stone-700 mt-0.5">
                  Estimate #{selectedQuotation.job_order_no}
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 sm:space-y-8 flex-1 bg-stone-50/30">
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row justify-between items-start gap-3">
                <div>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">
                    Prepared For
                  </p>
                  <p className="text-base font-black text-stone-900">
                    {customerProfile.full_name}
                  </p>
                  <p className="text-sm font-medium text-stone-600 mt-1">
                    {selectedQuotation.brand} {selectedQuotation.model}
                  </p>
                </div>
                <div className="text-left sm:text-right w-full sm:w-auto">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-bold border mb-2 ${selectedQuotation.quotation_status === "Accepted" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : selectedQuotation.quotation_status === "Rejected" ? "bg-red-50 text-red-700 border-red-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}
                  >
                    Status: {selectedQuotation.quotation_status}
                  </span>
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-0">
                    <thead>
                      <tr className="text-[11px] font-black text-stone-400 uppercase tracking-wider border-b border-stone-200 bg-stone-100/50">
                        <th className="py-4 px-5">Item & Description</th>
                        <th className="py-4 px-5 text-center md:w-20 w-16">
                          Qty
                        </th>
                        <th className="py-4 px-5 text-right md:w-32 w-24">
                          Rate
                        </th>
                        <th className="py-4 px-5 text-right md:w-32 w-24">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {!selectedQuotation.quotation_items ||
                      selectedQuotation.quotation_items.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="py-8 text-center text-sm text-stone-400 font-medium"
                          >
                            No detailed line items provided. Please refer to the
                            message below.
                          </td>
                        </tr>
                      ) : (
                        selectedQuotation.quotation_items.map(
                          (item: QuoteItem) => (
                            <tr
                              key={item.id}
                              className="hover:bg-stone-50 transition-colors"
                            >
                              <td className="py-4 px-5 break-words whitespace-normal">
                                <p className="font-bold text-stone-900 text-sm">
                                  {item.item}
                                </p>
                                {item.description && (
                                  <p className="text-xs text-stone-500 mt-1">
                                    {item.description}
                                  </p>
                                )}
                              </td>
                              <td className="py-4 px-5 text-center font-bold text-stone-700">
                                {item.qty}
                              </td>
                              <td className="py-4 px-5 text-right font-medium text-stone-700">
                                ₱
                                {item.rate.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                })}
                              </td>
                              <td className="py-4 px-5 text-right font-black text-stone-900">
                                ₱
                                {item.total.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                })}
                              </td>
                            </tr>
                          ),
                        )
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="bg-blue-50/50 border-t border-stone-200 p-5 sm:px-8">
                  <div className="flex flex-col sm:flex-row sm:justify-end items-start sm:items-center gap-2">
                    <span className="text-sm font-bold text-blue-900 uppercase tracking-wider">
                      Grand Total
                    </span>
                    <span className="text-lg sm:text-2xl font-semibold text-blue-700">
                      ₱{" "}
                      {selectedQuotation.quotation_amount?.toLocaleString(
                        undefined,
                        { minimumFractionDigits: 2 },
                      ) || "0.00"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
                <span className="flex items-center gap-1.5 text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">
                  <FileText className="w-4 h-4" /> Warranty & Exclusions
                </span>
                <p className="text-sm font-medium text-stone-700 whitespace-pre-wrap leading-relaxed">
                  {selectedQuotation.quotation_message ||
                    "All hardware products are covered by the manufacturer's warranty period. Software services carry no warranty. This proposal and cost estimate are good for 14 days."}
                </p>
              </div>

              {selectedQuotation.quotation_status === "Pending Confirmation" ? (
                <div className="bg-white p-5 sm:p-6 rounded-2xl border-2 border-blue-100 shadow-md shadow-blue-100/50 space-y-4">
                  <div>
                    <label className="text-[11px] font-black text-blue-600 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                      <MessageSquare className="w-4 h-4" /> Customer Acceptance
                      & Remarks
                    </label>
                    <p className="text-xs text-stone-500 mb-3">
                      By clicking "Accept Quote", you confirm the repairs and
                      costs listed above.
                    </p>
                  </div>
                  <textarea
                    rows={2}
                    value={customerReply}
                    onChange={(e) => setCustomerReply(e.target.value)}
                    placeholder="E.g., Please proceed, I need this by Friday..."
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl text-sm p-4 outline-none focus:ring-2 focus:ring-blue-500 resize-none font-medium"
                  />
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={() =>
                        handleQuotationResponse(
                          selectedQuotation.job_order_no,
                          "Rejected",
                        )
                      }
                      disabled={isSubmittingReply}
                      className="flex-1 py-3.5 bg-white border-2 border-red-100 text-red-600 text-sm font-bold rounded-xl hover:bg-red-50 hover:border-red-200 transition-colors"
                    >
                      Decline Quote
                    </button>
                    <button
                      onClick={() =>
                        handleQuotationResponse(
                          selectedQuotation.job_order_no,
                          "Accepted",
                        )
                      }
                      disabled={isSubmittingReply}
                      className="flex-1 py-3.5 bg-blue-600 text-white text-sm font-black rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      {isSubmittingReply ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-5 h-5" /> Accept & Proceed
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div
                    className={`flex-1 p-4 rounded-xl border text-center font-bold text-sm ${selectedQuotation.quotation_status === "Accepted" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : selectedQuotation.quotation_status === "Rejected" ? "bg-red-50 text-red-700 border-red-200" : "bg-stone-50 text-stone-500 border-stone-200"}`}
                  >
                    You have {selectedQuotation.quotation_status?.toLowerCase()}{" "}
                    this quotation.
                  </div>
                  <button
                    onClick={() => setSelectedQuotation(null)}
                    className="px-6 py-4 bg-white border border-stone-200 text-stone-600 font-bold text-sm rounded-xl hover:bg-stone-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* NEW: DETAILED INVOICE MODAL (PRINTABLE) */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/70 print:relative print:inset-auto print:bg-white print:p-0 print:flex-none print:z-0">
          <div className="bg-white w-full max-w-3xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[100dvh] sm:h-auto max-h-[100dvh] sm:max-h-[95vh] print:max-h-none print:shadow-none print:rounded-none animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-stone-200 flex flex-col sm:flex-row justify-between items-start gap-3 bg-white shrink-0 print:border-b-2">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm border border-emerald-100 print:border-none print:bg-transparent">
                  <Building2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-stone-900 leading-tight uppercase tracking-tight">
                    Central Juan
                  </h3>
                  <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mt-0.5">
                    I.T. Solutions Partner
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right flex flex-col items-start sm:items-end w-full sm:w-auto">
                <h2 className="text-3xl font-black text-emerald-700 uppercase tracking-wider">
                  INVOICE
                </h2>
                <p className="text-sm font-medium text-stone-500 mt-1 flex items-center justify-start sm:justify-end gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {new Date(selectedInvoice.created_at).toLocaleDateString()}
                </p>
                <p className="text-sm font-bold text-stone-700 mt-0.5">
                  INV-#{selectedInvoice.job_order_no}
                </p>
                {/* Close button removed per request */}
              </div>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 sm:space-y-8 flex-1 bg-stone-50/30 print:bg-white print:overflow-visible">
              {/* Bill To */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row justify-between items-start gap-3 print:shadow-none print:border-none print:p-0">
                <div>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">
                    Billed To
                  </p>
                  <p className="text-base font-black text-stone-900">
                    {customerProfile.full_name}
                  </p>
                  <p className="text-sm font-medium text-stone-600 mt-1">
                    {selectedInvoice.brand} {selectedInvoice.model}
                  </p>
                </div>
                <div className="text-left sm:text-right w-full sm:w-auto">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-2">
                    Payment Status
                  </span>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-black border ${(selectedInvoice.quotation_amount || 0) - (selectedInvoice.amount_paid || 0) <= 0 ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-rose-100 text-rose-700 border-rose-200"}`}
                  >
                    {(selectedInvoice.quotation_amount || 0) -
                      (selectedInvoice.amount_paid || 0) <=
                    0
                      ? "PAID IN FULL"
                      : "BALANCE DUE"}
                  </span>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm print:shadow-none print:rounded-none">
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-0">
                    <thead>
                      <tr className="text-[11px] font-black text-stone-400 uppercase tracking-wider border-b border-stone-200 bg-stone-100/50 print:bg-transparent">
                        <th className="py-4 px-5">Item & Description</th>
                        <th className="py-4 px-5 text-center md:w-20 w-16">
                          Qty
                        </th>
                        <th className="py-4 px-5 text-right md:w-32 w-24">
                          Rate
                        </th>
                        <th className="py-4 px-5 text-right md:w-32 w-24">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {!selectedInvoice.quotation_items ||
                      selectedInvoice.quotation_items.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="py-8 text-center text-sm text-stone-500 font-medium"
                          >
                            {selectedInvoice.quotation_message ||
                              "Service and repairs applied."}
                          </td>
                        </tr>
                      ) : (
                        selectedInvoice.quotation_items.map(
                          (item: QuoteItem) => (
                            <tr key={item.id}>
                              <td className="py-4 px-5 break-words whitespace-normal">
                                <p className="font-bold text-stone-900 text-sm">
                                  {item.item}
                                </p>
                                {item.description && (
                                  <p className="text-xs text-stone-500 mt-1">
                                    {item.description}
                                  </p>
                                )}
                              </td>
                              <td className="py-4 px-5 text-center font-bold text-stone-700">
                                {item.qty}
                              </td>
                              <td className="py-4 px-5 text-right font-medium text-stone-700">
                                ₱
                                {item.rate.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                })}
                              </td>
                              <td className="py-4 px-5 text-right font-black text-stone-900">
                                ₱
                                {item.total.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                })}
                              </td>
                            </tr>
                          ),
                        )
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Financial Totals */}
                <div className="bg-emerald-50/30 border-t border-stone-200 p-5 sm:px-8 space-y-3 print:bg-transparent">
                  <div className="flex justify-between items-center text-sm font-bold text-stone-500">
                    <span>Subtotal / Grand Total</span>
                    <span>
                      ₱{" "}
                      {(selectedInvoice.quotation_amount || 0).toLocaleString(
                        undefined,
                        { minimumFractionDigits: 2 },
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold text-emerald-600">
                    <span>Amount Paid</span>
                    <span>
                      - ₱{" "}
                      {(selectedInvoice.amount_paid || 0).toLocaleString(
                        undefined,
                        { minimumFractionDigits: 2 },
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-stone-200">
                    <span className="text-sm font-bold text-stone-800 uppercase tracking-wider">
                      Balance Due
                    </span>
                    <span
                      className={`text-2xl font-black ${(selectedInvoice.quotation_amount || 0) - (selectedInvoice.amount_paid || 0) > 0 ? "text-rose-600" : "text-emerald-600"}`}
                    >
                      ₱{" "}
                      {Math.max(
                        0,
                        (selectedInvoice.quotation_amount || 0) -
                          (selectedInvoice.amount_paid || 0),
                      ).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Print Button */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 print:hidden">
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="w-full sm:w-auto px-6 py-3 bg-white border border-stone-200 text-stone-600 font-bold text-sm rounded-xl hover:bg-stone-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handlePrintInvoice}
                  className="w-full sm:w-auto px-6 py-3 bg-emerald-600 text-white text-sm font-black rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <Download className="w-5 h-5" /> Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
