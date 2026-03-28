import { useState, useEffect } from "react";
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

export default function CustomerDetails() {
  const { id } = useParams(); // Grab the customer ID from the URL
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<any>(null);
  const [jobHistory, setJobHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) fetchCustomerDetails();
  }, [id]);

  const fetchCustomerDetails = async () => {
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
        setCustomer(data);

        // Sort their history so the newest repairs are at the top
        const sortedJobs =
          data.job_orders?.sort((a: any, b: any) => {
            return (
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
            );
          }) || [];

        setJobHistory(sortedJobs);
      }
    } catch (error) {
      console.error("Error fetching customer details:", error);
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
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading customer profile...</p>
      </div>
    );
  }

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
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto">
      {/* Header & Back Button */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/customers")}
            className="flex items-center gap-2 p-2.5 bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium text-gray-700 hidden sm:inline">
              Back
            </span>
          </button>

          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
              Customer Profile
            </h1>
            <p className="text-gray-500 text-sm mt-1 font-medium">
              View client details and complete repair history
            </p>
          </div>
        </div>
      </div>

      {/* Top Section: Customer Info Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-50 to-transparent rounded-full -mr-20 -mt-20 opacity-60 z-0 pointer-events-none"></div>

        <div className="relative z-10 w-24 h-24 bg-gradient-to-tr from-blue-600 to-blue-400 text-white rounded-2xl flex items-center justify-center font-black text-4xl shadow-lg shadow-blue-500/20 flex-shrink-0">
          {customer.full_name.charAt(0).toUpperCase()}
        </div>

        <div className="relative z-10 flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900 mb-1">
              {customer.full_name}
            </h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">
              ID: {customer.id.substring(0, 8)}
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-600 font-medium">
                <Phone className="w-4 h-4 text-blue-500" />
                {customer.phone_number}
              </div>
              <div className="flex items-center gap-3 text-gray-600 font-medium">
                <Mail className="w-4 h-4 text-blue-500" />
                {customer.email || (
                  <span className="text-gray-400 italic">
                    No email provided
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="md:border-l md:border-gray-100 md:pl-6 space-y-4">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Address
              </p>
              <p className="text-sm text-gray-700 font-medium leading-relaxed max-w-xs">
                {customer.address}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Client Since
              </p>
              <p className="text-sm text-gray-700 font-medium">
                {new Date(customer.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Job Order History Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col mt-8">
        <div className="px-4 sm:px-7 py-6 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Repair History</h3>
            <p className="text-sm text-gray-500 font-medium">
              Total logged devices: {jobHistory.length}
            </p>
          </div>
        </div>

        {jobHistory.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <CheckCircle2 className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">
              This customer has no recorded job orders yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left border-collapse">
              <thead>
                <tr className="bg-white text-xs uppercase tracking-wider text-gray-400 border-b border-gray-100">
                  <th className="px-4 sm:px-7 py-4 font-bold">
                    Job Order / ID
                  </th>
                  <th className="px-4 sm:px-7 py-4 font-bold">Date Logged</th>
                  <th className="px-4 sm:px-7 py-4 font-bold">
                    Device Details
                  </th>
                  <th className="px-4 sm:px-7 py-4 font-bold">
                    Reported Issue
                  </th>
                  <th className="px-4 sm:px-7 py-4 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {jobHistory.map((job) => (
                  <tr
                    key={job.job_order_no}
                    className="hover:bg-blue-50/30 transition-colors"
                  >
                    <td className="px-4 sm:px-7 py-5">
                      <p className="font-bold text-gray-900">
                        #{job.job_order_no}
                      </p>
                      {job.tracking_id && (
                        <p className="text-[10px] font-bold text-blue-500 tracking-widest mt-0.5">
                          {job.tracking_id}
                        </p>
                      )}
                    </td>
                    <td className="px-4 sm:px-7 py-5 text-sm font-medium text-gray-600">
                      {new Date(job.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 sm:px-7 py-5">
                      <p className="text-sm font-bold text-gray-800">
                        {job.brand} {job.model}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        SN: {job.serial_number}
                      </p>
                    </td>
                    <td
                      className="px-4 sm:px-7 py-5 max-w-xs truncate text-sm text-gray-600 font-medium"
                      title={job.complaint_notes}
                    >
                      {job.complaint_notes}
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
