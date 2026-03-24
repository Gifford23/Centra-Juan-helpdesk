import { useState } from "react";
import {
  LayoutDashboard,
  ListTodo,
  Users,
  Settings,
  Search,
  Bell,
  User,
  Wrench,
} from "lucide-react";

// This acts as a wrapper. The 'children' will be the actual page content.
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ==========================================
          LEFT SIDEBAR (Collapse/Expand on Hover)
      ========================================== */}
      <aside
        className="fixed top-0 left-0 h-screen bg-white border-r border-gray-200 z-50 
                      w-20 hover:w-64 transition-all duration-300 ease-in-out group 
                      overflow-hidden flex flex-col shadow-sm"
      >
        {/* Logo Section */}
        <div className="h-16 flex items-center px-6 border-b border-gray-100 whitespace-nowrap">
          <Wrench className="w-8 h-8 text-blue-600 flex-shrink-0" />
          <span className="ml-4 font-bold text-xl text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            Central Juan
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-6 flex flex-col gap-2 px-3">
          <a
            href="#"
            className="flex items-center px-3 py-3 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors whitespace-nowrap"
          >
            <LayoutDashboard className="w-6 h-6 flex-shrink-0" />
            <span className="ml-4 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Dashboard
            </span>
          </a>

          <a
            href="#"
            className="flex items-center px-3 py-3 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors whitespace-nowrap"
          >
            <ListTodo className="w-6 h-6 flex-shrink-0" />
            <span className="ml-4 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Live Queue
            </span>
          </a>

          <a
            href="#"
            className="flex items-center px-3 py-3 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors whitespace-nowrap"
          >
            <Users className="w-6 h-6 flex-shrink-0" />
            <span className="ml-4 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Customers
            </span>
          </a>

          <div className="mt-auto">
            <a
              href="#"
              className="flex items-center px-3 py-3 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors whitespace-nowrap"
            >
              <Settings className="w-6 h-6 flex-shrink-0" />
              <span className="ml-4 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Settings / Print
              </span>
            </a>
          </div>
        </nav>
      </aside>

      {/* ==========================================
          MAIN CONTENT AREA (Pushed right to make room for the collapsed sidebar)
      ========================================== */}
      <div className="flex-1 ml-20 flex flex-col min-h-screen transition-all duration-300">
        {/* TOP NAVIGATION BAR */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-40">
          {/* Global Search */}
          <div className="flex-1 max-w-xl">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                placeholder="Search Job Order No. or Phone Number (e.g., 1415)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Right Actions (Notifications & Profile) */}
          <div className="flex items-center gap-6 ml-4">
            {/* Notification Bell */}
            <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100">
              <Bell className="w-6 h-6" />
              {/* Red Dot Indicator */}
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-3 pl-6 border-l border-gray-200 cursor-pointer">
              <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                J
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-semibold text-gray-700">
                  Admin - Juan
                </p>
                <p className="text-xs text-gray-500">Super Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT RENDERS HERE */}
        <main className="p-8 flex-1">{children}</main>
      </div>
    </div>
  );
}
