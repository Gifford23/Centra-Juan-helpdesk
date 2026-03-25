import { useState } from "react";
import {
  ShieldCheck,
  Shield, // <-- Added this missing import!
  Wrench,
  UserPlus,
  MoreVertical,
  X,
  Mail,
  Lock,
  User,
  UserRoundCheck,
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
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* ==========================================
          PAGE HEADER (Upgraded)
      ========================================== */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            Staff Management
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">
            Manage employee accounts and system roles
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all active:scale-95 shadow-md shadow-indigo-600/20"
        >
          <UserPlus className="w-5 h-5" /> Add Personnel
        </button>
      </div>

      {/* ==========================================
          STAFF DATA TABLE (Upgraded)
      ========================================== */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr>
                <th className="px-7 py-4 font-bold text-xs uppercase tracking-wider text-gray-400 bg-gray-50/50 border-b border-gray-100">
                  Employee Name
                </th>
                <th className="px-7 py-4 font-bold text-xs uppercase tracking-wider text-gray-400 bg-gray-50/50 border-b border-gray-100">
                  Email Account
                </th>
                <th className="px-7 py-4 font-bold text-xs uppercase tracking-wider text-gray-400 bg-gray-50/50 border-b border-gray-100">
                  System Role
                </th>
                <th className="px-7 py-4 font-bold text-xs uppercase tracking-wider text-gray-400 bg-gray-50/50 border-b border-gray-100">
                  Status
                </th>
                <th className="px-7 py-4 font-bold text-xs uppercase tracking-wider text-gray-400 bg-gray-50/50 border-b border-gray-100 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {staff.map((person) => (
                <tr
                  key={person.id}
                  className="hover:bg-indigo-50/30 transition-colors group cursor-pointer"
                >
                  {/* Name & Avatar */}
                  <td className="px-7 py-5">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ring-2 ring-white shadow-sm ${
                          person.role === "Super Admin"
                            ? "bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white"
                            : "bg-gradient-to-tr from-blue-500 to-blue-400 text-white"
                        }`}
                      >
                        {person.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{person.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5 font-medium">
                          ID: {person.id}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-7 py-5 text-sm text-gray-600 font-medium">
                    {person.email}
                  </td>

                  {/* Role */}
                  <td className="px-7 py-5">
                    <div className="flex items-center gap-2">
                      {person.role === "Super Admin" ? (
                        <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <UserRoundCheck className="w-4 h-4 text-blue-600" />
                      )}
                      <span
                        className={`text-sm font-bold ${
                          person.role === "Super Admin"
                            ? "text-indigo-700"
                            : "text-blue-700"
                        }`}
                      >
                        {person.role}
                      </span>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="px-7 py-5">
                    <span
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold border ${
                        person.status === "Active"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                          : "bg-gray-50 text-gray-500 border-gray-200/60"
                      }`}
                    >
                      {person.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-7 py-5 text-right">
                    <button className="text-gray-400 hover:text-gray-900 bg-transparent hover:bg-gray-100 p-2 rounded-lg transition-all ml-auto block opacity-0 group-hover:opacity-100">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==========================================
          ADD PERSONNEL MODAL (Premium UI)
      ========================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsModalOpen(false)}
          ></div>

          {/* Modal Content */}
          <div className="relative bg-white w-full max-w-lg rounded-[24px] shadow-2xl shadow-indigo-900/10 animate-in fade-in zoom-in-95 duration-300 flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900 tracking-tight">
                    Create New Account
                  </h2>
                  <p className="text-sm text-gray-500 font-medium mt-0.5">
                    Generate access credentials for a new employee.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors self-start"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body & Form */}
            <form className="p-8 space-y-5 bg-gray-50/30">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all text-sm font-medium placeholder:text-gray-400 shadow-sm"
                    placeholder="e.g. John Doe"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  Email Address (Username)
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all text-sm font-medium placeholder:text-gray-400 shadow-sm"
                    placeholder="john@centraljuan.com"
                  />
                </div>
              </div>

              {/* Password & Role Row */}
              <div className="flex flex-col sm:flex-row gap-5">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    Temporary Password
                  </label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      required
                      className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all text-sm font-medium placeholder:text-gray-400 shadow-sm"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    System Role
                  </label>
                  <select
                    required
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all text-sm font-medium shadow-sm appearance-none cursor-pointer"
                  >
                    <option value="Technician">Technician</option>
                    <option value="Super Admin">Super Admin</option>
                  </select>
                </div>
              </div>

              {/* Contextual Helper Text */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-start gap-3 mt-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-indigo-900 font-medium leading-relaxed">
                  <strong>Technicians</strong> can only view and update their
                  assigned job orders. <strong>Super Admins</strong> have full
                  access to billing, personnel, and system settings.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 mt-6 border-t border-gray-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 font-bold transition-colors active:scale-[0.98] text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-sm shadow-indigo-600/20 transition-all active:scale-[0.98] text-sm"
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
