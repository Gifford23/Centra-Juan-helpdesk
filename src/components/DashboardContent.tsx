import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import CreateJobModal from "./CreateJobModal";
import { Plus, Loader2, Eye, X, LayoutGrid, Cloud } from "lucide-react";
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
  type WorkloadItem = {
    id: string;
    tech: string;
    device: string;
    status: string;
    time: string;
    createdAt: string;
  };

  type ChartTicket = {
    id: string;
    customer: string;
    device: string;
    status: string;
    tech: string;
    loggedAt: string;
  };

  type BarChartPoint = {
    date: string;
    Tickets: number;
    tickets: ChartTicket[];
  };

  type PieChartPoint = {
    name: string;
    value: number;
    tickets: ChartTicket[];
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showBarTicketsModal, setShowBarTicketsModal] = useState(false);
  const [selectedBarDate, setSelectedBarDate] = useState("");
  const [selectedBarTickets, setSelectedBarTickets] = useState<ChartTicket[]>(
    [],
  );
  const [showPieTicketsModal, setShowPieTicketsModal] = useState(false);
  const [selectedPieCategory, setSelectedPieCategory] = useState("");
  const [selectedPieTickets, setSelectedPieTickets] = useState<ChartTicket[]>(
    [],
  );
  const [selectedPieColor, setSelectedPieColor] = useState("#3b82f6");
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
  const [activeWorkload, setActiveWorkload] = useState<WorkloadItem[]>([]);
  const [technicianAvatars, setTechnicianAvatars] = useState<
    Record<string, string | null>
  >({});
  const [metrics, setMetrics] = useState({
    pending: 0,
    active: 0,
    ready: 0,
  });

  // Chart States
  const [barChartData, setBarChartData] = useState<BarChartPoint[]>([]);
  const [pieChartData, setPieChartData] = useState<PieChartPoint[]>([]);
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
  const firstName = savedUser?.full_name?.split(" ")?.[0] || "";
  const assignedTechnicianName = savedUser?.full_name || "";
  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchDashboardData = useCallback(async () => {
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
          issue_category,
          customers ( full_name )
        `,
        )
        .order("created_at", { ascending: false });

      // APPLY RBAC FILTER: If not Super Admin, only fetch their assigned jobs
      if (!isSuperAdmin && assignedTechnicianName) {
        query = query.eq("assigned_tech", assignedTechnicianName);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        const assignedTechnicians = Array.from(
          new Set(
            data
              .map((job) => job.assigned_tech)
              .filter((name): name is string =>
                Boolean(name && name !== "Unassigned"),
              ),
          ),
        );

        if (assignedTechnicians.length > 0) {
          const { data: personnelRows, error: personnelError } = await supabase
            .from("personnel")
            .select("full_name, avatar_url")
            .in("full_name", assignedTechnicians);

          if (!personnelError && personnelRows) {
            const avatarMap = (
              personnelRows as {
                full_name: string;
                avatar_url: string | null;
              }[]
            ).reduce<Record<string, string | null>>((acc, person) => {
              acc[person.full_name] = person.avatar_url;
              return acc;
            }, {});
            setTechnicianAvatars(avatarMap);
          }
        } else {
          setTechnicianAvatars({});
        }

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
            createdAt: job.created_at,
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
        const issueTicketsMap: Record<string, ChartTicket[]> = {};
        data.forEach((job) => {
          const category = job.issue_category || "Other";
          issuesMap[category] = (issuesMap[category] || 0) + 1;

          const customerRelation = job.customers as
            | { full_name: string }
            | { full_name: string }[]
            | null;

          const customer = Array.isArray(customerRelation)
            ? customerRelation[0]?.full_name
            : customerRelation?.full_name;

          if (!issueTicketsMap[category]) {
            issueTicketsMap[category] = [];
          }

          issueTicketsMap[category].push({
            id: String(job.job_order_no),
            customer: customer || "Walk-in Customer",
            device: `${job.brand || "Unknown"} ${job.model || "Device"}`,
            status: job.status,
            tech: job.assigned_tech || "Unassigned",
            loggedAt: new Date(job.created_at).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            }),
          });
        });

        const formattedPieData = Object.keys(issuesMap)
          .map((key) => ({
            name: key,
            value: issuesMap[key],
            tickets: issueTicketsMap[key] || [],
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

          const dayTickets = data.filter((j) =>
            j.created_at.startsWith(dateString),
          );

          return {
            date: displayString,
            Tickets: dayTickets.length,
            tickets: dayTickets.map((job) => {
              const customerRelation = job.customers as
                | { full_name: string }
                | { full_name: string }[]
                | null;

              const customer = Array.isArray(customerRelation)
                ? customerRelation[0]?.full_name
                : customerRelation?.full_name;

              return {
                id: String(job.job_order_no),
                customer: customer || "Walk-in Customer",
                device: `${job.brand || "Unknown"} ${job.model || "Device"}`,
                status: job.status,
                tech: job.assigned_tech || "Unassigned",
                loggedAt: new Date(job.created_at).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                }),
              };
            }),
          };
        });
        setBarChartData(formattedBarData);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [assignedTechnicianName, isSuperAdmin]);

  // Fetch Data when the component loads
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleBarClick = (barData: { payload?: BarChartPoint }) => {
    if (!barData?.payload) return;

    setSelectedBarDate(barData.payload.date || "Selected Day");
    setSelectedBarTickets(barData.payload.tickets || []);
    setShowBarTicketsModal(true);
  };

  const handlePieSliceClick = (entry: PieChartPoint, index: number) => {
    setSelectedPieCategory(entry.name || "Issue Category");
    setSelectedPieTickets(entry.tickets || []);
    setSelectedPieColor(PIE_COLORS[index % PIE_COLORS.length]);
    setShowPieTicketsModal(true);
  };

  const getRelativeTime = (isoString: string) => {
    const date = new Date(isoString);
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / 60000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;

    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  };

  const isRecentlySubmitted = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    return diffMs <= 60 * 60 * 1000;
  };

  const getStatusBadgeClass = (status: string) => {
    if (status === "Diagnosing") {
      return "bg-purple-50 text-purple-700 border-purple-200/60";
    }
    if (status === "In Progress") {
      return "bg-blue-50 text-blue-700 border-blue-200/60";
    }
    if (status === "Waiting on Parts") {
      return "bg-amber-50 text-amber-700 border-amber-200/60";
    }
    if (status === "Ready" || status === "Ready for Pickup") {
      return "bg-emerald-50 text-emerald-700 border-emerald-200/60";
    }
    if (status === "Pending Drop-off" || status === "Received") {
      return "bg-indigo-50 text-indigo-700 border-indigo-200/60";
    }
    return "bg-gray-50 text-gray-600 border-gray-200/60";
  };

  const getStatusAccentClass = (status: string) => {
    if (status === "Diagnosing") return "border-l-purple-400";
    if (status === "In Progress") return "border-l-blue-400";
    if (status === "Waiting on Parts") return "border-l-amber-400";
    if (status === "Ready" || status === "Ready for Pickup") {
      return "border-l-emerald-400";
    }
    if (status === "Pending Drop-off" || status === "Received") {
      return "border-l-indigo-400";
    }
    return "border-l-slate-300";
  };

  const getTechBadgeClass = (tech: string) => {
    if (tech === "Unassigned") {
      return "bg-rose-50 text-rose-600 border-rose-200/70";
    }
    return "bg-blue-50 text-blue-700 border-blue-200/60";
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* ==========================================
          PAGE HEADER
      ========================================== */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 text-white shadow-[0_10px_26px_rgba(59,130,246,0.36)] flex items-center justify-center flex-shrink-0">
              <LayoutGrid className="w-6 h-6" />
              <span className="absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" />
            </div>

            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-tight truncate">
                {greeting},{" "}
                <span className="text-blue-600">{firstName || "Team"}</span>
                <Cloud className="inline-block w-5 h-5 sm:w-6 sm:h-6 text-sky-500 ml-2 -mt-1" />
              </h1>

              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1 font-bold uppercase tracking-wide text-blue-700">
                  General Operations Manager
                </span>
                <span className="text-gray-300">•</span>
                <span className="font-semibold text-slate-500">
                  {todayLabel}
                </span>
              </div>
            </div>
          </div>
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
        <div className="relative overflow-hidden bg-gradient-to-br from-white to-amber-50/40 p-6 rounded-3xl border border-amber-100/70 shadow-[0_10px_30px_rgba(2,6,23,0.06)] hover:shadow-[0_18px_42px_rgba(245,158,11,0.18)] hover:-translate-y-1 transition-all duration-300 flex items-center gap-5 group cursor-pointer">
          <div className="absolute -top-12 -right-10 w-28 h-28 rounded-full bg-amber-200/20 blur-2xl pointer-events-none" />
          <div className="w-14 h-14 bg-white/90 ring-1 ring-amber-200 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-sm">
            <img
              src={pending}
              alt="Pending"
              className="w-8 h-8 object-contain"
            />
          </div>
          <div className="relative z-10">
            <p className="text-[11px] font-extrabold text-amber-600/80 uppercase tracking-[0.14em] mb-1">
              Pending / Received
            </p>
            <h3 className="text-3xl font-black text-gray-900 leading-none tracking-tight">
              {isLoading ? "..." : metrics.pending}
            </h3>
            <p className="text-xs text-gray-500 font-semibold mt-2">
              Live queue intake
            </p>
          </div>
        </div>

        {/* Card 2: Active Workbench */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white to-blue-50/40 p-6 rounded-3xl border border-blue-100/70 shadow-[0_10px_30px_rgba(2,6,23,0.06)] hover:shadow-[0_18px_42px_rgba(59,130,246,0.18)] hover:-translate-y-1 transition-all duration-300 flex items-center gap-5 group cursor-pointer">
          <div className="absolute -top-12 -right-10 w-28 h-28 rounded-full bg-blue-200/20 blur-2xl pointer-events-none" />
          <div className="w-14 h-14 bg-white/90 ring-1 ring-blue-200 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-sm">
            <img
              src={tools}
              alt="Tools"
              className="w-7 h-7 object-contain drop-shadow-sm"
            />
          </div>
          <div className="relative z-10">
            <p className="text-[11px] font-extrabold text-blue-600/80 uppercase tracking-[0.14em] mb-1">
              Active Workbench
            </p>
            <h3 className="text-3xl font-black text-gray-900 leading-none tracking-tight">
              {isLoading ? "..." : metrics.active}
            </h3>
            <p className="text-xs text-gray-500 font-semibold mt-2">
              Devices under repair
            </p>
          </div>
        </div>

        {/* Card 3: Ready for Release */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white to-emerald-50/40 p-6 rounded-3xl border border-emerald-100/70 shadow-[0_10px_30px_rgba(2,6,23,0.06)] hover:shadow-[0_18px_42px_rgba(16,185,129,0.18)] hover:-translate-y-1 transition-all duration-300 flex items-center gap-5 group cursor-pointer">
          <div className="absolute -top-12 -right-10 w-28 h-28 rounded-full bg-emerald-200/20 blur-2xl pointer-events-none" />
          <div className="w-14 h-14 bg-white/90 ring-1 ring-emerald-200 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-sm">
            <img
              src={checkIcon}
              alt="Ready"
              className="w-7 h-7 object-contain"
            />
          </div>
          <div className="relative z-10">
            <p className="text-[11px] font-extrabold text-emerald-600/80 uppercase tracking-[0.14em] mb-1">
              Ready for Release
            </p>
            <h3 className="text-3xl font-black text-gray-900 leading-none tracking-tight">
              {isLoading ? "..." : metrics.ready}
            </h3>
            <p className="text-xs text-gray-500 font-semibold mt-2">
              Pickup-ready units
            </p>
          </div>
        </div>

        {/* Card 4: 90-Day Warnings */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white to-red-50/40 p-6 rounded-3xl border border-red-100/70 shadow-[0_10px_30px_rgba(2,6,23,0.06)] hover:shadow-[0_18px_42px_rgba(239,68,68,0.18)] hover:-translate-y-1 transition-all duration-300 flex items-center gap-5 group cursor-pointer">
          <div className="absolute -top-12 -right-10 w-28 h-28 rounded-full bg-red-200/20 blur-2xl pointer-events-none" />
          <div className="w-14 h-14 bg-white/90 ring-1 ring-red-200 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-sm">
            <img
              src={warningIcon}
              alt="Warning"
              className="w-7 h-7 object-contain"
            />
          </div>
          <div className="relative z-10">
            <p className="text-[11px] font-extrabold text-red-500/80 uppercase tracking-[0.14em] mb-1">
              90-Day Warnings
            </p>
            <h3 className="text-3xl font-black text-gray-900 leading-none tracking-tight">
              0
            </h3>
            <p className="text-xs text-gray-500 font-semibold mt-2">
              Unclaimed repair alerts
            </p>
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
                    vertical={false}
                    stroke="#cbd5e1"
                    strokeWidth={1.1}
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
                    onClick={handleBarClick}
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
              <p className="text-xs text-blue-600 font-bold mt-2">
                Click a pie slice to view matching tickets.
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
                      {pieChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                          className="cursor-pointer"
                          onClick={() => handlePieSliceClick(entry, index)}
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
                      <div className="mt-0.5 flex items-center gap-2">
                        <p className="text-xs text-gray-500 font-medium">
                          {job.time}
                        </p>
                        {isRecentlySubmitted(job.createdAt) && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-blue-600 font-bold mt-1">
                        {getRelativeTime(job.createdAt)}
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
                      {job.tech !== "Unassigned" &&
                      technicianAvatars[job.tech] ? (
                        <img
                          src={technicianAvatars[job.tech] || ""}
                          alt={job.tech}
                          className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-sm"
                        />
                      ) : (
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-white shadow-sm ${
                            job.tech === "Unassigned"
                              ? "bg-gray-100 text-gray-500"
                              : "bg-gradient-to-tr from-blue-600 to-blue-400 text-white"
                          }`}
                        >
                          {job.tech === "Unassigned" ? "?" : job.tech.charAt(0)}
                        </div>
                      )}
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
                        <p>#{job.id}</p>
                        <div className="mt-1 flex items-center gap-2">
                          {isRecentlySubmitted(job.createdAt) && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                              New
                            </span>
                          )}
                          <span className="text-[11px] text-blue-600 font-bold">
                            {getRelativeTime(job.createdAt)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-7 py-5">
                        <div className="flex items-center gap-3">
                          {job.tech !== "Unassigned" &&
                          technicianAvatars[job.tech] ? (
                            <img
                              src={technicianAvatars[job.tech] || ""}
                              alt={job.tech}
                              className="w-9 h-9 rounded-full object-cover ring-2 ring-white shadow-sm"
                            />
                          ) : (
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
                          )}
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

      {showBarTicketsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm"
            onClick={() => setShowBarTicketsModal(false)}
          ></div>

          <div className="relative w-full max-w-5xl bg-white rounded-3xl border border-slate-200 shadow-[0_24px_55px_rgba(15,23,42,0.24)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-4 sm:px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-cyan-50/60">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-blue-600 mb-1">
                    Daily Drilldown
                  </p>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    Customer Tickets for {selectedBarDate}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium mt-1">
                    {selectedBarTickets.length} ticket
                    {selectedBarTickets.length !== 1 ? "s" : ""} found on this
                    date.
                  </p>
                </div>
                <button
                  onClick={() => setShowBarTicketsModal(false)}
                  className="p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-white transition-colors"
                  aria-label="Close tickets modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black border bg-white text-slate-700 border-slate-200">
                  Total: {selectedBarTickets.length}
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black border bg-emerald-50 text-emerald-700 border-emerald-200">
                  Ready:{" "}
                  {
                    selectedBarTickets.filter(
                      (t) =>
                        t.status === "Ready" || t.status === "Ready for Pickup",
                    ).length
                  }
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black border bg-amber-50 text-amber-700 border-amber-200">
                  Active:{" "}
                  {
                    selectedBarTickets.filter(
                      (t) =>
                        t.status === "Diagnosing" ||
                        t.status === "In Progress" ||
                        t.status === "Waiting on Parts",
                    ).length
                  }
                </span>
              </div>
            </div>

            {selectedBarTickets.length === 0 ? (
              <div className="py-16 px-6 text-center">
                <p className="text-gray-500 font-medium">
                  No tickets were logged for this day.
                </p>
              </div>
            ) : (
              <div className="max-h-[70vh] overflow-auto bg-slate-50/40">
                <table className="w-full min-w-[720px] text-left border-collapse">
                  <thead>
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-700 bg-white border-b border-slate-200">
                        Job Order
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-700 bg-white border-b border-slate-200">
                        Customer
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-700 bg-white border-b border-slate-200">
                        Device
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-700 bg-white border-b border-slate-200">
                        Status
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-700 bg-white border-b border-slate-200">
                        Assigned Tech
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-700 bg-white border-b border-slate-200">
                        Logged At
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-700 bg-white border-b border-slate-200 text-center">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {selectedBarTickets.map((ticket) => (
                      <tr
                        key={ticket.id}
                        className="hover:bg-blue-50/30 transition-colors"
                      >
                        <td className="px-4 sm:px-6 py-4 font-bold text-slate-900">
                          #{ticket.id}
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-sm text-slate-700 font-medium">
                          {ticket.customer}
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-sm text-slate-600 font-medium">
                          {ticket.device}
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadgeClass(ticket.status)}`}
                          >
                            {ticket.status}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${getTechBadgeClass(ticket.tech)}`}
                          >
                            {ticket.tech}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-sm text-slate-500 font-medium">
                          {ticket.loggedAt}
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-center">
                          <button
                            onClick={() => {
                              setShowBarTicketsModal(false);
                              navigate(`/job-orders/${ticket.id}`);
                            }}
                            className="inline-flex items-center gap-1.5 text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors font-bold text-xs"
                            title="View Ticket Details"
                          >
                            <Eye className="w-4 h-4" /> View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {showPieTicketsModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm"
            onClick={() => setShowPieTicketsModal(false)}
          ></div>

          <div className="relative w-full max-w-4xl bg-white rounded-3xl border border-slate-200 shadow-[0_24px_55px_rgba(15,23,42,0.24)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div
              className="px-4 sm:px-6 py-5 border-b border-slate-100"
              style={{
                background: `linear-gradient(90deg, ${selectedPieColor}20, #ffffff)`,
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-700 mb-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: selectedPieColor }}
                    ></span>
                    Issue Category Drilldown
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    {selectedPieCategory}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium mt-1">
                    {selectedPieTickets.length} ticket
                    {selectedPieTickets.length !== 1 ? "s" : ""} under this
                    issue category.
                  </p>
                </div>
                <button
                  onClick={() => setShowPieTicketsModal(false)}
                  className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-white transition-colors"
                  aria-label="Close issue tickets modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black border bg-white text-slate-700 border-slate-200">
                  Total: {selectedPieTickets.length}
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black border bg-blue-50 text-blue-700 border-blue-200">
                  Category Focus
                </span>
              </div>
            </div>

            {selectedPieTickets.length === 0 ? (
              <div className="py-16 px-6 text-center">
                <p className="text-slate-500 font-medium">
                  No tickets found in this issue category.
                </p>
              </div>
            ) : (
              <div className="max-h-[70vh] overflow-y-auto p-4 sm:p-6 space-y-3 bg-slate-50/40">
                {selectedPieTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm border-l-4 ${getStatusAccentClass(ticket.status)}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div>
                        <p className="font-black text-slate-900">
                          #{ticket.id}
                        </p>
                        <p className="text-sm text-slate-600 font-medium mt-1">
                          {ticket.customer}
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                          {ticket.device}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadgeClass(ticket.status)}`}
                        >
                          {ticket.status}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border ${getTechBadgeClass(ticket.tech)}`}
                        >
                          {ticket.tech}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-xs text-slate-500 font-medium">
                        Logged at {ticket.loggedAt}
                      </p>
                      <button
                        onClick={() => {
                          setShowPieTicketsModal(false);
                          navigate(`/job-orders/${ticket.id}`);
                        }}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
