import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Phone, Loader2, AlertCircle, ArrowRight, X } from "lucide-react";
import { supabase } from "../lib/supabase";
import background from "../assets/background.png";
import technician from "../assets/technician.png";

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 5 * 60 * 1000;
const CUSTOMER_SECURITY_KEY = "central_juan_customer_security";

export default function CustomerLogin() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const data = localStorage.getItem(CUSTOMER_SECURITY_KEY);
    if (!data) return;

    const parsed = JSON.parse(data);
    if (parsed.lockoutUntil && parsed.lockoutUntil > Date.now()) {
      setLockoutUntil(parsed.lockoutUntil);
      return;
    }

    if (parsed.lockoutUntil && parsed.lockoutUntil <= Date.now()) {
      localStorage.removeItem(CUSTOMER_SECURITY_KEY);
      return;
    }

    setAttempts(parsed.attempts || 0);
  }, []);

  useEffect(() => {
    if (!lockoutUntil) return;

    const interval = setInterval(() => {
      const diff = lockoutUntil - Date.now();
      if (diff <= 0) {
        setLockoutUntil(null);
        setAttempts(0);
        setTimeRemaining("");
        setError("");
        localStorage.removeItem(CUSTOMER_SECURITY_KEY);
        clearInterval(interval);
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(`${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [lockoutUntil]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutUntil) return;

    setIsLoading(true);
    setError("");

    try {
      // Find customer by matching Email and Phone Number
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("email", email.trim())
        .eq("phone_number", phone.trim())
        .single();

      if (error || !data) {
        throw new Error(
          "No account found with this email and phone number combination.",
        );
      }

      localStorage.removeItem(CUSTOMER_SECURITY_KEY);
      setAttempts(0);

      // Save customer session
      localStorage.setItem(
        "central_juan_customer_session_started_at",
        new Date().toISOString(),
      );
      localStorage.setItem("central_juan_customer", JSON.stringify(data));
      navigate("/my-portal");
    } catch (err: unknown) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts >= MAX_ATTEMPTS) {
        const unlockTime = Date.now() + LOCKOUT_DURATION;
        setLockoutUntil(unlockTime);
        localStorage.setItem(
          CUSTOMER_SECURITY_KEY,
          JSON.stringify({ attempts: newAttempts, lockoutUntil: unlockTime }),
        );
        setError(
          "Too many failed attempts. Your account is temporarily locked.",
        );
      } else {
        localStorage.setItem(
          CUSTOMER_SECURITY_KEY,
          JSON.stringify({ attempts: newAttempts, lockoutUntil: null }),
        );
        setError(
          err instanceof Error
            ? `${err.message} (${MAX_ATTEMPTS - newAttempts} attempts remaining)`
            : `Invalid login credentials. (${MAX_ATTEMPTS - newAttempts} attempts remaining)`,
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: `url(${background})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-sm"></div>

      <div className="relative w-full max-w-md bg-white/95 backdrop-blur-xl rounded-[24px] shadow-2xl p-8 sm:p-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-blue-100">
            <img
              src={technician}
              alt="Logo"
              className="w-10 h-10 object-cover"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Customer Portal
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-2">
            Log in to view your repair history and active tickets.
          </p>
        </div>

        {lockoutUntil && (
          <div className="mb-6 bg-[#fdeaea] border border-[#e8c9c9] text-[#7a2323] p-3 sm:p-4 rounded-md animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-2.5 sm:gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#de4b4b] flex items-center justify-center flex-shrink-0 mt-0.5">
                <X className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white stroke-[3]" />
              </div>
              <p className="text-sm sm:text-[15px] leading-5 sm:leading-6 font-medium">
                <span className="font-extrabold">
                  Your account has been locked
                </span>{" "}
                because you have reached the maximum number of invalid sign-in
                attempts. Please try again in {timeRemaining}.
              </p>
            </div>
          </div>
        )}

        {error && !lockoutUntil && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-bold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
          </div>
        )}

        <form
          onSubmit={handleLogin}
          className={`space-y-5 ${lockoutUntil ? "opacity-50 pointer-events-none" : ""}`}
        >
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                disabled={!!lockoutUntil}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium"
                placeholder="Enter your registered email"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="tel"
                required
                disabled={!!lockoutUntil}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium"
                placeholder="Enter your registered phone number"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !!lockoutUntil}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 disabled:opacity-70 flex justify-center items-center gap-2 mt-4"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Access My Portal <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link
            to="/submit-ticket"
            className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
          >
            Don't have a ticket? Submit one here
          </Link>
        </div>
      </div>
    </div>
  );
}
