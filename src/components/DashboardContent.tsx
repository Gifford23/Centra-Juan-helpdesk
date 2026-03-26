import { useState, useEffect } from "react";
import CreateJobModal from "./CreateJobModal";
import { MoreVertical, Plus, Loader2 } from "lucide-react";
import checkIcon from "../assets/icons/check.png";
import warningIcon from "../assets/icons/warning.png";
import tools from "../assets/icons/tools.png";
import pending from "../assets/icons/pending.gif";
import { supabase } from "../lib/supabase";

export default function DashboardContent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Read the logged-in user to determine access level
  const savedUser = JSON.parse(
    localStorage.getItem("central_juan_user") || "{}",
  );
  const isSuperAdmin = savedUser?.role === "Super Admin";

  // Set up State for our Live Data
  const [activeWorkload, setActiveWorkload] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    pending: 0,
    active: 0,
    ready: 0,
  });

  // Fetch Data when the component loads
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      // BUILD THE QUERY
      let query = supabase
        .from("job_orders")
        .select(
          `
          job_order_no,
          created_at,
          brand,
          model,
          assigned_tech,
          status
        `,
        )
        .order("created_at", { ascending: false });

      // APPLY RBAC FILTER: If not Super Admin, only fetch their assigned jobs
      if (!isSuperAdmin && savedUser?.full_name) {
        query = query.eq("assigned_tech", savedUser.full_name);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        let pendingCount = 0;
        let activeCount = 0;
        let readyCount = 0;

        // Map the data for the table AND count the metrics
        const formattedData = data.map((job) => {
          // Count metrics based on status
          if (job.status === "Received" || job.status === "Pending Drop-off") {
            pendingCount++;
          } else if (
            job.status === "Ready" ||
            job.status === "Ready for Pickup"
          ) {
            readyCount++;
          } else {
            // Diagnosing, In Progress, Waiting on Parts
            activeCount++;
          }

          // Calculate a simple relative time string (e.g., "Mar 25")
          const dateObj = new Date(job.created_at);
          const timeString = dateObj.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });

          return {
            id: job.job_order_no.toString(),
            tech: job.assigned_tech || "Unassigned",
            device: `${job.brand} ${job.model}`,
            status: job.status,
            time: timeString,
          };
        });

        // Update our state with the live data
        setMetrics({
          pending: pendingCount,
          active: activeCount,
          ready: readyCount,
        });
        setActiveWorkload(formattedData.slice(0, 5)); // Only show the 5 most recent
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* ==========================================
          PAGE HEADER
      ========================================== */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">
            {isSuperAdmin
              ? "Central Juan C.M. Recto Branch - Live Status"
              : `Welcome back, ${savedUser?.full_name} - Your Assigned Tasks`}
          </p>
        </div>

        {/* ONLY SHOW 'CREATE JOB' BUTTON IF SUPER ADMIN */}
        {isSuperAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all active:scale-95 shadow-md shadow-blue-600/20 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Job Order
          </button>
        )}
      </div>

      {/* ==========================================
          TOP ROW: METRIC CARDS
      ========================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Pending Drop-offs */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/40 hover:-translate-y-1 transition-all duration-300 flex items-center gap-5 group cursor-pointer">
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <img
              src={pending}
              alt="Pending"
              className="w-8 h-8 object-contain"
            />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
              Pending / Received
            </p>
            <h3 className="text-3xl font-black text-gray-900 leading-none tracking-tight">
              {isLoading ? "..." : metrics.pending}
            </h3>
          </div>
        </div>

        {/* Card 2: Active Workbench */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/40 hover:-translate-y-1 transition-all duration-300 flex items-center gap-5 group cursor-pointer">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <img
              src={tools}
              alt="Tools"
              className="w-7 h-7 object-contain drop-shadow-sm"
            />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
              Active Workbench
            </p>
            <h3 className="text-3xl font-black text-gray-900 leading-none tracking-tight">
              {isLoading ? "..." : metrics.active}
            </h3>
          </div>
        </div>

        {/* Card 3: Ready for Release */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/40 hover:-translate-y-1 transition-all duration-300 flex items-center gap-5 group cursor-pointer">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <img
              src={checkIcon}
              alt="Ready"
              className="w-7 h-7 object-contain"
            />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
              Ready for Release
            </p>
            <h3 className="text-3xl font-black text-gray-900 leading-none tracking-tight">
              {isLoading ? "..." : metrics.ready}
            </h3>
          </div>
        </div>

        {/* Card 4: 90-Day Warnings */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/40 hover:-translate-y-1 transition-all duration-300 flex items-center gap-5 group cursor-pointer">
          <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <img
              src={warningIcon}
              alt="Warning"
              className="w-7 h-7 object-contain"
            />
          </div>
          <div>
            <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">
              90-Day Warnings
            </p>
            <h3 className="text-3xl font-black text-gray-900 leading-none tracking-tight">
              0
            </h3>
          </div>
        </div>
      </div>

      {/* ==========================================
          MIDDLE SECTION: ACTIVE WORKLOAD TABLE
      ========================================== */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[300px]">
        <div className="px-7 py-6 border-b border-gray-100 flex justify-between items-center bg-white">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
              {isSuperAdmin ? "Recent Job Orders" : "Your Recent Tasks"}
            </h2>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              The latest devices added to the system
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
            <p className="text-sm text-gray-500 font-medium">
              Loading live data...
            </p>
          </div>
        ) : activeWorkload.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <p className="text-sm text-gray-500 font-medium">
              No active job orders found.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="px-7 py-4 font-bold text-xs uppercase tracking-wider text-gray-400 bg-gray-50/50 border-b border-gray-100">
                    Job Order
                  </th>
                  <th className="px-7 py-4 font-bold text-xs uppercase tracking-wider text-gray-400 bg-gray-50/50 border-b border-gray-100">
                    Assigned Tech
                  </th>
                  <th className="px-7 py-4 font-bold text-xs uppercase tracking-wider text-gray-400 bg-gray-50/50 border-b border-gray-100">
                    Device
                  </th>
                  <th className="px-7 py-4 font-bold text-xs uppercase tracking-wider text-gray-400 bg-gray-50/50 border-b border-gray-100">
                    Current Status
                  </th>
                  <th className="px-7 py-4 font-bold text-xs uppercase tracking-wider text-gray-400 bg-gray-50/50 border-b border-gray-100">
                    Date Logged
                  </th>
                  <th className="px-7 py-4 font-bold text-xs uppercase tracking-wider text-gray-400 bg-gray-50/50 border-b border-gray-100 text-center">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activeWorkload.map((job) => (
                  <tr
                    key={job.id}
                    className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                  >
                    <td className="px-7 py-5 font-bold text-gray-900">
                      #{job.id}
                    </td>
                    <td className="px-7 py-5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-white shadow-sm ${
                            job.tech === "Unassigned"
                              ? "bg-gray-100 text-gray-500"
                              : "bg-gradient-to-tr from-blue-600 to-blue-400 text-white"
                          }`}
                        >
                          {job.tech === "Unassigned" ? "?" : job.tech.charAt(0)}
                        </div>
                        <span
                          className={`text-sm font-medium ${job.tech === "Unassigned" ? "text-gray-400 italic" : "text-gray-900"}`}
                        >
                          {job.tech}
                        </span>
                      </div>
                    </td>
                    <td className="px-7 py-5 text-sm text-gray-600 font-medium">
                      {job.device}
                    </td>
                    <td className="px-7 py-5">
                      <span
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold border ${
                          job.status === "Diagnosing"
                            ? "bg-purple-50 text-purple-700 border-purple-200/60"
                            : job.status === "In Progress"
                              ? "bg-blue-50 text-blue-700 border-blue-200/60"
                              : job.status === "Waiting on Parts"
                                ? "bg-amber-50 text-amber-700 border-amber-200/60"
                                : job.status === "Ready" ||
                                    job.status === "Ready for Pickup"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                                  : "bg-gray-50 text-gray-600 border-gray-200/60"
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="px-7 py-5 text-sm text-gray-500 font-medium">
                      {job.time}
                    </td>
                    <td className="px-7 py-5 text-center">
                      <button className="text-gray-400 hover:text-gray-900 bg-transparent hover:bg-gray-100 p-2 rounded-lg transition-all mx-auto block opacity-0 group-hover:opacity-100">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isSuperAdmin && (
        <CreateJobModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            fetchDashboardData();
          }}
        />
      )}
    </div>
  );
}
