import { useState } from "react";
import {
  Search,
  Mail,
  Phone,
  MapPin,
  UserPlus,
  ExternalLink,
} from "lucide-react";

export default function CustomersContent() {
  // Mock data for your customer database
  const [customers] = useState([
    {
      id: "C-001",
      name: "Juan Dela Cruz",
      phone: "0917 123 4567",
      email: "juan@example.com",
      address: "Brgy. Lapasan, Cagayan de Oro City",
      repairs: 3,
      lastVisit: "Mar 23, 2026",
    },
    {
      id: "C-002",
      name: "Maria Santos",
      phone: "0918 987 6543",
      email: "maria.s@gmail.com",
      address: "Brgy. Carmen, Cagayan de Oro City",
      repairs: 1,
      lastVisit: "Mar 24, 2026",
    },
    {
      id: "C-003",
      name: "Carlos Rivera",
      phone: "0922 456 7890",
      email: "No Email Provided",
      address: "Brgy. Bugo, Cagayan de Oro City",
      repairs: 1,
      lastVisit: "Mar 24, 2026",
    },
    {
      id: "C-004",
      name: "Elena Gomez",
      phone: "0917 555 1122",
      email: "elena.gomez@yahoo.com",
      address: "Opol, Misamis Oriental",
      repairs: 2,
      lastVisit: "Mar 22, 2026",
    },
    {
      id: "C-005",
      name: "Miguel Reyes",
      phone: "0966 333 4455",
      email: "miguel.reyes@company.ph",
      address: "Brgy. Macasandig, Cagayan de Oro City",
      repairs: 4,
      lastVisit: "Mar 20, 2026",
    },
  ]);

  return (
    <div className="space-y-6">
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
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm text-sm">
          <UserPlus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      {/* ==========================================
          SEARCH BAR
      ========================================== */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="relative w-full max-w-2xl">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-sm transition-shadow"
            placeholder="Search by Customer Name, Phone Number, or Email..."
          />
        </div>
      </div>

      {/* ==========================================
          CUSTOMER DATA TABLE
      ========================================== */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                <th className="px-6 py-4 font-semibold">Client Name</th>
                <th className="px-6 py-4 font-semibold">Contact Info</th>
                <th className="px-6 py-4 font-semibold">Address</th>
                <th className="px-6 py-4 font-semibold text-center">
                  Total Repairs
                </th>
                <th className="px-6 py-4 font-semibold">Last Visit</th>
                <th className="px-6 py-4 font-semibold text-right">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.map((customer) => (
                <tr
                  key={customer.id}
                  className="hover:bg-gray-50 transition-colors group"
                >
                  {/* Name & ID */}
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{customer.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      ID: {customer.id}
                    </p>
                  </td>

                  {/* Contact Info (Stacked) */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        {customer.phone}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        {customer.email}
                      </div>
                    </div>
                  </td>

                  {/* Address */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate max-w-[200px]">
                        {customer.address}
                      </span>
                    </div>
                  </td>

                  {/* Total Repairs Badge */}
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-700 font-bold text-sm">
                      {customer.repairs}
                    </span>
                  </td>

                  {/* Last Visit */}
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {customer.lastVisit}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    <button className="text-blue-700 hover:text-blue-800 text-sm font-medium flex items-center justify-end gap-1 w-full transition-colors">
                      View History <ExternalLink className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
