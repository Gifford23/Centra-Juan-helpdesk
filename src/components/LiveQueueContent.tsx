import { useState } from "react";
import { Search, Filter, Eye, Printer, Download } from "lucide-react";

export default function LiveQueueContent() {
  // We will hook this up to Supabase later, but here is mock data for the UI
  const [queueData] = useState([
    {
      id: "1418",
      date: "Mar 24, 2026",
      customer: "Maria Santos",
      device: "HP Pavilion",
      tech: "Unassigned",
      status: "Received",
    },
    {
      id: "1417",
      date: "Mar 24, 2026",
      customer: "Carlos Rivera",
      device: "Dell Inspiron",
      tech: "Unassigned",
      status: "Pending Drop-off",
    },
    {
      id: "1416",
      date: "Mar 23, 2026",
      customer: "Juan Dela Cruz",
      device: "Acer Aspire 5",
      tech: "Mark",
      status: "Waiting for Parts",
    },
    {
      id: "1412",
      date: "Mar 22, 2026",
      customer: "Elena Gomez",
      device: "Lenovo ThinkPad",
      tech: "Sarah",
      status: "In Progress",
    },
    {
      id: "1410",
      date: "Mar 20, 2026",
      customer: "Miguel Reyes",
      device: "MacBook Pro M1",
      tech: "Mark",
      status: "Diagnosing",
    },
    {
      id: "1405",
      date: "Mar 18, 2026",
      customer: "Sofia Lim",
      device: "Asus ROG",
      tech: "Sarah",
      status: "Ready for Pickup",
    },
  ]);

  // Helper function to color-code the status badges
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Pending Drop-off":
        return "bg-gray-100 text-gray-600 border-gray-200";
      case "Received":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Diagnosing":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Waiting for Parts":
        return "bg-red-50 text-red-700 border-red-200";
      case "In Progress":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Ready for Pickup":
        return "bg-green-50 text-green-700 border-green-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Queue</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage all active and pending job orders
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm text-sm">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* ==========================================
          FILTER & SEARCH BAR
      ========================================== */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-sm"
            placeholder="Search by Job Order, Name, or Device..."
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-48">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-gray-400" />
            </div>
            <select className="block w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-sm appearance-none bg-white">
              <option value="">All Statuses</option>
              <option value="Received">Received</option>
              <option value="Diagnosing">Diagnosing</option>
              <option value="Ready">Ready for Pickup</option>
            </select>
          </div>
          <div className="relative flex-1 md:w-48">
            <select className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-sm appearance-none bg-white">
              <option value="">All Technicians</option>
              <option value="Unassigned">Unassigned</option>
              <option value="Mark">Mark</option>
              <option value="Sarah">Sarah</option>
            </select>
          </div>
        </div>
      </div>

      {/* ==========================================
          MASTER DATA TABLE
      ========================================== */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                <th className="px-6 py-4 font-semibold">Job Order</th>
                <th className="px-6 py-4 font-semibold">Date Received</th>
                <th className="px-6 py-4 font-semibold">Customer</th>
                <th className="px-6 py-4 font-semibold">Device</th>
                <th className="px-6 py-4 font-semibold">Technician</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {queueData.map((job) => (
                <tr
                  key={job.id}
                  className="hover:bg-blue-50/50 transition-colors group"
                >
                  <td className="px-6 py-4 font-bold text-gray-900">
                    #{job.id}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {job.date}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">
                    {job.customer}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {job.device}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-sm ${job.tech === "Unassigned" ? "text-gray-400 italic" : "text-gray-700 font-medium"}`}
                    >
                      {job.tech}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1.5 rounded-md text-xs font-bold border ${getStatusStyle(job.status)}`}
                    >
                      {job.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 transition-colors">
                      <button
                        className="p-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors tooltip"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 text-gray-700 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors tooltip"
                        title="Print Job Order"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center text-sm text-gray-500">
          <span>Showing 1 to 6 of 24 entries</span>
          <div className="flex gap-1">
            <button
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
              disabled
            >
              Prev
            </button>
            <button className="px-3 py-1 bg-blue-600 text-white rounded font-medium">
              1
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100">
              2
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100">
              3
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
