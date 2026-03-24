import { useState } from "react";
import {
  Search,
  CheckCircle2,
  Clock,
  Wrench,
  Package,
  ArrowRight,
  MapPin,
  Laptop,
} from "lucide-react";
import background from "../assets/background.png";
import technician from "../assets/technician.png";

export default function TrackRepair() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearched, setIsSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate network request
    setIsSearched(true);
  };

  return (
    <div
      className="min-h-screen font-sans pb-12"
      style={{
        backgroundImage: `url(${background})`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
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
                  className="block w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-blue-600 outline-none transition-colors"
                  placeholder="Job Order No. (e.g., 1416)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl text-lg font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 md:w-auto w-full"
              >
                Track Status <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          </div>

          {/* ==========================================
              SEARCH RESULTS (Only shows after searching)
          ========================================== */}
          {isSearched && (
            <div className="border-t border-gray-100 bg-gray-50/50">
              {/* Top Banner: Quick Summary */}
              <div className="px-6 py-5 md:px-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Official Job Order
                  </p>
                  <h2 className="text-2xl font-black text-blue-900">
                    #{searchQuery || "1416"}
                  </h2>
                </div>
                <div className="flex items-center gap-3 text-sm font-medium text-gray-700 bg-gray-100 px-4 py-2 rounded-lg w-fit">
                  <Laptop className="w-5 h-5 text-gray-500" />
                  Acer Aspire 5 A515
                </div>
              </div>

              {/* The Horizontal Progress Stepper */}
              <div className="px-6 py-8 md:px-8">
                <div className="relative flex items-center justify-between max-w-md mx-auto mb-10">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full z-0"></div>
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1/2 h-1 bg-blue-600 rounded-full z-0 transition-all duration-1000"></div>

                  {/* Step 1: Received */}
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center ring-4 ring-white shadow-sm">
                      <Package className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-gray-900">
                      Received
                    </span>
                  </div>

                  {/* Step 2: In Repair (Active) */}
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center ring-4 ring-white shadow-sm ring-blue-100 animate-pulse">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-blue-700">
                      In Repair
                    </span>
                  </div>

                  {/* Step 3: Ready */}
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center ring-4 ring-white">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-gray-400">
                      Ready
                    </span>
                  </div>
                </div>

                {/* The Detailed Vertical Timeline */}
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6">
                  Detailed Tracking Log
                </h3>

                <div className="relative border-l-2 border-gray-200 ml-4 md:ml-6 space-y-8 pb-4">
                  {/* Timeline Item 1: Current (Highlighted) */}
                  <div className="relative pl-8 md:pl-10">
                    <span className="absolute -left-[17px] bg-amber-100 ring-4 ring-gray-50 rounded-full p-1.5">
                      <Clock className="w-5 h-5 text-amber-600" />
                    </span>
                    <div className="flex flex-col md:flex-row md:items-baseline gap-1 md:gap-3 mb-1">
                      <h4 className="text-base font-bold text-gray-900">
                        Waiting for Parts
                      </h4>
                      <span className="text-xs font-semibold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full w-fit">
                        Current Status
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium mb-3">
                      Mar 24, 2026 • 2:30 PM
                    </p>
                    <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
                      <p className="text-sm text-gray-700">
                        Diagnosed dead motherboard. Customer approved
                        replacement cost. Part ordered from supplier in Manila.
                        Estimated arrival in 2-3 business days.
                      </p>
                    </div>
                  </div>

                  {/* Timeline Item 2: Past */}
                  <div className="relative pl-8 md:pl-10">
                    <span className="absolute -left-[17px] bg-gray-100 ring-4 ring-gray-50 rounded-full p-1.5">
                      <Wrench className="w-5 h-5 text-gray-500" />
                    </span>
                    <h4 className="text-base font-bold text-gray-800 mb-0.5">
                      Diagnosing
                    </h4>
                    <p className="text-xs text-gray-500 font-medium mb-2">
                      Mar 23, 2026 • 1:00 PM
                    </p>
                    <p className="text-sm text-gray-600">
                      Device assigned to Technician Mark for complete hardware
                      testing and voltage checking.
                    </p>
                  </div>

                  {/* Timeline Item 3: Origin */}
                  <div className="relative pl-8 md:pl-10">
                    <span className="absolute -left-[17px] bg-gray-100 ring-4 ring-gray-50 rounded-full p-1.5">
                      <MapPin className="w-5 h-5 text-gray-500" />
                    </span>
                    <h4 className="text-base font-bold text-gray-800 mb-0.5">
                      Device Received
                    </h4>
                    <p className="text-xs text-gray-500 font-medium mb-2">
                      Mar 23, 2026 • 9:15 AM
                    </p>
                    <p className="text-sm text-gray-600">
                      Unit physically dropped off at C.M. Recto Branch. Initial
                      physical inspection completed and diagnostic fee applied.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
