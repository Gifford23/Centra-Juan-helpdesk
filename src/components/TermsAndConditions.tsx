import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Shield, Lock, HardDrive } from "lucide-react";
import background from "../assets/background.png";
import technician from "../assets/technician.png";

export default function TermsAndConditions() {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate("/submit-ticket");
  };

  return (
    <div
      className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans relative"
      style={{
        backgroundImage: `url(${background})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-blue-900/10"></div>

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Top Navigation */}
        <button
          onClick={handleGoBack}
          className="mb-6 flex items-center gap-2 text-white bg-blue-900/50 hover:bg-blue-900/80 px-4 py-2 rounded-xl backdrop-blur-md transition-colors w-fit font-bold text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>

        {/* Main Document Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-[24px] shadow-2xl shadow-blue-900/10 overflow-hidden border border-white">
          {/* Document Header */}
          <div className="bg-gradient-to-r from-blue-700 to-blue-600 p-8 sm:p-10 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="relative z-10">
              <div className="mx-auto w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-4">
                <img
                  src={technician}
                  alt="Logo"
                  className="w-10 h-10 object-cover"
                />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
                Enterprise Helpdesk Policies
              </h1>
              <p className="text-blue-100 font-medium">
                Central Juan I.T. Solutions • Effective 2026
              </p>
            </div>
          </div>

          {/* Document Content */}
          <div className="p-8 sm:p-12 space-y-10 text-gray-700 leading-relaxed">
            {/* Section 1 */}
            <section>
              <div className="flex items-center gap-3 mb-4 pb-2 border-b border-gray-100">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                  SECTION 1: Customer Terms of Service (ToS)
                </h2>
              </div>
              <ul className="space-y-4 list-disc pl-5 marker:text-blue-500">
                <li>
                  <strong className="text-gray-900">Diagnostic Fees:</strong> By
                  submitting a device via the Public Ticket Portal, the customer
                  agrees to a minimum, non-refundable diagnostic fee of{" "}
                  <strong className="text-blue-600">PHP 150.00</strong>. This
                  fee covers the initial technician assessment and applies once
                  the device is physically dropped off and inspected, regardless
                  of whether the customer chooses to proceed with the full
                  repair.
                </li>
                <li>
                  <strong className="text-gray-900">
                    Data Liability & Backup:
                  </strong>{" "}
                  The customer acknowledges that device repair carries an
                  inherent risk of data loss. Customers are{" "}
                  <strong>strictly responsible</strong> for backing up all
                  personal data, software, and files prior to dropping off the
                  device. Central Juan I.T. Solutions assumes zero liability for
                  lost, corrupted, or compromised data during the repair
                  process.
                </li>
                <li>
                  <strong className="text-gray-900">
                    Device Abandonment (90-Day Rule):
                  </strong>{" "}
                  Once a device is marked as "Ready for Pickup," the customer
                  will be notified via their Customer Portal. If the device is
                  not claimed and all associated fees are not paid within{" "}
                  <strong className="text-red-600">ninety (90) days</strong> of
                  this notification, the device will be legally considered
                  abandoned. Central Juan reserves the right to recycle,
                  dispose, or sell the device to recover unpaid labor and parts
                  costs.
                </li>
                <li>
                  <strong className="text-gray-900">Uploaded Media:</strong> Any
                  images uploaded by the customer via the Ticket Portal must be
                  strictly related to the device's physical condition or error
                  screens. Uploading inappropriate, illegal, or irrelevant media
                  will result in immediate ticket cancellation and account
                  suspension.
                </li>
              </ul>
            </section>

            {/* Section 2 */}
            <section>
              <div className="flex items-center gap-3 mb-4 pb-2 border-b border-gray-100">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Shield className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                  SECTION 2: Privacy & Data Handling Policy
                </h2>
              </div>
              <ul className="space-y-4 list-disc pl-5 marker:text-indigo-500">
                <li>
                  <strong className="text-gray-900">Data Collection:</strong> To
                  provide passwordless authentication and repair tracking, the
                  system collects the customer's Full Name, Phone Number, Email
                  Address, and Physical Address.
                </li>
                <li>
                  <strong className="text-gray-900">
                    Passwordless Authentication:
                  </strong>{" "}
                  Customer Portal access relies on a secure, two-factor matching
                  system using the customer's registered{" "}
                  <strong className="text-indigo-600">
                    Email Address and Phone Number
                  </strong>
                  . Customers are responsible for providing accurate contact
                  information to ensure continued access to their portal.
                </li>
                <li>
                  <strong className="text-gray-900">Right to Privacy:</strong>{" "}
                  Customer data is used strictly for repair tracking, invoicing,
                  and system notifications. Central Juan I.T. Solutions will
                  never sell, distribute, or leverage customer PII for
                  third-party marketing purposes.
                </li>
                <li>
                  <strong className="text-gray-900">Data Retention:</strong>{" "}
                  Repair histories and transaction logs are stored indefinitely
                  for warranty and audit purposes unless the customer explicitly
                  requests a permanent account deletion.
                </li>
              </ul>
            </section>

            {/* Section 3 */}
            <section>
              <div className="flex items-center gap-3 mb-4 pb-2 border-b border-gray-100">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Lock className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                  SECTION 3: Internal IT & Access Control Policy
                </h2>
              </div>
              <ul className="space-y-4 list-disc pl-5 marker:text-emerald-500">
                <li>
                  <strong className="text-gray-900">
                    Role-Based Access Control (RBAC):
                  </strong>
                  <ul className="mt-2 space-y-2 list-circle pl-5 marker:text-gray-400">
                    <li>
                      <strong>Technicians</strong> are granted restricted
                      access. They may only view, update, and manage job orders
                      explicitly assigned to them. They cannot reassign tickets
                      to other staff, modify global system settings, or view the
                      complete unassigned queue.
                    </li>
                    <li>
                      <strong>Super Admins</strong> have unrestricted global
                      access. Only Super Admins are authorized to delete
                      tickets, reassign technicians, manage the personnel
                      directory, and toggle the Public Ticket Portal
                      availability.
                    </li>
                  </ul>
                </li>
                <li>
                  <strong className="text-gray-900">
                    Mandatory Audit Logging:
                  </strong>{" "}
                  Every critical action taken within the system—including
                  logging in, updating ticket statuses, assigning technicians,
                  and deleting records—is permanently recorded in the System
                  Logs. Personnel are strictly prohibited from sharing accounts,
                  as all actions are legally tied to the logged-in user's
                  profile.
                </li>
                <li>
                  <strong className="text-gray-900">
                    Customer Data Confidentiality:
                  </strong>{" "}
                  Technicians may view customer files or data <em>only</em> to
                  the extent necessary to complete the requested repair.
                  Unauthorized browsing, copying, or transferring of a
                  customer's personal files during the repair process is grounds
                  for immediate termination.
                </li>
              </ul>
            </section>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 p-6 text-center border-t border-gray-100">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
              <HardDrive className="w-3.5 h-3.5" /> End of Policy Document
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
