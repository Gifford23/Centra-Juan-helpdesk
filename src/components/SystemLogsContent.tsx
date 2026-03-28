import { useState, useEffect } from "react";
import {
  Activity,
  Search,
  Loader2,
  Calendar,
  CalendarDays,
  FileText,
  User,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { logSystemAction } from "../utils/auditLog";

export default function SystemLogsContent() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [logToDelete, setLogToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // RBAC: Only Super Admins should be here, but just in case:
  const savedUser = JSON.parse(
    localStorage.getItem("central_juan_user") || "{}",
  );
  const isSuperAdmin = savedUser?.role === "Super Admin";

  useEffect(() => {
    if (isSuperAdmin) {
      fetchLogs();
    }
  }, []);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      // Fetch the latest 100 logs
      const { data, error } = await supabase
        .from("system_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      if (data) setLogs(data);
    } catch (error) {
      console.error("Error fetching system logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add a quick test log manually from the UI
  const handleTestLog = async () => {
    try {
      await supabase.from("system_logs").insert([
        {
          user_name: savedUser.full_name || "Unknown User",
          action: "Tested the Logging System",
          details:
            "Clicked the generate test log button on the System Logs page.",
        },
      ]);
      fetchLogs();
    } catch (error) {
      console.error("Error creating log:", error);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.details &&
        log.details.toLowerCase().includes(searchQuery.toLowerCase()));

    const logDate = new Date(log.created_at);
    const matchesStart = startDate
      ? logDate >= new Date(`${startDate}T00:00:00`)
      : true;
    const matchesEnd = endDate
      ? logDate <= new Date(`${endDate}T23:59:59.999`)
      : true;

    return matchesSearch && matchesStart && matchesEnd;
  });

  const handleDeleteConfirm = async () => {
    if (!logToDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("system_logs")
        .delete()
        .eq("id", logToDelete);

      if (error) throw error;

      await logSystemAction({
        userName: savedUser?.full_name || "Unknown User",
        action: "Deleted system log entry",
        details: `Deleted system log ID ${logToDelete}`,
      });

      setLogToDelete(null);
      fetchLogs();
    } catch (error) {
      console.error("Error deleting log:", error);
      alert("Failed to delete the log entry.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-gray-500 font-bold text-lg">
          You do not have permission to view this page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            System Logs
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">
            Audit trail of recent system activities
          </p>
        </div>
        <button
          onClick={handleTestLog}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl font-bold transition-all shadow-sm text-sm active:scale-95"
        >
          <Activity className="w-4 h-4" /> Generate Test Log
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-4">
          <div className="relative w-full lg:max-w-2xl">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-sm font-medium placeholder:text-gray-400"
              placeholder="Search logs by user, action, or details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="w-full lg:w-auto flex justify-end">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <CalendarDays className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full sm:w-[180px] pl-10 pr-3 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-sm font-medium text-gray-700"
                  aria-label="Start date"
                  title="Start date"
                />
              </div>

              <div className="relative">
                <CalendarDays className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full sm:w-[180px] pl-10 pr-3 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-sm font-medium text-gray-700"
                  aria-label="End date"
                  title="End date"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-500 font-medium">Loading system logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              No Logs Found
            </h3>
            <p className="text-gray-500">
              There are no system activities matching your search.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-auto max-h-[560px]">
            <table className="w-full min-w-[900px] text-left border-collapse whitespace-nowrap">
              <thead>
                <tr>
                  <th className="px-4 sm:px-7 py-4 font-bold text-xs uppercase tracking-wider text-gray-400 bg-gray-50/50 border-b border-gray-100">
                    Date & Time
                  </th>
                  <th className="px-4 sm:px-7 py-4 font-bold text-xs uppercase tracking-wider text-gray-400 bg-gray-50/50 border-b border-gray-100">
                    User
                  </th>
                  <th className="px-4 sm:px-7 py-4 font-bold text-xs uppercase tracking-wider text-gray-400 bg-gray-50/50 border-b border-gray-100">
                    Action
                  </th>
                  <th className="px-4 sm:px-7 py-4 font-bold text-xs uppercase tracking-wider text-gray-400 bg-gray-50/50 border-b border-gray-100 w-full">
                    Details
                  </th>
                  <th className="px-4 sm:px-7 py-4 font-bold text-xs uppercase tracking-wider text-gray-400 bg-gray-50/50 border-b border-gray-100 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-blue-50/30 transition-colors group"
                  >
                    <td className="px-4 sm:px-7 py-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(log.created_at).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                    <td className="px-4 sm:px-7 py-4">
                      <div className="flex items-center gap-2 text-sm font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg w-fit">
                        <User className="w-4 h-4" />
                        {log.user_name}
                      </div>
                    </td>
                    <td className="px-4 sm:px-7 py-4">
                      <span className="text-sm font-bold text-gray-900">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 sm:px-7 py-4 text-sm text-gray-500 font-medium truncate max-w-md">
                      {log.details || "-"}
                    </td>
                    <td className="px-4 sm:px-7 py-4 text-right">
                      <button
                        onClick={() => setLogToDelete(log.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Log"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {logToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => !isDeleting && setLogToDelete(null)}
          ></div>
          <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="mx-auto w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">
              Delete Log Entry?
            </h3>
            <p className="text-sm text-gray-500 font-medium mb-6">
              Are you sure you want to permanently delete this log? This action
              cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setLogToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-md shadow-red-600/20 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Yes, Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
