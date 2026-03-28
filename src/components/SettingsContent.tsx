import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Lock,
  ShieldCheck,
  Wrench,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Globe,
  Settings as SettingsIcon,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { logSystemAction } from "../utils/auditLog";

export default function SettingsContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"account" | "system">("account");

  // Get the currently logged-in user
  const savedUser = JSON.parse(
    localStorage.getItem("central_juan_user") || "{}",
  );
  const isSuperAdmin = savedUser.role === "Super Admin";

  // State for Personal Form Inputs
  const [formData, setFormData] = useState({
    fullName: savedUser.full_name || "",
    email: savedUser.email || "",
    password: "",
  });

  // State for Global System Settings
  const [systemSettingsId, setSystemSettingsId] = useState<number | null>(null);
  const [allowPublicTickets, setAllowPublicTickets] = useState(true);

  // Fetch Global Settings on Load
  useEffect(() => {
    if (isSuperAdmin) {
      fetchSystemSettings();
    } else {
      setIsFetching(false);
    }
  }, [isSuperAdmin]);

  const fetchSystemSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .single(); // We only expect row ID 1

      if (error) throw error;
      if (data) {
        setSystemSettingsId(data.id);
        setAllowPublicTickets(data.allow_public_tickets);
      }
    } catch (error) {
      console.error("Error fetching system settings:", error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof Error && error.message) return error.message;
    return fallback;
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // 1. UPDATE PERSONAL PROFILE
      const updatePayload: {
        full_name: string;
        email: string;
        password?: string;
      } = {
        full_name: formData.fullName,
        email: formData.email,
      };

      if (formData.password.trim() !== "") {
        updatePayload.password = formData.password;
      }

      const { error: profileError } = await supabase
        .from("personnel")
        .update(updatePayload)
        .eq("id", savedUser.id);

      if (profileError) {
        if (profileError.code === "23505")
          throw new Error("That email is already in use by another account.");
        throw profileError;
      }

      // Update local storage so UI syncs
      const updatedUser = { ...savedUser, ...updatePayload };
      localStorage.setItem("central_juan_user", JSON.stringify(updatedUser));

      await logSystemAction({
        userName: savedUser?.full_name || "Unknown User",
        action: "Updated account settings",
        details: "Updated personal profile information.",
      });

      setSuccessMessage("Profile settings were successfully updated!");
      setFormData({ ...formData, password: "" }); // Clear password field
    } catch (error: unknown) {
      console.error("Error updating settings:", error);
      setErrorMessage(
        getErrorMessage(error, "Failed to update settings. Please try again."),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSystemSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin || !systemSettingsId) return;

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const { error: settingsError } = await supabase
        .from("system_settings")
        .update({ allow_public_tickets: allowPublicTickets })
        .eq("id", systemSettingsId);

      if (settingsError) throw settingsError;

      await logSystemAction({
        userName: savedUser?.full_name || "Unknown User",
        action: "Updated system settings",
        details: `Set public ticket portal to ${allowPublicTickets ? "enabled" : "disabled"}.`,
      });

      setSuccessMessage("System configuration was successfully updated!");
    } catch (error: unknown) {
      console.error("Error updating system settings:", error);
      setErrorMessage(
        getErrorMessage(
          error,
          "Failed to update system settings. Please try again.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading preferences...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
          Account Settings
        </h1>
        <p className="text-gray-500 text-sm mt-1 font-medium">
          Manage your personal profile and system preferences
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2 inline-flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("account")}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
            activeTab === "account"
              ? "bg-blue-600 text-white"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          Account
        </button>
        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => setActiveTab("system")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              activeTab === "system"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            System
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: Profile Summary Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center sticky top-24">
            <div
              className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center font-black text-4xl shadow-lg mb-4 text-white ${savedUser.role === "Super Admin" ? "bg-gradient-to-tr from-indigo-600 to-indigo-400 shadow-indigo-500/20" : "bg-gradient-to-tr from-blue-600 to-blue-400 shadow-blue-500/20"}`}
            >
              {savedUser?.full_name
                ? savedUser.full_name.charAt(0).toUpperCase()
                : "U"}
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              {savedUser.full_name}
            </h2>
            <p className="text-sm text-gray-500 font-medium mb-4">
              {savedUser.email}
            </p>

            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border ${savedUser.role === "Super Admin" ? "bg-indigo-50 text-indigo-700 border-indigo-100" : "bg-blue-50 text-blue-700 border-blue-100"}`}
            >
              {savedUser.role === "Super Admin" ? (
                <ShieldCheck className="w-4 h-4" />
              ) : (
                <Wrench className="w-4 h-4" />
              )}
              {savedUser.role}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100 text-left">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                Account Status
              </p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-sm font-bold text-gray-900">
                  {savedUser.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Tabbed Forms */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === "account" && (
            <form onSubmit={handleSaveProfile}>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
                <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-500" />
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Personal Information
                    </h3>
                    <p className="text-sm text-gray-500 font-medium">
                      Update your login credentials and details.
                    </p>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium"
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
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">
                      Change Password{" "}
                      <span className="text-gray-400 font-medium">
                        (Leave blank to keep current)
                      </span>
                    </label>
                    <div className="relative">
                      <Lock className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium"
                        placeholder="Enter new password"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
                {errorMessage && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />{" "}
                    {errorMessage}
                  </div>
                )}
                {successMessage && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />{" "}
                    {successMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white px-6 py-3.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 disabled:opacity-70 flex justify-center items-center gap-2 active:scale-[0.98]"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Save Profile Changes"
                  )}
                </button>
              </div>
            </form>
          )}

          {activeTab === "system" && isSuperAdmin && (
            <form onSubmit={handleSaveSystemSettings}>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
                <div className="px-6 py-5 border-b border-gray-100 bg-indigo-50/50 flex items-center gap-3">
                  <SettingsIcon className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      System Configuration
                    </h3>
                    <p className="text-sm text-gray-500 font-medium">
                      Manage global application behaviors.
                    </p>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex gap-4">
                      <div
                        className={`p-2.5 rounded-lg flex-shrink-0 h-fit ${allowPublicTickets ? "bg-blue-100 text-blue-600" : "bg-gray-200 text-gray-500"}`}
                      >
                        <Globe className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 mb-0.5">
                          Public Ticket Portal
                        </h4>
                        <p className="text-sm text-gray-500 font-medium leading-snug max-w-sm">
                          Allow customers to access the external booking page to
                          submit their own repair requests.
                        </p>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={allowPublicTickets}
                        onChange={(e) =>
                          setAllowPublicTickets(e.target.checked)
                        }
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
                {errorMessage && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />{" "}
                    {errorMessage}
                  </div>
                )}
                {successMessage && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />{" "}
                    {successMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white px-6 py-3.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 disabled:opacity-70 flex justify-center items-center gap-2 active:scale-[0.98]"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Save System Settings"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
