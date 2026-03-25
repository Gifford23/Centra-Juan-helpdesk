import { useState } from "react";
import CreateJobModal from "./CreateJobModal";
import { Clock, MoreHorizontal, Plus, ChevronDown } from "lucide-react";

type Job = {
  id: string;
  customer: string;
  device: string;
  time: string;
  priority: "Normal" | "High";
  tech?: string;
};

type BoardData = {
  received: Job[];
  diagnosing: Job[];
  inProgress: Job[];
  ready: Job[];
};

type BoardFilter = "all" | "received" | "diagnosing" | "inProgress" | "ready";

type JobStatus = "Received" | "Diagnosing" | "In Repair" | "Ready";

type JobWithStatus = Job & { status: JobStatus };

type PendingAssignment = {
  jobId: string;
  customer: string;
  previousTech: string;
  nextTech: string;
} | null;

export default function JobOrdersContent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [boardFilter, setBoardFilter] = useState<BoardFilter>("all");
  const [pendingAssignment, setPendingAssignment] =
    useState<PendingAssignment>(null);
  const technicians = ["Unassigned", "Mark", "Sarah", "John"];

  const [boardData] = useState<BoardData>({
    received: [
      {
        id: "1418",
        customer: "Maria Santos",
        device: "HP Pavilion",
        time: "10m ago",
        priority: "Normal",
      },
      {
        id: "1419",
        customer: "Alex Reyes",
        device: "Canon Printer",
        time: "2m ago",
        priority: "High",
      },
    ],
    diagnosing: [
      {
        id: "1416",
        customer: "Juan Dela Cruz",
        device: "Acer Aspire 5",
        time: "2h ago",
        priority: "Normal",
        tech: "Mark",
      },
      {
        id: "1410",
        customer: "Miguel Reyes",
        device: "MacBook Pro M1",
        time: "1d ago",
        priority: "High",
        tech: "Mark",
      },
    ],
    inProgress: [
      {
        id: "1412",
        customer: "Elena Gomez",
        device: "Lenovo ThinkPad",
        time: "1d ago",
        priority: "Normal",
        tech: "Sarah",
      },
    ],
    ready: [
      {
        id: "1405",
        customer: "Sofia Lim",
        device: "Asus ROG",
        time: "2d ago",
        priority: "Normal",
        tech: "Sarah",
      },
    ],
  });

  const allJobs: JobWithStatus[] = [
    ...boardData.received.map((job) => ({
      ...job,
      status: "Received" as const,
    })),
    ...boardData.diagnosing.map((job) => ({
      ...job,
      status: "Diagnosing" as const,
    })),
    ...boardData.inProgress.map((job) => ({
      ...job,
      status: "In Repair" as const,
    })),
    ...boardData.ready.map((job) => ({ ...job, status: "Ready" as const })),
  ];

  const [assignedTechByJob, setAssignedTechByJob] = useState<
    Record<string, string>
  >(() =>
    allJobs.reduce<Record<string, string>>((acc, job) => {
      acc[job.id] = job.tech ?? "Unassigned";
      return acc;
    }, {}),
  );

  const getStatusPillClass = (status: JobStatus) => {
    switch (status) {
      case "Received":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Diagnosing":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "In Repair":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Ready":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const handleAssignTech = (job: JobWithStatus, selectedTech: string) => {
    const currentTech = assignedTechByJob[job.id] ?? "Unassigned";
    if (selectedTech === currentTech) {
      return;
    }

    setPendingAssignment({
      jobId: job.id,
      customer: job.customer,
      previousTech: currentTech,
      nextTech: selectedTech,
    });
  };

  const confirmAssignment = () => {
    if (!pendingAssignment) {
      return;
    }

    setAssignedTechByJob((prev) => ({
      ...prev,
      [pendingAssignment.jobId]: pendingAssignment.nextTech,
    }));
    setPendingAssignment(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            Job Orders Board
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">
            Visual workflow of all devices in the shop
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={boardFilter}
              onChange={(e) => setBoardFilter(e.target.value as BoardFilter)}
              className="appearance-none bg-white border border-gray-200 hover:border-gray-300 text-gray-700 pl-4 pr-10 py-2.5 rounded-xl font-bold transition-all shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="all">Filter Board: All</option>
              <option value="received">Received</option>
              <option value="diagnosing">Diagnosing</option>
              <option value="inProgress">In Repair</option>
              <option value="ready">Ready</option>
            </select>
            <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm text-sm active:scale-95"
          >
            <Plus className="w-4 h-4" /> Create Job Order
          </button>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-6 h-full min-w-[1000px]">
          {(boardFilter === "all" || boardFilter === "received") && (
            <Column
              title="Received"
              dotColorClass="bg-blue-500"
              jobs={boardData.received}
              showAddButton
            />
          )}

          {(boardFilter === "all" || boardFilter === "diagnosing") && (
            <Column
              title="Diagnosing"
              dotColorClass="bg-purple-500"
              jobs={boardData.diagnosing}
            />
          )}

          {(boardFilter === "all" || boardFilter === "inProgress") && (
            <Column
              title="In Repair"
              dotColorClass="bg-amber-500"
              jobs={boardData.inProgress}
            />
          )}

          {(boardFilter === "all" || boardFilter === "ready") && (
            <Column
              title="Ready"
              dotColorClass="bg-emerald-500"
              jobs={boardData.ready}
            />
          )}
        </div>
      </div>

      {/* Professional Customer Job Orders Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-gray-900 tracking-tight">
              Customer Job Orders
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Assign technicians per job order to streamline workflow
            </p>
          </div>
          <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {allJobs.length} Active Orders
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide border-b border-gray-200">
                <th className="px-6 py-3 font-bold">Job Order</th>
                <th className="px-6 py-3 font-bold">Customer</th>
                <th className="px-6 py-3 font-bold">Device</th>
                <th className="px-6 py-3 font-bold">Stage</th>
                <th className="px-6 py-3 font-bold">Priority</th>
                <th className="px-6 py-3 font-bold">Assigned Technician</th>
                <th className="px-6 py-3 font-bold">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {allJobs.map((job) => (
                <tr
                  key={job.id}
                  className="hover:bg-blue-50/40 transition-colors"
                >
                  <td className="px-6 py-4">
                    <p className="text-sm font-extrabold text-gray-900">
                      #{job.id}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">
                    {job.customer}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {job.device}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1.5 rounded-[13px] text-xs font-bold border ${getStatusPillClass(job.status)}`}
                    >
                      {job.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full border ${job.priority === "High" ? "bg-red-50 text-red-700 border-red-200" : "bg-gray-50 text-gray-600 border-gray-200"}`}
                    >
                      {job.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="relative w-44">
                      <select
                        value={assignedTechByJob[job.id] ?? "Unassigned"}
                        onChange={(e) => handleAssignTech(job, e.target.value)}
                        className="w-full appearance-none bg-white border border-gray-300 hover:border-gray-400 text-gray-700 pl-3 pr-9 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-200"
                      >
                        {technicians.map((tech) => (
                          <option key={tech} value={tech}>
                            {tech}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {job.time}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <CreateJobModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {pendingAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-lg font-extrabold text-gray-900">
                Confirm Technician Assignment
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Please review this assignment before applying changes.
              </p>
            </div>

            <div className="px-6 py-5 space-y-3 text-sm text-gray-700">
              <p>
                Job Order:{" "}
                <span className="font-bold text-gray-900">
                  #{pendingAssignment.jobId}
                </span>
              </p>
              <p>
                Customer:{" "}
                <span className="font-bold text-gray-900">
                  {pendingAssignment.customer}
                </span>
              </p>
              <p>
                Technician:{" "}
                <span className="font-semibold">
                  {pendingAssignment.previousTech}
                </span>
                <span className="mx-2 text-gray-400">to</span>
                <span className="font-bold text-blue-700">
                  {pendingAssignment.nextTech}
                </span>
              </p>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingAssignment(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAssignment}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Column({
  title,
  dotColorClass,
  jobs,
  showAddButton = false,
}: {
  title: string;
  dotColorClass: string;
  jobs: Job[];
  showAddButton?: boolean;
}) {
  return (
    <div className="flex-1 flex flex-col bg-gray-50/50 rounded-2xl border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${dotColorClass}`}></div>
          <h3 className="font-bold text-gray-900">{title}</h3>
          <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">
            {jobs.length}
          </span>
        </div>
        <button className="text-gray-400 hover:text-gray-900 transition-colors">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {jobs.map((job) => (
          <KanbanCard key={job.id} job={job} />
        ))}

        {showAddButton && (
          <button className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 font-bold text-sm hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2 bg-gray-50/50 hover:bg-blue-50/30">
            <Plus className="w-4 h-4" /> Add Job Order
          </button>
        )}
      </div>
    </div>
  );
}

function KanbanCard({ job }: { job: Job }) {
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-grab active:cursor-grabbing group">
      <div className="flex justify-between items-start mb-3">
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${job.priority === "High" ? "bg-red-50 text-red-600 border-red-200" : "bg-gray-50 text-gray-500 border-gray-200"}`}
        >
          {job.priority}
        </span>
        <button className="text-gray-300 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      <h4 className="font-bold text-gray-900 mb-1 text-sm">{job.device}</h4>
      <p className="text-xs text-gray-500 font-medium mb-4">
        {job.customer} • #{job.id}
      </p>

      <div className="flex justify-between items-center pt-3 border-t border-gray-50">
        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
          <Clock className="w-3.5 h-3.5" />
          {job.time}
        </div>
        {job.tech && (
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-blue-400 text-white flex items-center justify-center text-[10px] font-bold shadow-sm ring-2 ring-white">
            {job.tech}
          </div>
        )}
      </div>
    </div>
  );
}
