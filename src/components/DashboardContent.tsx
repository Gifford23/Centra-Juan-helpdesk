import { useState } from "react";
import CreateJobModal from "./CreateJobModal";
import { MoreVertical } from "lucide-react";
import tools from "../assets/icons/tools.png";
import pending from "../assets/icons/pending.gif";
import check from "../assets/icons/check.png";
import warning from "../assets/icons/warning.png";

export default function DashboardContent() {
  // 1. Add the state to control when the modal is open or closed
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Dummy data for the Active Workload table
  const activeWorkload = [
    {
      id: "1416",
      tech: "Mark",
      device: "Acer Aspire 5",
      status: "Diagnosing",
      time: "2 hrs ago",
    },
    {
      id: "1412",
      tech: "Sarah",
      device: "Lenovo ThinkPad",
      status: "In Progress",
      time: "1 day ago",
    },
    {
      id: "1410",
      tech: "Mark",
      device: "MacBook Pro M1",
      status: "Waiting on Parts",
      time: "3 days ago",
    },
    {
      id: "1418",
      tech: "Unassigned",
      device: "HP Pavilion",
      status: "Received",
      time: "10 mins ago",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard Overview
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Central Juan C.M. Recto Branch - Live Status
          </p>
        </div>

        {/* 2. Update the button to open the modal when clicked (with loader) */}
        <button
          onClick={() => {
            setIsCreating(true);
            setTimeout(() => {
              setIsModalOpen(true);
              setIsCreating(false);
            }, 600);
          }}
          disabled={isCreating}
          className={`bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm flex items-center justify-center ${isCreating ? "opacity-80 cursor-wait" : ""}`}
        >
          {isCreating ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin inline-block" />
              <span>Creating...</span>
            </span>
          ) : (
            "+ Create Job Order"
          )}
        </button>
      </div>

      {/* ==========================================
          TOP ROW: METRIC CARDS
      ========================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Pending Drop-offs */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0">
            <img
              src={pending}
              alt="Pending"
              className="w-10 h-10 object-contain"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">
              Pending Drop-offs
            </p>
            <h3 className="text-2xl font-bold text-gray-900">4</h3>
          </div>
        </div>

        {/* Card 2: Active Workbench */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
            <img src={tools} alt="Tools" className="w-6 h-6 object-contain" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">
              Active Workbench
            </p>
            <h3 className="text-2xl font-bold text-gray-900">12</h3>
          </div>
        </div>

        {/* Card 3: Ready for Release */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0">
            <img src={check} alt="Ready" className="w-7 h-7 object-contain" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">
              Ready for Release
            </p>
            <h3 className="text-2xl font-bold text-gray-900">7</h3>
          </div>
        </div>

        {/* Card 4: 90-Day Warnings */}
        <div className="bg-white p-6 rounded-xl border border-red-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center flex-shrink-0">
            <img
              src={warning}
              alt="Warning"
              className="w-6 h-6 object-contain"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-red-600">90-Day Warnings</p>
            <h3 className="text-2xl font-bold text-gray-900">2</h3>
          </div>
        </div>
      </div>

      {/* ==========================================
          MIDDLE SECTION: ACTIVE WORKLOAD TABLE
      ========================================== */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm mt-8 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">
            Active Technician Workload
          </h2>
          <button className="text-sm text-blue-600 font-medium hover:text-blue-700">
            View All
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm">
                <th className="px-6 py-4 font-medium">Job Order</th>
                <th className="px-6 py-4 font-medium">Assigned Tech</th>
                <th className="px-6 py-4 font-medium">Device</th>
                <th className="px-6 py-4 font-medium">Current Status</th>
                <th className="px-6 py-4 font-medium">Last Update</th>
                <th className="px-6 py-4 font-medium text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {activeWorkload.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-gray-900">
                    #{job.id}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          job.tech === "Unassigned"
                            ? "bg-gray-100 text-gray-500"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {job.tech === "Unassigned" ? "?" : job.tech.charAt(0)}
                      </div>
                      <span
                        className={`text-sm ${job.tech === "Unassigned" ? "text-gray-500 italic" : "text-gray-700"}`}
                      >
                        {job.tech}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {job.device}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        job.status === "Diagnosing"
                          ? "bg-purple-100 text-purple-700"
                          : job.status === "In Progress"
                            ? "bg-blue-100 text-blue-700"
                            : job.status === "Waiting on Parts"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {job.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {job.time}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreVertical className="w-5 h-5 mx-auto" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Add the Modal component at the very bottom of the file! */}
      <CreateJobModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
