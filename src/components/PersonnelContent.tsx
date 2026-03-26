import { useState, useEffect } from "react";
import {
  ShieldCheck,
  Shield,
  Wrench,
  UserPlus,
  MoreVertical,
  X,
  Mail,
  Lock,
  User,
  Loader2,
  AlertCircle,
  Edit,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "../lib/supabase";

export default function PersonnelContent() {
  const [staff, setStaff] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // GET LOGGED IN USER (To prevent self-deletion)
  const savedUser = JSON.parse(
    localStorage.getItem("central_juan_user") || "{}",
  );

  // CREATE Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // EDIT Modal States
  const [personToEdit, setPersonToEdit] = useState<any | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // DELETE Modal States
  const [personToDelete, setPersonToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 1. Fetch Staff Data
  useEffect(() => {
    fetchPersonnel();
  }, []);

  const fetchPersonnel = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("personnel")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      if (data) setStaff(data);
    } catch (error) {
      console.error("Error fetching personnel:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Create Employee
  const handleAddPersonnel = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    const formData = new FormData(e.currentTarget);

    try {
      const { error } = await supabase.from("personnel").insert([
        {
          full_name: formData.get("fullName"),
          email: formData.get("email"),
          password: formData.get("password"),
          role: formData.get("role"),
          status: "Active",
        },
      ]);

      if (error) {
        if (error.code === "23505")
          throw new Error("An account with this email already exists.");
        throw error;
      }

      setIsCreateModalOpen(false);
      fetchPersonnel();
    } catch (error: any) {
      console.error("Error adding personnel:", error);
      setErrorMessage(error.message || "Failed to create account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Update Employee
  const handleUpdatePersonnel = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!personToEdit) return;

    setIsUpdating(true);
    setErrorMessage("");
    const formData = new FormData(e.currentTarget);

    try {
      const { error } = await supabase
        .from("personnel")
        .update({
          full_name: formData.get("fullName"),
          email: formData.get("email"),
          role: formData.get("role"),
          status: formData.get("status"),
        })
        .eq("id", personToEdit.id);

      if (error) {
        if (error.code === "23505")
          throw new Error("This email is already taken by another account.");
        throw error;
      }

      setPersonToEdit(null);
      fetchPersonnel();
    } catch (error: any) {
      console.error("Error updating personnel:", error);
      setErrorMessage(error.message || "Failed to update account.");
    } finally {
      setIsUpdating(false);
    }
  };

  // 4. Delete Employee
  const handleDeleteConfirm = async () => {
    if (!personToDelete) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("personnel")
        .delete()
        .eq("id", personToDelete.id);

      if (error) throw error;

      setPersonToDelete(null);
      fetchPersonnel();
    } catch (error: any) {
      console.error("Error deleting personnel:", error);
      alert(
        "Failed to delete account. They may have job orders attached to them.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      {/* ==========================================
          PAGE HEADER
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
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all active:scale-95 shadow-md shadow-indigo-600/20"
        >
          <UserPlus className="w-5 h-5" /> Add Personnel
        </button>
      </div>

      {/* ==========================================
          STAFF DATA TABLE
      ========================================== */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
            <p className="text-gray-500 font-medium">
              Loading personnel database...
            </p>
          </div>
        ) : staff.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              No Staff Found
            </h3>
            <p className="text-gray-500">
              Click 'Add Personnel' to create your first account.
            </p>
          </div>
        ) : (
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
                    className="hover:bg-indigo-50/30 transition-colors group"
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
                          {person.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">
                            {person.full_name}{" "}
                            {savedUser.id === person.id && (
                              <span className="text-xs text-indigo-500 ml-1">
                                (You)
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 font-medium">
                            ID: {person.id.substring(0, 8).toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-7 py-5 text-sm text-gray-600 font-medium">
                      {person.email}
                    </td>

                    <td className="px-7 py-5">
                      <div className="flex items-center gap-2">
                        {person.role === "Super Admin" ? (
                          <ShieldCheck className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Wrench className="w-4 h-4 text-blue-600" />
                        )}
                        <span
                          className={`text-sm font-bold ${person.role === "Super Admin" ? "text-indigo-700" : "text-blue-700"}`}
                        >
                          {person.role}
                        </span>
                      </div>
                    </td>

                    <td className="px-7 py-5">
                      <span
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold border ${person.status === "Active" ? "bg-emerald-50 text-emerald-700 border-emerald-200/60" : "bg-red-50 text-red-600 border-red-200/60"}`}
                      >
                        {person.status}
                      </span>
                    </td>

                    {/* Actions: Edit & Delete */}
                    <td className="px-7 py-5 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setPersonToEdit(person)}
                          className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors tooltip"
                          title="Edit Account"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setPersonToDelete(person)}
                          disabled={savedUser.id === person.id} // Prevent deleting self
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors tooltip disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Delete Account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ==========================================
          MODAL 1: CREATE ACCOUNT
      ========================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            onClick={() => {
              if (!isSubmitting) setIsCreateModalOpen(false);
            }}
          ></div>
          <div className="relative bg-white w-full max-w-lg rounded-[24px] shadow-2xl shadow-indigo-900/10 animate-in fade-in zoom-in-95 duration-300 flex flex-col overflow-hidden">
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
                onClick={() => setIsCreateModalOpen(false)}
                disabled={isSubmitting}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors self-start disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleAddPersonnel}
              className="p-8 space-y-5 bg-gray-50/30"
            >
              {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" /> {errorMessage}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    name="fullName"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all text-sm font-medium shadow-sm"
                    placeholder="e.g. John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  Email Address (Username)
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all text-sm font-medium shadow-sm"
                    placeholder="john@centraljuan.com"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-5">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    Temporary Password
                  </label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      name="password"
                      required
                      className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all text-sm font-medium shadow-sm"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    System Role
                  </label>
                  <select
                    name="role"
                    required
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all text-sm font-medium shadow-sm cursor-pointer"
                  >
                    <option value="Technician">Technician</option>
                    <option value="Super Admin">Super Admin</option>
                  </select>
                </div>
              </div>

              {/* RESTORED INFO BLOCK */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-start gap-3 mt-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-indigo-900 font-medium leading-relaxed">
                  <strong>Technicians</strong> can only view and update their
                  assigned job orders. <strong>Super Admins</strong> have full
                  access to billing, personnel, and system settings.
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-gray-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 font-bold transition-colors text-sm disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-sm shadow-indigo-600/20 transition-all text-sm flex justify-center items-center gap-2 disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Create Account"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 2: EDIT ACCOUNT
      ========================================== */}
      {personToEdit && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            onClick={() => {
              if (!isUpdating) setPersonToEdit(null);
            }}
          ></div>
          <div className="relative bg-white w-full max-w-lg rounded-[24px] shadow-2xl shadow-indigo-900/10 animate-in fade-in zoom-in-95 duration-300 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Edit className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900 tracking-tight">
                    Edit Account
                  </h2>
                  <p className="text-sm text-gray-500 font-medium mt-0.5">
                    Update details for {personToEdit.full_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPersonToEdit(null)}
                disabled={isUpdating}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors self-start disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleUpdatePersonnel}
              className="p-8 space-y-5 bg-gray-50/30"
            >
              {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" /> {errorMessage}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    name="fullName"
                    defaultValue={personToEdit.full_name}
                    required
                    className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all text-sm font-medium shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    name="email"
                    defaultValue={personToEdit.email}
                    required
                    className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all text-sm font-medium shadow-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-5">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    System Role
                  </label>
                  <select
                    name="role"
                    defaultValue={personToEdit.role}
                    required
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all text-sm font-medium shadow-sm cursor-pointer"
                  >
                    <option value="Technician">Technician</option>
                    <option value="Super Admin">Super Admin</option>
                  </select>
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    Account Status
                  </label>
                  <select
                    name="status"
                    defaultValue={personToEdit.status}
                    required
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all text-sm font-medium shadow-sm cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Deactivated">Deactivated</option>
                  </select>
                </div>
              </div>

              {/* RESTORED INFO BLOCK FOR EDIT MODAL TOO */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-start gap-3 mt-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-indigo-900 font-medium leading-relaxed">
                  <strong>Technicians</strong> can only view and update their
                  assigned job orders. <strong>Super Admins</strong> have full
                  access to billing, personnel, and system settings.
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-gray-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setPersonToEdit(null)}
                  disabled={isUpdating}
                  className="flex-1 px-4 py-3.5 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-colors text-sm disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 px-4 py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-sm shadow-blue-600/20 transition-all text-sm flex justify-center items-center gap-2 disabled:opacity-70"
                >
                  {isUpdating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 3: DELETE CONFIRMATION
      ========================================== */}
      {personToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => !isDeleting && setPersonToDelete(null)}
          ></div>
          <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="mx-auto w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">
              Delete Account?
            </h3>
            <p className="text-sm text-gray-500 font-medium mb-6">
              Are you sure you want to permanently delete{" "}
              <strong className="text-gray-900">
                {personToDelete.full_name}
              </strong>
              ? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setPersonToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-md shadow-red-600/20 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Yes, Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
