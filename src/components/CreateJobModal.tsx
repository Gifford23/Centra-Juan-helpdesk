import { useState } from "react";
import { Loader2, X } from "lucide-react";

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
      {/* Dark Overlay (Clicking it also closes the modal) */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
      ></div>

      {/* Centered Modal */}
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              New Walk-In Repair
            </h2>
            <p className="text-sm text-gray-500">
              Create a new Job Order ticket
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSubmitting && (
          <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-[1px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 rounded-xl border border-gray-200 bg-white px-8 py-6 shadow-lg">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-sm font-semibold text-gray-800">
                Creating job order...
              </p>
              <p className="text-xs text-gray-500">Please wait 2 seconds</p>
            </div>
          </div>
        )}

        {/* Modal Body (Scrollable Form) */}
        <form
          id="create-job-form"
          className="flex-1 overflow-y-auto p-6 space-y-6"
          onSubmit={handleSubmit}
        >
          {/* Customer Section */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="bg-blue-600 w-2 h-2 rounded-full"></span>
              Customer Info
            </h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Full Name *"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-sm"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="tel"
                  placeholder="Phone Number *"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-sm"
                />
                <input
                  type="email"
                  placeholder="Email (Optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-sm"
                />
              </div>
            </div>
          </div>

          {/* Device Section */}
          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="bg-blue-600 w-2 h-2 rounded-full"></span>
              Device Details
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-sm bg-white"
                >
                  <option value="">Type *</option>
                  <option value="Laptop">Laptop</option>
                  <option value="Desktop">Desktop</option>
                  <option value="Printer">Printer</option>
                </select>
                <input
                  type="text"
                  placeholder="Brand *"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-sm"
                />
                <input
                  type="text"
                  placeholder="Exact Model *"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-sm"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Serial Number"
                  className="md:col-span-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-sm"
                />
                <input
                  type="text"
                  placeholder="Device PIN/Password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-sm"
                />
              </div>
            </div>
          </div>

          {/* Issue Section */}
          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="bg-blue-600 w-2 h-2 rounded-full"></span>
              Complaint & Notes
            </h3>
            <div className="space-y-4">
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-sm bg-white"
              >
                <option value="">Primary Issue *</option>
                <option value="No Power">No Power / Won't Turn On</option>
                <option value="Broken Screen">Broken Screen</option>
                <option value="Running Slow">Running Slow / Virus</option>
                <option value="Hardware Upgrade">Hardware Upgrade</option>
              </select>
              <textarea
                rows={3}
                placeholder="Admin Notes (e.g., Missing screws, deep scratch on cover)..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-sm resize-none"
              ></textarea>
            </div>
          </div>

          {/* Terms Agreement */}
          <div className="pt-4 border-t bg-amber-50 p-3 rounded-lg border border-amber-100">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                required
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-amber-900 font-medium">
                Customer verbally agrees to the 350.00 PHP minimum diagnostic
                fee and data loss waiver.
              </span>
            </label>
          </div>
        </form>

        {/* Modal Footer (Action Buttons) */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-job-form"
            disabled={isSubmitting}
            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Submit"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
