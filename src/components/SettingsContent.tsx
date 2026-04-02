import { useState, useEffect, useRef } from "react";
import {
  User,
  Mail,
  Lock,
  Bell,
  Shield,
  KeyRound,
  Clock3,
  LogOut,
  Eye,
  EyeOff,
  ShieldCheck,
  Wrench,
  Loader2,
  AlertCircle,
  Globe,
  Settings as SettingsIcon,
  Camera,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { logSystemAction } from "../utils/auditLog";
import SettingsSuccessDialog from "./settings/SettingsSuccessDialog";

export default function SettingsContent() {
  type NotificationSettings = {
    newTicketSound: boolean;
    browserNotifications: boolean;
    emailDigest: "real-time" | "hourly" | "daily";
    escalationAlerts: boolean;
  };

  type SecuritySettings = {
    minPasswordLength: 8 | 10 | 12;
    requireComplexity: boolean;
    sessionTimeoutMinutes: 15 | 30 | 60 | 120;
    enable2FA: boolean;
  };

  type BackupReminderFrequency = "off" | "weekly" | "monthly";
  type AutoAssignRule = "round-robin" | "manual";

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [showProfileSuccessDialog, setShowProfileSuccessDialog] =
    useState(false);
  const [showSystemSuccessDialog, setShowSystemSuccessDialog] = useState(false);
  const [showNotificationSuccessDialog, setShowNotificationSuccessDialog] =
    useState(false);
  const [showSecuritySuccessDialog, setShowSecuritySuccessDialog] =
    useState(false);
  const [showForceLogoutDialog, setShowForceLogoutDialog] = useState(false);
  const [showForceLogoutSuccessDialog, setShowForceLogoutSuccessDialog] =
    useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "account" | "notifications" | "security" | "system"
  >("account");

  // Get the currently logged-in user
  const savedUser = JSON.parse(
    localStorage.getItem("central_juan_user") || "{}",
  );
  const [currentUser, setCurrentUser] = useState(savedUser);
  const isSuperAdmin = currentUser.role === "Super Admin";

  // State for Personal Form Inputs
  const [formData, setFormData] = useState({
    fullName: currentUser.full_name || "",
    email: currentUser.email || "",
    password: "",
  });

  // State for Avatar Upload
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    currentUser.avatar_url || null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const localObjectUrlRef = useRef<string | null>(null);

  // State for Global System Settings
  const [systemSettingsId, setSystemSettingsId] = useState<number | null>(null);
  const [allowPublicTickets, setAllowPublicTickets] = useState(true);
  const [submissionHours, setSubmissionHours] = useState({
    start: "08:00",
    end: "18:00",
  });
  const [backupReminderFrequency, setBackupReminderFrequency] =
    useState<BackupReminderFrequency>("weekly");
  const [autoAssignRule, setAutoAssignRule] =
    useState<AutoAssignRule>("manual");

  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>({
      newTicketSound: true,
      browserNotifications: false,
      emailDigest: "hourly",
      escalationAlerts: true,
    });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    minPasswordLength: 10,
    requireComplexity: true,
    sessionTimeoutMinutes: 30,
    enable2FA: false,
  });

  const advancedSettingsStorageKey = `central_juan_advanced_settings_${currentUser?.id || "default"}`;
  const submissionHoursStorageKey = "central_juan_submission_hours";

  useEffect(() => {
    const syncUser = () => {
      const updated = JSON.parse(
        localStorage.getItem("central_juan_user") || "{}",
      );
      setCurrentUser(updated);
      setFormData((prev) => ({
        ...prev,
        fullName: updated.full_name || "",
        email: updated.email || "",
      }));
      setAvatarPreview(updated.avatar_url || null);
    };

    const handleUserUpdated = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        setCurrentUser(customEvent.detail);
        setFormData((prev) => ({
          ...prev,
          fullName: customEvent.detail.full_name || "",
          email: customEvent.detail.email || "",
        }));
        setAvatarPreview(customEvent.detail.avatar_url || null);
        return;
      }
      syncUser();
    };

    window.addEventListener("storage", syncUser);
    window.addEventListener("central_juan_user_updated", handleUserUpdated);

    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener(
        "central_juan_user_updated",
        handleUserUpdated,
      );
    };
  }, []);

  useEffect(() => {
    setErrorMessage("");
  }, [activeTab]);

  useEffect(() => {
    if (!isSuperAdmin && (activeTab === "security" || activeTab === "system")) {
      setActiveTab("account");
    }
  }, [activeTab, isSuperAdmin]);

  // Fetch Global Settings on Load
  useEffect(() => {
    if (isSuperAdmin) {
      fetchSystemSettings();
    } else {
      setIsFetching(false);
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    const raw = localStorage.getItem(advancedSettingsStorageKey);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as {
        notificationSettings?: NotificationSettings;
        securitySettings?: SecuritySettings;
      };

      if (parsed.notificationSettings) {
        setNotificationSettings(parsed.notificationSettings);
      }
      if (parsed.securitySettings) {
        setSecuritySettings(parsed.securitySettings);
      }
    } catch {
      // Ignore malformed local settings and keep defaults.
    }
  }, [advancedSettingsStorageKey]);

  useEffect(() => {
    const raw = localStorage.getItem(submissionHoursStorageKey);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as {
        start?: string;
        end?: string;
        backupReminderFrequency?: BackupReminderFrequency;
        autoAssignRule?: AutoAssignRule;
      };
      if (parsed.start && parsed.end) {
        setSubmissionHours({ start: parsed.start, end: parsed.end });
      }
      if (parsed.backupReminderFrequency) {
        setBackupReminderFrequency(parsed.backupReminderFrequency);
      }
      if (parsed.autoAssignRule) {
        setAutoAssignRule(parsed.autoAssignRule);
      }
    } catch {
      // Ignore malformed values and keep defaults.
    }
  }, []);

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

  // Handle local avatar file selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (localObjectUrlRef.current) {
        URL.revokeObjectURL(localObjectUrlRef.current);
      }
      const objectUrl = URL.createObjectURL(file);
      localObjectUrlRef.current = objectUrl;
      setAvatarFile(file);
      setAvatarPreview(objectUrl); // Show instant preview
    }
  };

  useEffect(() => {
    return () => {
      if (localObjectUrlRef.current) {
        URL.revokeObjectURL(localObjectUrlRef.current);
      }
    };
  }, []);

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof Error && error.message) return error.message;
    return fallback;
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      // 1. UPLOAD NEW AVATAR (If a new one was selected)
      let newAvatarUrl = currentUser.avatar_url; // Keep current if no new file

      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop();
        const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, avatarFile);

        if (uploadError) throw uploadError;

        // Get the public URL for the newly uploaded image
        const { data: publicUrlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(fileName);

        newAvatarUrl = publicUrlData.publicUrl;
      }

      // 2. UPDATE PERSONAL PROFILE IN DATABASE
      const updatePayload: {
        full_name: string;
        email: string;
        password?: string;
        avatar_url?: string;
      } = {
        full_name: formData.fullName,
        email: formData.email,
        avatar_url: newAvatarUrl, // Save the new image URL
      };

      if (formData.password.trim() !== "") {
        updatePayload.password = formData.password;
      }

      const { error: profileError } = await supabase
        .from("personnel")
        .update(updatePayload)
        .eq("id", currentUser.id);

      if (profileError) {
        if (profileError.code === "23505")
          throw new Error("That email is already in use by another account.");
        throw profileError;
      }

      // Update local storage so UI syncs
      const updatedUser = { ...currentUser, ...updatePayload };
      localStorage.setItem("central_juan_user", JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      window.dispatchEvent(
        new CustomEvent("central_juan_user_updated", {
          detail: updatedUser,
        }),
      );

      await logSystemAction({
        userName: currentUser?.full_name || "Unknown User",
        action: "Updated account settings",
        details: "Updated personal profile information.",
      });

      setShowProfileSuccessDialog(true);
      setAvatarFile(null);
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

    if (submissionHours.start >= submissionHours.end) {
      setErrorMessage("Submission start time must be earlier than end time.");
      setIsLoading(false);
      return;
    }

    try {
      const { error: settingsError } = await supabase
        .from("system_settings")
        .update({ allow_public_tickets: allowPublicTickets })
        .eq("id", systemSettingsId);

      if (settingsError) throw settingsError;

      localStorage.setItem(
        submissionHoursStorageKey,
        JSON.stringify({
          ...submissionHours,
          backupReminderFrequency,
          autoAssignRule,
        }),
      );
      window.dispatchEvent(
        new CustomEvent("central_juan_submission_hours_updated", {
          detail: {
            ...submissionHours,
            backupReminderFrequency,
            autoAssignRule,
          },
        }),
      );

      await logSystemAction({
        userName: currentUser?.full_name || "Unknown User",
        action: "Updated system settings",
        details: `Set public ticket portal to ${allowPublicTickets ? "enabled" : "disabled"}. Allowed submission hours: ${submissionHours.start} - ${submissionHours.end}. Auto-assign: ${autoAssignRule}. Backup reminders: ${backupReminderFrequency}.`,
      });

      setShowSystemSuccessDialog(true);
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

  const handleSaveNotificationSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      if (
        notificationSettings.browserNotifications &&
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "default"
      ) {
        await Notification.requestPermission();
      }

      localStorage.setItem(
        advancedSettingsStorageKey,
        JSON.stringify({ notificationSettings, securitySettings }),
      );

      await logSystemAction({
        userName: currentUser?.full_name || "Unknown User",
        action: "Updated notification settings",
        details: `Updated alerts: sound ${notificationSettings.newTicketSound ? "on" : "off"}, browser ${notificationSettings.browserNotifications ? "on" : "off"}, digest ${notificationSettings.emailDigest}, escalation ${notificationSettings.escalationAlerts ? "on" : "off"}.`,
      });

      setShowNotificationSuccessDialog(true);
    } catch (error: unknown) {
      console.error("Error saving notification settings:", error);
      setErrorMessage(
        getErrorMessage(
          error,
          "Failed to save notification settings. Please try again.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSecuritySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      localStorage.setItem(
        advancedSettingsStorageKey,
        JSON.stringify({ notificationSettings, securitySettings }),
      );

      await logSystemAction({
        userName: currentUser?.full_name || "Unknown User",
        action: "Updated security settings",
        details: `Password min ${securitySettings.minPasswordLength}, complexity ${securitySettings.requireComplexity ? "required" : "not required"}, timeout ${securitySettings.sessionTimeoutMinutes}m, 2FA ${securitySettings.enable2FA ? "enabled" : "disabled"}.`,
      });

      setShowSecuritySuccessDialog(true);
    } catch (error: unknown) {
      console.error("Error saving security settings:", error);
      setErrorMessage(
        getErrorMessage(
          error,
          "Failed to save security settings. Please try again.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceLogoutAllSessions = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const timestamp = new Date().toISOString();
      localStorage.setItem("central_juan_force_logout_all", timestamp);
      window.dispatchEvent(
        new CustomEvent("central_juan_force_logout_all", {
          detail: { requestedAt: timestamp, requestedBy: currentUser?.id },
        }),
      );

      await logSystemAction({
        userName: currentUser?.full_name || "Unknown User",
        action: "Triggered force logout signal",
        details: "Sent force logout signal for all active sessions.",
      });

      setShowForceLogoutSuccessDialog(true);
    } catch (error: unknown) {
      console.error("Error forcing logout signal:", error);
      setErrorMessage(
        getErrorMessage(
          error,
          "Failed to trigger force logout. Please try again.",
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
    <div className="relative space-y-5 sm:space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="pointer-events-none absolute -top-16 -left-20 h-56 w-56 rounded-full bg-blue-200/30 blur-3xl" />
      <div className="pointer-events-none absolute top-24 -right-16 h-64 w-64 rounded-full bg-indigo-200/30 blur-3xl" />

      {/* Page Header */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50 to-blue-50/60 p-5 sm:p-8 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
        <div className="absolute -top-16 -right-10 h-40 w-40 rounded-full bg-blue-300/20 blur-2xl" />
        <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-indigo-300/20 blur-2xl" />

        <div className="relative flex items-start gap-3 sm:gap-4">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 text-white shadow-[0_10px_26px_rgba(59,130,246,0.35)] flex items-center justify-center flex-shrink-0">
            <SettingsIcon className="w-6 h-6" />
          </div>

          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-blue-600 mb-1">
              Control Center
            </p>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
              Account Settings
            </h1>
            <p className="text-slate-600 text-sm mt-1 font-medium max-w-2xl">
              Manage your profile identity, credentials, and platform behavior
              from a single professional control panel.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200 shadow-[0_8px_24px_rgba(15,23,42,0.06)] p-2 flex gap-2 w-full sm:w-fit overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("account")}
          className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex-shrink-0 ${
            activeTab === "account"
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25"
              : "text-gray-600 hover:bg-slate-50"
          }`}
        >
          Account
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("notifications")}
          className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex-shrink-0 ${
            activeTab === "notifications"
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25"
              : "text-gray-600 hover:bg-slate-50"
          }`}
        >
          Notifications
        </button>
        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => setActiveTab("security")}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === "security"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25"
                : "text-gray-600 hover:bg-slate-50"
            }`}
          >
            Security
          </button>
        )}
        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => setActiveTab("system")}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === "system"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25"
                : "text-gray-600 hover:bg-slate-50"
            }`}
          >
            System
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-8">
        {/* LEFT COLUMN: Profile Summary Card */}
        <div className="lg:col-span-1">
          <div className="relative overflow-hidden bg-white rounded-3xl border border-slate-200 shadow-[0_16px_38px_rgba(15,23,42,0.08)] p-4 sm:p-6 text-center lg:sticky lg:top-24">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-blue-50 to-indigo-50" />

            {/* CLICKABLE AVATAR UPLOAD */}
            <div
              className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-2 group cursor-pointer z-10"
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Profile"
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover shadow-lg border-4 border-white ring-2 ring-blue-100"
                />
              ) : (
                <div
                  className={`w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full flex items-center justify-center font-black text-3xl sm:text-4xl shadow-lg text-white border-4 border-white ring-2 ring-blue-100 ${currentUser.role === "Super Admin" ? "bg-gradient-to-tr from-indigo-600 to-indigo-400 shadow-indigo-500/20" : "bg-gradient-to-tr from-blue-600 to-blue-400 shadow-blue-500/20"}`}
                >
                  {currentUser?.full_name
                    ? currentUser.full_name.charAt(0).toUpperCase()
                    : "U"}
                </div>
              )}

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Hidden Input */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleAvatarChange}
            />
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-4 font-bold">
              Click image to change
            </p>

            <h2 className="text-xl font-black text-gray-900 tracking-tight">
              {currentUser.full_name}
            </h2>
            <p className="text-sm text-gray-500 font-medium mb-4">
              {currentUser.email}
            </p>

            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border ${currentUser.role === "Super Admin" ? "bg-indigo-50 text-indigo-700 border-indigo-100" : "bg-blue-50 text-blue-700 border-blue-100"}`}
            >
              {currentUser.role === "Super Admin" ? (
                <ShieldCheck className="w-4 h-4" />
              ) : (
                <Wrench className="w-4 h-4" />
              )}
              {currentUser.role}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 text-left">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                Account Status
              </p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-sm font-bold text-gray-900">
                  {currentUser.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Tabbed Forms */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === "account" && (
            <form onSubmit={handleSaveProfile}>
              <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_16px_38px_rgba(15,23,42,0.08)] overflow-hidden mb-6">
                <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50/40 flex items-center gap-3">
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

                <div className="p-4 sm:p-6 space-y-5">
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
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600/70 outline-none transition-all text-sm font-medium"
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
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600/70 outline-none transition-all text-sm font-medium"
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
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600/70 outline-none transition-all text-sm font-medium"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_12px_30px_rgba(15,23,42,0.07)] p-4 sm:p-6 flex flex-col gap-4">
                {errorMessage && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />{" "}
                    {errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3.5 rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md shadow-blue-600/25 disabled:opacity-70 flex justify-center items-center gap-2 active:scale-[0.98]"
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

          {activeTab === "notifications" && (
            <form onSubmit={handleSaveNotificationSettings}>
              <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_16px_38px_rgba(15,23,42,0.08)] overflow-hidden mb-6">
                <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-blue-100/70 bg-gradient-to-r from-blue-50 to-indigo-50/60 flex items-center gap-3">
                  <Bell className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Notification Preferences
                    </h3>
                    <p className="text-sm text-gray-500 font-medium">
                      Configure alert behavior for your daily operations.
                    </p>
                  </div>
                </div>

                <div className="p-4 sm:p-6 space-y-5">
                  <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        New Ticket Sound
                      </p>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        Play a sound when a new ticket arrives.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={notificationSettings.newTicketSound}
                        onChange={(e) =>
                          setNotificationSettings((prev) => ({
                            ...prev,
                            newTicketSound: e.target.checked,
                          }))
                        }
                      />
                      <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-blue-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Browser Notifications
                      </p>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        Receive desktop browser pop-up alerts.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={notificationSettings.browserNotifications}
                        onChange={(e) =>
                          setNotificationSettings((prev) => ({
                            ...prev,
                            browserNotifications: e.target.checked,
                          }))
                        }
                      />
                      <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-blue-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                    </label>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                    <label className="block text-sm font-bold text-slate-900 mb-2">
                      Email Digest Frequency
                    </label>
                    <select
                      value={notificationSettings.emailDigest}
                      onChange={(e) =>
                        setNotificationSettings((prev) => ({
                          ...prev,
                          emailDigest: e.target.value as
                            | "real-time"
                            | "hourly"
                            | "daily",
                        }))
                      }
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/70 outline-none transition-all text-sm font-medium"
                    >
                      <option value="real-time">Real-time</option>
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Escalation Alerts
                      </p>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        Alert when tickets exceed overdue threshold.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={notificationSettings.escalationAlerts}
                        onChange={(e) =>
                          setNotificationSettings((prev) => ({
                            ...prev,
                            escalationAlerts: e.target.checked,
                          }))
                        }
                      />
                      <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-blue-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_12px_30px_rgba(15,23,42,0.07)] p-4 sm:p-6 flex flex-col gap-4">
                {errorMessage && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />{" "}
                    {errorMessage}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3.5 rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md shadow-blue-600/25 disabled:opacity-70 flex justify-center items-center gap-2 active:scale-[0.98]"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Save Notification Settings"
                  )}
                </button>
              </div>
            </form>
          )}

          {activeTab === "security" && isSuperAdmin && (
            <form onSubmit={handleSaveSecuritySettings}>
              <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_16px_38px_rgba(15,23,42,0.08)] overflow-hidden mb-6">
                <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-indigo-100/70 bg-gradient-to-r from-indigo-50 to-slate-50/60 flex items-center gap-3">
                  <Shield className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Security Controls
                    </h3>
                    <p className="text-sm text-gray-500 font-medium">
                      Define account protection and policy behaviors.
                    </p>
                  </div>
                </div>

                <div className="p-4 sm:p-6 space-y-5">
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                    <label className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-2">
                      <KeyRound className="w-4 h-4 text-indigo-600" /> Password
                      Policy
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <select
                        value={securitySettings.minPasswordLength}
                        onChange={(e) =>
                          setSecuritySettings((prev) => ({
                            ...prev,
                            minPasswordLength: Number(e.target.value) as
                              | 8
                              | 10
                              | 12,
                          }))
                        }
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600/70 outline-none transition-all text-sm font-medium"
                      >
                        <option value={8}>Min 8 characters</option>
                        <option value={10}>Min 10 characters</option>
                        <option value={12}>Min 12 characters</option>
                      </select>

                      <label className="flex items-center justify-between gap-4 p-3 rounded-xl border border-slate-200 bg-white">
                        <span className="text-sm font-semibold text-slate-700">
                          Require complexity
                        </span>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                          checked={securitySettings.requireComplexity}
                          onChange={(e) =>
                            setSecuritySettings((prev) => ({
                              ...prev,
                              requireComplexity: e.target.checked,
                            }))
                          }
                        />
                      </label>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                    <label className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-2">
                      <Clock3 className="w-4 h-4 text-indigo-600" /> Session
                      Timeout
                    </label>
                    <select
                      value={securitySettings.sessionTimeoutMinutes}
                      onChange={(e) =>
                        setSecuritySettings((prev) => ({
                          ...prev,
                          sessionTimeoutMinutes: Number(e.target.value) as
                            | 15
                            | 30
                            | 60
                            | 120,
                        }))
                      }
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600/70 outline-none transition-all text-sm font-medium"
                    >
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={60}>60 minutes</option>
                      <option value={120}>120 minutes</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Optional 2FA (Future-ready)
                      </p>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        Enable two-factor authentication once provider is
                        connected.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={securitySettings.enable2FA}
                        onChange={(e) =>
                          setSecuritySettings((prev) => ({
                            ...prev,
                            enable2FA: e.target.checked,
                          }))
                        }
                      />
                      <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-indigo-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                    </label>
                  </div>

                  <div className="p-4 rounded-xl border border-red-200 bg-red-50/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-red-700 flex items-center gap-2">
                        <LogOut className="w-4 h-4" /> Force Logout All Sessions
                      </p>
                      <p className="text-xs text-red-600 font-medium mt-1">
                        Sends a global logout signal for active sessions.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowForceLogoutDialog(true)}
                      disabled={isLoading}
                      className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-60"
                    >
                      Trigger Logout
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_12px_30px_rgba(15,23,42,0.07)] p-4 sm:p-6 flex flex-col gap-4">
                {errorMessage && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />{" "}
                    {errorMessage}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3.5 rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md shadow-blue-600/25 disabled:opacity-70 flex justify-center items-center gap-2 active:scale-[0.98]"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Save Security Settings"
                  )}
                </button>
              </div>
            </form>
          )}

          {activeTab === "system" && isSuperAdmin && (
            <form onSubmit={handleSaveSystemSettings}>
              <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_16px_38px_rgba(15,23,42,0.08)] overflow-hidden mb-6">
                <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-indigo-100/70 bg-gradient-to-r from-indigo-50 to-blue-50/60 flex items-center gap-3">
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

                <div className="p-4 sm:p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
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

                    <label className="relative inline-flex items-center cursor-pointer sm:ml-4 flex-shrink-0 self-end sm:self-auto">
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

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                        <Clock3 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 mb-0.5">
                          Allowed Submission Hours
                        </h4>
                        <p className="text-sm text-gray-500 font-medium leading-snug">
                          Control what time range customers can submit public
                          ticket requests.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5">
                          Start Time
                        </label>
                        <input
                          type="time"
                          value={submissionHours.start}
                          onChange={(e) =>
                            setSubmissionHours((prev) => ({
                              ...prev,
                              start: e.target.value,
                            }))
                          }
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/70 outline-none transition-all text-sm font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5">
                          End Time
                        </label>
                        <input
                          type="time"
                          value={submissionHours.end}
                          onChange={(e) =>
                            setSubmissionHours((prev) => ({
                              ...prev,
                              end: e.target.value,
                            }))
                          }
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/70 outline-none transition-all text-sm font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                        <SettingsIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 mb-0.5">
                          Backup Reminder Settings
                        </h4>
                        <p className="text-sm text-gray-500 font-medium leading-snug">
                          Set how often admins receive backup reminder prompts.
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5">
                        Reminder Frequency
                      </label>
                      <select
                        value={backupReminderFrequency}
                        onChange={(e) =>
                          setBackupReminderFrequency(
                            e.target.value as BackupReminderFrequency,
                          )
                        }
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/70 outline-none transition-all text-sm font-medium"
                      >
                        <option value="off">Off</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-violet-100 text-violet-600">
                        <SettingsIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 mb-0.5">
                          Auto-assign Rule
                        </h4>
                        <p className="text-sm text-gray-500 font-medium leading-snug">
                          Decide how newly created jobs get assigned to
                          technicians.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setAutoAssignRule("round-robin")}
                        className={`text-left p-3 rounded-xl border transition-all ${
                          autoAssignRule === "round-robin"
                            ? "bg-violet-50 border-violet-200 text-violet-700"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <p className="text-sm font-bold">Round-robin</p>
                        <p className="text-xs mt-1">
                          Rotate assignments evenly across technicians.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAutoAssignRule("manual")}
                        className={`text-left p-3 rounded-xl border transition-all ${
                          autoAssignRule === "manual"
                            ? "bg-violet-50 border-violet-200 text-violet-700"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <p className="text-sm font-bold">Manual</p>
                        <p className="text-xs mt-1">
                          Keep assignment under admin/staff control.
                        </p>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_12px_30px_rgba(15,23,42,0.07)] p-4 sm:p-6 flex flex-col gap-4">
                {errorMessage && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />{" "}
                    {errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3.5 rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md shadow-blue-600/25 disabled:opacity-70 flex justify-center items-center gap-2 active:scale-[0.98]"
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

      <SettingsSuccessDialog
        open={showProfileSuccessDialog}
        title="Profile Updated"
        message="Your profile changes were saved successfully!"
        onClose={() => setShowProfileSuccessDialog(false)}
      />

      <SettingsSuccessDialog
        open={showSystemSuccessDialog}
        title="System Settings Updated"
        message="System configuration was successfully updated!"
        onClose={() => setShowSystemSuccessDialog(false)}
      />

      <SettingsSuccessDialog
        open={showNotificationSuccessDialog}
        title="Notification Settings Updated"
        message="Your alert preferences were saved successfully."
        onClose={() => setShowNotificationSuccessDialog(false)}
      />

      <SettingsSuccessDialog
        open={showSecuritySuccessDialog}
        title="Security Settings Updated"
        message="Security controls were saved successfully."
        onClose={() => setShowSecuritySuccessDialog(false)}
      />

      {showForceLogoutDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-red-100 p-2 text-red-600">
                <LogOut className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Confirm Force Logout
                </h3>
                <p className="mt-2 text-sm font-medium text-slate-600">
                  This will sign out all active sessions immediately. Continue?
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForceLogoutDialog(false)}
                disabled={isLoading}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await handleForceLogoutAllSessions();
                  setShowForceLogoutDialog(false);
                }}
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Confirm Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <SettingsSuccessDialog
        open={showForceLogoutSuccessDialog}
        title="Force Logout Triggered"
        message="All active sessions received a force logout signal."
        onClose={() => setShowForceLogoutSuccessDialog(false)}
      />
    </div>
  );
}
