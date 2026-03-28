import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CreateJobModal from "./CreateJobModal";
import { Plus, Loader2, Sunrise, Sun, Moon, Eye } from "lucide-react";
import checkIcon from "../assets/icons/check.png";
import warningIcon from "../assets/icons/warning.png";
import tools from "../assets/icons/tools.png";
import pending from "../assets/icons/pending.gif";
import { supabase } from "../lib/supabase";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export default function DashboardContent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 640;
  });
  const navigate = useNavigate();

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

  // Chart States
  const [barChartData, setBarChartData] = useState<any[]>([]);
  const [pieChartData, setPieChartData] = useState<any[]>([]);
  const PIE_COLORS = [
    "#4f46e5",
    "#3b82f6",
    "#0ea5e9",
    "#38bdf8",
    "#7dd3fc",
    "#bae6fd",
  ];

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? "Good morning"
      : currentHour < 18
        ? "Good afternoon"
        : "Good evening";
  const GreetingIcon =
    currentHour < 12 ? Sunrise : currentHour < 18 ? Sun : Moon;
  const firstName = savedUser?.full_name?.split(" ")?.[0] || "";

  // Fetch Data when the component loads
  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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
          status,
          issue_category
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
        setActiveWorkload(formattedData.slice(0, 5)); // Only show the 5 most recent in the table

        // --- PIE CHART: Top Issue Categories ---
        const issuesMap: Record<string, number> = {};
        data.forEach((job) => {
          const category = job.issue_category || "Other";
          issuesMap[category] = (issuesMap[category] || 0) + 1;
        });

        const formattedPieData = Object.keys(issuesMap)
          .map((key) => ({
            name: key,
            value: issuesMap[key],
          }))
          .sort((a, b) => b.value - a.value); // Sort highest to lowest
        setPieChartData(formattedPieData);

        // --- BAR CHART: Repairs Over Time (Last 7 Days) ---
        const last7Days = [...Array(7)]
          .map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d;
          })
          .reverse();

        const formattedBarData = last7Days.map((date) => {
          const dateString = date.toISOString().split("T")[0]; // YYYY-MM-DD
          const displayString = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }); // MMM DD

          const count = data.filter((j) =>
            j.created_at.startsWith(dateString),
          ).length;

          return {
            date: displayString,
            Tickets: count,
          };
        });
        setBarChartData(formattedBarData);
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
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5">
            <GreetingIcon className="w-4 h-4 text-blue-600" />
            <span className="text-xs sm:text-sm font-bold text-blue-700">
              {firstName ? `${greeting}, ${firstName}` : greeting}
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">
            {isSuperAdmin
              ? "Central Juan C.M. Recto Branch"
              : `Welcome back, ${savedUser?.full_name} - Your Assigned Tasks`}
          </p>
        </div>

        {/* ONLY SHOW 'CREATE JOB' BUTTON IF SUPER ADMIN */}
        {isSuperAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all active:scale-95 shadow-md shadow-blue-600/20 flex items-center justify-center gap-2"
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
          MIDDLE ROW: ANALYTICS CHARTS
      ========================================== */}
      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bar Chart: Last 7 Days */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:col-span-2">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900">Ticket Volume</h3>
              <p className="text-sm text-gray-500 font-medium">
                Number of repair tickets received over the last 7 days.
              </p>
            </div>
            <div className="h-[220px] sm:h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barChartData}
                  margin={{
                    top: 10,
                    right: isMobile ? 0 : 10,
                    left: isMobile ? -8 : -20,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f3f4f6"
                  />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: isMobile ? 10 : 12, fill: "#6b7280" }}
                    dy={isMobile ? 6 : 10}
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: isMobile ? 10 : 12, fill: "#6b7280" }}
                  />
                  <RechartsTooltip
                    cursor={{ fill: "#f8fafc" }}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Bar
                    dataKey="Tickets"
                    fill="#3b82f6"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={isMobile ? 36 : 50}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart: Issue Categories */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:col-span-1 flex flex-col">
            <div className="mb-2">
              <h3 className="text-lg font-bold text-gray-900">
                Top Device Issues
              </h3>
              <p className="text-sm text-gray-500 font-medium">
                Breakdown by complaint category.
              </p>
            </div>
            <div className="flex-1 h-[220px] sm:h-[250px] w-full flex items-center justify-center">
              {pieChartData.length === 0 ? (
                <p className="text-gray-400 font-medium text-sm">
                  No issue data available yet.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={isMobile ? 38 : 50}
                      outerRadius={isMobile ? 66 : 80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieChartData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    {!isMobile && (
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }}
                      />
                    )}
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          BOTTOM SECTION: ACTIVE WORKLOAD TABLE
      ========================================== */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[300px]">
        <div className="px-4 sm:px-7 py-5 sm:py-6 border-b border-gray-100 flex justify-between items-center bg-white">
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
          <>
            <div className="md:hidden p-3 space-y-3">
              {activeWorkload.map((job) => (
                <div
                  key={job.id}
                  className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-gray-900">#{job.id}</p>
                      <p className="text-xs text-gray-500 mt-0.5 font-medium">
                        {job.time}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-bold border ${
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
                  </div>

                  <div className="mt-3 space-y-2">
                    <p className="text-sm text-gray-700 font-medium truncate">
                      {job.device}
                    </p>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-white shadow-sm ${
                          job.tech === "Unassigned"
                            ? "bg-gray-100 text-gray-500"
                            : "bg-gradient-to-tr from-blue-600 to-blue-400 text-white"
                        }`}
                      >
                        {job.tech === "Unassigned" ? "?" : job.tech.charAt(0)}
                      </div>
                      <span
                        className={`text-sm ${
                          job.tech === "Unassigned"
                            ? "text-gray-400 italic"
                            : "text-gray-900 font-medium"
                        }`}
                      >
                        {job.tech}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/job-orders/${job.id}`)}
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 text-gray-700 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
                    title="View Ticket Details"
                  >
                    <Eye className="w-4 h-4" /> View Details
                  </button>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[760px] text-left border-collapse">
                <thead>
                  <tr>
                    <th className="px-4 sm:px-7 py-4 font-bold text-xs uppercase tracking-wider text-gray-700 bg-gray-100 border-b border-gray-200">
                      Job Order
                    </th>
                    <th className="px-4 sm:px-7 py-4 font-bold text-xs uppercase tracking-wider text-gray-700 bg-gray-100 border-b border-gray-200">
                      Assigned Tech
                    </th>
                    <th className="px-4 sm:px-7 py-4 font-bold text-xs uppercase tracking-wider text-gray-700 bg-gray-100 border-b border-gray-200">
                      Device
                    </th>
                    <th className="px-4 sm:px-7 py-4 font-bold text-xs uppercase tracking-wider text-gray-700 bg-gray-100 border-b border-gray-200">
                      Current Status
                    </th>
                    <th className="px-4 sm:px-7 py-4 font-bold text-xs uppercase tracking-wider text-gray-700 bg-gray-100 border-b border-gray-200">
                      Date Logged
                    </th>
                    <th className="px-4 sm:px-7 py-4 font-bold text-xs uppercase tracking-wider text-gray-700 bg-gray-100 border-b border-gray-200 text-center">
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
                      <td className="px-4 sm:px-7 py-5 font-bold text-gray-900">
                        #{job.id}
                      </td>
                      <td className="px-4 sm:px-7 py-5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-white shadow-sm ${
                              job.tech === "Unassigned"
                                ? "bg-gray-100 text-gray-500"
                                : "bg-gradient-to-tr from-blue-600 to-blue-400 text-white"
                            }`}
                          >
                            {job.tech === "Unassigned"
                              ? "?"
                              : job.tech.charAt(0)}
                          </div>
                          <span
                            className={`text-sm font-medium ${job.tech === "Unassigned" ? "text-gray-400 italic" : "text-gray-900"}`}
                          >
                            {job.tech}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-7 py-5 text-sm text-gray-600 font-medium">
                        {job.device}
                      </td>
                      <td className="px-4 sm:px-7 py-5">
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
                      <td className="px-4 sm:px-7 py-5 text-sm text-gray-500 font-medium">
                        {job.time}
                      </td>
                      <td className="px-4 sm:px-7 py-5 text-center">
                        <button
                          // UPDATED: Now navigates directly to the specific Job Order Details page!
                          onClick={() => navigate(`/job-orders/${job.id}`)}
                          className="text-gray-400 hover:text-gray-900 bg-transparent hover:bg-gray-100 p-2 rounded-lg transition-all mx-auto block"
                          title="View Ticket Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
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
