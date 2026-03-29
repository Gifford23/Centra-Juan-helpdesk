import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
  X,
  CheckCircle2,
} from "lucide-react";
import technician from "../assets/technician.png";
import background from "../assets/background.png";
import { supabase } from "../lib/supabase"; // Import Supabase connection
import { logSystemAction } from "../utils/auditLog";

export default function AdminLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginSuccessModal, setShowLoginSuccessModal] = useState(false);
  const [loggedInUserName, setLoggedInUserName] = useState("");
  const [error, setError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showForgotPasswordValue, setShowForgotPasswordValue] = useState(false);
  const [showForgotConfirmValue, setShowForgotConfirmValue] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState("");
  const [showResetSuccessModal, setShowResetSuccessModal] = useState(false);

  const navigate = useNavigate();

  const handleOpenForgotPassword = () => {
    setForgotEmail(email);
    setNewPassword("");
    setConfirmPassword("");
    setForgotPasswordError("");
    setShowResetSuccessModal(false);
    setShowForgotPassword(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordError("");

    if (!forgotEmail.trim()) {
      setForgotPasswordError("Please enter your email address.");
      return;
    }

    if (newPassword.length < 6) {
      setForgotPasswordError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotPasswordError("Passwords do not match.");
      return;
    }

    setIsResettingPassword(true);
    try {
      const normalizedEmail = forgotEmail.trim().toLowerCase();

      const { data: account, error: accountError } = await supabase
        .from("personnel")
        .select("id, full_name")
        .eq("email", normalizedEmail)
        .single();

      if (accountError || !account) {
        throw new Error("No account found with that email address.");
      }

      const { error: updateError } = await supabase
        .from("personnel")
        .update({ password: newPassword })
        .eq("id", account.id);

      if (updateError) throw updateError;

      await logSystemAction({
        userName: account.full_name || normalizedEmail,
        action: "Password reset",
        details: `Password reset using forgot password flow for ${normalizedEmail}.`,
      });

      setShowForgotPassword(false);
      setShowResetSuccessModal(true);
      setPassword("");
      setEmail(normalizedEmail);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      console.error("Forgot Password Error:", err);
      setForgotPasswordError(
        err instanceof Error
          ? err.message
          : "Unable to reset password right now.",
      );
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // 1. Query the personnel table for this email and password
      const { data, error: fetchError } = await supabase
        .from("personnel")
        .select("*")
        .eq("email", email)
        .eq("password", password)
        .single(); // We expect exactly one match

      // 2. Handle Invalid Credentials
      if (fetchError || !data) {
        await logSystemAction({
          userName: email || "Unknown User",
          action: "Failed login attempt",
          details: `Login failed for email: ${email}`,
        });
        throw new Error("Invalid email or password.");
      }

      // 3. Handle Deactivated Accounts
      if (data.status !== "Active") {
        await logSystemAction({
          userName: data.full_name || email || "Unknown User",
          action: "Blocked login attempt",
          details: "Attempted login with deactivated account.",
        });
        throw new Error(
          "This account has been deactivated. Contact an administrator.",
        );
      }

      // 4. Success! Save user data locally so the Dashboard knows who is logged in
      localStorage.setItem("central_juan_user", JSON.stringify(data));

      await logSystemAction({
        userName: data.full_name || "Unknown User",
        action: "User login",
        details: `${data.role || "User"} signed in successfully.`,
      });

      setLoggedInUserName(data.full_name || data.email || "User");
      setShowLoginSuccessModal(true);
      setPassword("");
    } catch (err: unknown) {
      console.error("Login Error:", err);
      setError(
        err instanceof Error ? err.message : "An error occurred during login.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans relative"
      style={{
        backgroundImage: `url(${background})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Dark overlay to make the card pop */}
      <div className="absolute inset-0 bg-blue-900/10"></div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-blue-900/10 mb-6">
          <img
            src={technician}
            alt="Technician"
            className="w-12 h-12 object-cover"
          />
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
          Central Juan
        </h2>
        <p className="mt-2 text-sm text-gray-600 font-bold tracking-widest uppercase">
          I.T. Solutions Service Desk
        </p>
      </div>

      <div className="relative z-10 mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/90 backdrop-blur-xl py-8 px-4 shadow-2xl shadow-blue-900/20 rounded-2xl sm:rounded-[24px] sm:px-10 border border-white">
          <form className="space-y-6" onSubmit={handleLogin}>
            {/* Error Message Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-sm font-medium shadow-sm"
                  placeholder="admin@centraljuan.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-bold text-gray-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleOpenForgotPassword}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-11 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-sm font-medium shadow-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-blue-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm font-medium text-gray-700 cursor-pointer"
              >
                Remember my device
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-md shadow-blue-600/20 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Sign in securely <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security Footer */}
          <div className="mt-8 border-t border-gray-200/60 pt-6">
            <div className="text-center flex flex-col gap-1">
              <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase">
                Restricted Access
              </span>
              <p className="text-xs text-gray-500 font-medium">
                Authorized Central Juan personnel only.
                <br />
                All login attempts are logged and monitored.
              </p>
            </div>
          </div>
        </div>
      </div>

      {showForgotPassword && (
        <div className="fixed inset-0 z-20 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/35 backdrop-blur-[1px]"
            onClick={() => !isResettingPassword && setShowForgotPassword(false)}
          ></div>

          <div className="relative w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-2xl p-6">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">
                  Reset Password
                </h3>
                <p className="text-sm text-gray-500 font-medium mt-1">
                  Enter your account email and a new password.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                disabled={isResettingPassword}
                className="p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                aria-label="Close reset password dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleResetPassword}>
              {forgotPasswordError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  {forgotPasswordError}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="block w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-sm font-medium shadow-sm"
                  placeholder="admin@centraljuan.com"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  New password
                </label>
                <div className="relative">
                  <input
                    type={showForgotPasswordValue ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full pr-11 px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-sm font-medium shadow-sm"
                    placeholder="At least 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordValue((v) => !v)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-blue-600 transition-colors"
                    aria-label={
                      showForgotPasswordValue
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showForgotPasswordValue ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  Confirm new password
                </label>
                <div className="relative">
                  <input
                    type={showForgotConfirmValue ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pr-11 px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-sm font-medium shadow-sm"
                    placeholder="Re-enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowForgotConfirmValue((v) => !v)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-blue-600 transition-colors"
                    aria-label={
                      showForgotConfirmValue
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                  >
                    {showForgotConfirmValue ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  disabled={isResettingPassword}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResettingPassword}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-70 flex items-center gap-2"
                >
                  {isResettingPassword ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : null}
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showResetSuccessModal && (
        <div className="fixed inset-0 z-30 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            onClick={() => setShowResetSuccessModal(false)}
          ></div>

          <div className="relative w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight">
                  Password Updated
                </h3>
                <p className="text-sm text-gray-500 font-medium mt-0.5">
                  Your password has been successfully updated. You can now sign
                  in with your new password.
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowResetSuccessModal(false)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-blue-950/45 backdrop-blur-sm"></div>

          <div className="relative w-full max-w-sm rounded-3xl border border-white/20 bg-white/95 shadow-2xl p-7 text-center">
            <div className="mx-auto mb-4 relative w-16 h-16 flex items-center justify-center">
              <span className="absolute inset-0 rounded-full border-4 border-blue-100"></span>
              <span className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 border-r-blue-500 animate-spin"></span>
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            </div>
            <h3 className="text-lg font-black text-gray-900 tracking-tight">
              Signing you in securely
            </h3>
            <p className="mt-1.5 text-sm text-gray-500 font-medium">
              Verifying your credentials and preparing your dashboard...
            </p>
          </div>
        </div>
      )}

      {showLoginSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-blue-950/45 backdrop-blur-sm"></div>

          <div className="relative w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight">
                  Login Successful
                </h3>
                <p className="text-sm text-gray-500 font-medium mt-0.5">
                  Welcome back, {loggedInUserName}. Your session is now active.
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowLoginSuccessModal(false);
                  navigate("/");
                }}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
