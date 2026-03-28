import { useState, useEffect } from "react";
import {
  Clock,
  Wrench,
  MoreHorizontal,
  Plus,
  Filter,
  Loader2,
  CheckCircle2,
  Package,
  AlertCircle,
  UserPlus,
  ChevronLeft,
  ChevronDown,
  User,
  LayoutGrid,
  List,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { logSystemAction } from "../utils/auditLog";

// Define a type for our Job Order data
interface JobCardData {
  id: string;
  customer: string;
  device: string;
  time: string;
  priority: string;
  techInitials: string;
  techFullName: string;
  currentStatus: string;
}

export default function JobOrdersContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [technicians, setTechnicians] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");

  // 1. GET LOGGED IN USER FOR RBAC
  const savedUser = JSON.parse(
    localStorage.getItem("central_juan_user") || "{}",
  );
  const isSuperAdmin = savedUser?.role === "Super Admin";

  // State to toggle between Kanban Board and Table List
  const [viewMode, setViewMode] = useState<"board" | "list">(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      return "list";
    }
    return "board";
  });

  // Store the raw list for the Table view
  const [allJobs, setAllJobs] = useState<JobCardData[]>([]);

  // State for the four columns on the Board view
  const [boardData, setBoardData] = useState<{
    received: JobCardData[];
    diagnosing: JobCardData[];
    inProgress: JobCardData[];
    ready: JobCardData[];
  }>({
    received: [],
    diagnosing: [],
    inProgress: [],
    ready: [],
  });

  useEffect(() => {
    fetchBoardData();
    // Only bother fetching the technician list if the user is an Admin
    if (isSuperAdmin) {
      fetchTechnicians();
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setViewMode("list");
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchTechnicians = async () => {
    try {
      const { data, error } = await supabase
        .from("personnel")
        .select("full_name")
        .eq("role", "Technician")
        .eq("status", "Active");

      if (error) throw error;
      if (data) {
        setTechnicians(data.map((tech) => tech.full_name));
      }
    } catch (error) {
      console.error("Error fetching technicians:", error);
    }
  };

  const fetchBoardData = async () => {
    try {
      setIsLoading(true);

      // 2. BUILD THE SECURE QUERY
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

      // 3. APPLY RBAC FILTER: If not Super Admin, only fetch their assigned jobs
      if (!isSuperAdmin && savedUser?.full_name) {
        query = query.eq("assigned_tech", savedUser.full_name);
      }

      const { data, error } = await query;

      if (error) throw error;

      const sortedData = {
        received: [] as JobCardData[],
        diagnosing: [] as JobCardData[],
        inProgress: [] as JobCardData[],
        ready: [] as JobCardData[],
      };
      const rawList: JobCardData[] = [];

      if (data) {
        data.forEach((job: any) => {
          const dateObj = new Date(job.created_at);
          const timeString = dateObj.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });

          const isAssigned =
            job.assigned_tech && job.assigned_tech !== "Unassigned";
          const techInitials = isAssigned
            ? job.assigned_tech.charAt(0).toUpperCase()
            : "";

          const card: JobCardData = {
            id: job.job_order_no.toString(),
            customer: job.customers?.full_name || "Unknown",
            device: `${job.brand} ${job.model}`,
            time: timeString,
            priority: job.priority || "Normal",
            techInitials: techInitials,
            techFullName: job.assigned_tech || "Unassigned",
            currentStatus: job.status,
          };

          rawList.push(card);

          const status = job.status;
          if (status === "Received" || status === "Pending Drop-off")
            sortedData.received.push(card);
          else if (status === "Diagnosing") sortedData.diagnosing.push(card);
          else if (status === "In Progress" || status === "Waiting on Parts")
            sortedData.inProgress.push(card);
          else if (status === "Ready" || status === "Ready for Pickup")
            sortedData.ready.push(card);
          else sortedData.received.push(card);
        });
      }

      setAllJobs(rawList);
      setBoardData(sortedData);
    } catch (error) {
      console.error("Error fetching Kanban data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const statusOptions = [
    "All",
    "Pending Drop-off",
    "Received",
    "Diagnosing",
    "Waiting on Parts",
    "In Progress",
    "Ready for Pickup",
    "Ready",
  ];

  const filteredJobs =
    statusFilter === "All"
      ? allJobs
      : allJobs.filter((job) => job.currentStatus === statusFilter);

  const filteredBoardData = {
    received:
      statusFilter === "All"
        ? boardData.received
        : boardData.received.filter(
            (job) => job.currentStatus === statusFilter,
          ),
    diagnosing:
      statusFilter === "All"
        ? boardData.diagnosing
        : boardData.diagnosing.filter(
            (job) => job.currentStatus === statusFilter,
          ),
    inProgress:
      statusFilter === "All"
        ? boardData.inProgress
        : boardData.inProgress.filter(
            (job) => job.currentStatus === statusFilter,
          ),
    ready:
      statusFilter === "All"
        ? boardData.ready
        : boardData.ready.filter((job) => job.currentStatus === statusFilter),
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col animate-in fade-in duration-500">
      {/* Page Header & View Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 flex-shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            Job Orders
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">
            {isSuperAdmin
              ? "Manage your device repair pipeline"
              : "Manage your assigned repair tasks"}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          {/* View Toggle Buttons */}
          <div className="flex bg-gray-200/50 p-1 rounded-xl border border-gray-200 flex-1 sm:flex-none">
            <button
              onClick={() => setViewMode("board")}
              className={`hidden sm:flex flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold items-center justify-center gap-2 transition-all ${viewMode === "board" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              <LayoutGrid className="w-4 h-4" /> Board
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${viewMode === "list" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              <List className="w-4 h-4" /> List
            </button>
          </div>

          <div className="relative w-full sm:w-auto">
            <button
              onClick={() => setIsFilterOpen((prev) => !prev)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl font-bold transition-all shadow-sm text-sm active:scale-95"
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">{statusFilter}</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${isFilterOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isFilterOpen && (
              <>
                <button
                  className="fixed inset-0 z-10"
                  onClick={() => setIsFilterOpen(false)}
                  aria-label="Close filter menu"
                />
                <div className="absolute right-0 mt-2 w-full sm:w-52 bg-white border border-gray-100 rounded-xl shadow-xl z-20 py-1">
                  {statusOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setStatusFilter(option);
                        setIsFilterOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors ${statusFilter === option ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Loading job orders...</p>
        </div>
      ) : (
        <>
          {/* ==========================================
              VIEW 1: KANBAN BOARD
          ========================================== */}
          {viewMode === "board" && (
            <div className="hidden md:block flex-1 overflow-x-auto pb-2 sm:pb-4 -mx-1 sm:mx-0">
              <div className="flex gap-4 sm:gap-6 h-full min-w-[1000px] px-1 sm:px-0">
                {/* COLUMN 1: RECEIVED */}
                <div className="flex-1 flex flex-col bg-gray-50/50 rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-4 px-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50"></div>
                      <h3 className="font-bold text-gray-900">Received</h3>
                      <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">
                        {filteredBoardData.received.length}
                      </span>
                    </div>
                    <button className="text-gray-400 hover:text-gray-900 transition-colors">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-20">
                    {filteredBoardData.received.map((job) => (
                      <KanbanCard
                        key={job.id}
                        job={job}
                        technicians={technicians}
                        onUpdate={fetchBoardData}
                        isSuperAdmin={isSuperAdmin}
                        actorName={savedUser?.full_name || "Unknown User"}
                      />
                    ))}
                    {/* ONLY SUPER ADMINS CAN ADD QUICK ORDERS HERE */}
                    {isSuperAdmin && (
                      <button className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 font-bold text-sm hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2 bg-gray-50/50 hover:bg-blue-50/30">
                        <Plus className="w-4 h-4" /> Add Job Order
                      </button>
                    )}
                  </div>
                </div>

                {/* COLUMN 2: DIAGNOSING */}
                <div className="flex-1 flex flex-col bg-gray-50/50 rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-4 px-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-sm shadow-purple-500/50"></div>
                      <h3 className="font-bold text-gray-900">Diagnosing</h3>
                      <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">
                        {filteredBoardData.diagnosing.length}
                      </span>
                    </div>
                    <button className="text-gray-400 hover:text-gray-900 transition-colors">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-20">
                    {filteredBoardData.diagnosing.map((job) => (
                      <KanbanCard
                        key={job.id}
                        job={job}
                        technicians={technicians}
                        onUpdate={fetchBoardData}
                        isSuperAdmin={isSuperAdmin}
                        actorName={savedUser?.full_name || "Unknown User"}
                      />
                    ))}
                  </div>
                </div>

                {/* COLUMN 3: IN PROGRESS */}
                <div className="flex-1 flex flex-col bg-gray-50/50 rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-4 px-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50"></div>
                      <h3 className="font-bold text-gray-900">In Repair</h3>
                      <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">
                        {filteredBoardData.inProgress.length}
                      </span>
                    </div>
                    <button className="text-gray-400 hover:text-gray-900 transition-colors">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-20">
                    {filteredBoardData.inProgress.map((job) => (
                      <KanbanCard
                        key={job.id}
                        job={job}
                        technicians={technicians}
                        onUpdate={fetchBoardData}
                        isSuperAdmin={isSuperAdmin}
                        actorName={savedUser?.full_name || "Unknown User"}
                      />
                    ))}
                  </div>
                </div>

                {/* COLUMN 4: READY */}
                <div className="flex-1 flex flex-col bg-gray-50/50 rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-4 px-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></div>
                      <h3 className="font-bold text-gray-900">Ready</h3>
                      <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">
                        {filteredBoardData.ready.length}
                      </span>
                    </div>
                    <button className="text-gray-400 hover:text-gray-900 transition-colors">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-20">
                    {filteredBoardData.ready.map((job) => (
                      <KanbanCard
                        key={job.id}
                        job={job}
                        technicians={technicians}
                        onUpdate={fetchBoardData}
                        isSuperAdmin={isSuperAdmin}
                        actorName={savedUser?.full_name || "Unknown User"}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==========================================
              VIEW 2: TABLE LIST 
          ========================================== */}
          {viewMode === "list" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex-1 flex flex-col mb-4">
              <div className="md:hidden p-3 space-y-3">
                {filteredJobs.map((job) => (
                  <div
                    key={job.id}
                    className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-gray-900">#{job.id}</p>
                        <p className="text-xs text-gray-500 mt-0.5 font-medium">
                          {job.time}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded border uppercase tracking-wider ${job.priority === "High" ? "bg-red-50 text-red-600 border-red-200" : "bg-gray-50 text-gray-500 border-gray-200"}`}
                      >
                        {job.priority}
                      </span>
                    </div>

                    <div className="mt-3 space-y-2">
                      <p className="font-bold text-sm text-gray-900 truncate">
                        {job.device}
                      </p>
                      <p className="text-xs font-medium text-gray-500 truncate">
                        {job.customer}
                      </p>
                      <div>
                        <span
                          className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold border ${job.currentStatus === "Pending Drop-off" || job.currentStatus === "Received" ? "bg-blue-50 text-blue-700 border-blue-200/60" : job.currentStatus === "Diagnosing" ? "bg-purple-50 text-purple-700 border-purple-200/60" : job.currentStatus === "Waiting on Parts" || job.currentStatus === "In Progress" ? "bg-amber-50 text-amber-700 border-amber-200/60" : job.currentStatus === "Ready for Pickup" || job.currentStatus === "Ready" ? "bg-emerald-50 text-emerald-700 border-emerald-200/60" : "bg-gray-50 text-gray-600 border-gray-200/60"}`}
                        >
                          {job.currentStatus}
                        </span>
                      </div>
                      <div className="pt-1">
                        {job.techInitials ? (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-blue-400 text-white flex items-center justify-center text-xs font-bold shadow-sm ring-2 ring-white">
                              {job.techInitials}
                            </div>
                            <span className="text-sm font-bold text-gray-900 truncate">
                              {job.techFullName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm font-bold text-red-500 bg-red-50 px-3 py-1 rounded-lg border border-red-100">
                            Unassigned
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <ActionMenu
                        job={job}
                        technicians={technicians}
                        onUpdate={fetchBoardData}
                        isSuperAdmin={isSuperAdmin}
                        actorName={savedUser?.full_name || "Unknown User"}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block overflow-x-auto flex-1">
                <table className="w-full min-w-[880px] text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="text-xs uppercase tracking-wider border-b border-gray-200">
                      <th className="px-4 sm:px-7 py-4 font-bold text-gray-700 bg-gray-100 border-b border-gray-200">
                        Job Order
                      </th>
                      <th className="px-4 sm:px-7 py-4 font-bold text-gray-700 bg-gray-100 border-b border-gray-200">
                        Priority
                      </th>
                      <th className="px-4 sm:px-7 py-4 font-bold text-gray-700 bg-gray-100 border-b border-gray-200">
                        Device & Customer
                      </th>
                      <th className="px-4 sm:px-7 py-4 font-bold text-gray-700 bg-gray-100 border-b border-gray-200">
                        Status
                      </th>
                      <th className="px-4 sm:px-7 py-4 font-bold text-gray-700 bg-gray-100 border-b border-gray-200">
                        Assigned Tech
                      </th>
                      <th className="px-4 sm:px-7 py-4 font-bold text-gray-700 bg-gray-100 border-b border-gray-200">
                        Date Logged
                      </th>
                      <th className="px-4 sm:px-7 py-4 font-bold text-gray-700 bg-gray-100 border-b border-gray-200 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredJobs.map((job) => (
                      <JobTableRow
                        key={job.id}
                        job={job}
                        technicians={technicians}
                        onUpdate={fetchBoardData}
                        isSuperAdmin={isSuperAdmin}
                        actorName={savedUser?.full_name || "Unknown User"}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ==============================================================
// SUB-COMPONENT: Kanban Card (For Board View)
// ==============================================================
function KanbanCard({
  job,
  technicians,
  onUpdate,
  isSuperAdmin,
  actorName,
}: {
  job: JobCardData;
  technicians: string[];
  onUpdate: () => void;
  isSuperAdmin: boolean;
  actorName: string;
}) {
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-300 transition-all group relative">
      {job.priority === "High" && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-l-xl"></div>
      )}

      <div className="flex justify-between items-start mb-3">
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${job.priority === "High" ? "bg-red-50 text-red-600 border-red-200" : "bg-gray-50 text-gray-500 border-gray-200"}`}
        >
          {job.priority}
        </span>
        <ActionMenu
          job={job}
          technicians={technicians}
          onUpdate={onUpdate}
          isSuperAdmin={isSuperAdmin}
          actorName={actorName}
        />
      </div>

      <h4 className="font-bold text-gray-900 mb-1 text-sm leading-tight">
        {job.device}
      </h4>
      <p className="text-xs text-gray-500 font-medium mb-4">
        {job.customer} • #{job.id}
      </p>

      <div className="flex justify-between items-center pt-3 border-t border-gray-50">
        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
          <Clock className="w-3.5 h-3.5" /> {job.time}
        </div>
        {job.techInitials && (
          <div
            className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-blue-400 text-white flex items-center justify-center text-[10px] font-bold shadow-sm ring-2 ring-white"
            title={`Assigned to: ${job.techFullName}`}
          >
            {job.techInitials}
          </div>
        )}
      </div>
    </div>
  );
}

// ==============================================================
// SUB-COMPONENT: Table Row (For List View)
// ==============================================================
function JobTableRow({
  job,
  technicians,
  onUpdate,
  isSuperAdmin,
  actorName,
}: {
  job: JobCardData;
  technicians: string[];
  onUpdate: () => void;
  isSuperAdmin: boolean;
  actorName: string;
}) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending Drop-off":
      case "Received":
        return "bg-blue-50 text-blue-700 border-blue-200/60";
      case "Diagnosing":
        return "bg-purple-50 text-purple-700 border-purple-200/60";
      case "Waiting on Parts":
      case "In Progress":
        return "bg-amber-50 text-amber-700 border-amber-200/60";
      case "Ready for Pickup":
      case "Ready":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/60";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200/60";
    }
  };

  return (
    <tr className="hover:bg-blue-50/30 transition-colors group relative">
      <td className="px-4 sm:px-7 py-5 font-black text-gray-900">#{job.id}</td>
      <td className="px-4 sm:px-7 py-5">
        <span
          className={`text-[10px] font-bold px-2.5 py-1 rounded border uppercase tracking-wider ${job.priority === "High" ? "bg-red-50 text-red-600 border-red-200" : "bg-gray-50 text-gray-500 border-gray-200"}`}
        >
          {job.priority}
        </span>
      </td>
      <td className="px-4 sm:px-7 py-5">
        <p className="font-bold text-sm text-gray-900">{job.device}</p>
        <p className="text-xs font-medium text-gray-500 mt-0.5">
          {job.customer}
        </p>
      </td>
      <td className="px-4 sm:px-7 py-5">
        <span
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold border ${getStatusBadge(job.currentStatus)}`}
        >
          {job.currentStatus}
        </span>
      </td>
      <td className="px-4 sm:px-7 py-5">
        <div className="flex items-center gap-2">
          {job.techInitials ? (
            <>
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-blue-400 text-white flex items-center justify-center text-xs font-bold shadow-sm ring-2 ring-white">
                {job.techInitials}
              </div>
              <span className="text-sm font-bold text-gray-900">
                {job.techFullName}
              </span>
            </>
          ) : (
            <span className="text-sm font-bold text-red-500 bg-red-50 px-3 py-1 rounded-lg border border-red-100">
              Unassigned
            </span>
          )}
        </div>
      </td>
      <td className="px-4 sm:px-7 py-5 text-sm font-medium text-gray-500">
        {job.time}
      </td>
      <td className="px-4 sm:px-7 py-5 text-right">
        <ActionMenu
          job={job}
          technicians={technicians}
          onUpdate={onUpdate}
          isSuperAdmin={isSuperAdmin}
          actorName={actorName}
        />
      </td>
    </tr>
  );
}

// ==============================================================
// SUB-COMPONENT: Reusable Action Menu (Dropdown)
// ==============================================================
function ActionMenu({
  job,
  technicians,
  onUpdate,
  isSuperAdmin,
  actorName,
}: {
  job: JobCardData;
  technicians: string[];
  onUpdate: () => void;
  isSuperAdmin: boolean;
  actorName: string;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuView, setMenuView] = useState<"main" | "assign">("main");
  const [isUpdating, setIsUpdating] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    setMenuView("main");
  };

  const updateField = async (
    field: "status" | "assigned_tech",
    value: string,
  ) => {
    if (field === "status" && value === job.currentStatus)
      return setIsMenuOpen(false);
    if (field === "assigned_tech" && value === job.techFullName)
      return setIsMenuOpen(false);

    setIsUpdating(true);
    setIsMenuOpen(false);

    try {
      const { error } = await supabase
        .from("job_orders")
        .update({ [field]: value })
        .eq("job_order_no", parseInt(job.id));
      if (error) throw error;

      await logSystemAction({
        userName: actorName,
        action: "Updated job order",
        details: `Updated ${field} for job order #${job.id} to ${value}`,
      });

      onUpdate();
    } catch (err) {
      console.error(`Error updating ${field}:`, err);
      alert("Failed to update. Please try again.");
      setIsUpdating(false);
    }
  };

  return (
    <div className="relative inline-block text-left">
      {isUpdating && (
        <div className="absolute -inset-4 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-xl">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
        </div>
      )}
      <button
        onClick={toggleMenu}
        className={`p-1.5 rounded-lg transition-colors ${isMenuOpen ? "bg-blue-50 text-blue-600" : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"}`}
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>

      {isMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => setIsMenuOpen(false)}
          ></div>
          <div className="absolute right-0 top-8 mt-1 w-52 bg-white border border-gray-100 rounded-xl shadow-xl shadow-gray-200/50 z-30 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {menuView === "main" && (
              <>
                <p className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 mb-1">
                  Move to...
                </p>
                <button
                  onClick={() => updateField("status", "Received")}
                  className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2"
                >
                  <Package className="w-4 h-4 text-gray-400" /> Received
                </button>
                <button
                  onClick={() => updateField("status", "Diagnosing")}
                  className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-purple-400" /> Diagnosing
                </button>
                <button
                  onClick={() => updateField("status", "In Progress")}
                  className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-amber-50 hover:text-amber-700 flex items-center gap-2"
                >
                  <Wrench className="w-4 h-4 text-amber-400" /> In Repair
                </button>
                <button
                  onClick={() => updateField("status", "Ready")}
                  className={`w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2 mb-1 ${isSuperAdmin ? "border-b border-gray-50 pb-3" : "pb-2"}`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Ready
                </button>

                {/* ONLY SHOW ASSIGN BUTTON TO SUPER ADMINS */}
                {isSuperAdmin && (
                  <button
                    onClick={() => setMenuView("assign")}
                    className="w-full text-left px-4 py-2 text-sm font-bold text-indigo-600 hover:bg-indigo-50 flex items-center justify-between mt-1"
                  >
                    <span className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4" /> Assign Tech
                    </span>
                  </button>
                )}
              </>
            )}

            {/* ASSIGN TECH VIEW (Only reachable if Super Admin) */}
            {menuView === "assign" && isSuperAdmin && (
              <>
                <div className="px-3 py-2 border-b border-gray-50 flex items-center gap-2">
                  <button
                    onClick={() => setMenuView("main")}
                    className="p-1 hover:bg-gray-100 rounded text-gray-500"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Select Tech
                  </p>
                </div>
                <div className="max-h-48 overflow-y-auto py-1">
                  {technicians.length === 0 ? (
                    <p className="px-4 py-3 text-xs text-gray-500 italic">
                      No active technicians found.
                    </p>
                  ) : (
                    <>
                      <button
                        onClick={() =>
                          updateField("assigned_tech", "Unassigned")
                        }
                        className="w-full text-left px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 flex items-center gap-2"
                      >
                        Unassign Tech
                      </button>
                      {technicians.map((tech, index) => (
                        <button
                          key={index}
                          onClick={() => updateField("assigned_tech", tech)}
                          className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2"
                        >
                          <User className="w-4 h-4 text-gray-400" /> {tech}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
