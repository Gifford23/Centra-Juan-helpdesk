import { useState, useEffect } from "react";
import {
  Search,
  Loader2,
  PhilippinePeso,
  ReceiptText,
  ChevronDown,
  MoreVertical,
  Pencil,
  Trash2,
  X,
  Filter,
  Users,
  FileSpreadsheet,
  UserCircle2,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import warningIcon from "../assets/icons/warning.png";
import checkIcon from "../assets/icons/check.png";
import walletIcon from "../assets/icons/wallet.png";

type JobRecord = {
  id: string;
  job_order_no: number | string;
  created_at?: string | null;
  quotation_amount?: number | string | null;
  amount_paid?: number | string | null;
  customers?: {
    id?: string | null;
    full_name?: string | null;
    avatar_url?: string | null;
  } | null;
};

type CustomerSummary = {
  id: string;
  name: string;
  avatarUrl: string;
  totalDue: number;
  totalPaid: number;
  balance: number;
  jobCount: number;
};

export default function AccountsReceivableContent() {
  const [receivables, setReceivables] = useState<JobRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Tabs
  const [activeTab, setActiveTab] = useState<"transactions" | "customers">(
    "transactions",
  );

  // New Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Payment Modal States
  const [selectedJob, setSelectedJob] = useState<JobRecord | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  const [editJob, setEditJob] = useState<JobRecord | null>(null);
  const [editQuotationAmount, setEditQuotationAmount] = useState("");
  const [editAmountPaid, setEditAmountPaid] = useState("");
  const [isUpdatingJob, setIsUpdatingJob] = useState(false);
  const [deleteJob, setDeleteJob] = useState<JobRecord | null>(null);
  const [isDeletingJob, setIsDeletingJob] = useState(false);

  useEffect(() => {
    fetchReceivables();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("accounts-receivable-profiles")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "customers" },
        () => {
          fetchReceivables();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchReceivables = async () => {
    try {
      setIsLoading(true);
      // Fetch only jobs that have an accepted quotation
      const { data, error } = await supabase
        .from("job_orders")
        .select(`*, customers (id, full_name, avatar_url)`)
        .eq("quotation_status", "Accepted")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReceivables(data || []);
    } catch (error) {
      console.error("Error fetching receivables:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return `₱${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (value?: string | null) => {
    if (!value) return "--";
    try {
      return new Date(value).toLocaleDateString();
    } catch {
      return value;
    }
  };

  const handleOpenPaymentModal = (job: JobRecord) => {
    setSelectedJob(job);
    setPaymentAmount("");
  };

  const handleRecordPayment = async () => {
    if (!selectedJob || !paymentAmount)
      return alert("Please enter a payment amount.");

    const payment = parseFloat(paymentAmount);
    if (isNaN(payment) || payment <= 0)
      return alert("Please enter a valid amount.");

    try {
      setIsSaving(true);

      const currentPaid = parseFloat(String(selectedJob.amount_paid || 0));
      const totalDue = parseFloat(String(selectedJob.quotation_amount || 0));
      const newTotalPaid = currentPaid + payment;

      // Auto-update status if fully paid
      const newPaymentStatus = newTotalPaid >= totalDue ? "Paid" : "Partial";

      const { error } = await supabase
        .from("job_orders")
        .update({
          amount_paid: newTotalPaid,
          payment_status: newPaymentStatus,
        })
        .eq("job_order_no", selectedJob.job_order_no);

      if (error) throw error;

      alert(`Payment of ₱${payment.toLocaleString()} recorded successfully!`);
      setSelectedJob(null);
      fetchReceivables();
    } catch (error) {
      console.error("Error recording payment:", error);
      alert("Failed to record payment.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEditModal = (job: JobRecord) => {
    setEditJob(job);
    setEditQuotationAmount(
      String(parseFloat(String(job.quotation_amount || 0))),
    );
    setEditAmountPaid(String(parseFloat(String(job.amount_paid || 0))));
  };

  const handleSaveEditJob = async () => {
    if (!editJob) return;

    const newQuote = parseFloat(editQuotationAmount);
    const newPaid = parseFloat(editAmountPaid);

    if (
      Number.isNaN(newQuote) ||
      Number.isNaN(newPaid) ||
      newQuote < 0 ||
      newPaid < 0
    ) {
      alert("Please enter valid non-negative numbers.");
      return;
    }

    const newPaymentStatus =
      newPaid >= newQuote ? "Paid" : newPaid > 0 ? "Partial" : "Unpaid";

    try {
      setIsUpdatingJob(true);
      const { error } = await supabase
        .from("job_orders")
        .update({
          quotation_amount: newQuote,
          amount_paid: newPaid,
          payment_status: newPaymentStatus,
        })
        .eq("job_order_no", editJob.job_order_no);

      if (error) throw error;

      setEditJob(null);
      setEditQuotationAmount("");
      setEditAmountPaid("");
      fetchReceivables();
    } catch (error) {
      console.error("Error updating receivable record:", error);
      alert("Failed to update this record.");
    } finally {
      setIsUpdatingJob(false);
    }
  };

  const handleConfirmDeleteJob = async () => {
    if (!deleteJob) return;

    try {
      setIsDeletingJob(true);
      const { error } = await supabase
        .from("job_orders")
        .delete()
        .eq("job_order_no", deleteJob.job_order_no);

      if (error) throw error;

      setDeleteJob(null);
      fetchReceivables();
    } catch (error) {
      console.error("Error deleting receivable record:", error);
      alert("Failed to delete this record.");
    } finally {
      setIsDeletingJob(false);
    }
  };

  const filteredReceivables = receivables.filter((job) => {
    // 1. Search Filter
    const matchesSearch =
      job.job_order_no.toString().includes(searchTerm) ||
      (job.customers?.full_name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    // Calculate current balance/status for filtering
    const total = parseFloat(String(job.quotation_amount || 0));
    const paid = parseFloat(String(job.amount_paid || 0));
    const balance = total - paid;
    let currentStatus = "Unpaid";
    if (balance <= 0) currentStatus = "Paid";
    else if (paid > 0) currentStatus = "Partial";

    // 2. Status Filter
    const matchesStatus =
      statusFilter === "all" || currentStatus === statusFilter;

    // 3. Date Filter
    let matchesDate = true;
    const createdAt = new Date(job.created_at || "");
    const hasValidCreatedAt = !Number.isNaN(createdAt.getTime());
    if (startDate) {
      matchesDate =
        matchesDate && hasValidCreatedAt && createdAt >= new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Set to end of the day
      matchesDate = matchesDate && hasValidCreatedAt && createdAt <= end;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Calculate metrics based on the dynamically filtered list
  const totalReceivables = filteredReceivables.reduce(
    (sum, job) =>
      sum +
      (parseFloat(String(job.quotation_amount || 0)) -
        parseFloat(String(job.amount_paid || 0))),
    0,
  );

  const totalCollected = filteredReceivables.reduce(
    (sum, job) => sum + parseFloat(String(job.amount_paid || 0)),
    0,
  );

  const paidCount = filteredReceivables.filter((job) => {
    const total = parseFloat(String(job.quotation_amount || 0));
    const paid = parseFloat(String(job.amount_paid || 0));
    return total - paid <= 0;
  }).length;

  // Group filtered transactions by Customer for the Invoicing Tab
  const customerList = Object.values(
    filteredReceivables.reduce(
      (acc, job) => {
        const customerKey =
          job.customers?.id ||
          `fallback-${job.customers?.full_name || "unknown"}`;
        const customerName = job.customers?.full_name || "Unknown Customer";
        const avatarUrl = job.customers?.avatar_url || "";

        if (!acc[customerKey]) {
          acc[customerKey] = {
            id: customerKey,
            name: customerName,
            avatarUrl,
            totalDue: 0,
            totalPaid: 0,
            balance: 0,
            jobCount: 0,
          };
        } else {
          // Keep latest non-empty profile details so profile edits reflect in summary cards.
          acc[customerKey].name = customerName || acc[customerKey].name;
          acc[customerKey].avatarUrl = avatarUrl || acc[customerKey].avatarUrl;
        }

        const total = parseFloat(String(job.quotation_amount || 0));
        const paid = parseFloat(String(job.amount_paid || 0));
        acc[customerKey].totalDue += total;
        acc[customerKey].totalPaid += paid;
        acc[customerKey].balance += total - paid;
        acc[customerKey].jobCount += 1;
        return acc;
      },
      {} as Record<string, CustomerSummary>,
    ),
  ) as CustomerSummary[];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="rounded-3xl border border-emerald-100/80 bg-gradient-to-br from-white via-emerald-50/40 to-teal-50/70 p-5 md:p-7 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700/80">
              Finance Workspace
            </p>
            <h1 className="mt-2 text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Accounts Receivable
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-600">
              Monitor balances, track collections, and post customer payments.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-rose-100 bg-white/90 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <img
                  src={warningIcon}
                  alt="Warning"
                  className="h-5 w-5 object-contain"
                />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Outstanding
              </p>
            </div>
            <p className="mt-2 text-2xl font-black text-rose-600">
              {formatCurrency(totalReceivables)}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white/90 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <img
                  src={checkIcon}
                  alt="Check"
                  className="h-6 w-6 object-contain"
                />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Collected
              </p>
            </div>
            <p className="mt-2 text-2xl font-black text-emerald-600">
              {formatCurrency(totalCollected)}
            </p>
          </div>

          <div className="rounded-2xl border border-teal-100 bg-white/90 p-4 shadow-sm sm:col-span-2 xl:col-span-1">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                <img
                  src={walletIcon}
                  alt="Wallet"
                  className="h-6 w-6 object-contain"
                />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Cleared Accounts
              </p>
            </div>
            <p className="mt-2 text-2xl font-black text-teal-700">
              {paidCount}
            </p>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 md:p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="relative w-full lg:max-w-lg">
            <Search className="absolute left-3.5 top-3 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-600"
              placeholder="Search Job Order or Customer..."
            />
          </div>

          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:w-auto lg:grid-cols-[auto_auto]">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2 py-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-transparent px-2 text-sm font-semibold text-slate-700 outline-none"
                title="Start Date"
              />
              <span className="text-xs font-bold text-slate-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-transparent px-2 text-sm font-semibold text-slate-700 outline-none"
                title="End Date"
              />
            </div>

            <div className="relative">
              <Filter className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-10 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="all">All Statuses</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Partial">Partial Payment</option>
                <option value="Paid">Fully Paid</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-col gap-2 rounded-2xl border border-slate-200/80 bg-white p-2 shadow-sm sm:flex-row sm:items-center">
        <button
          onClick={() => setActiveTab("transactions")}
          className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${activeTab === "transactions" ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
        >
          <FileSpreadsheet className="h-4 w-4" /> All Transactions
        </button>
        <button
          onClick={() => setActiveTab("customers")}
          className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${activeTab === "customers" ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
        >
          <Users className="h-4 w-4" /> Customer Balances
        </button>
      </div>

      {/* TAB 1: ALL TRANSACTIONS */}
      {activeTab === "transactions" && (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm min-h-[400px]">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : filteredReceivables.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center px-6 text-center text-slate-500">
              <img
                src={walletIcon}
                alt="Wallet"
                className="mb-3 h-12 w-12 object-contain opacity-40"
              />
              <p className="font-semibold text-slate-700">
                No matching records
              </p>
              <p className="mt-1 text-sm">
                No records found matching your filters.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100 text-xs font-bold uppercase tracking-wider text-slate-600">
                      <th className="px-6 py-4">Job Order</th>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4 text-right">Total Due</th>
                      <th className="px-6 py-4 text-right">Amount Paid</th>
                      <th className="px-6 py-4 text-right">Balance</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredReceivables.map((job) => {
                      const total = parseFloat(
                        String(job.quotation_amount || 0),
                      );
                      const paid = parseFloat(String(job.amount_paid || 0));
                      const balance = total - paid;

                      return (
                        <tr
                          key={job.id}
                          className="transition-colors hover:bg-slate-50"
                        >
                          <td className="px-6 py-4 font-black text-slate-900">
                            #{job.job_order_no}
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-700">
                            <div className="flex items-center gap-2.5">
                              {job.customers?.avatar_url ? (
                                <img
                                  src={job.customers.avatar_url}
                                  alt={job.customers?.full_name || "Customer"}
                                  className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-200"
                                />
                              ) : (
                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                                  <UserCircle2 className="h-5 w-5" />
                                </span>
                              )}
                              <span>
                                {job.customers?.full_name || "Unknown Customer"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-slate-500">
                            {formatDate(job.created_at)}
                          </td>
                          <td className="px-6 py-4 text-right font-black text-slate-900">
                            {formatCurrency(total)}
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-emerald-600">
                            {formatCurrency(paid)}
                          </td>
                          <td className="px-6 py-4 text-right font-black text-rose-600">
                            {formatCurrency(balance)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`rounded-md px-2.5 py-1 text-xs font-bold ${balance <= 0 ? "bg-emerald-50 text-emerald-700" : paid > 0 ? "bg-blue-50 text-blue-700" : "bg-rose-50 text-rose-700"}`}
                            >
                              {balance <= 0
                                ? "Paid"
                                : paid > 0
                                  ? "Partial"
                                  : "Unpaid"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="relative inline-block text-left">
                              <button
                                onClick={() =>
                                  setOpenActionMenu((prev) =>
                                    prev === job.id ? null : job.id,
                                  )
                                }
                                className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                                title="Open actions"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>

                              {openActionMenu === job.id && (
                                <div className="absolute right-0 z-20 mt-2 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                                  <button
                                    onClick={() => {
                                      setOpenActionMenu(null);
                                      handleOpenPaymentModal(job);
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:text-slate-400"
                                    disabled={balance <= 0}
                                  >
                                    <img
                                      src={walletIcon}
                                      alt="Wallet"
                                      className="h-4 w-4 object-contain"
                                    />
                                    {balance > 0 ? "Pay" : "Paid"}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setOpenActionMenu(null);
                                      handleOpenEditModal(job);
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100"
                                  >
                                    <Pencil className="h-4 w-4" /> Edit
                                  </button>
                                  <button
                                    onClick={() => {
                                      setOpenActionMenu(null);
                                      setDeleteJob(job);
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50"
                                  >
                                    <Trash2 className="h-4 w-4" /> Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 p-4 md:hidden">
                {filteredReceivables.map((job) => {
                  const total = parseFloat(String(job.quotation_amount || 0));
                  const paid = parseFloat(String(job.amount_paid || 0));
                  const balance = total - paid;

                  return (
                    <div
                      key={job.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Job Order
                          </p>
                          <p className="text-lg font-black text-slate-900">
                            #{job.job_order_no}
                          </p>
                          <div className="mt-2 flex items-center gap-2.5">
                            {job.customers?.avatar_url ? (
                              <img
                                src={job.customers.avatar_url}
                                alt={job.customers?.full_name || "Customer"}
                                className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-200"
                              />
                            ) : (
                              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                                <UserCircle2 className="h-5 w-5" />
                              </span>
                            )}
                            <p className="text-sm font-semibold text-slate-700">
                              {job.customers?.full_name || "Unknown Customer"}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`rounded-md px-2.5 py-1 text-xs font-bold ${balance <= 0 ? "bg-emerald-50 text-emerald-700" : paid > 0 ? "bg-blue-50 text-blue-700" : "bg-rose-50 text-rose-700"}`}
                        >
                          {balance <= 0
                            ? "Paid"
                            : paid > 0
                              ? "Partial"
                              : "Unpaid"}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-lg bg-slate-50 p-2.5">
                          <p className="font-bold uppercase text-slate-400">
                            Date
                          </p>
                          <p className="mt-1 font-semibold text-slate-700">
                            {formatDate(job.created_at)}
                          </p>
                        </div>
                        <div className="rounded-lg bg-slate-50 p-2.5">
                          <p className="font-bold uppercase text-slate-400">
                            Total Due
                          </p>
                          <p className="mt-1 font-black text-slate-900">
                            {formatCurrency(total)}
                          </p>
                        </div>
                        <div className="rounded-lg bg-slate-50 p-2.5">
                          <p className="font-bold uppercase text-slate-400">
                            Paid
                          </p>
                          <p className="mt-1 font-black text-emerald-700">
                            {formatCurrency(paid)}
                          </p>
                        </div>
                        <div className="rounded-lg bg-slate-50 p-2.5">
                          <p className="font-bold uppercase text-slate-400">
                            Balance
                          </p>
                          <p className="mt-1 font-black text-rose-600">
                            {formatCurrency(balance)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3">
                        {balance > 0 ? (
                          <button
                            onClick={() => handleOpenPaymentModal(job)}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
                          >
                            <img
                              src={walletIcon}
                              alt="Wallet"
                              className="h-4 w-4 object-contain"
                            />
                            Record Payment
                          </button>
                        ) : (
                          <div className="rounded-xl bg-emerald-50 px-4 py-2.5 text-center text-sm font-bold text-emerald-700">
                            Payment Cleared
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: CUSTOMER BALANCES (INVOICING) */}
      {activeTab === "customers" && (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm min-h-[400px]">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : customerList.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-slate-500">
              <Users className="mb-3 h-12 w-12 text-slate-300" />
              <p className="font-medium">No customer balances found.</p>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100 text-xs font-bold uppercase tracking-wider text-slate-600">
                      <th className="px-6 py-4">Customer Name</th>
                      <th className="px-6 py-4 text-center">Active Invoices</th>
                      <th className="px-6 py-4 text-right">Total Billed</th>
                      <th className="px-6 py-4 text-right">Total Paid</th>
                      <th className="px-6 py-4 text-right">
                        Outstanding Balance
                      </th>
                      <th className="px-6 py-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customerList.map((customer: CustomerSummary) => (
                      <tr
                        key={customer.id}
                        className="transition-colors hover:bg-slate-50"
                      >
                        <td className="px-6 py-4 font-black text-slate-900">
                          <div className="flex items-center gap-3">
                            {customer.avatarUrl ? (
                              <img
                                src={customer.avatarUrl}
                                alt={customer.name}
                                className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-200"
                              />
                            ) : (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                                <UserCircle2 className="h-5 w-5" />
                              </div>
                            )}
                            {customer.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-slate-600">
                          {customer.jobCount}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900">
                          {formatCurrency(customer.totalDue)}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-emerald-600">
                          {formatCurrency(customer.totalPaid)}
                        </td>
                        <td className="px-6 py-4 text-right font-black text-rose-600">
                          {formatCurrency(customer.balance)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`rounded-md px-2.5 py-1 text-xs font-bold ${customer.balance <= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}
                          >
                            {customer.balance <= 0
                              ? "Account Cleared"
                              : "Balance Due"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 p-4 md:hidden">
                {customerList.map((customer: CustomerSummary) => (
                  <div
                    key={customer.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {customer.avatarUrl ? (
                          <img
                            src={customer.avatarUrl}
                            alt={customer.name}
                            className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-200"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                            <UserCircle2 className="h-5 w-5" />
                          </div>
                        )}
                        <p className="text-sm font-black text-slate-900">
                          {customer.name}
                        </p>
                      </div>
                      <span
                        className={`rounded-md px-2 py-1 text-[11px] font-bold ${customer.balance <= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}
                      >
                        {customer.balance <= 0 ? "Cleared" : "Balance Due"}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-slate-50 p-2.5">
                        <p className="font-bold uppercase text-slate-400">
                          Invoices
                        </p>
                        <p className="mt-1 font-black text-slate-700">
                          {customer.jobCount}
                        </p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-2.5">
                        <p className="font-bold uppercase text-slate-400">
                          Total Billed
                        </p>
                        <p className="mt-1 font-black text-slate-900">
                          {formatCurrency(customer.totalDue)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-2.5">
                        <p className="font-bold uppercase text-slate-400">
                          Total Paid
                        </p>
                        <p className="mt-1 font-black text-emerald-700">
                          {formatCurrency(customer.totalPaid)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-2.5">
                        <p className="font-bold uppercase text-slate-400">
                          Outstanding
                        </p>
                        <p className="mt-1 font-black text-rose-600">
                          {formatCurrency(customer.balance)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Record Payment Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl md:rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in-95">
            <div className="shrink-0 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-emerald-50 p-4 md:p-6 flex items-start justify-between gap-3">
              <div>
                <h3 className="flex items-center gap-2 text-lg md:text-xl font-black text-slate-900">
                  <ReceiptText className="h-5 w-5 text-emerald-600" /> Record
                  Payment
                </h3>
                <p className="text-sm font-medium text-slate-500">
                  Ticket #{selectedJob.job_order_no} •{" "}
                  {selectedJob.customers?.full_name}
                </p>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="rounded-full border bg-white p-2 shadow-sm transition-colors hover:bg-slate-100"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 p-4 md:p-6">
              <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-emerald-800">
                  Remaining Balance
                </span>
                <span className="text-xl md:text-2xl font-black text-emerald-700">
                  {formatCurrency(
                    parseFloat(String(selectedJob.quotation_amount || 0)) -
                      parseFloat(String(selectedJob.amount_paid || 0)),
                  )}
                </span>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-slate-400">
                  Enter Payment Amount (PHP)
                </label>
                <div className="relative">
                  <PhilippinePeso className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-lg font-black text-slate-900 outline-none transition-all focus:ring-2 focus:ring-emerald-600"
                    placeholder="0.00"
                  />
                </div>
                <p className="mt-2 text-xs font-bold text-slate-400">
                  Enter the exact amount paid by the customer today.
                </p>
              </div>

              <button
                onClick={handleRecordPayment}
                disabled={isSaving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-base md:text-lg font-black text-white shadow-md shadow-emerald-600/20 transition-all hover:bg-emerald-700 active:scale-[0.98]"
              >
                {isSaving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Confirm Payment"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {editJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl md:rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in-95">
            <div className="shrink-0 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50 p-4 md:p-6 flex items-start justify-between gap-3">
              <div>
                <h3 className="flex items-center gap-2 text-lg md:text-xl font-black text-slate-900">
                  <Pencil className="h-5 w-5 text-blue-600" /> Edit Receivable
                </h3>
                <p className="text-sm font-medium text-slate-500">
                  Job Order #{editJob.job_order_no} •{" "}
                  {editJob.customers?.full_name}
                </p>
              </div>
              <button
                onClick={() => setEditJob(null)}
                className="rounded-full border bg-white p-2 shadow-sm transition-colors hover:bg-slate-100"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-5 p-4 md:p-6">
              <div>
                <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-slate-400">
                  Quotation Amount (PHP)
                </label>
                <div className="relative">
                  <PhilippinePeso className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
                  <input
                    type="number"
                    value={editQuotationAmount}
                    onChange={(e) => setEditQuotationAmount(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-lg font-black text-slate-900 outline-none transition-all focus:ring-2 focus:ring-blue-600"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-slate-400">
                  Amount Paid (PHP)
                </label>
                <div className="relative">
                  <PhilippinePeso className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
                  <input
                    type="number"
                    value={editAmountPaid}
                    onChange={(e) => setEditAmountPaid(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-lg font-black text-slate-900 outline-none transition-all focus:ring-2 focus:ring-blue-600"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  onClick={() => setEditJob(null)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEditJob}
                  disabled={isUpdatingJob}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white transition-colors hover:bg-blue-700 disabled:opacity-70"
                >
                  {isUpdatingJob ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Pencil className="h-4 w-4" />
                  )}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95">
            <div className="border-b border-slate-100 p-5">
              <h3 className="flex items-center gap-2 text-lg font-black text-slate-900">
                <Trash2 className="h-5 w-5 text-rose-600" /> Confirm Delete
              </h3>
              <p className="mt-2 text-sm font-medium text-slate-600">
                Delete Job Order #{deleteJob.job_order_no} for{" "}
                {deleteJob.customers?.full_name || "this customer"}?
              </p>
              <p className="mt-1 text-xs font-semibold text-rose-600">
                This action cannot be undone.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 p-5 sm:grid-cols-2">
              <button
                onClick={() => setDeleteJob(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteJob}
                disabled={isDeletingJob}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-black text-white transition-colors hover:bg-rose-700 disabled:opacity-70"
              >
                {isDeletingJob ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
