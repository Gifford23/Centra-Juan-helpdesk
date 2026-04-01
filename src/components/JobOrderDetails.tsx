import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Wrench,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  Printer,
  Tag,
  Cpu,
  UserCog,
  Clock3,
  Maximize2,
  X,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { printJobOrder } from "../utils/printJobOrder";
import { printCSR } from "../utils/printCSR";
import userIcon from "../assets/icons/user.png";

interface CustomerMini {
  full_name: string;
  phone_number?: string | null;
  email?: string | null;
  address?: string | null;
}

interface JobOrderDetailsRow {
  job_order_no: number;
  created_at: string;
  tracking_id?: string | null;
  status: string;
  priority?: string | null;
  assigned_tech?: string | null;
  device_type?: string | null;
  brand: string;
  model: string;
  serial_number?: string | null;
  issue_category?: string | null;
  complaint_notes?: string | null;
  visual_checks?: string | null;
  image_url?: string | null;
  resolution_notes?: string | null;
  customers: CustomerMini | CustomerMini[] | null;
}

export default function JobOrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [jobData, setJobData] = useState<JobOrderDetailsRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [detailModal, setDetailModal] = useState<"complaint" | "visual" | null>(
    null,
  );

  // Resolution Notes States
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [isSavingResolution, setIsSavingResolution] = useState(false);

  const fetchJobDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("job_orders")
        .select("*, customers(*)")
        .eq("job_order_no", id)
        .single();

      if (error) throw error;
      if (data) {
        setJobData(data as JobOrderDetailsRow);
        setResolutionNotes(data.resolution_notes || "");
      }
    } catch (error) {
      console.error("Error fetching job details:", error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchJobDetails();
  }, [id, fetchJobDetails]);

  const handleSaveResolution = async () => {
    try {
      setIsSavingResolution(true);
      const { error } = await supabase
        .from("job_orders")
        .update({ resolution_notes: resolutionNotes })
        .eq("job_order_no", id);

      if (error) throw error;
      alert("Resolution notes saved successfully!");
      fetchJobDetails();
    } catch (error) {
      console.error("Error saving resolution:", error);
      alert("Failed to save resolution.");
    } finally {
      setIsSavingResolution(false);
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

  const getPriorityBadge = (priority?: string | null) => {
    switch (priority) {
      case "Critical":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "High":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "Medium":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
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

  const customerInfo = Array.isArray(jobData.customers)
    ? jobData.customers[0]
    : jobData.customers;

  const isHighPriority =
    jobData.priority === "High" || jobData.priority === "Critical";

  const detailModalConfig =
    detailModal === "complaint"
      ? {
          title: "Nature of Complaint",
          subtitle: "Full customer-reported issue details",
          content: jobData.complaint_notes || "No complaint notes provided.",
          accent: "text-red-500",
        }
      : detailModal === "visual"
        ? {
            title: "Visual Checks / Physical Damage",
            subtitle: "Inspection and physical condition notes",
            content: jobData.visual_checks || "No physical damage noted.",
            accent: "text-slate-500",
          }
        : null;

  const detailActionButtonClass =
    "inline-flex h-7 min-w-[92px] items-center justify-center gap-1 rounded-md border px-2 py-1 text-[11px] font-bold transition-colors";

  return (
    <div className="relative space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div className="pointer-events-none absolute -top-16 -right-20 h-56 w-56 rounded-full bg-blue-200/35 blur-3xl" />
      <div className="pointer-events-none absolute top-44 -left-24 h-64 w-64 rounded-full bg-cyan-100/35 blur-3xl" />

      <div className="relative overflow-hidden rounded-3xl border border-blue-100/80 bg-gradient-to-br from-white via-blue-50/35 to-cyan-50/25 p-5 sm:p-7 shadow-[0_16px_40px_rgba(30,64,175,0.08)]">
        <div className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-blue-200/30 blur-2xl" />
        <div className="absolute left-0 bottom-0 h-24 w-24 -translate-x-8 translate-y-8 rounded-full bg-cyan-100/50 blur-2xl" />

        <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div className="flex items-start gap-3 sm:gap-4 min-w-0">
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors shadow-sm flex-shrink-0"
            >
              <div className="flex items-center gap-2">
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-black">Go back</span>
              </div>
            </button>

            <div className="min-w-0 -mt-1 sm:-mt-1.5">
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                Ticket #{jobData.job_order_no}
              </h1>
              <p className="text-slate-500 text-sm mt-0.5 font-semibold tracking-wide">
                Tracking ID:{" "}
                <span className="font-black text-blue-600">
                  {jobData.tracking_id || "N/A"}
                </span>
              </p>
            </div>
          </div>

          <div className="w-full lg:w-auto flex flex-col lg:items-end gap-2">
            <span
              className={`inline-flex self-start lg:self-end -mt-2 lg:-mt-3 px-2.5 py-0.5 text-[11px] font-bold border rounded-md ${getStatusBadge(jobData.status)}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current/70 mr-1.5 mt-1" />
              {jobData.status}
            </span>
            <div className="flex gap-2 w-full lg:w-auto">
              <button
                onClick={() => printJobOrder(jobData.job_order_no.toString())}
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition-colors shadow-sm"
              >
                <Printer className="w-4 h-4" /> Ticket
              </button>
              <button
                onClick={() => printCSR(jobData.job_order_no.toString())}
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-5 py-2.5 rounded-xl font-black transition-all shadow-md shadow-emerald-500/25 active:scale-95"
              >
                <FileText className="w-4 h-4" /> Print CSR
              </button>
            </div>
          </div>
        </div>

        <div className="relative mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-rose-200/70 bg-rose-50/70 px-4 py-3 shadow-sm">
            <p className="text-[11px] uppercase tracking-[0.14em] font-black text-rose-500">
              Priority
            </p>
            <p
              className={`text-xl font-black mt-1 ${isHighPriority ? "text-rose-600" : "text-slate-900"}`}
            >
              {jobData.priority || "Normal"}
            </p>
          </div>
          <div className="rounded-2xl border border-blue-200/70 bg-blue-50/70 px-4 py-3 shadow-sm">
            <p className="text-[11px] uppercase tracking-[0.14em] font-black text-blue-500">
              Technician
            </p>
            <p className="text-xl font-black text-blue-700 mt-1 truncate">
              {jobData.assigned_tech || "Unassigned"}
            </p>
          </div>
          <div className="rounded-2xl border border-cyan-200/70 bg-cyan-50/70 px-4 py-3 shadow-sm">
            <p className="text-[11px] uppercase tracking-[0.14em] font-black text-cyan-600">
              Device Type
            </p>
            <p className="text-xl font-black text-cyan-700 mt-1 truncate">
              {jobData.device_type || "N/A"}
            </p>
          </div>
          <div className="rounded-2xl border border-indigo-200/70 bg-indigo-50/70 px-4 py-3 shadow-sm">
            <p className="text-[11px] uppercase tracking-[0.14em] font-black text-indigo-500">
              Date Logged
            </p>
            <p className="text-base sm:text-lg font-black text-indigo-700 mt-1">
              {new Date(jobData.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_12px_28px_rgba(15,23,42,0.06)] p-5 sm:p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <img src={userIcon} alt="" className="w-24 h-24 object-contain" />
            </div>
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <img src={userIcon} alt="" className="w-4 h-4 object-contain" />{" "}
              Customer Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
              <div>
                <p className="text-xs text-slate-500 font-semibold mb-1">
                  Full Name
                </p>
                <p className="font-black text-slate-900">
                  {customerInfo?.full_name || "Unknown Customer"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold mb-1">
                  Phone Number
                </p>
                <p className="font-black text-slate-900 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {customerInfo?.phone_number || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold mb-1">
                  Email Address
                </p>
                <p className="font-black text-slate-900 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {customerInfo?.email || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold mb-1">
                  Home Address
                </p>
                <p className="font-black text-slate-900 flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                  {customerInfo?.address || "N/A"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_12px_28px_rgba(15,23,42,0.06)] p-5 sm:p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <Wrench className="w-24 h-24" />
            </div>
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Wrench className="w-4 h-4" /> Device & Issue Report
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pb-6 border-b border-slate-100">
              <div>
                <p className="text-xs text-slate-500 font-semibold mb-1">
                  Type
                </p>
                <p className="font-black text-slate-900">
                  {jobData.device_type || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold mb-1">
                  Brand
                </p>
                <p className="font-black text-slate-900">{jobData.brand}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold mb-1">
                  Model
                </p>
                <p className="font-black text-slate-900">{jobData.model}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold mb-1">
                  Serial No.
                </p>
                <p
                  className="font-black text-slate-900 truncate"
                  title={jobData.serial_number || "N/A"}
                >
                  {jobData.serial_number || "N/A"}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 font-semibold mb-1">
                  Issue Category
                </p>
                <span className="inline-flex bg-slate-100 text-slate-700 px-3 py-1 rounded-lg text-sm font-black border border-slate-200">
                  {jobData.issue_category || "Uncategorized"}
                </span>
              </div>
              <div className="bg-red-50/50 p-4 rounded-xl border border-red-100">
                <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <p className="text-xs font-black text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> Nature of Complaint
                  </p>
                  <button
                    onClick={() => setDetailModal("complaint")}
                    className={`${detailActionButtonClass} self-start border-red-200 bg-white/80 text-red-600 hover:text-red-700`}
                  >
                    <Maximize2 className="w-3 h-3" /> View full
                  </button>
                </div>
                <p className="text-sm font-medium text-slate-900 whitespace-pre-wrap">
                  {jobData.complaint_notes || "No complaint notes provided."}
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" /> Visual Checks / Physical
                    Damage
                  </p>
                  <button
                    onClick={() => setDetailModal("visual")}
                    className={`${detailActionButtonClass} self-start border-slate-200 bg-white text-slate-600 hover:text-slate-700`}
                  >
                    <Maximize2 className="w-3 h-3" /> View full
                  </button>
                </div>
                <p className="text-sm font-medium text-slate-700">
                  {jobData.visual_checks || "No physical damage noted."}
                </p>
              </div>
            </div>
          </div>

          {/* NEW: RESOLUTION NOTES CARD */}
          <div className="bg-white rounded-3xl border border-emerald-200/80 shadow-[0_12px_28px_rgba(16,185,129,0.06)] p-5 sm:p-6 relative overflow-hidden mt-6">
            <h3 className="text-sm font-black text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Resolution & Action Taken
            </h3>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">
                Final Technician Report (Printed on CSR)
              </p>
              <textarea
                rows={4}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Detail the repairs made, parts replaced, and final checks performed..."
                className="w-full bg-emerald-50/50 border border-emerald-100 rounded-xl text-sm p-4 outline-none focus:ring-2 focus:ring-emerald-500 resize-none font-medium text-slate-800"
              />
              <div className="flex justify-end mt-3">
                <button
                  onClick={handleSaveResolution}
                  disabled={isSavingResolution}
                  className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-bold px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
                >
                  {isSavingResolution ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Save Resolution Notes"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_12px_28px_rgba(15,23,42,0.06)] p-5 sm:p-6">
            <h3 className="text-sm font-black text-blue-500 uppercase tracking-widest mb-4">
              Ticket Metadata
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2 text-sm text-indigo-600 font-semibold">
                  <Clock3 className="w-4 h-4" /> Date Logged
                </div>
                <p className="font-black text-slate-900 text-sm text-right">
                  {new Date(jobData.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2 text-sm text-rose-600 font-semibold">
                  <Tag className="w-4 h-4" /> Priority Level
                </div>
                <span
                  className={`text-[10px] font-black px-2.5 py-1 rounded border uppercase tracking-wider ${getPriorityBadge(jobData.priority)}`}
                >
                  {jobData.priority || "Normal"}
                </span>
              </div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2 text-sm text-blue-600 font-semibold">
                  <UserCog className="w-4 h-4" /> Assigned Tech
                </div>
                <p
                  className={`font-black text-sm text-right ${jobData.assigned_tech === "Unassigned" ? "text-rose-500" : "text-blue-600"}`}
                >
                  {jobData.assigned_tech || "Unassigned"}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-cyan-600 font-semibold">
                  <Cpu className="w-4 h-4" /> Current Status
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-1 text-[10px] font-black rounded border uppercase tracking-wider ${getStatusBadge(jobData.status)}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current/70 mr-1.5" />
                  {jobData.status}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_12px_28px_rgba(15,23,42,0.06)] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">
                Attached Image
              </h3>
            </div>
            <div className="p-4 flex-1 flex flex-col items-center justify-center bg-slate-50 min-h-[220px]">
              {jobData.image_url ? (
                <a
                  href={jobData.image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block relative group rounded-xl overflow-hidden shadow-sm border border-slate-200"
                >
                  <img
                    src={jobData.image_url}
                    alt="Customer Upload"
                    className="w-full max-h-[320px] object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white font-black text-sm bg-black/50 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                      Click to Enlarge
                    </span>
                  </div>
                </a>
              ) : (
                <div className="text-center">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ImageIcon className="w-5 h-5 text-slate-300" />
                  </div>
                  <p className="text-sm font-black text-slate-500">
                    No Image Uploaded
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    The customer did not attach a photo.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {detailModalConfig && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setDetailModal(null)}
          />

          <div className="relative w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-start justify-between gap-4">
              <div>
                <p
                  className={`text-[11px] uppercase tracking-[0.14em] font-black mb-1 ${detailModalConfig.accent}`}
                >
                  Technician Read Mode
                </p>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                  {detailModalConfig.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  {detailModalConfig.subtitle}
                </p>
              </div>

              <button
                onClick={() => setDetailModal(null)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Close details modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 sm:px-6 py-5 max-h-[60vh] overflow-y-auto">
              <p className="text-sm sm:text-[15px] leading-relaxed text-slate-800 whitespace-pre-wrap">
                {detailModalConfig.content}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
