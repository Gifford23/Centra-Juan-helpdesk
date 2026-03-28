import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard,
  ListTodo,
  Users,
  Settings,
  Search,
  Bell,
  ShieldCheck,
  LogOut,
  ChevronDown,
  Tickets,
  ClipboardList,
} from "lucide-react";
import technician from "../assets/technician.png";

// This acts as a wrapper. The 'children' will be the actual page content.
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const navigate = useNavigate();
  const location = useLocation(); // Used to highlight the active tab

  // 1. GET THE LOGGED IN USER FROM LOCAL STORAGE
  const savedUser = JSON.parse(
    localStorage.getItem("central_juan_user") || "{}",
  );
  const isSuperAdmin = savedUser?.role === "Super Admin";

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans">
      {/* ==========================================
          LEFT SIDEBAR (Collapse/Expand on Hover)
      ========================================== */}
      <aside
        className="fixed top-0 left-0 h-screen bg-blue-600 border-r border-blue-700 text-white z-50 
                      w-20 hover:w-64 transition-all duration-300 ease-in-out group 
                      overflow-hidden flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)]"
      >
        {/* Logo Section */}
        <div className="h-16 flex items-center px-6 border-b border-blue-700 whitespace-nowrap">
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

        {/* Bottom Actions (Settings & Sign Out) */}
        <div className="p-3 border-t border-blue-700 flex flex-col gap-1.5 bg-blue-600/40">
          <button className="w-full flex items-center px-3 py-2.5 text-white hover:bg-blue-700/10 hover:text-white rounded-lg transition-all whitespace-nowrap font-medium">
            <Settings className="w-5 h-5 flex-shrink-0" />
            <span className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Settings
            </span>
          </button>
        </div>
      </aside>

      {/* ==========================================
          MAIN CONTENT AREA 
      ========================================== */}
      <div className="flex-1 ml-20 flex flex-col min-h-screen transition-all duration-300">
        {/* TOP NAVIGATION BAR (Glassmorphism Effect) */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-40 shadow-sm">
          {/* Global Search */}
          <div className="flex-1 max-w-xl">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 bg-gray-100/70 border-transparent rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm font-medium placeholder:text-gray-400"
                placeholder="Search Job Order No. or Phone Number (e.g., 1415)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Right Actions (Notifications & Profile) */}
          <div className="flex items-center gap-5 ml-4">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications((v) => !v)}
                className="relative p-2 text-gray-400 hover:text-gray-700 transition-colors rounded-full hover:bg-gray-100"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-100 shadow-xl shadow-gray-200/50 rounded-xl p-4 z-50 transform opacity-100 scale-100 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold text-gray-900">
                      Notifications
                    </p>
                    <span className="text-xs text-blue-600 font-medium cursor-pointer hover:underline">
                      Mark all as read
                    </span>
                  </div>
                  <ul className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    <li className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                        <ListTodo className="w-4 h-4" />
                      </div>
                      <div className="text-sm">
                        <p className="text-gray-900 font-medium">
                          New job order #1419
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          2 hours ago
                        </p>
                      </div>
                    </li>
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
                    onClick={() => {
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
        <main className="p-8 flex-1">{children}</main>
      </div>
    </div>
  );
}
