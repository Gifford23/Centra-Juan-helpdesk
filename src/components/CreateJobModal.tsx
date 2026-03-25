import { useState } from "react";
import { Loader2, X, AlertCircle } from "lucide-react";

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateJobModal({
  isOpen,
  onClose,
}: CreateJobModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    window.setTimeout(() => {
      setIsSubmitting(false);
      onClose();
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
      {/* Dark Overlay */}
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
      ></div>

      {/* Centered Modal */}
      <div className="relative w-full max-w-3xl bg-white rounded-[24px] shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 bg-white">
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
                Generating Job Order...
              </p>
            </div>
          </div>
        )}

        {/* Modal Body (Scrollable Form) */}
        <form
          id="create-job-form"
          className="flex-1 overflow-y-auto p-8 space-y-8 bg-gray-50/30"
          onSubmit={handleSubmit}
        >
          {/* ==========================================
              SECTION 1: CUSTOMER DETAILS
          ========================================== */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
              Customer Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="Customer Name *"
                  required
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-sm font-medium placeholder:text-gray-400 shadow-sm"
                />
              </div>
              <input
                type="tel"
                placeholder="Tel. / Mobile No. *"
                required
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-sm font-medium placeholder:text-gray-400 shadow-sm"
              />
              <input
                type="email"
                placeholder="Email Address"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-sm font-medium placeholder:text-gray-400 shadow-sm"
              />
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="Complete Address *"
                  required
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-sm font-medium placeholder:text-gray-400 shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* ==========================================
              SECTION 2: EQUIPMENT DETAILS
          ========================================== */}
          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
              Equipment Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <input
                type="text"
                placeholder="Brand *"
                required
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium placeholder:text-gray-400 shadow-sm"
              />
              <input
                type="text"
                placeholder="Model *"
                required
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium placeholder:text-gray-400 shadow-sm"
              />
              <input
                type="text"
                placeholder="Serial No. *"
                required
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium placeholder:text-gray-400 shadow-sm"
              />
              <div className="md:col-span-3">
                <textarea
                  rows={2}
                  placeholder="Visual Checks (Please indicate notable marks/defects, etc.) *"
                  required
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium placeholder:text-gray-400 shadow-sm resize-none"
                ></textarea>
              </div>
            </div>
          </div>

          {/* ==========================================
              SECTION 3: NATURE OF COMPLAINT
          ========================================== */}
          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
              Nature of Complaint
            </h3>
            <div className="space-y-5">
              <textarea
                rows={3}
                placeholder="Describe the issue reported by the customer..."
                required
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium placeholder:text-gray-400 shadow-sm resize-none"
              ></textarea>
            </div>
          </div>

          {/* ==========================================
              SECTION 4: TERMS AND CONDITIONS
          ========================================== */}
          <div className="pt-6 border-t border-gray-200">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
              <h4 className="text-sm font-black text-blue-900 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Terms and Conditions
                Agreement
              </h4>
              <ul className="text-xs text-blue-800 space-y-2 list-disc pl-4 font-medium">
                <li>
                  A minimum fee of 350.00 Pesos for the inspection and
                  diagnostic checks.
                </li>
                <li>
                  Customer is responsible for data backup before repair. Central
                  Juan is not responsible for data loss for any reason.
                </li>
                <li>All parts replaced are subject to 3 months warranty.</li>
                <li>
                  There will be a 30 days warranty of labor in relation to the
                  original complaint.
                </li>
                <li>
                  Unable to claim the item within 90 days after advised to claim
                  regardless of the state of the repair, Central Juan has the
                  right to dispose the unit.
                </li>
              </ul>

              <label className="flex items-start gap-3 cursor-pointer mt-5 pt-4 border-t border-blue-200/50">
                <input
                  type="checkbox"
                  required
                  className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-sm text-blue-900 font-bold leading-tight">
                  I confirm that the customer has read and verbally agreed to
                  the Terms and Conditions listed above.
                </span>
              </label>
            </div>
          </div>
        </form>

        {/* Modal Footer (Action Buttons) */}
        <div className="px-8 py-5 border-t border-gray-100 bg-white flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-3 text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors active:scale-95"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-job-form"
            disabled={isSubmitting}
            className="px-6 py-3 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 active:scale-95"
          >
            {isSubmitting ? "Processing..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
