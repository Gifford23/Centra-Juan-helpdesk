import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  ShieldCheck,
  Wrench,
  Loader2,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../lib/supabase";

export default function PersonnelDetails() {
  const { id } = useParams(); // Grab the personnel ID from the URL
  const navigate = useNavigate();

  const [personnel, setPersonnel] = useState<any>(null);
  const [assignedJobs, setAssignedJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) fetchPersonnelDetails();
  }, [id]);

  const fetchPersonnelDetails = async () => {
    try {
      setIsLoading(true);

      // 1. Fetch the specific personnel record
      const { data: staffData, error: staffError } = await supabase
        .from("personnel")
        .select("*")
        .eq("id", id)
        .single();

      if (staffError) throw staffError;

      if (staffData) {
        setPersonnel(staffData);

        // 2. Fetch all job orders assigned to this person's full_name
        const { data: jobsData, error: jobsError } = await supabase
          .from("job_orders")
          .select("*, customers(full_name)")
          .eq("assigned_tech", staffData.full_name)
          .order("created_at", { ascending: false });

        if (!jobsError && jobsData) {
          setAssignedJobs(jobsData);
        }
      }
    } catch (error) {
      console.error("Error fetching personnel details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper for Status Badge styling
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
      case "Released":
        return "bg-gray-100 text-gray-700 border-gray-300";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200/60";
    }
  };

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">
          Loading personnel profile...
        </p>
      </div>
    );
  }

  if (!personnel) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Personnel Not Found
        </h2>
        <p className="text-gray-500 mb-6">
          The employee profile you are looking for does not exist or has been
          removed.
        </p>
        <button
          onClick={() => navigate("/personnel")}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold"
        >
          Return to Directory
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto">
      {/* Header & Back Button */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate("/personnel")}
          className="p-2.5 bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            Employee Profile
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">
            View employee details and assigned workload
          </p>
        </div>
      </div>

      {/* Top Section: Personnel Info Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center md:items-start relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-50 to-transparent rounded-full -mr-20 -mt-20 opacity-60 z-0 pointer-events-none"></div>

        <div
          className={`relative z-10 w-28 h-28 text-white rounded-3xl flex items-center justify-center font-black text-5xl shadow-lg flex-shrink-0 ${personnel.role === "Super Admin" ? "bg-gradient-to-tr from-indigo-600 to-indigo-400 shadow-indigo-500/20" : "bg-gradient-to-tr from-blue-500 to-blue-400 shadow-blue-500/20"}`}
        >
          {personnel.full_name.charAt(0).toUpperCase()}
        </div>

        <div className="relative z-10 flex-1 w-full flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-black text-gray-900 mb-1">
              {personnel.full_name}
            </h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
              ID: {personnel.id.substring(0, 8)}
            </p>

            <div className="flex items-center gap-3 text-gray-600 font-medium">
              <Mail className="w-4 h-4 text-indigo-500" />
              {personnel.email}
            </div>
          </div>

          <div className="flex flex-row md:flex-col gap-3">
            <div
              className={`inline-flex items-center justify-center md:justify-start gap-2 px-4 py-2 rounded-xl text-sm font-bold border ${personnel.role === "Super Admin" ? "bg-indigo-50 text-indigo-700 border-indigo-100" : "bg-blue-50 text-blue-700 border-blue-100"}`}
            >
              {personnel.role === "Super Admin" ? (
                <ShieldCheck className="w-4 h-4" />
              ) : (
                <Wrench className="w-4 h-4" />
              )}
              {personnel.role}
            </div>
            <div
              className={`inline-flex items-center justify-center md:justify-start px-4 py-2 rounded-xl text-sm font-bold border ${personnel.status === "Active" ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-gray-50 border-gray-200 text-gray-500"}`}
            >
              {personnel.status}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Assigned Workload Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col mt-8">
        <div className="px-4 sm:px-7 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Assigned Workload
              </h3>
              <p className="text-sm text-gray-500 font-medium">
                Total tickets assigned: {assignedJobs.length}
              </p>
            </div>
          </div>
        </div>

        {assignedJobs.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <CheckCircle2 className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">
              This employee has no assigned job orders.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left border-collapse">
              <thead>
                <tr className="bg-white text-xs uppercase tracking-wider text-gray-400 border-b border-gray-100">
                  <th className="px-4 sm:px-7 py-4 font-bold">Job Order</th>
                  <th className="px-4 sm:px-7 py-4 font-bold">Date Logged</th>
                  <th className="px-4 sm:px-7 py-4 font-bold">Customer</th>
                  <th className="px-4 sm:px-7 py-4 font-bold">
                    Device Details
                  </th>
                  <th className="px-4 sm:px-7 py-4 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {assignedJobs.map((job) => (
                  <tr
                    key={job.job_order_no}
                    className="hover:bg-indigo-50/30 transition-colors"
                  >
                    <td className="px-4 sm:px-7 py-5 font-bold text-gray-900">
                      #{job.job_order_no}
                    </td>
                    <td className="px-4 sm:px-7 py-5 text-sm font-medium text-gray-600">
                      {new Date(job.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 sm:px-7 py-5 text-sm font-bold text-gray-800">
                      {job.customers?.full_name || "Unknown"}
                    </td>
                    <td className="px-4 sm:px-7 py-5">
                      <p className="text-sm font-bold text-gray-800">
                        {job.brand} {job.model}
                      </p>
                      <p
                        className="text-xs text-gray-500 mt-0.5 max-w-[200px] truncate"
                        title={job.complaint_notes}
                      >
                        {job.complaint_notes}
                      </p>
                    </td>
                    <td className="px-4 sm:px-7 py-5">
                      <span
                        className={`px-3 py-1.5 rounded-full text-[11px] font-bold border whitespace-nowrap ${getStatusBadge(job.status)}`}
                      >
                        {job.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
