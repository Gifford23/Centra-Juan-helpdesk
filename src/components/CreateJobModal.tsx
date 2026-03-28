import { useState } from "react";
import {
  Loader2,
  X,
  AlertCircle,
  CheckCircle2,
  Copy,
  ChevronDown,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { logSystemAction } from "../utils/auditLog";

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateJobModal({
  isOpen,
  onClose,
}: CreateJobModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successTrackingId, setSuccessTrackingId] = useState("");

  // Function to generate a secure J&T style tracking ID
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
    const newTrackingId = generateTrackingId(); // Generate the ID!

    try {
      // 1. Insert the Customer
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

      // 2. Insert the Job Order with the new Tracking ID
      const { error: jobOrderError } = await supabase
        .from("job_orders")
        .insert([
          {
            customer_id: customerData.id,
            tracking_id: newTrackingId, // Save the Tracking ID!
            device_type: formData.get("deviceType") || "Not Specified",
            brand: formData.get("brand"),
            model: formData.get("model"),
            serial_number: formData.get("serialNumber"),
            visual_checks: formData.get("visualChecks"),
            issue_category: formData.get("issueCategory") || "General",
            complaint_notes: formData.get("complaint"),
            status: "Received",
            priority: "Normal",
          },
        ]);

      if (jobOrderError) throw jobOrderError;

      const savedUser = JSON.parse(
        localStorage.getItem("central_juan_user") || "{}",
      );
      await logSystemAction({
        userName: savedUser?.full_name || "Unknown User",
        action: "Created job order",
        details: `Created job order with tracking ID ${newTrackingId}`,
      });

      // Show the success screen with the Tracking ID
      setIsSubmitting(false);
      setSuccessTrackingId(newTrackingId);
    } catch (error: any) {
      console.error("Error saving job order:", error);
      setErrorMessage(error.message || "An error occurred while saving.");
      setIsSubmitting(false);
    }
  };

  const handleCloseAndRefresh = () => {
    setSuccessTrackingId("");
    onClose();
    window.location.reload(); // Refresh to see the new data in tables
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
        onClick={() => {
          if (!isSubmitting && !successTrackingId) onClose();
        }}
      ></div>

      <div className="relative w-full max-w-3xl bg-white rounded-[24px] shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* SUCCESS SCREEN */}
        {successTrackingId ? (
          <div className="p-6 sm:p-12 flex flex-col items-center justify-center text-center bg-white h-full">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2">
              Job Order Created!
            </h2>
            <p className="text-gray-500 font-medium mb-8">
              Please write this tracking number on the customer's receipt.
            </p>

            <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-6 mb-8 w-full max-w-md relative group">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                Official Tracking ID
              </p>
              <p className="text-4xl font-black text-blue-600 tracking-wider">
                {successTrackingId}
              </p>
              <button
                onClick={() => navigator.clipboard.writeText(successTrackingId)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors tooltip"
                title="Copy ID"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={handleCloseAndRefresh}
              className="bg-blue-600 text-white px-8 py-3.5 rounded-xl font-bold shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-colors active:scale-95"
            >
              Done & Return to Dashboard
            </button>
          </div>
        ) : (
          <>
            {/* Standard Modal Header */}
            <div className="flex items-center justify-between px-4 sm:px-8 py-5 border-b border-gray-100 bg-white">
              <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight uppercase">
                  Official Job Order
                </h2>
                <p className="text-sm text-gray-500 font-medium mt-0.5">
                  Central Juan I.T. Solutions
                </p>
              </div>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isSubmitting && (
              <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-[2px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-gray-100 bg-white px-10 py-8 shadow-xl">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  <p className="text-sm font-bold text-gray-900">
                    Saving to Database...
                  </p>
                </div>
              </div>
            )}

            {/* Standard Modal Body */}
            <form
              id="create-job-form"
              className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 bg-gray-50/30"
              onSubmit={handleSubmit}
            >
              {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  {errorMessage}
                </div>
              )}

              {/* SECTION 1: CUSTOMER DETAILS */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                  Customer Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      name="customerName"
                      placeholder="Customer Name *"
                      required
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-sm font-medium placeholder:text-gray-400 shadow-sm"
                    />
                  </div>
                  <input
                    type="tel"
                    name="phoneNumber"
                    placeholder="Tel. / Mobile No. *"
                    required
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-sm font-medium placeholder:text-gray-400 shadow-sm"
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-sm font-medium placeholder:text-gray-400 shadow-sm"
                  />
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      name="address"
                      placeholder="Complete Address *"
                      required
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-sm font-medium placeholder:text-gray-400 shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: EQUIPMENT DETAILS */}
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                  Equipment Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <select
                    name="deviceType"
                    required
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium shadow-sm appearance-none cursor-pointer"
                  >
                    <option value="">Device Type *</option>
                    <option value="Laptop">Laptop</option>
                    <option value="Desktop">Desktop</option>
                    <option value="Printer">Printer</option>
                    <option value="Other">Other</option>
                  </select>
                  <input
                    type="text"
                    name="brand"
                    placeholder="Brand *"
                    required
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium placeholder:text-gray-400 shadow-sm"
                  />
                  <input
                    type="text"
                    name="model"
                    placeholder="Model *"
                    required
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium placeholder:text-gray-400 shadow-sm"
                  />
                  <input
                    type="text"
                    name="serialNumber"
                    placeholder="Serial No. *"
                    required
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium placeholder:text-gray-400 shadow-sm md:col-span-3"
                  />
                  <div className="md:col-span-3">
                    <textarea
                      name="visualChecks"
                      rows={2}
                      placeholder="Visual Checks (Please indicate notable marks/defects, etc.) *"
                      required
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium placeholder:text-gray-400 shadow-sm resize-none"
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* SECTION 3: NATURE OF COMPLAINT */}
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                  Nature of Complaint
                </h3>
                <div className="space-y-5">
                  <div className="relative">
                    <select
                      name="issueCategory"
                      required
                      className="w-full px-4 pr-10 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium shadow-sm appearance-none cursor-pointer"
                    >
                      <option value="">Primary Issue Category *</option>
                      <option value="Hardware">
                        Hardware / Physical Damage
                      </option>
                      <option value="Software">Software / OS / Virus</option>
                      <option value="No Power">No Power / Boot Issue</option>
                      <option value="Upgrade">Upgrades / Installation</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  <textarea
                    name="complaint"
                    rows={3}
                    placeholder="Describe the exact issue reported by the customer..."
                    required
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium placeholder:text-gray-400 shadow-sm resize-none"
                  ></textarea>
                </div>
              </div>

              {/* SECTION 4: TERMS AND CONDITIONS */}
              <div className="pt-6 border-t border-gray-200">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
                  <h4 className="text-sm font-black text-blue-900 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> Terms and Conditions
                    Agreement
                  </h4>
                  <ul className="text-xs text-blue-800 space-y-2 list-disc pl-4 font-medium">
                    <li>
                      A minimum fee of 150.00 Pesos for the inspection and
                      diagnostic checks.
                    </li>
                    <li>
                      Customer is responsible for data backup before repair.
                      Central Juan is not responsible for data loss for any
                      reason.
                    </li>
                    <li>
                      All parts replaced are subject to 3 months warranty.
                    </li>
                    <li>
                      There will be a 30 days warranty of labor in relation to
                      the original complaint.
                    </li>
                    <li>
                      Unable to claim the item within 90 days after advised to
                      claim regardless of the state of the repair, Central Juan
                      has the right to dispose the unit.
                    </li>
                  </ul>
                  <label className="flex items-start gap-3 cursor-pointer mt-5 pt-4 border-t border-blue-200/50">
                    <input
                      type="checkbox"
                      required
                      className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-sm text-blue-900 font-bold leading-tight">
                      I confirm that the customer has read and verbally agreed
                      to the Terms and Conditions listed above.
                    </span>
                  </label>
                </div>
              </div>
            </form>

            <div className="px-4 sm:px-8 py-5 border-t border-gray-100 bg-white flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-3 text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors active:scale-95"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="create-job-form"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-3 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 active:scale-95"
              >
                Submit
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
