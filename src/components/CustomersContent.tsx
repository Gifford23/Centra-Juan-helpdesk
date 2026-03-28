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
  CalendarDays,
  X,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../lib/supabase"; // Import Supabase
import { logSystemAction } from "../utils/auditLog";

export default function CustomersContent() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [lastVisitFilter, setLastVisitFilter] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

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
          let lastVisitDateValue: string | null = null;
          if (c.job_orders && c.job_orders.length > 0) {
            const dates = c.job_orders.map((j: any) =>
              new Date(j.created_at).getTime(),
            );
            const latest = new Date(Math.max(...dates));
            const year = latest.getFullYear();
            const month = String(latest.getMonth() + 1).padStart(2, "0");
            const day = String(latest.getDate()).padStart(2, "0");
            lastVisitDateValue = `${year}-${month}-${day}`;
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
            lastVisitDateValue,
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
      (c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (!lastVisitFilter || c.lastVisitDateValue === lastVisitFilter),
  );

  const handleAddCustomer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError("");

    const formData = new FormData(e.currentTarget);

    try {
      const { error } = await supabase.from("customers").insert([
        {
          full_name: formData.get("customerName"),
          phone_number: formData.get("phoneNumber"),
          email: formData.get("email") || null,
          address: formData.get("address"),
        },
      ]);

      if (error) throw error;

      await logSystemAction({
        userName:
          JSON.parse(localStorage.getItem("central_juan_user") || "{}")
            .full_name || "Unknown User",
        action: "Created customer profile",
        details: `Added customer: ${String(formData.get("customerName") || "Unknown")}`,
      });

      setIsAddModalOpen(false);
      fetchCustomers();
    } catch (error: any) {
      console.error("Error adding customer:", error);
      setFormError(error.message || "Failed to add customer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Customer Directory
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage client profiles and repair history
          </p>
        </div>
        <button
          onClick={() => {
            setFormError("");
            setIsAddModalOpen(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-blue-600/20 text-sm active:scale-95"
        >
          <UserPlus className="w-5 h-5" /> Add Customer
        </button>
      </div>

      {/* ==========================================
          SEARCH BAR
      ========================================== */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-4">
          <div className="relative w-full lg:max-w-2xl">
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
          <div className="w-full lg:w-auto flex justify-end">
            <div className="relative">
              <CalendarDays className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="date"
                value={lastVisitFilter}
                onChange={(e) => setLastVisitFilter(e.target.value)}
                className="w-full lg:w-[220px] pl-10 pr-3 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-sm font-medium text-gray-700"
                aria-label="Filter by last visit date"
                title="Filter by last visit date"
              />
            </div>
          </div>
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
          <>
            <div className="md:hidden p-3 space-y-3 max-h-[560px] overflow-y-auto">
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-gray-900 truncate">
                        {customer.name}
                      </p>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">
                        ID: {customer.shortId}
                      </p>
                    </div>
                    <span className="inline-flex items-center justify-center min-w-8 h-8 px-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 font-bold text-sm">
                      {customer.repairs}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{customer.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{customer.address}</span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium pt-1">
                      Last Visit: {customer.lastVisit}
                    </p>
                  </div>

                  <button
                    onClick={() => navigate(`/customers/${customer.id}`)}
                    className="mt-4 w-full text-blue-600 hover:text-blue-800 text-sm font-bold flex items-center justify-center gap-1.5 py-2.5 border border-blue-100 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    View History <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto overflow-y-auto max-h-[560px]">
              <table className="w-full min-w-[980px] text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr>
                    <th className="px-4 sm:px-7 py-4 font-bold text-xs uppercase tracking-wider text-gray-700 bg-gray-100 border-b border-gray-200">
                      Client Name
                    </th>
                    <th className="px-4 sm:px-7 py-4 font-bold text-xs uppercase tracking-wider text-gray-700 bg-gray-100 border-b border-gray-200">
                      Contact Info
                    </th>
                    <th className="px-4 sm:px-7 py-4 font-bold text-xs uppercase tracking-wider text-gray-700 bg-gray-100 border-b border-gray-200">
                      Address
                    </th>
                    <th className="px-4 sm:px-7 py-4 font-bold text-xs uppercase tracking-wider text-gray-700 bg-gray-100 border-b border-gray-200 text-center">
                      Total Repairs
                    </th>
                    <th className="px-4 sm:px-7 py-4 font-bold text-xs uppercase tracking-wider text-gray-700 bg-gray-100 border-b border-gray-200">
                      Last Visit
                    </th>
                    <th className="px-4 sm:px-7 py-4 font-bold text-xs uppercase tracking-wider text-gray-700 bg-gray-100 border-b border-gray-200 text-right">
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
                      <td className="px-4 sm:px-7 py-5">
                        <p className="font-bold text-gray-900">
                          {customer.name}
                        </p>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">
                          ID: {customer.shortId}
                        </p>
                      </td>

                      <td className="px-4 sm:px-7 py-5">
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

                      <td className="px-4 sm:px-7 py-5">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                          <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="truncate max-w-[200px]">
                            {customer.address}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 sm:px-7 py-5 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 border border-blue-100 text-blue-700 font-bold text-sm">
                          {customer.repairs}
                        </span>
                      </td>

                      <td className="px-4 sm:px-7 py-5 text-sm font-medium text-gray-500">
                        {customer.lastVisit}
                      </td>

                      <td className="px-4 sm:px-7 py-5 text-right">
                        <button
                          onClick={() => navigate(`/customers/${customer.id}`)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-bold flex items-center justify-end gap-1 w-full transition-colors"
                        >
                          View History <ExternalLink className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            onClick={() => {
              if (!isSubmitting) setIsAddModalOpen(false);
            }}
          ></div>

          <div className="relative bg-white w-full max-w-lg rounded-[24px] shadow-2xl shadow-blue-900/10 animate-in fade-in zoom-in-95 duration-300 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900 tracking-tight">
                    Add New Customer
                  </h2>
                  <p className="text-sm text-gray-500 font-medium mt-0.5">
                    Create a new customer profile.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                disabled={isSubmitting}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors self-start disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleAddCustomer}
              className="p-8 space-y-5 bg-gray-50/30"
            >
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" /> {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  name="customerName"
                  required
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-sm font-medium shadow-sm"
                  placeholder="e.g. Juan Dela Cruz"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  Phone Number
                </label>
                <input
                  type="text"
                  name="phoneNumber"
                  required
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-sm font-medium shadow-sm"
                  placeholder="e.g. 0917xxxxxxx"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-sm font-medium shadow-sm"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  Address
                </label>
                <textarea
                  name="address"
                  required
                  rows={3}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-sm font-medium shadow-sm resize-none"
                  placeholder="Complete address"
                ></textarea>
              </div>

              <div className="pt-6 mt-6 border-t border-gray-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 font-bold transition-colors text-sm disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-sm shadow-blue-600/20 transition-all text-sm flex justify-center items-center gap-2 disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Add Customer"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
