import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  FileText,
  ShoppingCart,
  CreditCard,
  BadgeCheck,
  Check,
} from "lucide-react";

type QuoteItem = {
  id: string;
  item: string;
  description: string;
  qty: number;
  rate: number;
  total: number;
};

type ProgressTicket = {
  status: string;
  brand?: string;
  model?: string;
  created_at: string;
  job_order_no?: string | number;
  complaint_notes?: string;
  resolution_notes?: string;
  assigned_tech?: string | null;
  quotation_status?: string;
  quotation_amount?: number;
  quotation_message?: string;
  quotation_items?: QuoteItem[];
  payment_status?: string;
  amount_paid?: number;
  has_purchase_order?: boolean;
};

type StageKey = "job" | "quote" | "po" | "payment" | "complete";

const COMPLETED_STATUSES = ["Ready for Pickup", "Ready", "Released"];

const formatPeso = (value: number) =>
  `P${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

interface CustomerProgressDetailsProps {
  ticket: ProgressTicket;
}

export default function CustomerProgressDetails({
  ticket,
}: CustomerProgressDetailsProps) {
  const [activeStage, setActiveStage] = useState<StageKey>("job");

  const financials = useMemo(() => {
    const total = ticket.quotation_amount || 0;
    const paid = ticket.amount_paid || 0;
    const balance = Math.max(0, total - paid);
    return { total, paid, balance };
  }, [ticket.amount_paid, ticket.quotation_amount]);

  const isCompleted = COMPLETED_STATUSES.includes(ticket.status);

  const stages = [
    {
      key: "job" as const,
      label: "Job Order Details",
      icon: ClipboardList,
      active: true,
    },
    {
      key: "quote" as const,
      label: "Quotation Details",
      icon: FileText,
      active:
        !!ticket.quotation_status && ticket.quotation_status !== "Not Created",
    },
    {
      key: "po" as const,
      label: "Purchase Order Details",
      icon: ShoppingCart,
      active: !!ticket.has_purchase_order,
    },
    {
      key: "payment" as const,
      label: "Payment Details",
      icon: CreditCard,
      active: ticket.payment_status === "Paid" || financials.paid > 0,
    },
    {
      key: "complete" as const,
      label: "Complete Details",
      icon: BadgeCheck,
      active: isCompleted,
    },
  ];

  const currentProgressIndex = (() => {
    const firstPendingIndex = stages.findIndex((stage) => !stage.active);
    return firstPendingIndex === -1 ? stages.length - 1 : firstPendingIndex;
  })();

  const unlockedStages = stages.filter((stage) => stage.active).length;
  const completionPercent = Math.round((unlockedStages / stages.length) * 100);

  const stageTheme: Record<
    StageKey,
    {
      panel: string;
      pill: string;
      progressBar: string;
      stageButton: string;
      stageIcon: string;
      cue: string;
      section: string;
    }
  > = {
    job: {
      panel: "bg-sky-50/60 border border-sky-100",
      pill: "border-sky-200/60 bg-sky-500/20",
      progressBar: "from-sky-300 via-blue-300 to-indigo-300",
      stageButton:
        "border-sky-200 bg-gradient-to-b from-sky-50 to-white shadow-md shadow-sky-100/70",
      stageIcon: "bg-sky-100 text-sky-700",
      cue: "bg-sky-50 text-sky-700 border-sky-200",
      section: "bg-sky-50/40 border-sky-200 shadow-sky-100/60",
    },
    quote: {
      panel: "bg-violet-50/60 border border-violet-100",
      pill: "border-violet-200/60 bg-violet-500/20",
      progressBar: "from-violet-300 via-fuchsia-300 to-indigo-300",
      stageButton:
        "border-violet-200 bg-gradient-to-b from-violet-50 to-white shadow-md shadow-violet-100/70",
      stageIcon: "bg-violet-100 text-violet-700",
      cue: "bg-violet-50 text-violet-700 border-violet-200",
      section: "bg-violet-50/40 border-violet-200 shadow-violet-100/60",
    },
    po: {
      panel: "bg-amber-50/60 border border-amber-100",
      pill: "border-amber-200/60 bg-amber-500/20",
      progressBar: "from-amber-300 via-orange-300 to-yellow-300",
      stageButton:
        "border-amber-200 bg-gradient-to-b from-amber-50 to-white shadow-md shadow-amber-100/70",
      stageIcon: "bg-amber-100 text-amber-700",
      cue: "bg-amber-50 text-amber-700 border-amber-200",
      section: "bg-amber-50/40 border-amber-200 shadow-amber-100/60",
    },
    payment: {
      panel: "bg-emerald-50/60 border border-emerald-100",
      pill: "border-emerald-200/60 bg-emerald-500/20",
      progressBar: "from-emerald-300 via-teal-300 to-cyan-300",
      stageButton:
        "border-emerald-200 bg-gradient-to-b from-emerald-50 to-white shadow-md shadow-emerald-100/70",
      stageIcon: "bg-emerald-100 text-emerald-700",
      cue: "bg-emerald-50 text-emerald-700 border-emerald-200",
      section: "bg-emerald-50/40 border-emerald-200 shadow-emerald-100/60",
    },
    complete: {
      panel: "bg-indigo-50/60 border border-indigo-100",
      pill: "border-indigo-200/60 bg-indigo-500/20",
      progressBar: "from-indigo-300 via-blue-300 to-slate-300",
      stageButton:
        "border-indigo-200 bg-gradient-to-b from-indigo-50 to-white shadow-md shadow-indigo-100/70",
      stageIcon: "bg-indigo-100 text-indigo-700",
      cue: "bg-indigo-50 text-indigo-700 border-indigo-200",
      section: "bg-indigo-50/40 border-indigo-200 shadow-indigo-100/60",
    },
  };

  const activeTheme = stageTheme[activeStage];

  return (
    <div
      className={`space-y-4 sm:space-y-6 rounded-3xl p-1.5 sm:p-2 ${activeTheme.panel}`}
    >
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-5 sm:p-7 shadow-xl shadow-slate-900/20">
        <div className="absolute -top-14 -right-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h4 className="text-lg sm:text-2xl font-black text-white tracking-tight break-words">
              Job Order #{ticket.job_order_no}
            </h4>
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white ${activeTheme.pill}`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {ticket.status || "Pending"}
            </span>
          </div>
          <p className="mt-2 text-xs sm:text-sm text-slate-300">
            Track each stage in one place with a cleaner, more transparent view
            of your repair journey.
          </p>
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider">
              <span className="text-slate-300">Overall Progress</span>
              <span className="text-white">{completionPercent}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-white/20 overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${activeTheme.progressBar}`}
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div
        className={`rounded-2xl border px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold tracking-wide ${activeTheme.cue}`}
      >
        Viewing: {stages.find((stage) => stage.key === activeStage)?.label}
      </div>

      <div className="bg-white rounded-3xl border border-stone-200 p-4 sm:p-5 shadow-lg shadow-stone-200/40">
        <h4 className="text-xs font-black text-stone-500 uppercase tracking-[0.22em] mb-4">
          Progress Stages
        </h4>

        <div className="md:hidden space-y-2.5">
          {stages.map((stage, index) => {
            const isCompletedStage = index < currentProgressIndex;
            const isCurrentStage = index === currentProgressIndex;
            const isUpcomingStage = index > currentProgressIndex;
            const StageIcon = stage.icon;

            return (
              <button
                key={stage.key}
                onClick={() => setActiveStage(stage.key)}
                className={`w-full rounded-2xl border px-3 py-2.5 transition-all text-left ${
                  isCurrentStage
                    ? "border-blue-200 bg-blue-50/70"
                    : "border-stone-200 bg-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-white shadow-sm ${
                      isCompletedStage
                        ? "bg-emerald-500"
                        : isCurrentStage
                          ? "bg-blue-600 ring-4 ring-blue-100"
                          : "bg-stone-400"
                    }`}
                  >
                    {isCompletedStage ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <StageIcon className="w-4 h-4" />
                    )}
                  </span>

                  <div className="min-w-0">
                    <p
                      className={`text-[10px] font-black uppercase tracking-[0.18em] ${
                        isUpcomingStage ? "text-stone-400" : "text-stone-500"
                      }`}
                    >
                      Step {index + 1}
                    </p>
                    <p
                      className={`text-sm font-black leading-tight break-words ${
                        isCurrentStage
                          ? "text-stone-900"
                          : isUpcomingStage
                            ? "text-stone-400"
                            : "text-stone-700"
                      }`}
                    >
                      {stage.label}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="hidden md:block overflow-x-auto pb-1">
          <div className="min-w-[760px] px-1 flex items-start gap-2">
            {stages.map((stage, index) => {
              const isCompletedStage = index < currentProgressIndex;
              const isCurrentStage = index === currentProgressIndex;
              const isUpcomingStage = index > currentProgressIndex;
              const connectorClass =
                index < currentProgressIndex - 1
                  ? "bg-emerald-500"
                  : index === currentProgressIndex - 1
                    ? "bg-blue-600"
                    : "bg-stone-300";
              const StageIcon = stage.icon;
              return (
                <div key={stage.key} className="relative flex-1 min-w-[140px]">
                  {index < stages.length - 1 && (
                    <span
                      className={`absolute left-1/2 top-4 h-1 w-full rounded-full ${connectorClass}`}
                      aria-hidden="true"
                    />
                  )}

                  <button
                    onClick={() => setActiveStage(stage.key)}
                    className={`group relative z-10 w-full rounded-2xl px-1.5 py-1 text-center transition-colors ${
                      activeStage === stage.key ? "" : ""
                    }`}
                  >
                    <span
                      className={`mx-auto inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-white shadow-sm transition-all duration-200 group-hover:shadow-[0_0_0_5px_rgba(16,185,129,0.25)] ${
                        isCompletedStage
                          ? "bg-emerald-500"
                          : isCurrentStage
                            ? "bg-blue-600 ring-4 ring-blue-100"
                            : "bg-stone-400"
                      }`}
                    >
                      {isCompletedStage ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <StageIcon className="w-4 h-4" />
                      )}
                    </span>

                    <p
                      className={`mt-2 text-[10px] font-black uppercase tracking-[0.18em] ${
                        isUpcomingStage ? "text-stone-400" : "text-stone-500"
                      }`}
                    >
                      Step {index + 1}
                    </p>
                    <p
                      className={`text-sm font-black leading-tight ${
                        isCurrentStage
                          ? "text-stone-900"
                          : isUpcomingStage
                            ? "text-stone-400"
                            : "text-stone-700"
                      }`}
                    >
                      {stage.label}
                    </p>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {activeStage === "job" && (
        <div
          className={`p-4 sm:p-5 rounded-3xl border shadow-lg space-y-4 ${activeTheme.section}`}
        >
          <h5 className="text-sm font-black text-stone-900 uppercase tracking-[0.18em]">
            Job Order Details
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-stone-200 bg-gradient-to-b from-stone-50 to-white p-4">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                Ticket Number
              </p>
              <p className="mt-1 text-base font-black text-stone-900">
                #{ticket.job_order_no}
              </p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-gradient-to-b from-stone-50 to-white p-4">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                Device
              </p>
              <p className="mt-1 text-base font-black text-stone-900 break-words">
                {ticket.brand} {ticket.model}
              </p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-gradient-to-b from-stone-50 to-white p-4">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                Date Logged
              </p>
              <p className="mt-1 text-base font-black text-stone-900">
                {new Date(ticket.created_at).toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-gradient-to-b from-stone-50 to-white p-4">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                Technician
              </p>
              <p className="mt-1 text-base font-black text-stone-900">
                {ticket.assigned_tech || "Unassigned"}
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-stone-200 p-4 bg-white">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
              Reported Issue
            </p>
            <p className="text-sm font-medium text-stone-700 whitespace-pre-wrap">
              {ticket.complaint_notes || "No complaint notes provided."}
            </p>
          </div>
        </div>
      )}

      {activeStage === "quote" && (
        <div
          className={`p-4 sm:p-5 rounded-3xl border shadow-lg space-y-4 ${activeTheme.section}`}
        >
          <h5 className="text-sm font-black text-stone-900 uppercase tracking-[0.18em]">
            Quotation Details
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-stone-200 bg-gradient-to-b from-stone-50 to-white p-4">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                Quotation Status
              </p>
              <p className="mt-1 text-base font-black text-stone-900">
                {ticket.quotation_status || "Not Created"}
              </p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-gradient-to-b from-stone-50 to-white p-4">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                Estimated Amount
              </p>
              <p className="mt-1 text-base font-black text-blue-700">
                {formatPeso(financials.total)}
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-stone-200 p-4 bg-white">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
              Quotation Notes
            </p>
            <p className="text-sm font-medium text-stone-700 whitespace-pre-wrap">
              {ticket.quotation_message || "No quotation notes available."}
            </p>
          </div>
          {ticket.quotation_items && ticket.quotation_items.length > 0 && (
            <div className="rounded-2xl border border-stone-200 overflow-hidden bg-white">
              <div className="px-4 py-3 bg-stone-100 text-xs font-black text-stone-500 uppercase tracking-[0.18em]">
                Item Breakdown
              </div>
              <div className="divide-y divide-stone-100">
                {ticket.quotation_items.map((item) => (
                  <div
                    key={item.id}
                    className="px-4 py-3 text-sm flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4"
                  >
                    <div>
                      <p className="font-bold text-stone-900">{item.item}</p>
                      <p className="text-stone-500">{item.description}</p>
                    </div>
                    <p className="font-black text-stone-900 whitespace-normal sm:whitespace-nowrap">
                      {item.qty} x {formatPeso(item.rate)} ={" "}
                      {formatPeso(item.total)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeStage === "po" && (
        <div
          className={`p-4 sm:p-5 rounded-3xl border shadow-lg space-y-4 ${activeTheme.section}`}
        >
          <h5 className="text-sm font-black text-stone-900 uppercase tracking-[0.18em]">
            Purchase Order Details
          </h5>
          <div className="rounded-2xl border border-stone-200 bg-gradient-to-b from-stone-50 to-white p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                Purchase Order Status
              </p>
              <p className="mt-1 text-base font-black text-stone-900">
                {ticket.has_purchase_order
                  ? "Purchase Order Confirmed"
                  : "Awaiting Purchase Order"}
              </p>
            </div>
            {ticket.has_purchase_order ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            ) : (
              <ShoppingCart className="w-6 h-6 text-amber-600" />
            )}
          </div>
          <p className="text-sm text-stone-600">
            This stage tracks whether parts procurement is finalized for your
            repair ticket.
          </p>
        </div>
      )}

      {activeStage === "payment" && (
        <div
          className={`p-4 sm:p-5 rounded-3xl border shadow-lg space-y-4 ${activeTheme.section}`}
        >
          <h5 className="text-sm font-black text-stone-900 uppercase tracking-[0.18em]">
            Payment Details
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-stone-200 bg-gradient-to-b from-stone-50 to-white p-4">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                Total Amount
              </p>
              <p className="mt-1 text-base font-black text-stone-900">
                {formatPeso(financials.total)}
              </p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-gradient-to-b from-stone-50 to-white p-4">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                Amount Paid
              </p>
              <p className="mt-1 text-base font-black text-emerald-600">
                {formatPeso(financials.paid)}
              </p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-gradient-to-b from-stone-50 to-white p-4">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                Balance
              </p>
              <p
                className={`mt-1 text-base font-black ${
                  financials.balance > 0 ? "text-rose-600" : "text-emerald-600"
                }`}
              >
                {formatPeso(financials.balance)}
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-stone-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-white">
            <p className="text-sm font-bold text-stone-700">Payment Status</p>
            <span
              className={`px-3 py-1 rounded-full text-xs font-black border ${
                ticket.payment_status === "Paid"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              {ticket.payment_status || "Unpaid"}
            </span>
          </div>
        </div>
      )}

      {activeStage === "complete" && (
        <div
          className={`p-4 sm:p-5 rounded-3xl border shadow-lg space-y-4 ${activeTheme.section}`}
        >
          <h5 className="text-sm font-black text-stone-900 uppercase tracking-[0.18em]">
            Complete Details
          </h5>
          <div className="rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-stone-200 bg-gradient-to-b from-stone-50 to-white">
            <div>
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                Completion Status
              </p>
              <p className="mt-1 text-base font-black text-stone-900">
                {isCompleted ? "Completed" : "In Progress"}
              </p>
              <p className="mt-2 text-sm text-stone-600">
                Current repair state: {ticket.status}
              </p>
            </div>
            <div
              className={`rounded-full p-2 ${
                isCompleted ? "bg-emerald-100" : "bg-amber-100"
              }`}
            >
              {isCompleted ? (
                <Check className="w-5 h-5 text-emerald-700" />
              ) : (
                <BadgeCheck className="w-5 h-5 text-amber-700" />
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-stone-200 p-4 bg-white">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
              Resolution / Action Taken
            </p>
            <p className="text-sm font-medium text-stone-700 whitespace-pre-wrap">
              {ticket.resolution_notes ||
                "No final resolution has been posted yet."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
