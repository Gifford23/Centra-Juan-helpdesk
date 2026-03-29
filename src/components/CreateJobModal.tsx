import { useEffect, useRef, useState } from "react";
import { Loader2, X, AlertCircle, Copy, ChevronDown } from "lucide-react";
import formIcon from "../assets/icons/form.png";
import check2Icon from "../assets/icons/check2.png";
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
  const [showCopySuccessDialog, setShowCopySuccessDialog] = useState(false);
  const [copyFeedbackMessage, setCopyFeedbackMessage] = useState("");
  const copyDialogTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyDialogTimeoutRef.current) {
        window.clearTimeout(copyDialogTimeoutRef.current);
      }
    };
  }, []);

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
    } catch (error: unknown) {
      console.error("Error saving job order:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "An error occurred while saving.",
      );
      setIsSubmitting(false);
    }
  };

  const handleCloseAndRefresh = () => {
    setSuccessTrackingId("");
    setShowCopySuccessDialog(false);
    setCopyFeedbackMessage("");
    onClose();
    window.location.reload(); // Refresh to see the new data in tables
  };

  const handleCopyTrackingId = async () => {
    try {
      await navigator.clipboard.writeText(successTrackingId);
      setCopyFeedbackMessage("Tracking ID copied successfully!");
      setShowCopySuccessDialog(true);

      if (copyDialogTimeoutRef.current) {
        window.clearTimeout(copyDialogTimeoutRef.current);
      }

      copyDialogTimeoutRef.current = window.setTimeout(() => {
        setShowCopySuccessDialog(false);
      }, 1500);
    } catch {
      setCopyFeedbackMessage("Unable to copy. Please try again.");
      setShowCopySuccessDialog(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
      <div
        className="absolute inset-0 bg-slate-900/55 backdrop-blur-md transition-opacity"
        onClick={() => {
          if (!isSubmitting && !successTrackingId) onClose();
        }}
      ></div>

      <div className="relative w-full max-w-3xl bg-gradient-to-b from-white to-slate-50/80 rounded-[28px] shadow-[0_24px_70px_rgba(15,23,42,0.24)] border border-slate-200/70 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* SUCCESS SCREEN */}
        {successTrackingId ? (
          <div className="relative p-6 sm:p-12 flex flex-col items-center justify-center text-center bg-gradient-to-b from-white to-blue-50/30 h-full">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 relative">
              <img
                src={check2Icon}
                alt="Success"
                className="w-10 h-10 object-contain"
              />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-sm">
                <img
                  src={formIcon}
                  alt="Form"
                  className="w-4 h-4 object-contain"
                />
              </div>
            </div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2">
              Job Order Created!
            </h2>
            <p className="text-gray-500 font-medium mb-8">
              Please write this tracking number on the customer's receipt.
            </p>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 w-full max-w-md relative group shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
              <p className="text-xs font-black text-slate-400 uppercase tracking-[0.14em] mb-1">
                Official Tracking ID
              </p>
              <p className="text-3xl sm:text-[2rem] font-black text-blue-600 tracking-wider break-all">
                {successTrackingId}
              </p>
              <button
                onClick={handleCopyTrackingId}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors tooltip"
                title="Copy ID"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>

            {showCopySuccessDialog && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/30 backdrop-blur-[2px]">
                <div className="mx-4 w-full max-w-xs rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl text-center">
                  <img
                    src={check2Icon}
                    alt="Success"
                    className="w-10 h-10 object-contain mx-auto mb-3"
                  />
                  <h3 className="text-lg font-black text-slate-900 mb-1">
                    Copy Complete
                  </h3>
                  <p className="text-sm text-slate-600 font-medium">
                    {copyFeedbackMessage}
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={handleCloseAndRefresh}
              className="bg-blue-600 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-blue-600/25 hover:bg-blue-700 transition-colors active:scale-95"
            >
              Done & Return to Dashboard
            </button>
          </div>
        ) : (
          <>
            {/* Standard Modal Header */}
            <div className="flex items-center justify-between px-4 sm:px-8 py-5 border-b border-slate-200/80 bg-gradient-to-r from-blue-50/70 via-white to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white text-blue-600 border border-blue-200 flex items-center justify-center shadow-sm">
                  <img
                    src={formIcon}
                    alt="Form"
                    className="w-5 h-5 object-contain"
                  />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                    Official Job Order
                  </h2>
                  <p className="text-sm text-slate-500 font-semibold mt-0.5">
                    Central Juan I.T. Solutions
                  </p>
                </div>
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
              <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-[3px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white px-10 py-8 shadow-2xl">
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
              className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 bg-gradient-to-b from-slate-50/40 to-white"
              onSubmit={handleSubmit}
            >
              {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm">
                  <AlertCircle className="w-5 h-5" />
                  {errorMessage}
                </div>
              )}

              {/* SECTION 1: CUSTOMER DETAILS */}
              <section className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-[0_8px_22px_rgba(15,23,42,0.04)]">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] mb-4">
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
              </section>

              {/* SECTION 2: EQUIPMENT DETAILS */}
              <section className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-[0_8px_22px_rgba(15,23,42,0.04)]">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] mb-4">
                  Equipment Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="relative">
                    <select
                      name="deviceType"
                      required
                      className="w-full px-4 pr-10 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium shadow-sm appearance-none cursor-pointer"
                    >
                      <option value="">Device Type *</option>
                      <option value="Laptop">Laptop</option>
                      <option value="Desktop">Desktop</option>
                      <option value="Printer">Printer</option>
                      <option value="Other">Other</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
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
              </section>

              {/* SECTION 3: NATURE OF COMPLAINT */}
              <section className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-[0_8px_22px_rgba(15,23,42,0.04)]">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] mb-4">
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
              </section>

              {/* SECTION 4: TERMS AND CONDITIONS */}
              <section className="rounded-2xl border border-blue-100/90 bg-gradient-to-br from-blue-50 to-white p-5 sm:p-6 shadow-[0_8px_22px_rgba(59,130,246,0.08)]">
                <div className="rounded-xl border border-blue-100 bg-white/60 p-5">
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
              </section>
            </form>

            <div className="px-4 sm:px-8 py-5 border-t border-slate-200/80 bg-white/95 flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-3 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors active:scale-95"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="create-job-form"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-3 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 active:scale-95"
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
