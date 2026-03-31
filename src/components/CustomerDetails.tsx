import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Loader2,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../lib/supabase";

interface JobHistoryRow {
  job_order_no: number;
  tracking_id?: string | null;
  created_at: string;
  brand: string;
  model: string;
  serial_number?: string | null;
  complaint_notes?: string | null;
  status: string;
}

interface CustomerDetailsRow {
  id: string;
  full_name: string;
  phone_number: string;
  email?: string | null;
  address: string;
  created_at: string;
  job_orders?: JobHistoryRow[];
}

export default function CustomerDetails() {
  const { id } = useParams(); // Grab the customer ID from the URL
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<CustomerDetailsRow | null>(null);
  const [jobHistory, setJobHistory] = useState<JobHistoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCustomerDetails = useCallback(async () => {
    try {
      setIsLoading(true);

      // We can fetch the customer AND all their job orders in one go!
      const { data, error } = await supabase
        .from("customers")
        .select(
          `
          *,
          job_orders ( * )
        `,
        )
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        const customerData = data as CustomerDetailsRow;
        setCustomer(customerData);

        // Sort their history so the newest repairs are at the top
        const sortedJobs = [...(customerData.job_orders || [])].sort((a, b) => {
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        });

        setJobHistory(sortedJobs);
      }
    } catch (error) {
      console.error("Error fetching customer details:", error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchCustomerDetails();
  }, [id, fetchCustomerDetails]);

  // Helper for Status Badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
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
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading customer profile...</p>
      </div>
    );
  }

  const completedRepairs = jobHistory.filter(
    (job) =>
      job.status === "Ready" ||
      job.status === "Ready for Pickup" ||
      job.status === "Released",
  ).length;

  const activeRepairs = jobHistory.length - completedRepairs;

  if (!customer) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Customer Not Found
        </h2>
        <p className="text-gray-500 mb-6">
          The customer profile you are looking for does not exist or has been
          removed.
        </p>
        <button
          onClick={() => navigate("/customers")}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold"
        >
          Return to Directory
        </button>
      </div>
    );
  }

  return (
    <div className="relative space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div className="pointer-events-none absolute -top-16 -right-20 h-56 w-56 rounded-full bg-blue-200/35 blur-3xl" />
      <div className="pointer-events-none absolute top-44 -left-24 h-64 w-64 rounded-full bg-cyan-100/35 blur-3xl" />

      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-blue-100/80 bg-gradient-to-br from-white via-blue-50/35 to-cyan-50/25 p-5 sm:p-7 shadow-[0_16px_40px_rgba(30,64,175,0.08)]">
        <div className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-blue-200/30 blur-2xl" />
        <div className="absolute left-0 bottom-0 h-24 w-24 -translate-x-8 translate-y-8 rounded-full bg-cyan-100/50 blur-2xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="flex items-start gap-3 sm:gap-4 min-w-0">
            <button
              onClick={() => navigate("/customers")}
              className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors shadow-sm flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-semibold text-slate-700 hidden sm:inline">
                Back
              </span>
            </button>

            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.16em] font-black text-blue-500 mb-1.5">
                Customer Relation
              </p>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight truncate">
                Customer Profile
              </h1>
              <p className="text-slate-600 text-sm mt-1 font-medium">
                View complete account details and repair timeline.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:w-auto w-full">
            <div className="rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-3 shadow-sm">
              <p className="text-[11px] uppercase tracking-[0.14em] font-black text-slate-400">
                Total Repairs
              </p>
              <p className="text-xl font-black text-slate-900 mt-1">
                {jobHistory.length}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-3 shadow-sm">
              <p className="text-[11px] uppercase tracking-[0.14em] font-black text-slate-400">
                Active Jobs
              </p>
              <p className="text-xl font-black text-amber-600 mt-1">
                {activeRepairs}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Summary */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_12px_28px_rgba(15,23,42,0.06)] p-5 sm:p-7 flex flex-col lg:flex-row gap-6 sm:gap-8 items-start relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-50 to-transparent rounded-full -mr-20 -mt-20 opacity-70 z-0 pointer-events-none"></div>

        <div className="relative z-10 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-tr from-blue-600 to-blue-400 text-white rounded-2xl flex items-center justify-center font-black text-3xl sm:text-4xl shadow-lg shadow-blue-500/20 flex-shrink-0">
          {customer.full_name.charAt(0).toUpperCase()}
        </div>

        <div className="relative z-10 flex-1 w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 mb-1">
              {customer.full_name}
            </h2>
            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.14em] mb-5">
              ID: {customer.id.substring(0, 8)}
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-slate-600 font-semibold text-sm">
                <Phone className="w-4 h-4 text-blue-500" />
                {customer.phone_number}
              </div>
              <div className="flex items-center gap-3 text-slate-600 font-semibold text-sm">
                <Mail className="w-4 h-4 text-blue-500" />
                {customer.email || (
                  <span className="text-slate-400 italic">
                    No email provided
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="lg:border-l lg:border-slate-100 lg:pl-6 space-y-5">
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-[0.14em] mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Address
              </p>
              <p className="text-sm text-slate-700 font-semibold leading-relaxed">
                {customer.address}
              </p>
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-[0.14em] mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Client Since
              </p>
              <p className="text-sm text-slate-700 font-semibold">
                {new Date(customer.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-[0.14em] mb-1.5">
                Completed Repairs
              </p>
              <p className="text-lg font-black text-emerald-600">
                {completedRepairs}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Repair History */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_12px_28px_rgba(15,23,42,0.06)] overflow-hidden flex flex-col mt-8">
        <div className="px-4 sm:px-7 py-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Repair History
              </h3>
              <p className="text-sm text-slate-500 font-semibold">
                Timeline of all service records for this customer
              </p>
            </div>
          </div>
          <div className="hidden sm:block text-xs font-black text-slate-400 uppercase tracking-[0.14em]">
            Total logged devices: {jobHistory.length}
          </div>
        </div>

        {jobHistory.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center bg-gradient-to-b from-white to-slate-50/60">
            <CheckCircle2 className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-slate-500 font-semibold">
              This customer has no recorded job orders yet.
            </p>
          </div>
        ) : (
          <>
            <div className="md:hidden p-3 sm:p-4 space-y-3 bg-gradient-to-b from-slate-50/40 to-white">
              {jobHistory.map((job) => (
                <div
                  key={job.job_order_no}
                  className="rounded-2xl border border-slate-200/75 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.05)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-slate-900">
                        #{job.job_order_no}
                      </p>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">
                        {new Date(job.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      {job.tracking_id && (
                        <p className="text-[10px] font-black text-blue-500 tracking-widest mt-1">
                          {job.tracking_id}
                        </p>
                      )}
                    </div>
                    <span
                      className={`px-3 py-1.5 rounded-full text-[11px] font-bold border whitespace-nowrap ${getStatusBadge(job.status)}`}
                    >
                      {job.status}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5">
                    <p className="text-sm font-black text-slate-800">
                      {job.brand} {job.model}
                    </p>
                    <p className="text-xs text-slate-500">
                      SN: {job.serial_number || "N/A"}
                    </p>
                    <p className="text-sm text-slate-600 font-medium leading-relaxed line-clamp-2">
                      {job.complaint_notes || "No complaint notes provided."}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto overflow-y-auto max-h-[620px]">
              <table className="w-full min-w-[920px] text-left border-collapse">
                <thead>
                  <tr className="text-[11px] uppercase tracking-[0.13em] text-slate-500 border-b border-slate-100">
                    <th className="sticky top-0 z-10 px-4 sm:px-7 py-4 font-black bg-slate-100">
                      Job Order / ID
                    </th>
                    <th className="sticky top-0 z-10 px-4 sm:px-7 py-4 font-black bg-slate-100">
                      Date Logged
                    </th>
                    <th className="sticky top-0 z-10 px-4 sm:px-7 py-4 font-black bg-slate-100">
                      Device Details
                    </th>
                    <th className="sticky top-0 z-10 px-4 sm:px-7 py-4 font-black bg-slate-100">
                      Reported Issue
                    </th>
                    <th className="sticky top-0 z-10 px-4 sm:px-7 py-4 font-black bg-slate-100">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {jobHistory.map((job) => (
                    <tr
                      key={job.job_order_no}
                      className="hover:bg-blue-50/35 transition-colors"
                    >
                      <td className="px-4 sm:px-7 py-5">
                        <p className="font-black text-slate-900">
                          #{job.job_order_no}
                        </p>
                        {job.tracking_id && (
                          <p className="text-[10px] font-black text-blue-500 tracking-widest mt-0.5">
                            {job.tracking_id}
                          </p>
                        )}
                      </td>
                      <td className="px-4 sm:px-7 py-5 text-sm font-semibold text-slate-600">
                        {new Date(job.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 sm:px-7 py-5">
                        <p className="text-sm font-black text-slate-800">
                          {job.brand} {job.model}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          SN: {job.serial_number || "N/A"}
                        </p>
                      </td>
                      <td
                        className="px-4 sm:px-7 py-5 max-w-xs truncate text-sm text-slate-600 font-medium"
                        title={job.complaint_notes || "No complaint notes"}
                      >
                        {job.complaint_notes || "No complaint notes provided."}
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
          </>
        )}
      </div>
    </div>
  );
}
