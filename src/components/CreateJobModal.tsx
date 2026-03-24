import { X } from "lucide-react";

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateJobModal({
  isOpen,
  onClose,
}: CreateJobModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Dark Overlay (Clicking it also closes the modal) */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Slide-over Panel */}
      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
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
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body (Scrollable Form) */}
        <div className="flex-1 overflow-y-auto p-6">
          <form className="space-y-6">
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
                <div className="flex gap-4">
                  <input
                    type="tel"
                    placeholder="Phone Number *"
                    required
                    className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-sm"
                  />
                  <input
                    type="email"
                    placeholder="Email (Optional)"
                    className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-sm"
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
                <div className="flex gap-4">
                  <select
                    required
                    className="w-1/3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-sm bg-white"
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
                    className="w-1/3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Exact Model *"
                    required
                    className="w-1/3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-sm"
                  />
                </div>
                <div className="flex gap-4">
                  <input
                    type="text"
                    placeholder="Serial Number"
                    className="w-2/3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Device PIN/Password"
                    className="w-1/3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-sm"
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
            <div className="pt-4 border-t border-gray-100 bg-amber-50 p-3 rounded-lg border border-amber-100">
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
        </div>

        {/* Modal Footer (Action Buttons) */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            Create & Print Job Order
          </button>
        </div>
      </div>
    </div>
  );
}
