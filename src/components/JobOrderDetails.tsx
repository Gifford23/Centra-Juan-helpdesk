import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Wrench,
  Calendar,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  Printer,
  CheckCircle2,
  Tag,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { printJobOrder } from "../utils/printJobOrder";

export default function JobOrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [jobData, setJobData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) fetchJobDetails();
  }, [id]);

  const fetchJobDetails = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("job_orders")
        .select("*, customers(*)")
        .eq("job_order_no", id)
        .single();

      if (error) throw error;
      if (data) setJobData(data);
    } catch (error) {
      console.error("Error fetching job details:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
        <p className="text-gray-500 font-medium">Loading ticket details...</p>
      </div>
    );
  }

  if (!jobData) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Ticket Not Found
        </h2>
        <p className="text-gray-500 mb-6">
          This job order may have been deleted or does not exist.
        </p>
        <button
          onClick={() => navigate("/queue")}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold"
        >
          Return to Queue
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors shadow-sm"
          >
            <div className="flex items-center gap-2">
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-bold">Go back</span>
            </div>
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              Ticket #{jobData.job_order_no}
              <span
                className={`px-3 py-1 text-sm font-bold border rounded-lg ${getStatusBadge(jobData.status)}`}
              >
                {jobData.status}
              </span>
            </h1>
            <p className="text-gray-500 text-sm mt-1 font-medium tracking-wide">
              Tracking ID:{" "}
              <span className="font-bold text-blue-600">
                {jobData.tracking_id || "N/A"}
              </span>
            </p>
          </div>
        </div>

        <button
          onClick={() => printJobOrder(jobData.job_order_no.toString())}
          className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95"
        >
          <Printer className="w-4 h-4" /> Print Ticket
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <User className="w-24 h-24" />
            </div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <User className="w-4 h-4" /> Customer Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">
                  Full Name
                </p>
                <p className="font-bold text-gray-900">
                  {jobData.customers?.full_name}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">
                  Phone Number
                </p>
                <p className="font-bold text-gray-900 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />{" "}
                  {jobData.customers?.phone_number}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">
                  Email Address
                </p>
                <p className="font-bold text-gray-900 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />{" "}
                  {jobData.customers?.email || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">
                  Home Address
                </p>
                <p className="font-bold text-gray-900 flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5" />{" "}
                  {jobData.customers?.address}
                </p>
              </div>
            </div>
          </div>

          {/* Device & Complaint Info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <Wrench className="w-24 h-24" />
            </div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Wrench className="w-4 h-4" /> Device & Issue Report
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pb-6 border-b border-gray-100">
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">Type</p>
                <p className="font-bold text-gray-900">
                  {jobData.device_type || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">Brand</p>
                <p className="font-bold text-gray-900">{jobData.brand}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">Model</p>
                <p className="font-bold text-gray-900">{jobData.model}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">
                  Serial No.
                </p>
                <p
                  className="font-bold text-gray-900 truncate"
                  title={jobData.serial_number}
                >
                  {jobData.serial_number || "N/A"}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">
                  Issue Category
                </p>
                <span className="inline-flex bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm font-bold border border-gray-200">
                  {jobData.issue_category || "Uncategorized"}
                </span>
              </div>
              <div className="bg-red-50/50 p-4 rounded-xl border border-red-100">
                <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> Nature of Complaint
                </p>
                <p className="text-sm font-medium text-gray-900 whitespace-pre-wrap">
                  {jobData.complaint_notes}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" /> Visual Checks / Physical
                  Damage
                </p>
                <p className="text-sm font-medium text-gray-700">
                  {jobData.visual_checks || "No physical damage noted."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Image & Meta */}
        <div className="lg:col-span-1 space-y-6">
          {/* Action / Meta Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
              Ticket Metadata
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-gray-50">
                <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                  <Calendar className="w-4 h-4" /> Date Logged
                </div>
                <p className="font-bold text-gray-900 text-sm text-right">
                  {new Date(jobData.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="flex items-center justify-between pb-4 border-b border-gray-50">
                <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                  <Tag className="w-4 h-4" /> Priority Level
                </div>
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded border uppercase tracking-wider ${jobData.priority === "High" || jobData.priority === "Critical" ? "bg-red-50 text-red-600 border-red-200" : "bg-gray-50 text-gray-500 border-gray-200"}`}
                >
                  {jobData.priority || "Normal"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                  <ShieldCheck className="w-4 h-4" /> Assigned Tech
                </div>
                <p
                  className={`font-bold text-sm text-right ${jobData.assigned_tech === "Unassigned" ? "text-red-500" : "text-blue-600"}`}
                >
                  {jobData.assigned_tech || "Unassigned"}
                </p>
              </div>
            </div>
          </div>

          {/* Uploaded Image Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-gray-500" />
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest">
                Attached Image
              </h3>
            </div>
            <div className="p-4 flex-1 flex flex-col items-center justify-center bg-gray-50 min-h-[200px]">
              {jobData.image_url ? (
                <a
                  href={jobData.image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block relative group rounded-xl overflow-hidden shadow-sm border border-gray-200"
                >
                  <img
                    src={jobData.image_url}
                    alt="Customer Upload"
                    className="w-full max-h-[300px] object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white font-bold text-sm bg-black/50 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                      Click to Enlarge
                    </span>
                  </div>
                </a>
              ) : (
                <div className="text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ImageIcon className="w-5 h-5 text-gray-300" />
                  </div>
                  <p className="text-sm font-bold text-gray-500">
                    No Image Uploaded
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    The customer did not attach a photo.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
