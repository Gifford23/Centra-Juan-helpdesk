import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Shield,
  Wrench,
  UserPlus,
  X,
  Mail,
  Lock,
  User,
  Loader2,
  AlertCircle,
  Edit,
  Trash2,
  AlertTriangle,
  Eye,
  EyeOff,
  LayoutGrid,
  List,
  ExternalLink,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { logSystemAction } from "../utils/auditLog";

export default function PersonnelContent() {
  const [staff, setStaff] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // VIEW TOGGLE STATE
  const [viewMode, setViewMode] = useState<"table" | "card">(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      return "card";
    }
    return "table";
  });

  // GET LOGGED IN USER
  const savedUser = JSON.parse(
    localStorage.getItem("central_juan_user") || "{}",
  );

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [personToEdit, setPersonToEdit] = useState<any | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const [personToDelete, setPersonToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchPersonnel();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setViewMode("card");
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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

      await logSystemAction({
        userName: savedUser?.full_name || "Unknown User",
        action: "Created personnel account",
        details: `Created account for ${String(formData.get("fullName") || "Unknown")}`,
      });

      setIsCreateModalOpen(false);
      fetchPersonnel();
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to create account.");
    } finally {
      setIsSubmitting(false);
    }
  };

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

      await logSystemAction({
        userName: savedUser?.full_name || "Unknown User",
        action: "Updated personnel account",
        details: `Updated account for ${String(formData.get("fullName") || "Unknown")}`,
      });

      setPersonToEdit(null);
      fetchPersonnel();
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to update account.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!personToDelete) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("personnel")
        .delete()
        .eq("id", personToDelete.id);
      if (error) throw error;

      await logSystemAction({
        userName: savedUser?.full_name || "Unknown User",
        action: "Deleted personnel account",
        details: `Deleted account for ${personToDelete.full_name || "Unknown"}`,
      });

      setPersonToDelete(null);
      fetchPersonnel();
    } catch (error: any) {
      alert(
        "Failed to delete account. They may have job orders attached to them.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            Staff Management
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">
            Manage employee accounts and system roles
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          {/* VIEW TOGGLE */}
          <div className="flex bg-gray-200/50 p-1 rounded-xl border border-gray-200 w-full sm:w-auto">
            <button
              onClick={() => setViewMode("card")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${viewMode === "card" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              <LayoutGrid className="w-4 h-4" /> Cards
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`hidden sm:flex flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold items-center justify-center gap-2 transition-all ${viewMode === "table" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              <List className="w-4 h-4" /> Table
            </button>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all active:scale-95 shadow-md shadow-indigo-600/20"
          >
            <UserPlus className="w-5 h-5" /> Add Personnel
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
          <p className="text-gray-500 font-medium">
            Loading personnel database...
          </p>
        </div>
      ) : staff.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
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
        <>
          {/* ==========================================
              VIEW 1: GRID / CARD VIEW
          ========================================== */}
          {viewMode === "card" && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {staff.map((person) => (
                <div
                  key={person.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all group relative flex flex-col"
                >
                  {/* Top Row: Avatar & Actions */}
                  <div className="flex justify-between items-start mb-5">
                    {person.avatar_url ? (
                      <img
                        src={person.avatar_url}
                        alt={person.full_name}
                        className="w-14 h-14 rounded-2xl object-cover shadow-sm ring-2 ring-white"
                      />
                    ) : (
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-sm text-white ${person.role === "Super Admin" ? "bg-gradient-to-tr from-indigo-600 to-indigo-400" : "bg-gradient-to-tr from-blue-500 to-blue-400"}`}
                      >
                        {person.full_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setPersonToEdit(person)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors tooltip"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setPersonToDelete(person)}
                        disabled={savedUser.id === person.id}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors tooltip disabled:opacity-30"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Info */}
                  <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1">
                    {person.full_name}{" "}
                    {savedUser.id === person.id && (
                      <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold ml-2 uppercase align-middle tracking-wider">
                        You
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-500 font-medium mb-5">
                    {person.email}
                  </p>

                  {/* Badges */}
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${person.role === "Super Admin" ? "bg-indigo-50 text-indigo-700" : "bg-blue-50 text-blue-700"}`}
                    >
                      {person.role === "Super Admin" ? (
                        <ShieldCheck className="w-3.5 h-3.5" />
                      ) : (
                        <Wrench className="w-3.5 h-3.5" />
                      )}
                      {person.role}
                    </div>
                    <div
                      className={`px-2.5 py-1 rounded-md text-xs font-bold border ${person.status === "Active" ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-gray-50 border-gray-200 text-gray-500"}`}
                    >
                      {person.status}
                    </div>
                  </div>

                  {/* Profile Link */}
                  <button
                    onClick={() => navigate(`/personnel/${person.id}`)}
                    className="mt-auto pt-4 border-t border-gray-50 w-full text-indigo-600 font-bold text-sm flex items-center justify-center gap-2 hover:text-indigo-800 transition-colors"
                  >
                    View Full Profile <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ==========================================
              VIEW 2: TABLE VIEW
          ========================================== */}
          {viewMode === "table" && (
            <div className="hidden md:flex bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex-col">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[960px] text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr>
                      <th className="px-4 sm:px-7 py-4 font-bold text-xs uppercase tracking-wider text-gray-700 bg-gray-100 border-b border-gray-200">
                        Employee Name
                      </th>
                      <th className="px-4 sm:px-7 py-4 font-bold text-xs uppercase tracking-wider text-gray-700 bg-gray-100 border-b border-gray-200">
                        Email Account
                      </th>
                      <th className="px-4 sm:px-7 py-4 font-bold text-xs uppercase tracking-wider text-gray-700 bg-gray-100 border-b border-gray-200">
                        System Role
                      </th>
                      <th className="px-4 sm:px-7 py-4 font-bold text-xs uppercase tracking-wider text-gray-700 bg-gray-100 border-b border-gray-200">
                        Status
                      </th>
                      <th className="px-4 sm:px-7 py-4 font-bold text-xs uppercase tracking-wider text-gray-700 bg-gray-100 border-b border-gray-200 text-right">
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
                        <td className="px-4 sm:px-7 py-5">
                          <div className="flex items-center gap-4">
                            {person.avatar_url ? (
                              <img
                                src={person.avatar_url}
                                alt={person.full_name}
                                className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm"
                              />
                            ) : (
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ring-2 ring-white shadow-sm ${person.role === "Super Admin" ? "bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white" : "bg-gradient-to-tr from-blue-500 to-blue-400 text-white"}`}
                              >
                                {person.full_name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-gray-900">
                                {person.full_name}{" "}
                                {savedUser.id === person.id && (
                                  <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold ml-2 uppercase align-middle tracking-wider">
                                    You
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5 font-medium">
                                ID: {person.id.substring(0, 8).toUpperCase()}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-7 py-5 text-sm text-gray-600 font-medium">
                          {person.email}
                        </td>
                        <td className="px-4 sm:px-7 py-5">
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
                        <td className="px-4 sm:px-7 py-5">
                          <span
                            className={`px-3.5 py-1.5 rounded-full text-xs font-bold border ${person.status === "Active" ? "bg-emerald-50 text-emerald-700 border-emerald-200/60" : "bg-red-50 text-red-600 border-red-200/60"}`}
                          >
                            {person.status}
                          </span>
                        </td>
                        <td className="px-4 sm:px-7 py-5 text-right">
                          <div className="flex justify-end items-center gap-2 opacity-100 transition-opacity">
                            <button
                              onClick={() =>
                                navigate(`/personnel/${person.id}`)
                              }
                              className="text-indigo-600 hover:text-indigo-800 text-sm font-bold flex items-center gap-1 transition-colors mr-2"
                            >
                              Profile <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setPersonToEdit(person)}
                              className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors tooltip"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setPersonToDelete(person)}
                              disabled={savedUser.id === person.id}
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors tooltip disabled:opacity-30"
                              title="Delete"
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
            </div>
          )}
        </>
      )}

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
          <div className="relative bg-white w-full max-w-lg max-h-[90vh] rounded-2xl sm:rounded-[24px] shadow-2xl shadow-indigo-900/10 animate-in fade-in zoom-in-95 duration-300 flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-6 border-b border-gray-100 bg-white">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-50 text-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight truncate">
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
              className="p-4 sm:p-8 space-y-4 sm:space-y-5 bg-gray-50/30"
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
                    className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all text-sm font-medium shadow-sm"
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
                    className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all text-sm font-medium shadow-sm"
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
                      type={showPassword ? "text" : "password"}
                      name="password"
                      required
                      className="w-full pl-11 pr-11 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all text-sm font-medium shadow-sm"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3.5 top-3.5 p-1 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
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

              {/* REQUESTED INFO BLOCK */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-start gap-3 mt-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-indigo-900 font-medium leading-relaxed">
                  <strong>Technicians</strong> can only view and update their
                  assigned job orders. <strong>Super Admins</strong> have full
                  access to billing, personnel, and system settings.
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3.5 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-colors text-sm disabled:opacity-50"
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

              {/* REQUESTED INFO BLOCK */}
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
