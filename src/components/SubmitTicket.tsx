import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Chatbot from "./Chatbot";
import {
  Loader2,
  AlertCircle,
  User,
  Phone,
  Mail,
  MapPin,
  Wrench,
  Copy,
  ArrowRight,
  ChevronDown,
  ImagePlus,
  UploadCloud,
  X,
} from "lucide-react";
import check2 from "../assets/icons/check2.png";
import alertIcon from "../assets/icons/alert.png";
import { supabase } from "../lib/supabase";
import background from "../assets/background.png";
import technician from "../assets/technician.png";
import { logSystemAction } from "../utils/auditLog";

export default function SubmitTicket() {
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successTrackingId, setSuccessTrackingId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showCopySuccessModal, setShowCopySuccessModal] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  // Image Upload State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // 1. Check if the admin has enabled Public Tickets
  useEffect(() => {
    const checkSystemStatus = async () => {
      try {
        const { data, error } = await supabase
          .from("system_settings")
          .select("allow_public_tickets")
          .single();

        if (error) throw error;
        setIsAllowed(data.allow_public_tickets);
      } catch (error) {
        console.error("Failed to check system status", error);
        setIsAllowed(false); // Default to closed if we can't verify
      }
    };
    checkSystemStatus();
  }, []);

  // Generate a secure J&T style tracking ID
  const generateTrackingId = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "CJ-";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Handle Image Selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    const formData = new FormData(e.currentTarget);
    const newTrackingId = generateTrackingId();

    try {
      const customerName = String(formData.get("customerName") || "").trim();
      const phoneNumber = String(formData.get("phoneNumber") || "").trim();
      const email = String(formData.get("email") || "").trim();
      const address = String(formData.get("address") || "").trim();
      const deviceType = String(formData.get("deviceType") || "").trim();
      const issueCategory = String(formData.get("issueCategory") || "").trim();
      const brand = String(formData.get("brand") || "").trim();
      const model = String(formData.get("model") || "").trim();
      const serialNumber = String(formData.get("serialNumber") || "").trim();
      const visualChecks = String(formData.get("visualChecks") || "").trim();
      const complaint = String(formData.get("complaint") || "").trim();

      // 1. Upload Image to Supabase Storage (if selected)
      let imageUrl = null;
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${newTrackingId}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("job_images")
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        // Get the public URL for the uploaded image
        const { data: publicUrlData } = supabase.storage
          .from("job_images")
          .getPublicUrl(fileName);

        imageUrl = publicUrlData.publicUrl;
      }

      // 2. Insert the Customer Profile
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .insert([
          {
            full_name: customerName,
            phone_number: phoneNumber,
            email: email || null,
            address,
          },
        ])
        .select()
        .single();

      if (customerError) throw customerError;

      // 3. Insert the Job Order as "Pending Drop-off"
      const { error: jobOrderError } = await supabase
        .from("job_orders")
        .insert([
          {
            customer_id: customerData.id,
            tracking_id: newTrackingId,
            device_type: deviceType,
            brand,
            model,
            serial_number: serialNumber || "Unknown",
            visual_checks: visualChecks || "Not specified by customer",
            issue_category: issueCategory,
            complaint_notes: complaint,
            ...(imageUrl ? { image_url: imageUrl } : {}),
            status: "Pending Drop-off",
            priority: "Normal",
            assigned_tech: "Unassigned",
          },
        ]);

      if (jobOrderError) throw jobOrderError;

      // Do not block successful ticket creation if audit logging is restricted.
      try {
        await logSystemAction({
          userName: customerName || "Guest Customer",
          action: "Submitted public ticket",
          details: `Tracking ID ${newTrackingId} created via public portal.`,
        });
      } catch (auditError) {
        console.warn("Audit logging failed after ticket creation:", auditError);
      }

      // Show Success Screen
      setSuccessTrackingId(newTrackingId);
    } catch (error: unknown) {
      console.error("Error submitting ticket:", error);
      let backendMessage = "";
      if (typeof error === "object" && error !== null) {
        const errObj = error as {
          message?: string;
          error_description?: string;
          details?: string;
        };
        backendMessage =
          errObj.message || errObj.error_description || errObj.details || "";
      }
      setErrorMessage(
        backendMessage
          ? `Submit failed: ${backendMessage}`
          : "Something went wrong while submitting your request. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyTrackingId = async () => {
    if (!successTrackingId || isCopying) return;

    try {
      setIsCopying(true);
      await navigator.clipboard.writeText(successTrackingId);

      // Keep the loader briefly visible for clearer action feedback.
      await new Promise((resolve) => setTimeout(resolve, 500));
      setShowCopySuccessModal(true);
    } catch (error) {
      console.error("Failed to copy tracking ID:", error);
    } finally {
      setIsCopying(false);
    }
  };

  // Show a loading spinner while checking the database settings
  if (isAllowed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  // Show the "Closed" screen if the Super Admin disabled the feature
  if (isAllowed === false) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center"
        style={{
          backgroundImage: `url(${background})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="bg-white p-10 rounded-3xl shadow-xl max-w-md w-full">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <img src={alertIcon} alt="Alert" className="w-16 h-16" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">
            Portal Temporarily Closed
          </h2>
          <p className="text-gray-500 font-medium mb-8">
            We are currently not accepting new repair requests online. Please
            visit our physical branch or call our hotline for assistance.
          </p>
          <Link
            to="/track"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
          >
            Track an Existing Repair
          </Link>
        </div>

        <Chatbot />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen overflow-x-hidden bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans relative"
      style={{
        backgroundImage: `url(${background})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="absolute inset-0 bg-blue-900/10"></div>

      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="mx-auto w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-blue-900/10 mb-6">
            <img
              src={technician}
              alt="Technician"
              className="w-12 h-12 object-cover"
            />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-2">
            Submit Repair Request
          </h1>
          <p className="text-gray-700 font-medium max-w-xl mx-auto">
            Skip the line! Register your device details below, get your tracking
            number, and drop it off at our branch anytime.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-[24px] shadow-2xl shadow-blue-900/10 overflow-hidden border border-white">
          {/* SUCCESS SCREEN */}
          {successTrackingId ? (
            <div className="p-12 flex flex-col items-center text-center animate-in fade-in zoom-in-95">
              <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                <img src={check2} alt="Success" className="w-12 h-12" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">
                Request Submitted!
              </h2>
              <p className="text-gray-500 font-medium mb-8">
                Your device is now registered in our system. Please present this
                tracking number to the front desk when you drop off your device.
              </p>

              <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-6 mb-8 w-full max-w-sm relative group">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                  Official Tracking ID
                </p>
                <p className="text-2xl md:text-4xl font-black text-blue-600 tracking-wider break-words">
                  {successTrackingId}
                </p>
                <button
                  onClick={handleCopyTrackingId}
                  disabled={isCopying}
                  className="absolute top-4 right-4 p-2 rounded-lg transition-colors text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                  title={isCopying ? "Copying..." : "Copy ID"}
                >
                  {isCopying ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>

              <div className="flex gap-4 w-full max-w-sm">
                <Link
                  to="/track"
                  className="flex-1 bg-blue-600 text-white py-3.5 rounded-xl font-bold shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-colors"
                >
                  Track Status
                </Link>
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 bg-white border border-gray-200 text-gray-700 py-3.5 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                >
                  Submit Another
                </button>
              </div>

              {showCopySuccessModal && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                  <div
                    className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm"
                    onClick={() => setShowCopySuccessModal(false)}
                  ></div>

                  <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200 text-center">
                    <div className="mx-auto w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                      <img src={check2} alt="Copied" className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-1">
                      Successfully Copied
                    </h3>
                    <p className="text-sm text-gray-500 font-medium mb-6">
                      Your tracking ID has been copied to clipboard.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowCopySuccessModal(false)}
                      className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
                    >
                      OK
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* SUBMISSION FORM */
            <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-8">
              {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />{" "}
                  {errorMessage}
                </div>
              )}

              {/* 1. Customer Information */}
              <div>
                <h3 className="text-sm font-bold text-blue-900 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                  <User className="w-4 h-4" /> Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 relative">
                    <User className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      name="customerName"
                      required
                      placeholder="Full Name *"
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium"
                    />
                  </div>
                  <div className="relative">
                    <Phone className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
                    <input
                      type="tel"
                      name="phoneNumber"
                      required
                      placeholder="Phone Number *"
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium"
                    />
                  </div>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="Email Address *"
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium"
                    />
                  </div>
                  <div className="md:col-span-2 relative">
                    <MapPin className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      name="address"
                      required
                      placeholder="Complete Address *"
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Device Details */}
              <div>
                <h3 className="text-sm font-bold text-blue-900 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                  <Wrench className="w-4 h-4" /> Device Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <select
                      name="deviceType"
                      required
                      className="w-full pr-10 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium cursor-pointer appearance-none"
                    >
                      <option value="">Select Device Type *</option>
                      <option value="Laptop">Laptop</option>
                      <option value="Desktop">Desktop PC</option>
                      <option value="Printer">Printer</option>
                      <option value="Other">Other</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5 pointer-events-none" />
                  </div>
                  <div className="relative">
                    <select
                      name="issueCategory"
                      required
                      className="w-full pr-10 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium cursor-pointer appearance-none"
                    >
                      <option value="">Primary Issue *</option>
                      <option value="Hardware">
                        Hardware / Physical Damage
                      </option>
                      <option value="Software">Software / OS / Virus</option>
                      <option value="No Power">No Power / Won't Turn On</option>
                      <option value="Upgrade">Upgrades / Installation</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5 pointer-events-none" />
                  </div>
                  <input
                    type="text"
                    name="brand"
                    required
                    placeholder="Brand (e.g., Acer, HP) *"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium"
                  />
                  <input
                    type="text"
                    name="model"
                    required
                    placeholder="Model *"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium"
                  />

                  <div className="md:col-span-2">
                    <input
                      type="text"
                      name="serialNumber"
                      placeholder="Serial Number (If known)"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <textarea
                      name="complaint"
                      required
                      rows={3}
                      placeholder="Please describe the issue in detail..."
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium resize-none"
                    ></textarea>
                  </div>
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      name="visualChecks"
                      placeholder="Any visible physical damage? (Scratches, dents, etc.)"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Optional Image Upload */}
              <div>
                <h3 className="text-sm font-bold text-blue-900 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                  <ImagePlus className="w-4 h-4" /> Upload Photo (Optional)
                </h3>
                <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors relative">
                  {imagePreview ? (
                    <div className="relative w-full max-w-xs mx-auto">
                      <img
                        src={imagePreview}
                        alt="Device Preview"
                        className="w-full h-48 object-cover rounded-xl shadow-sm border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                        }}
                        className="absolute -top-3 -right-3 p-1.5 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-colors"
                        title="Remove Image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="w-10 h-10 text-blue-500 mb-3" />
                      <p className="text-sm font-bold text-gray-700 text-center">
                        Click or drag an image to upload
                      </p>
                      <p className="text-xs text-gray-500 mt-1 text-center">
                        Take a picture of the error screen or physical damage.
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider text-center">
                        PNG, JPG up to 5MB
                      </p>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={handleImageChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer flex-shrink-0"
                  />
                  <span className="text-xs text-blue-900 font-medium leading-relaxed">
                    I understand that submitting this form registers my device
                    in the Central Juan system. A minimum diagnostic fee of PHP
                    150.00 applies once the device is dropped off and inspected.
                    I am responsible for backing up my data prior to drop-off.{" "}
                    <Link to="/terms" target="_blank" className="text-blue-600 font-bold hover:underline">
                      Read full Terms & Policies.
                    </Link>
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center gap-2 text-lg"
              >
                {isSubmitting ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    Submit Request <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* CHATBOT ADDED HERE FOR THE MAIN OPEN SCREEN */}
      <Chatbot />
    </div>
  );
}