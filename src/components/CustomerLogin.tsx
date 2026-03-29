import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Phone, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { supabase } from "../lib/supabase";
import background from "../assets/background.png";
import technician from "../assets/technician.png";

export default function CustomerLogin() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
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

      // Save customer session
      localStorage.setItem("central_juan_customer", JSON.stringify(data));
      navigate("/my-portal");
    } catch (err: any) {
      setError(err.message || "Invalid login credentials.");
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

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-bold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
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
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium"
                placeholder="Enter your registered phone number"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
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
