import { Link, useNavigate, useLocation } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  ListTodo,
  Users,
  Settings,
  Bell,
  ShieldCheck,
  LogOut,
  ChevronDown,
  Tickets,
  ClipboardList,
  Activity,
} from "lucide-react";
import technician from "../assets/technician.png";
import { supabase } from "../lib/supabase";
import { logSystemAction } from "../utils/auditLog";

type NotificationItem = {
  id: string;
  message: string;
  createdAt: string;
};

type JobNotificationRow = {
  job_order_no: number;
  created_at: string;
  customers: { full_name: string } | { full_name: string }[] | null;
};

// This acts as a wrapper. The 'children' will be the actual page content.
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [lastReadAt, setLastReadAt] = useState<string>("");

  const navigate = useNavigate();
  const location = useLocation(); // Used to highlight the active tab

  // 1. GET THE LOGGED IN USER FROM LOCAL STORAGE
  const savedUser = JSON.parse(
    localStorage.getItem("central_juan_user") || "{}",
  );
  const isSuperAdmin = savedUser?.role === "Super Admin";

  const notificationStorageKey = useMemo(
    () => `central_juan_notifications_read_at_${savedUser?.id || "default"}`,
    [savedUser?.id],
  );

  const formatRelativeTime = (isoString: string) => {
    const date = new Date(isoString);
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / 60000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;

    return date.toLocaleDateString();
  };

  const mapRowToNotification = (job: JobNotificationRow): NotificationItem => {
    const customer = Array.isArray(job.customers)
      ? job.customers[0]?.full_name
      : job.customers?.full_name;

    return {
      id: String(job.job_order_no),
      message: `New job order #${job.job_order_no}${customer ? ` from ${customer}` : ""}`,
      createdAt: job.created_at,
    };
  };

  const playNotificationTing = () => {
    try {
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(1046.5, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.08,
        audioContext.currentTime + 0.01,
      );
      gainNode.gain.exponentialRampToValueAtTime(
        0.0001,
        audioContext.currentTime + 0.18,
      );

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.18);
      oscillator.onended = () => {
        audioContext.close();
      };
    } catch (error) {
      console.error("Unable to play notification sound:", error);
    }
  };

  const fetchNotifications = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("job_orders")
        .select(
          `
            job_order_no,
            created_at,
            customers ( full_name )
          `,
        )
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      if (data) {
        setNotifications(
          (data as JobNotificationRow[]).map(mapRowToNotification),
        );
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }, []);

  const upsertNotification = useCallback((item: NotificationItem) => {
    setNotifications((prev) => {
      const merged = [item, ...prev.filter((n) => n.id !== item.id)];
      return merged
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 10);
    });
  }, []);

  const markNotificationsAsRead = () => {
    const now = new Date().toISOString();
    setLastReadAt(now);
    localStorage.setItem(notificationStorageKey, now);
  };

  const handleBellClick = () => {
    setShowNotifications((v) => !v);
  };

  const handleNotificationClick = () => {
    markNotificationsAsRead();
    setShowNotifications(false);
    navigate("/queue");
  };

  useEffect(() => {
    const storedReadAt = localStorage.getItem(notificationStorageKey);
    if (storedReadAt) {
      setLastReadAt(storedReadAt);
    } else {
      const now = new Date().toISOString();
      setLastReadAt(now);
      localStorage.setItem(notificationStorageKey, now);
    }

    fetchNotifications();

    const channel = supabase
      .channel("admin-job-order-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "job_orders" },
        async (payload) => {
          const newJobOrderNo = payload.new?.job_order_no;
          if (!newJobOrderNo) return;

          try {
            const { data, error } = await supabase
              .from("job_orders")
              .select(
                `
                  job_order_no,
                  created_at,
                  customers ( full_name )
                `,
              )
              .eq("job_order_no", newJobOrderNo)
              .single();

            if (error) throw error;
            if (!data) return;

            upsertNotification(mapRowToNotification(data));
            playNotificationTing();
          } catch (error) {
            console.error("Error handling new notification:", error);
          }
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          fetchNotifications();
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications, notificationStorageKey, upsertNotification]);

  useEffect(() => {
    const syncNotifications = () => {
      if (document.visibilityState === "visible") {
        fetchNotifications();
      }
    };

    window.addEventListener("focus", syncNotifications);
    document.addEventListener("visibilitychange", syncNotifications);

    return () => {
      window.removeEventListener("focus", syncNotifications);
      document.removeEventListener("visibilitychange", syncNotifications);
    };
  }, [fetchNotifications]);

  const unreadCount = notifications.filter(
    (item) => !lastReadAt || new Date(item.createdAt) > new Date(lastReadAt),
  ).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans">
      {/* ==========================================
          LEFT SIDEBAR (Collapse/Expand on Hover)
      ========================================== */}
      <aside
        className="fixed top-0 left-0 h-screen bg-blue-600 border-r border-blue-700 text-white z-50 
                      w-16 sm:w-20 md:hover:w-64 transition-all duration-300 ease-in-out group 
                      overflow-hidden flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)]"
      >
        {/* Logo Section */}
        <div className="h-16 flex items-center px-4 sm:px-6 border-b border-blue-700 whitespace-nowrap">
          <img
            src={technician}
            alt="Technician"
            className="w-8 h-8 flex-shrink-0 object-cover drop-shadow-sm"
          />
          <span className="ml-4 font-black text-xl text-white tracking-tight opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            Help Desk
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-6 flex flex-col gap-1.5 px-3 overflow-y-auto">
          <Link
            to="/"
            className={`flex items-center px-3 py-2.5 rounded-lg transition-all whitespace-nowrap font-medium ${location.pathname === "/" ? "bg-blue-700/20 text-white" : "text-white hover:bg-blue-700/10"}`}
          >
            <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
            <span className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Dashboard
            </span>
          </Link>

          <Link
            to="/job-orders"
            className={`flex items-center px-3 py-2.5 rounded-lg transition-all whitespace-nowrap font-medium ${location.pathname === "/job-orders" ? "bg-blue-700/20 text-white" : "text-white hover:bg-blue-700/10"}`}
          >
            <ClipboardList className="w-5 h-5 flex-shrink-0" />
            <span className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Job Orders
            </span>
          </Link>

          <Link
            to="/queue"
            className={`flex items-center px-3 py-2.5 rounded-lg transition-all whitespace-nowrap font-medium ${location.pathname === "/queue" ? "bg-blue-700/20 text-white" : "text-white hover:bg-blue-700/10"}`}
          >
            <Tickets className="w-5 h-5 flex-shrink-0" />
            <span className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Tickets
            </span>
          </Link>

          <Link
            to="/customers"
            className={`flex items-center px-3 py-2.5 rounded-lg transition-all whitespace-nowrap font-medium ${location.pathname === "/customers" ? "bg-blue-700/20 text-white" : "text-white hover:bg-blue-700/10"}`}
          >
            <Users className="w-5 h-5 flex-shrink-0" />
            <span className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Customers
            </span>
          </Link>

          {/* 2. ONLY SHOW PERSONNEL TAB IF SUPER ADMIN */}
          {isSuperAdmin && (
            <Link
              to="/personnel"
              className={`flex items-center px-3 py-2.5 rounded-lg transition-all whitespace-nowrap font-medium ${location.pathname === "/personnel" ? "bg-blue-700/20 text-white" : "text-white hover:bg-blue-700/10"}`}
            >
              <ShieldCheck className="w-5 h-5 flex-shrink-0" />
              <span className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Personnel
              </span>
            </Link>
          )}
        </nav>

        {/* Bottom Actions (Logs & Settings) */}
        <div className="p-3 border-t border-blue-700 flex flex-col gap-1.5 bg-blue-600/40">
          {/* ONLY SUPER ADMINS CAN SEE SYSTEM LOGS */}
          {isSuperAdmin && (
            <Link
              to="/logs"
              className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-all whitespace-nowrap font-medium ${location.pathname === "/logs" ? "bg-blue-700/20 text-white" : "text-white hover:bg-blue-700/10"}`}
            >
              <Activity className="w-5 h-5 flex-shrink-0" />
              <span className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                System Logs
              </span>
            </Link>
          )}

          <Link
            to="/settings"
            className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-all whitespace-nowrap font-medium ${location.pathname === "/settings" ? "bg-blue-700/20 text-white" : "text-white hover:bg-blue-700/10"}`}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            <span className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Settings
            </span>
          </Link>
        </div>
      </aside>

      {/* ==========================================
          MAIN CONTENT AREA 
      ========================================== */}
      <div className="flex-1 ml-16 sm:ml-20 flex flex-col min-h-screen transition-all duration-300">
        {/* TOP NAVIGATION BAR (Glassmorphism Effect) */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-3 sm:px-5 lg:px-8 sticky top-0 z-40 shadow-sm">
          <div className="flex-1 flex items-center">
            <span className="text-sm sm:text-base md:text-xl font-black text-gray-900 tracking-tight truncate">
              Central Juan Service Center.
            </span>
          </div>

          {/* Right Actions (Notifications & Profile) */}
          <div className="flex items-center gap-2 sm:gap-4 ml-2 sm:ml-4">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={handleBellClick}
                className="relative p-2 text-gray-400 hover:text-gray-700 transition-colors rounded-full hover:bg-gray-100"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white flex items-center justify-center leading-none">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-[calc(100vw-5.5rem)] max-w-80 bg-white border border-gray-100 shadow-xl shadow-gray-200/50 rounded-xl p-4 z-50 transform opacity-100 scale-100 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold text-gray-900">
                      Notifications
                    </p>
                    <span
                      onClick={markNotificationsAsRead}
                      className="text-xs text-blue-600 font-medium cursor-pointer hover:underline"
                    >
                      Mark all as read
                    </span>
                  </div>
                  <ul className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <li className="text-sm text-gray-500 font-medium px-2 py-4 text-center">
                        No notifications yet.
                      </li>
                    ) : (
                      notifications.map((item) => {
                        const isUnread =
                          !lastReadAt ||
                          new Date(item.createdAt) > new Date(lastReadAt);

                        return (
                          <li
                            key={item.id}
                            onClick={handleNotificationClick}
                            className={`flex items-start gap-3 p-2 rounded-lg transition-colors cursor-pointer ${
                              isUnread
                                ? "bg-blue-50 border border-blue-100 hover:bg-blue-100/70"
                                : "hover:bg-gray-50"
                            }`}
                          >
                            <div
                              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                isUnread
                                  ? "bg-blue-200 text-blue-700"
                                  : "bg-gray-100 text-gray-500"
                              }`}
                            >
                              <ListTodo className="w-4 h-4" />
                            </div>
                            <div className="text-sm flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p
                                  className={`font-medium ${
                                    isUnread ? "text-blue-900" : "text-gray-900"
                                  }`}
                                >
                                  {item.message}
                                </p>
                                {isUnread && (
                                  <span className="mt-1 w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {formatRelativeTime(item.createdAt)}
                              </p>
                            </div>
                          </li>
                        );
                      })
                    )}
                  </ul>
                </div>
              )}
            </div>

            <div className="h-6 w-px bg-gray-200"></div>

            {/* User Profile Area */}
            <div className="relative">
              <div
                onClick={() => setShowProfile((v) => !v)}
                className="flex items-center gap-3 cursor-pointer group"
              >
                {/* 3. DYNAMIC PROFILE AVATAR */}
                <div
                  className={`w-9 h-9 text-white rounded-full flex items-center justify-center font-bold shadow-md transition-transform group-hover:scale-105 ${isSuperAdmin ? "bg-gradient-to-tr from-indigo-600 to-indigo-500 shadow-indigo-500/20" : "bg-gradient-to-tr from-blue-600 to-blue-500 shadow-blue-500/20"}`}
                >
                  {savedUser?.full_name
                    ? savedUser.full_name.charAt(0).toUpperCase()
                    : "U"}
                </div>

                {/* 4. DYNAMIC PROFILE TEXT */}
                <div className="hidden md:flex flex-col">
                  <span className="text-sm font-bold text-gray-900 leading-none mb-1">
                    {savedUser?.full_name || "Unknown User"}
                  </span>
                  <span className="text-xs font-medium text-gray-500 leading-none">
                    {savedUser?.role || "Staff"}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors ml-1 hidden md:block" />
              </div>

              {showProfile && (
                <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-100 rounded-lg shadow-lg p-2 z-50">
                  <button
                    onClick={async () => {
                      await logSystemAction({
                        userName: savedUser?.full_name || "Unknown User",
                        action: "User logout",
                        details: "Signed out from admin dashboard.",
                      });

                      // 5. CLEAR SAVED SESSION ON LOGOUT
                      localStorage.removeItem("central_juan_user");
                      setShowProfile(false);
                      navigate("/login");
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT RENDERS HERE */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1">{children}</main>
      </div>
    </div>
  );
}
