import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Printer,
  Download,
  ChevronDown,
  Loader2,
  Trash2,
  Edit,
  AlertTriangle,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { printJobOrder } from "../utils/printJobOrder"; // Make sure to import this!
import { logSystemAction } from "../utils/auditLog";

export default function LiveQueueContent() {
  const [queueData, setQueueData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [technicians, setTechnicians] = useState<string[]>([]);

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // DELETE Modal States
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // PRINT Modal State
  const [jobToPrint, setJobToPrint] = useState<string | null>(null);

  // EDIT Modal States
  const [jobToEdit, setJobToEdit] = useState<any | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // RBAC: Check user role
  const savedUser = JSON.parse(
    localStorage.getItem("central_juan_user") || "{}",
  );
  const isSuperAdmin = savedUser?.role === "Super Admin";

  useEffect(() => {
    fetchJobOrders();
    if (isSuperAdmin) fetchTechnicians();
  }, []);

  // Fetch Technicians for the Edit Modal dropdown
  const fetchTechnicians = async () => {
    try {
      const { data, error } = await supabase
        .from("personnel")
        .select("full_name")
        .eq("role", "Technician")
        .eq("status", "Active");
      if (error) throw error;
      if (data) setTechnicians(data.map((tech) => tech.full_name));
    } catch (error) {
      console.error("Error fetching technicians:", error);
    }
  };

  const fetchJobOrders = async () => {
    try {
      setIsLoading(true);

      let query = supabase
        .from("job_orders")
        .select(
          `
          job_order_no,
          created_at,
          brand,
          model,
          assigned_tech,
          status,
          priority,
          customers ( full_name )
        `,
        )
        .order("created_at", { ascending: false });

      if (!isSuperAdmin && savedUser?.full_name) {
        query = query.eq("assigned_tech", savedUser.full_name);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (data) {
        const formattedData = data.map((job: any) => ({
          id: job.job_order_no.toString(),
          date: new Date(job.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          customer: job.customers?.full_name || "Unknown Customer",
          device: `${job.brand} ${job.model}`,
          tech: job.assigned_tech || "Unassigned",
          status: job.status,
          priority: job.priority || "Normal",
        }));
        setQueueData(formattedData);
      }
    } catch (error) {
      console.error("Error fetching job orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // ACTION HANDLERS: DELETE & UPDATE
  // ==========================================
  const handleDeleteConfirm = async () => {
    if (!jobToDelete) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("job_orders")
        .delete()
        .eq("job_order_no", parseInt(jobToDelete));

      if (error) throw error;

      await logSystemAction({
        userName: savedUser?.full_name || "Unknown User",
        action: "Deleted job order",
        details: `Deleted job order #${jobToDelete}`,
      });

      setJobToDelete(null);
      fetchJobOrders(); // Refresh table
    } catch (error) {
      console.error("Error deleting job order:", error);
      alert("Failed to delete the job order.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!jobToEdit) return;
    setIsUpdating(true);

    const formData = new FormData(e.currentTarget);

    try {
      const updateData: any = {
        status: formData.get("status"),
        priority: formData.get("priority"),
      };

      // Only Super Admins can reassign tickets from this view
      if (isSuperAdmin) {
        updateData.assigned_tech = formData.get("assigned_tech");
      }

      const { error } = await supabase
        .from("job_orders")
        .update(updateData)
        .eq("job_order_no", parseInt(jobToEdit.id));

      if (error) throw error;

      await logSystemAction({
        userName: savedUser?.full_name || "Unknown User",
        action: "Updated job order",
        details: `Updated job order #${jobToEdit.id}`,
      });

      setJobToEdit(null);
      fetchJobOrders(); // Refresh table
    } catch (error) {
      console.error("Error updating job order:", error);
      alert("Failed to update the job order.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePrintConfirm = () => {
    if (!jobToPrint) return;
    printJobOrder(jobToPrint);
    setJobToPrint(null);
  };

  // Status Badge Styling
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Pending Drop-off":
        return "bg-gray-50 text-gray-600 ring-1 ring-gray-200/60";
      case "Received":
        return "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/60";
      case "Diagnosing":
        return "bg-purple-50 text-purple-700 ring-1 ring-purple-200/60";
      case "Waiting on Parts":
      case "In Progress":
        return "bg-amber-50 text-amber-700 ring-1 ring-amber-200/60";
      case "Ready for Pickup":
      case "Ready":
        return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60";
      default:
        return "bg-gray-50 text-gray-600 ring-1 ring-gray-200/60";
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  // Filter Logic
  const filteredQueue = queueData.filter((job) => {
    const matchesSearch =
      job.id.includes(searchTerm) ||
      job.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.device.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "" || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // ==========================================
  // EXPORT TO CSV LOGIC (NEW)
  // ==========================================
  const handleExportCSV = () => {
    // 1. Define the columns we want in the Excel file
    const headers = [
      "Job Order ID",
      "Date Logged",
      "Customer Name",
      "Device",
      "Assigned Technician",
      "Status",
      "Priority",
    ];

    // 2. Loop through the currently filtered data and format it
    // We wrap values in quotes to prevent commas in names/devices from breaking the layout
    const csvRows = filteredQueue.map((job) => {
      return [
        `"${job.id}"`,
        `"${job.date}"`,
        `"${job.customer}"`,
        `"${job.device}"`,
        `"${job.tech}"`,
        `"${job.status}"`,
        `"${job.priority}"`,
      ].join(",");
    });

    // 3. Combine headers and rows with line breaks
    const csvContent = [headers.join(","), ...csvRows].join("\n");

    // 4. Create a downloadable Blob and trigger the browser download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);

    // Name the file based on today's date
    const dateStr = new Date().toISOString().split("T")[0];
    link.setAttribute("download", `CentralJuan_LiveQueue_${dateStr}.csv`);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      {/* ==========================================
          HEADER & SEARCH BAR
      ========================================== */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            Live Queue
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">
            {isSuperAdmin
              ? "Manage all active and pending job orders"
              : "View your assigned job orders"}
          </p>
        </div>

        {/* WIRED UP THE EXPORT BUTTON HERE */}
        <button
          onClick={handleExportCSV}
          disabled={filteredQueue.length === 0}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm text-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col xl:flex-row gap-4 justify-between items-stretch xl:items-center">
        <div className="relative w-full xl:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-11 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-sm font-medium placeholder:text-gray-400"
            placeholder="Search Job Order, Name, or Device..."
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
          <div className="relative flex-1 sm:w-48">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-gray-400" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none text-sm font-medium appearance-none bg-white cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <option value="">All Statuses</option>
              <option value="Received">Received</option>
              <option value="Diagnosing">Diagnosing</option>
              <option value="In Progress">In Progress</option>
              <option value="Waiting on Parts">Waiting on Parts</option>
              <option value="Ready">Ready</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* ==========================================
          MASTER DATA TABLE
      ========================================== */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px] flex flex-col relative z-0">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-500 font-medium">
              Fetching live queue data...
            </p>
          </div>
        ) : filteredQueue.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Filter className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              No Job Orders Found
            </h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter
                ? "No tickets match your current filters."
                : "There are currently no job orders in the queue."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left border-collapse whitespace-nowrap">
              <thead>
                <tr>
                  <th className="px-4 sm:px-7 py-4 font-bold text-xs uppercase tracking-wider text-gray-700 bg-gray-100 border-b border-gray-200">
                    Job Order
                  </th>
                  <th className="px-4 sm:px-7 py-4 font-bold text-xs uppercase tracking-wider text-gray-700 bg-gray-100 border-b border-gray-200">
                    Customer
                  </th>
                  <th className="px-4 sm:px-7 py-4 font-bold text-xs uppercase tracking-wider text-gray-700 bg-gray-100 border-b border-gray-200">
                    Device
                  </th>
                  <th className="px-4 sm:px-7 py-4 font-bold text-xs uppercase tracking-wider text-gray-700 bg-gray-100 border-b border-gray-200">
                    Technician
                  </th>
                  <th className="px-4 sm:px-7 py-4 font-bold text-xs uppercase tracking-wider text-gray-700 bg-gray-100 border-b border-gray-200">
                    Status
                  </th>
                  <th className="px-4 sm:px-7 py-4 font-bold text-xs uppercase tracking-wider text-gray-700 bg-gray-100 border-b border-gray-200 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredQueue.map((job) => (
                  <tr
                    key={job.id}
                    className="hover:bg-blue-50/30 transition-colors group"
                  >
                    <td className="px-4 sm:px-7 py-4">
                      <p className="font-black text-gray-900">#{job.id}</p>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">
                        {job.date}
                      </p>
                    </td>
                    <td className="px-4 sm:px-7 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold ring-1 ring-gray-200">
                          {getInitials(job.customer)}
                        </div>
                        <span className="text-sm font-bold text-gray-800">
                          {job.customer}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-7 py-4 text-sm text-gray-600 font-medium">
                      {job.device}
                    </td>
                    <td className="px-4 sm:px-7 py-4">
                      <span
                        className={`text-sm ${job.tech === "Unassigned" ? "text-gray-400 italic" : "text-gray-900 font-bold"}`}
                      >
                        {job.tech}
                      </span>
                    </td>
                    <td className="px-4 sm:px-7 py-4">
                      <span
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold ${getStatusStyle(job.status)}`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="px-4 sm:px-7 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* UPDATE BUTTON */}
                        <button
                          onClick={() => setJobToEdit(job)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors tooltip"
                          title="Edit Job Order"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {/* DELETE BUTTON: ONLY VISIBLE TO SUPER ADMINS */}
                        {isSuperAdmin && (
                          <button
                            onClick={() => setJobToDelete(job.id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors tooltip"
                            title="Delete Job Order"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* PRINT BUTTON */}
                        <button
                          onClick={() => setJobToPrint(job.id)}
                          className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors tooltip"
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
        )}
      </div>

      {/* ==========================================
          MODAL 1: DELETE CONFIRMATION
      ========================================== */}
      {jobToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => !isDeleting && setJobToDelete(null)}
          ></div>
          <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="mx-auto w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">
              Delete Job Order?
            </h3>
            <p className="text-sm text-gray-500 font-medium mb-6">
              Are you sure you want to permanently delete Job Order{" "}
              <strong className="text-red-600">#{jobToDelete}</strong>? This
              action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setJobToDelete(null)}
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
                  "Yes, Delete it"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 1.5: PRINT CONFIRMATION
      ========================================== */}
      {jobToPrint && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => setJobToPrint(null)}
          ></div>
          <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="mx-auto w-16 h-16 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center mb-4">
              <Printer className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">
              Print Job Order?
            </h3>
            <p className="text-sm text-gray-500 font-medium mb-6">
              Do you want to print Job Order{" "}
              <strong className="text-gray-900">#{jobToPrint}</strong> now?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setJobToPrint(null)}
                className="flex-1 py-3 px-4 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePrintConfirm}
                className="flex-1 py-3 px-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-colors shadow-md shadow-gray-900/20"
              >
                Yes, Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 2: UPDATE JOB ORDER (EDIT)
      ========================================== */}
      {jobToEdit && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => !isUpdating && setJobToEdit(null)}
          ></div>
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
              <div>
                <h3 className="text-lg font-black text-gray-900">
                  Edit Ticket #{jobToEdit.id}
                </h3>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  {jobToEdit.device} • {jobToEdit.customer}
                </p>
              </div>
              <button
                onClick={() => setJobToEdit(null)}
                disabled={isUpdating}
                className="p-2 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleUpdateSubmit}
              className="p-6 space-y-5 bg-gray-50/30"
            >
              {/* Field 1: Change Status */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  Current Status
                </label>
                <select
                  name="status"
                  defaultValue={jobToEdit.status}
                  required
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium shadow-sm cursor-pointer"
                >
                  <option value="Received">Received</option>
                  <option value="Diagnosing">Diagnosing</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Waiting on Parts">Waiting on Parts</option>
                  <option value="Ready">Ready</option>
                  <option value="Released">Released (Archived)</option>
                </select>
              </div>

              {/* Field 2: Change Priority */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  Ticket Priority
                </label>
                <select
                  name="priority"
                  defaultValue={jobToEdit.priority}
                  required
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium shadow-sm cursor-pointer"
                >
                  <option value="Normal">Normal</option>
                  <option value="High">High Priority</option>
                  <option value="Critical">Critical (Warranty)</option>
                </select>
              </div>

              {/* Field 3: Reassign Technician (SUPER ADMIN ONLY) */}
              {isSuperAdmin && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    Assigned Technician
                  </label>
                  <select
                    name="assigned_tech"
                    defaultValue={jobToEdit.tech}
                    required
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium shadow-sm cursor-pointer"
                  >
                    <option value="Unassigned">Unassigned</option>
                    {technicians.map((tech, idx) => (
                      <option key={idx} value={tech}>
                        {tech}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-4 mt-2 flex gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setJobToEdit(null)}
                  disabled={isUpdating}
                  className="flex-1 py-3 px-4 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 py-3 px-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20 text-sm flex items-center justify-center gap-2"
                >
                  {isUpdating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
