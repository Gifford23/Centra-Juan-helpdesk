import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Mail,
  Phone,
  MapPin,
  UserPlus,
  ExternalLink,
  Loader2,
  Users,
} from "lucide-react";
import { supabase } from "../lib/supabase"; // Import Supabase

export default function CustomersContent() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Initialize the navigate function!
  const navigate = useNavigate();

  // Fetch customers when the page loads
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);

      // Query Supabase: Get customers AND their associated job orders
      const { data, error } = await supabase
        .from("customers")
        .select(
          `
          id,
          created_at,
          full_name,
          phone_number,
          email,
          address,
          job_orders (
            created_at
          )
        `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedCustomers = data.map((c: any) => {
          const repairsCount = c.job_orders ? c.job_orders.length : 0;

          // Calculate the most recent visit based on their job orders
          let lastVisitDate = "No repairs yet";
          if (c.job_orders && c.job_orders.length > 0) {
            const dates = c.job_orders.map((j: any) =>
              new Date(j.created_at).getTime(),
            );
            const latest = new Date(Math.max(...dates));
            lastVisitDate = latest.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
          }

          return {
            id: c.id,
            shortId: c.id.substring(0, 8).toUpperCase(), // Shorten the UUID for display
            name: c.full_name,
            phone: c.phone_number,
            email: c.email || "No Email Provided",
            address: c.address,
            repairs: repairsCount,
            lastVisit: lastVisitDate,
          };
        });

        setCustomers(formattedCustomers);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Simple filter for the search bar
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Customer Directory
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage client profiles and repair history
          </p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-blue-600/20 text-sm active:scale-95">
          <UserPlus className="w-5 h-5" /> Add Customer
        </button>
      </div>

      {/* ==========================================
          SEARCH BAR
      ========================================== */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative w-full max-w-2xl">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-sm font-medium placeholder:text-gray-400"
            placeholder="Search by Customer Name, Phone Number, or Email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* ==========================================
          CUSTOMER DATA TABLE
      ========================================== */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-500 font-medium">
              Loading customer database...
            </p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              No Customers Found
            </h3>
            <p className="text-gray-500">
              No customers match your current search.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr>
                  <th className="px-7 py-4 font-bold text-xs uppercase tracking-wider text-gray-400 bg-gray-50/50 border-b border-gray-100">
                    Client Name
                  </th>
                  <th className="px-7 py-4 font-bold text-xs uppercase tracking-wider text-gray-400 bg-gray-50/50 border-b border-gray-100">
                    Contact Info
                  </th>
                  <th className="px-7 py-4 font-bold text-xs uppercase tracking-wider text-gray-400 bg-gray-50/50 border-b border-gray-100">
                    Address
                  </th>
                  <th className="px-7 py-4 font-bold text-xs uppercase tracking-wider text-gray-400 bg-gray-50/50 border-b border-gray-100 text-center">
                    Total Repairs
                  </th>
                  <th className="px-7 py-4 font-bold text-xs uppercase tracking-wider text-gray-400 bg-gray-50/50 border-b border-gray-100">
                    Last Visit
                  </th>
                  <th className="px-7 py-4 font-bold text-xs uppercase tracking-wider text-gray-400 bg-gray-50/50 border-b border-gray-100 text-right">
                    Profile
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="hover:bg-blue-50/30 transition-colors group"
                  >
                    {/* Name & ID */}
                    <td className="px-7 py-5">
                      <p className="font-bold text-gray-900">{customer.name}</p>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">
                        ID: {customer.shortId}
                      </p>
                    </td>

                    {/* Contact Info (Stacked) */}
                    <td className="px-7 py-5">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {customer.phone}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {customer.email}
                        </div>
                      </div>
                    </td>

                    {/* Address */}
                    <td className="px-7 py-5">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate max-w-[200px]">
                          {customer.address}
                        </span>
                      </div>
                    </td>

                    {/* Total Repairs Badge */}
                    <td className="px-7 py-5 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 border border-blue-100 text-blue-700 font-bold text-sm">
                        {customer.repairs}
                      </span>
                    </td>

                    {/* Last Visit */}
                    <td className="px-7 py-5 text-sm font-medium text-gray-500">
                      {customer.lastVisit}
                    </td>

                    {/* Actions */}
                    <td className="px-7 py-5 text-right">
                      {/* --- WIRED UP NAVIGATION BUTTON --- */}
                      <button
                        onClick={() => navigate(`/customers/${customer.id}`)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-bold flex items-center justify-end gap-1 w-full transition-colors opacity-0 group-hover:opacity-100"
                      >
                        View History <ExternalLink className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
