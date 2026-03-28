import { useState } from "react";
import Chatbot from "./Chatbot";
import {
  Search,
  CheckCircle2,
  Clock,
  Wrench,
  Package,
  ArrowRight,
  MapPin,
  Laptop,
  AlertCircle,
  Loader2,
} from "lucide-react";
import background from "../assets/background.png";
import technician from "../assets/technician.png";
import { supabase } from "../lib/supabase";

export default function TrackRepair() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearched, setIsSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [jobData, setJobData] = useState<any>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError("");
    setIsSearched(false);
    setJobData(null);

    try {
      // Query Supabase for the specific Job Order Number
      const { data, error: fetchError } = await supabase
        .from("job_orders")
        .select(
          `
          *,
          customers ( full_name )
        `,
        )
        .eq("tracking_id", searchQuery.trim().toUpperCase())
        .single(); // We only want one exact match

      if (fetchError) throw fetchError;
      if (!data) throw new Error("Not found");

      setJobData(data);
      setIsSearched(true);
    } catch (err) {
      console.error("Error fetching job order:", err);
      setError(
        "We couldn't find a Job Order with that number. Please check and try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to determine the progress bar state
  const getProgressStep = (status: string) => {
    if (status === "Ready" || status === "Released") return 3;
    if (status === "Received" || status === "Pending Drop-off") return 1;
    return 2; // Diagnosing, In Progress, Waiting on Parts
  };

  return (
    <div
      className="min-h-screen bg-gray-50 font-sans pb-12"
      style={{
        backgroundImage: `url(${background})`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundAttachment: "scroll",
      }}
    >
      {/* ==========================================
          HEADER & BRANDING
      ========================================== */}
      <div className="pt-16 pb-8 text-center px-4">
        <div className="mx-auto w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md mb-4">
          <img
            src={technician}
            alt="Technician"
            className="w-10 h-10 object-cover"
          />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
          Track Your Repair
        </h1>
        <p className="mt-2 text-gray-700 font-medium max-w-xl mx-auto">
          Enter your Job Order Number to get real-time updates on your device's
          status at Central Juan.
        </p>
      </div>
      {/* ==========================================
          SEARCH CONTAINER (Elevated Card)
      ========================================== */}
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl shadow-blue-900/5 border border-gray-100 overflow-hidden">
          <div className="p-6 md:p-8">
            <form
              onSubmit={handleSearch}
              className="flex flex-col md:flex-row gap-4"
            >
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-6 w-6 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-blue-600 outline-none transition-colors uppercase"
                  placeholder="Tracking ID (e.g., CJ-8X9P2M4Q)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl text-lg font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 md:w-auto w-full disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Searching...
                  </>
                ) : (
                  <>
                    Track Status <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-center gap-3 animate-in fade-in">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}
          </div>

          {/* ==========================================
              SEARCH RESULTS (Live Data!)
          ========================================== */}
          {isSearched && jobData && (
            <div className="border-t border-gray-100 bg-gray-50/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Top Banner: Quick Summary */}
              <div className="px-4 sm:px-6 py-5 md:px-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Official Tracking ID
                  </p>

                  {/* YOU APPLIED THIS CHANGE PERFECTLY HERE: */}
                  <h2 className="text-2xl font-black text-blue-900">
                    {jobData.tracking_id}
                  </h2>

                  <p className="text-sm font-medium text-gray-600 mt-1">
                    Customer:{" "}
                    <span className="font-bold text-gray-900">
                      {jobData.customers?.full_name}
                    </span>
                  </p>
                </div>
                <div className="flex flex-col items-start md:items-end gap-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg w-fit">
                    <Laptop className="w-4 h-4 text-gray-500" />
                    {jobData.brand} {jobData.model}
                  </div>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Priority:{" "}
                    <span
                      className={
                        jobData.priority === "High"
                          ? "text-red-600"
                          : "text-blue-600"
                      }
                    >
                      {jobData.priority}
                    </span>
                  </span>
                </div>
              </div>

              {/* The Horizontal Progress Stepper */}
              <div className="px-4 sm:px-6 py-8 md:px-8">
                <div className="relative flex items-center justify-between max-w-md mx-auto mb-10">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full z-0"></div>

                  {/* Dynamic Progress Line */}
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 rounded-full z-0 transition-all duration-1000 ease-out"
                    style={{
                      width:
                        getProgressStep(jobData.status) === 1
                          ? "0%"
                          : getProgressStep(jobData.status) === 2
                            ? "50%"
                            : "100%",
                    }}
                  ></div>

                  {/* Step 1: Received */}
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ring-4 ring-white shadow-sm transition-colors ${getProgressStep(jobData.status) >= 1 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-400"}`}
                    >
                      <Package className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-xs font-bold ${getProgressStep(jobData.status) >= 1 ? "text-gray-900" : "text-gray-400"}`}
                    >
                      Received
                    </span>
                  </div>

                  {/* Step 2: In Repair */}
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ring-4 ring-white shadow-sm transition-colors ${getProgressStep(jobData.status) >= 2 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-400"} ${getProgressStep(jobData.status) === 2 ? "ring-blue-100 animate-pulse" : ""}`}
                    >
                      <Wrench className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-xs font-bold ${getProgressStep(jobData.status) >= 2 ? "text-blue-700" : "text-gray-400"}`}
                    >
                      In Repair
                    </span>
                  </div>

                  {/* Step 3: Ready */}
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ring-4 ring-white transition-colors ${getProgressStep(jobData.status) === 3 ? "bg-emerald-500 text-white shadow-sm ring-emerald-100" : "bg-gray-200 text-gray-400"}`}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-xs font-bold ${getProgressStep(jobData.status) === 3 ? "text-emerald-600" : "text-gray-400"}`}
                    >
                      Ready
                    </span>
                  </div>
                </div>

                {/* Detailed Vertical Timeline */}
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6">
                  Latest Updates
                </h3>

                <div className="relative border-l-2 border-gray-200 ml-4 md:ml-6 space-y-8 pb-4">
                  {/* Timeline Item 1: Current Status */}
                  <div className="relative pl-8 md:pl-10">
                    <span className="absolute -left-[17px] bg-blue-100 ring-4 ring-gray-50 rounded-full p-1.5">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </span>
                    <div className="flex flex-col md:flex-row md:items-baseline gap-1 md:gap-3 mb-1">
                      <h4 className="text-base font-bold text-gray-900">
                        {jobData.status}
                      </h4>
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full w-fit">
                        Current Status
                      </span>
                    </div>
                    <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm mt-3">
                      <p className="text-sm font-bold text-gray-800 mb-1">
                        Reported Issue:
                      </p>
                      <p className="text-sm text-gray-600 mb-3">
                        {jobData.complaint_notes}
                      </p>

                      <div className="h-px w-full bg-gray-100 mb-3"></div>

                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                        Technician Assigned
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {jobData.assigned_tech || "Pending Assignment"}
                      </p>
                    </div>
                  </div>

                  {/* Timeline Item 2: Origin (Creation Date) */}
                  <div className="relative pl-8 md:pl-10">
                    <span className="absolute -left-[17px] bg-gray-100 ring-4 ring-gray-50 rounded-full p-1.5">
                      <MapPin className="w-5 h-5 text-gray-500" />
                    </span>
                    <h4 className="text-base font-bold text-gray-800 mb-0.5">
                      Device Received
                    </h4>
                    <p className="text-xs text-gray-500 font-medium mb-2">
                      {new Date(jobData.created_at).toLocaleDateString(
                        "en-US",
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </p>
                    <p className="text-sm text-gray-600">
                      Unit physically dropped off. Initial physical inspection
                      completed and logged into the system.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Chatbot /> {/* ADD IT HERE */}
    </div>
  );
}
