import { useState } from 'react';
import { Search, CheckCircle2, Clock, Wrench, Package } from 'lucide-react';

export default function TrackRepair() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearched, setIsSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // In the future, this will query Supabase!
    setIsSearched(true);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 md:p-10 rounded-xl shadow-sm border border-gray-100 mt-10 font-sans">
      
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Track Your Repair</h1>
        <p className="text-gray-500 mt-2">Central Juan I.T. Solutions</p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-10">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
            placeholder="Enter your Job Order No. (e.g., 1416)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Track
        </button>
      </form>

      {/* The Timeline (Only shows after searching) */}
      {isSearched && (
        <div className="border-t border-gray-100 pt-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800">Job Order #{searchQuery || '1416'}</h2>
            <p className="text-gray-600 text-sm">Device: Acer Aspire 5 • Status: <span className="font-semibold text-amber-600">Waiting for Parts</span></p>
          </div>

          {/* Timeline Items */}
          <div className="relative border-l-2 border-gray-200 ml-3 space-y-8">
            
            {/* Current Active Status */}
            <div className="relative pl-8">
              <span className="absolute -left-[11px] bg-white p-1">
                <Clock className="w-5 h-5 text-amber-500" />
              </span>
              <h3 className="font-semibold text-gray-900">Waiting for Parts</h3>
              <p className="text-sm text-gray-500 mt-1">Today, 2:30 PM</p>
              <p className="text-sm text-gray-700 mt-2 bg-amber-50 p-3 rounded-md border border-amber-100">
                Diagnosed dead motherboard. Customer approved replacement cost. Part ordered from supplier in Manila.
              </p>
            </div>

            {/* Past Status */}
            <div className="relative pl-8">
              <span className="absolute -left-[11px] bg-white p-1">
                <Wrench className="w-5 h-5 text-blue-500" />
              </span>
              <h3 className="font-semibold text-gray-900">Diagnosing</h3>
              <p className="text-sm text-gray-500 mt-1">Yesterday, 1:00 PM</p>
              <p className="text-sm text-gray-700 mt-2">Device assigned to technician for hardware testing.</p>
            </div>

            {/* First Status */}
            <div className="relative pl-8">
              <span className="absolute -left-[11px] bg-white p-1">
                <Package className="w-5 h-5 text-green-500" />
              </span>
              <h3 className="font-semibold text-gray-900">Received</h3>
              <p className="text-sm text-gray-500 mt-1">Yesterday, 9:15 AM</p>
              <p className="text-sm text-gray-700 mt-2">Device dropped off at C.M. Recto Branch. Initial 350 PHP diagnostic fee applied.</p>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}