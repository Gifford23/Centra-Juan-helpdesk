import { useState } from "react";
import {
  ShieldCheck,
  Wrench,
  UserPlus,
  MoreVertical,
  X,
  Mail,
  Lock,
  User,
} from "lucide-react";

export default function PersonnelContent() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mock data for your staff database
  const [staff] = useState([
    {
      id: "U-001",
      name: "Juan Admin",
      email: "juan@centraljuan.com",
      role: "Super Admin",
      status: "Active",
    },
    {
      id: "U-002",
      name: "Mark Technician",
      email: "mark@centraljuan.com",
      role: "Technician",
      status: "Active",
    },
    {
      id: "U-003",
      name: "Sarah Fixer",
      email: "sarah@centraljuan.com",
      role: "Technician",
      status: "Active",
    },
    {
      id: "U-004",
      name: "Mike Intern",
      email: "mike@centraljuan.com",
      role: "Technician",
      status: "Inactive",
    },
  ]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage employee accounts and system roles
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm text-sm"
        >
          <UserPlus className="w-4 h-4" /> Add Personnel
        </button>
      </div>

      {/* ==========================================
          STAFF DATA TABLE
      ========================================== */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                <th className="px-6 py-4 font-semibold">Employee Name</th>
                <th className="px-6 py-4 font-semibold">Email Account</th>
                <th className="px-6 py-4 font-semibold">System Role</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {staff.map((person) => (
                <tr
                  key={person.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {/* Name */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                          person.role === "Super Admin"
                            ? "bg-indigo-100 text-indigo-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {person.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{person.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          ID: {person.id}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {person.email}
                  </td>

                  {/* Role */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      {person.role === "Super Admin" ? (
                        <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <Wrench className="w-4 h-4 text-blue-600" />
                      )}
                      <span
                        className={`text-sm font-medium ${
                          person.role === "Super Admin"
                            ? "text-indigo-700"
                            : "text-blue-700"
                        }`}
                      >
                        {person.role}
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        person.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {person.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    <button className="text-gray-400 hover:text-gray-700 transition-colors">
                      <MoreVertical className="w-5 h-5 ml-auto" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==========================================
          ADD PERSONNEL MODAL
      ========================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          ></div>

          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl animate-slide-in-right md:animate-none">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Create New Account
                </h2>
                <p className="text-sm text-gray-500">
                  Generate credentials for a new employee
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none"
                    placeholder="e.g. John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address (Username)
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none"
                    placeholder="john@centraljuan.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Temporary Password
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  System Role
                </label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none bg-white"
                >
                  <option value="Technician">
                    Technician (Restricted Access)
                  </option>
                  <option value="Super Admin">Super Admin (Full Access)</option>
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  * Technicians can only view and update their assigned job
                  orders.
                </p>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-sm"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
