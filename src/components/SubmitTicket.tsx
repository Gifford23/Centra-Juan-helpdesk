import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  User,
  Phone,
  Mail,
  MapPin,
  Wrench,
  Copy,
  ArrowRight,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import background from "../assets/background.png";
import technician from "../assets/technician.png";
import { logSystemAction } from "../utils/auditLog";

export default function SubmitTicket() {
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successTrackingId, setSuccessTrackingId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // 1. Check if the admin has enabled Public Tickets
  useEffect(() => {
    const checkSystemStatus = async () => {
      try {
        const { data, error } = await supabase
          .from("system_settings")
          .select("allow_public_tickets")
          .single();

        if (error) throw error;
        setIsAllowed(data.allow_public_tickets);
      } catch (error) {
        console.error("Failed to check system status", error);
        setIsAllowed(false); // Default to closed if we can't verify
      }
    };
    checkSystemStatus();
  }, []);

  // Generate a secure J&T style tracking ID
  const generateTrackingId = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "CJ-";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    const formData = new FormData(e.currentTarget);
    const newTrackingId = generateTrackingId();

    try {
      // 1. Insert the Customer Profile
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .insert([
          {
            full_name: formData.get("customerName"),
            phone_number: formData.get("phoneNumber"),
            email: formData.get("email") || null,
            address: formData.get("address"),
          },
        ])
        .select()
        .single();

      if (customerError) throw customerError;

      // 2. Insert the Job Order as "Pending Drop-off"
      const { error: jobOrderError } = await supabase
        .from("job_orders")
        .insert([
          {
            customer_id: customerData.id,
            tracking_id: newTrackingId,
            device_type: formData.get("deviceType"),
            brand: formData.get("brand"),
            model: formData.get("model"),
            serial_number: formData.get("serialNumber") || "Unknown",
            visual_checks:
              formData.get("visualChecks") || "Not specified by customer",
            issue_category: formData.get("issueCategory"),
            complaint_notes: formData.get("complaint"),
            status: "Pending Drop-off", // Automatically flagged for drop-off!
            priority: "Normal",
            assigned_tech: "Unassigned",
          },
        ]);

      if (jobOrderError) throw jobOrderError;

      await logSystemAction({
        userName: String(formData.get("customerName") || "Guest Customer"),
        action: "Submitted public ticket",
        details: `Tracking ID ${newTrackingId} created via public portal.`,
      });

      // Show Success Screen
      setSuccessTrackingId(newTrackingId);
    } catch (error: any) {
      console.error("Error submitting ticket:", error);
      setErrorMessage(
        "Something went wrong while submitting your request. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show a loading spinner while checking the database settings
  if (isAllowed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  // Show the "Closed" screen if the Super Admin disabled the feature
  if (isAllowed === false) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center"
        style={{
          backgroundImage: `url(${background})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="bg-white p-10 rounded-3xl shadow-xl max-w-md w-full">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">
            Portal Temporarily Closed
          </h2>
          <p className="text-gray-500 font-medium mb-8">
            We are currently not accepting new repair requests online. Please
            visit our physical branch or call our hotline for assistance.
          </p>
          <Link
            to="/track"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
          >
            Track an Existing Repair
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen overflow-x-hidden bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans relative"
      style={{
        backgroundImage: `url(${background})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="absolute inset-0 bg-blue-900/10"></div>

      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="mx-auto w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-blue-900/10 mb-6">
            <img
              src={technician}
              alt="Technician"
              className="w-12 h-12 object-cover"
            />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-2">
            Submit Repair Request
          </h1>
          <p className="text-gray-700 font-medium max-w-xl mx-auto">
            Skip the line! Register your device details below, get your tracking
            number, and drop it off at our branch anytime.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-[24px] shadow-2xl shadow-blue-900/10 overflow-hidden border border-white">
          {/* SUCCESS SCREEN */}
          {successTrackingId ? (
            <div className="p-12 flex flex-col items-center text-center animate-in fade-in zoom-in-95">
              <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">
                Request Submitted!
              </h2>
              <p className="text-gray-500 font-medium mb-8">
                Your device is now registered in our system. Please present this
                tracking number to the front desk when you drop off your device.
              </p>

              <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-6 mb-8 w-full max-w-sm relative group">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                  Official Tracking ID
                </p>
                <p className="text-4xl font-black text-blue-600 tracking-wider">
                  {successTrackingId}
                </p>
                <button
                  onClick={() =>
                    navigator.clipboard.writeText(successTrackingId)
                  }
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Copy ID"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>

              <div className="flex gap-4 w-full max-w-sm">
                <Link
                  to="/track"
                  className="flex-1 bg-blue-600 text-white py-3.5 rounded-xl font-bold shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-colors"
                >
                  Track Status
                </Link>
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 bg-white border border-gray-200 text-gray-700 py-3.5 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                >
                  Submit Another
                </button>
              </div>
            </div>
          ) : (
            /* SUBMISSION FORM */
            <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-8">
              {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />{" "}
                  {errorMessage}
                </div>
              )}

              {/* 1. Customer Information */}
              <div>
                <h3 className="text-sm font-bold text-blue-900 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                  <User className="w-4 h-4" /> Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 relative">
                    <User className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      name="customerName"
                      required
                      placeholder="Full Name *"
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium"
                    />
                  </div>
                  <div className="relative">
                    <Phone className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
                    <input
                      type="tel"
                      name="phoneNumber"
                      required
                      placeholder="Phone Number *"
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium"
                    />
                  </div>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      name="email"
                      placeholder="Email Address"
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium"
                    />
                  </div>
                  <div className="md:col-span-2 relative">
                    <MapPin className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      name="address"
                      required
                      placeholder="Complete Address *"
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Device Details */}
              <div>
                <h3 className="text-sm font-bold text-blue-900 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                  <Wrench className="w-4 h-4" /> Device Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <select
                      name="deviceType"
                      required
                      className="w-full pr-10 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium cursor-pointer appearance-none"
                    >
                      <option value="">Select Device Type *</option>
                      <option value="Laptop">Laptop</option>
                      <option value="Desktop">Desktop PC</option>
                      <option value="Printer">Printer</option>
                      <option value="Other">Other</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5 pointer-events-none" />
                  </div>
                  <div className="relative">
                    <select
                      name="issueCategory"
                      required
                      className="w-full pr-10 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium cursor-pointer appearance-none"
                    >
                      <option value="">Primary Issue *</option>
                      <option value="Hardware">
                        Hardware / Physical Damage
                      </option>
                      <option value="Software">Software / OS / Virus</option>
                      <option value="No Power">No Power / Won't Turn On</option>
                      <option value="Upgrade">Upgrades / Installation</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5 pointer-events-none" />
                  </div>
                  <input
                    type="text"
                    name="brand"
                    required
                    placeholder="Brand (e.g., Acer, HP) *"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium"
                  />
                  <input
                    type="text"
                    name="model"
                    required
                    placeholder="Model *"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium"
                  />

                  {/* SERIAL NUMBER FIELD ADDED HERE */}
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      name="serialNumber"
                      placeholder="Serial Number (If known)"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <textarea
                      name="complaint"
                      required
                      rows={3}
                      placeholder="Please describe the issue in detail..."
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium resize-none"
                    ></textarea>
                  </div>
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      name="visualChecks"
                      placeholder="Any visible physical damage? (Scratches, dents, etc.)"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-xs text-blue-900 font-medium leading-relaxed">
                    I understand that submitting this form registers my device
                    in the Central Juan system. A minimum diagnostic fee of PHP
                    150.00 applies once the device is dropped off and inspected.
                    I am responsible for backing up my data prior to drop-off.
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center gap-2 text-lg"
              >
                {isSubmitting ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    Submit Request <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
