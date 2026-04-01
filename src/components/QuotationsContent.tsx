import { useState, useEffect } from "react";
import {
  Search,
  Loader2,
  MessageSquare,
  X,
  Package,
  Plus,
  Trash2,
} from "lucide-react";
import formIcon from "../assets/icons/form.png";
import { supabase } from "../lib/supabase";

function PhilippinePeso({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center ${className}`}
      aria-hidden
    >
      ₱
    </span>
  );
}

type QuoteItem = {
  id: string;
  item: string;
  description: string;
  qty: number;
  rate: number;
  total: number;
};

type JobRecord = {
  id: string;
  job_order_no: number | string;
  created_at?: string | null;
  updated_at?: string | null;
  quotation_items?: QuoteItem[];
  quotation_amount?: number | null;
  quotation_message?: string | null;
  quotation_status?: string | null;
  has_purchase_order?: boolean | null;
  payment_status?: string | null;
  customer_reply?: string | null;
  customers?: {
    full_name?: string | null;
    avatar_url?: string | null;
  } | null;
};

export default function QuotationsContent() {
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal States
  const [selectedJob, setSelectedJob] = useState<JobRecord | null>(null);
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [quoteMessage, setQuoteMessage] = useState("");
  const [hasPO, setHasPO] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("Unpaid");
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("quotations-customer-profiles")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "customers" },
        () => {
          fetchJobs();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    setSelectedJob((prev) => {
      if (!prev) return prev;
      const refreshedSelection = jobs.find((job) => job.id === prev.id);
      return refreshedSelection || prev;
    });
  }, [jobs]);

  const formatDate = (iso?: string | null) => {
    if (!iso) return "--";
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("job_orders")
        .select(`*, customers (full_name, avatar_url)`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (job: JobRecord) => {
    setSelectedJob(job);
    setQuoteItems(job.quotation_items || []);
    setQuoteMessage(job.quotation_message || "");
    setHasPO(job.has_purchase_order || false);
    setPaymentStatus(job.payment_status || "Unpaid");
  };

  // Line Item Management
  const handleAddItem = () => {
    setQuoteItems([
      ...quoteItems,
      {
        id: Date.now().toString(),
        item: "",
        description: "",
        qty: 1,
        rate: 0,
        total: 0,
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    setQuoteItems(quoteItems.filter((item) => item.id !== id));
  };

  const handleItemChange = (
    id: string,
    field: keyof QuoteItem,
    value: string | number,
  ) => {
    setQuoteItems(
      quoteItems.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          if (field === "qty" || field === "rate") {
            updatedItem.total =
              Number(updatedItem.qty) * Number(updatedItem.rate);
          }
          return updatedItem;
        }
        return item;
      }),
    );
  };

  const calculateGrandTotal = () => {
    return quoteItems.reduce((sum, item) => sum + item.total, 0);
  };

  const handleSaveQuote = async () => {
    if (!selectedJob) return;
    try {
      setIsSaving(true);
      const grandTotal = calculateGrandTotal();

      const { error } = await supabase
        .from("job_orders")
        .update({
          quotation_items: quoteItems,
          quotation_amount: grandTotal,
          quotation_message: quoteMessage,
          has_purchase_order: hasPO,
          payment_status: paymentStatus,
          quotation_status:
            selectedJob.quotation_status === "Not Created"
              ? "Pending Confirmation"
              : selectedJob.quotation_status,
        })
        .eq("job_order_no", selectedJob.job_order_no);

      if (error) throw error;
      setSuccessMessage("Billing details updated successfully!");
      setShowSuccess(true);
      setSelectedJob(null);
      fetchJobs();
    } catch (error) {
      console.error("Error updating quote:", error);
      alert("Failed to save quotation.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.job_order_no.toString().includes(searchTerm) ||
      (job.customers?.full_name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesFilter =
      statusFilter === "all" ||
      job.quotation_status === statusFilter ||
      (statusFilter === "Unpaid" && job.payment_status === "Unpaid");
    return matchesSearch && matchesFilter;
  });

  const formatCurrency = (value?: number | null) => {
    if (value == null) return "--";
    return `₱${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  };

  const customerInitial = (fullName?: string | null) => {
    return (fullName || "?").trim().charAt(0).toUpperCase() || "?";
  };

  const totalQuotedAmount = filteredJobs.reduce(
    (sum, job) => sum + Number(job.quotation_amount || 0),
    0,
  );
  const pendingCount = filteredJobs.filter(
    (job) => job.quotation_status === "Pending Confirmation",
  ).length;
  const unpaidCount = filteredJobs.filter(
    (job) => (job.payment_status || "Unpaid") === "Unpaid",
  ).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-blue-50/60 p-5 md:p-7 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700/80">
              Finance Workspace
            </p>
            <h1 className="mt-2 text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
              Quotations & Billing
            </h1>
            <p className="text-gray-600 text-sm mt-1 font-medium">
              Manage customer quotations, billing updates, and payment progress.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-white/70 bg-white/90 shadow-sm p-4">
            <p className="text-[11px] uppercase tracking-wider font-bold text-gray-400">
              Showing Records
            </p>
            <p className="text-2xl font-black text-gray-900 mt-1">
              {filteredJobs.length}
            </p>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/90 shadow-sm p-4">
            <p className="text-[11px] uppercase tracking-wider font-bold text-gray-400">
              Pending Confirmation
            </p>
            <p className="text-2xl font-black text-amber-600 mt-1">
              {pendingCount}
            </p>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/90 shadow-sm p-4 sm:col-span-2 xl:col-span-1">
            <p className="text-[11px] uppercase tracking-wider font-bold text-gray-400">
              Total Quoted Amount
            </p>
            <p className="text-2xl font-black text-blue-700 mt-1">
              {formatCurrency(totalQuotedAmount)}
            </p>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col lg:flex-row gap-4 justify-between">
        <div className="relative w-full lg:max-w-lg">
          <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-600 font-medium"
            placeholder="Search Job Order or Customer..."
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start lg:min-w-[340px]">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
          >
            <option value="all">All Records</option>
            <option value="Not Created">Not Created</option>
            <option value="Pending Confirmation">Pending Confirmation</option>
            <option value="Accepted">Accepted Quotes</option>
            <option value="Unpaid">Unpaid Invoices</option>
          </select>
          <div className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2.5 text-xs font-bold text-rose-700 flex items-center justify-between">
            <span>Unpaid</span>
            <span className="text-sm">{unpaidCount}</span>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden min-h-[400px]">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="h-64 px-6 flex flex-col items-center justify-center text-center">
            <p className="text-base font-bold text-gray-700">
              No matching records
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Try adjusting your search or status filter.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead>
                  <tr className="border-b border-gray-200 text-xs uppercase tracking-wider text-gray-700 font-bold">
                    <th className="px-6 py-4 bg-gray-100">Job Order</th>
                    <th className="px-6 py-4 bg-gray-100">Customer</th>
                    <th className="px-6 py-4 bg-gray-100">Quote Status</th>
                    <th className="px-6 py-4 bg-gray-100">Amount</th>
                    <th className="px-6 py-4 bg-gray-100">PO Status</th>
                    <th className="px-6 py-4 bg-gray-100">Payment</th>
                    <th className="px-6 py-4 bg-gray-100 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredJobs.map((job) => (
                    <tr
                      key={job.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 font-black text-gray-900">
                        #{job.job_order_no}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-700">
                        <div className="flex items-center gap-2.5">
                          {job.customers?.avatar_url ? (
                            <img
                              src={job.customers.avatar_url}
                              alt={job.customers?.full_name || "Customer"}
                              className="w-8 h-8 rounded-full object-cover border border-gray-200"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center text-xs font-black">
                              {customerInitial(job.customers?.full_name)}
                            </div>
                          )}
                          <span>{job.customers?.full_name || "-"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-md text-xs font-bold ${job.quotation_status === "Accepted" ? "bg-emerald-50 text-emerald-700" : job.quotation_status === "Rejected" ? "bg-red-50 text-red-700" : job.quotation_status === "Pending Confirmation" ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-600"}`}
                        >
                          {job.quotation_status || "Not Created"}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-black text-gray-900">
                        {formatCurrency(job.quotation_amount)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-md text-xs font-bold ${job.has_purchase_order ? "bg-indigo-50 text-indigo-700" : "bg-gray-100 text-gray-400"}`}
                        >
                          {job.has_purchase_order ? "Confirmed" : "None"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-md text-xs font-bold ${(job.payment_status || "Unpaid") === "Paid" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}
                        >
                          {job.payment_status || "Unpaid"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleOpenModal(job)}
                          className="text-sm font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden p-4 space-y-3">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-gray-400 font-bold">
                        Job Order
                      </p>
                      <p className="text-lg font-black text-gray-900">
                        #{job.job_order_no}
                      </p>
                    </div>
                    <button
                      onClick={() => handleOpenModal(job)}
                      className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg"
                    >
                      Manage
                    </button>
                  </div>

                  <div className="mt-3 flex items-center gap-2.5">
                    {job.customers?.avatar_url ? (
                      <img
                        src={job.customers.avatar_url}
                        alt={job.customers?.full_name || "Customer"}
                        className="w-8 h-8 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center text-xs font-black">
                        {customerInitial(job.customers?.full_name)}
                      </div>
                    )}
                    <p className="text-sm font-semibold text-gray-700">
                      {job.customers?.full_name || "-"}
                    </p>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-gray-50 p-2.5">
                      <p className="font-bold text-gray-400 uppercase">Quote</p>
                      <p className="mt-1 font-bold text-gray-700">
                        {job.quotation_status || "Not Created"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-2.5">
                      <p className="font-bold text-gray-400 uppercase">
                        Amount
                      </p>
                      <p className="mt-1 font-black text-gray-900">
                        {formatCurrency(job.quotation_amount)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-2.5">
                      <p className="font-bold text-gray-400 uppercase">PO</p>
                      <p className="mt-1 font-bold text-gray-700">
                        {job.has_purchase_order ? "Confirmed" : "None"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-2.5">
                      <p className="font-bold text-gray-400 uppercase">
                        Payment
                      </p>
                      <p
                        className={`mt-1 font-bold ${(job.payment_status || "Unpaid") === "Paid" ? "text-emerald-700" : "text-rose-700"}`}
                      >
                        {job.payment_status || "Unpaid"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Edit Modal (Expanded for Line Items) */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-5xl rounded-t-3xl sm:rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[100dvh] sm:h-auto max-h-[100dvh] sm:max-h-[92vh] animate-in fade-in zoom-in-95">
            <div className="p-4 md:p-6 border-b border-gray-100 flex justify-between items-start bg-gradient-to-r from-gray-50 to-blue-50 shrink-0 gap-3">
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg md:text-xl font-black text-gray-900 flex items-center gap-2 min-w-0">
                  <img
                    src={formIcon}
                    alt="form"
                    className="w-5 h-5 object-contain"
                  />{" "}
                  <span className="truncate">
                    Quote for Ticket #{selectedJob.job_order_no}
                  </span>
                </h3>
                <div className="mt-2">
                  <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider">
                    Customer
                  </p>
                  <div className="mt-1.5 flex items-center gap-2.5">
                    {selectedJob.customers?.avatar_url ? (
                      <img
                        src={selectedJob.customers.avatar_url}
                        alt={selectedJob.customers?.full_name || "Customer"}
                        className="w-8 h-8 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center text-xs font-black">
                        {customerInitial(selectedJob.customers?.full_name)}
                      </div>
                    )}
                    <p className="text-sm font-semibold text-gray-700 break-words">
                      {selectedJob.customers?.full_name || "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-3 md:gap-4 flex-shrink-0">
                <button
                  onClick={() => setSelectedJob(null)}
                  className="p-1 bg-white rounded-full border shadow-sm hover:bg-gray-100 transition-colors"
                  aria-label="Close quote modal"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
                <div className="text-xs text-gray-500 text-right">
                  <div>
                    <span className="font-medium text-gray-400">Logged:</span>{" "}
                    <span className="font-bold text-gray-700">
                      {formatDate(selectedJob.created_at)}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-400">
                      Processed:
                    </span>{" "}
                    <span className="font-bold text-gray-700">
                      {formatDate(selectedJob.updated_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 md:p-6 overflow-y-auto overscroll-contain space-y-5 sm:space-y-6 flex-1">
              {/* Customer Reply Alert */}
              {selectedJob.customer_reply && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm">
                  <p className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4" /> Customer Reply
                  </p>
                  <p className="text-sm text-blue-900 font-medium italic">
                    "{selectedJob.customer_reply}"
                  </p>
                </div>
              )}

              {/* Dynamic Line Items Table */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                  <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wider">
                    Line Items
                  </h4>
                  <button
                    onClick={handleAddItem}
                    className="text-xs font-bold bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Item
                  </button>
                </div>
                <div className="hidden md:block p-4 overflow-x-auto">
                  <table className="w-full min-w-[620px] text-left">
                    <thead>
                      <tr className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                        <th className="pb-3 pr-2 w-1/4">Item</th>
                        <th className="pb-3 px-2 w-1/3">Description</th>
                        <th className="pb-3 px-2 w-20">Qty</th>
                        <th className="pb-3 px-2 w-32">Rate (₱)</th>
                        <th className="pb-3 px-2 w-32">Total (₱)</th>
                        <th className="pb-3 pl-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {quoteItems.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="py-6 text-center text-sm text-gray-400 font-medium"
                          >
                            No items added yet. Click "Add Item" to build the
                            quote.
                          </td>
                        </tr>
                      ) : (
                        quoteItems.map((item) => (
                          <tr key={item.id}>
                            <td className="py-2 pr-2">
                              <input
                                type="text"
                                value={item.item}
                                onChange={(e) =>
                                  handleItemChange(
                                    item.id,
                                    "item",
                                    e.target.value,
                                  )
                                }
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                                placeholder="Item name"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) =>
                                  handleItemChange(
                                    item.id,
                                    "description",
                                    e.target.value,
                                  )
                                }
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                                placeholder="Description"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <input
                                type="number"
                                min="1"
                                value={item.qty}
                                onChange={(e) =>
                                  handleItemChange(
                                    item.id,
                                    "qty",
                                    e.target.value,
                                  )
                                }
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.rate}
                                onChange={(e) =>
                                  handleItemChange(
                                    item.id,
                                    "rate",
                                    e.target.value,
                                  )
                                }
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <div className="w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-gray-700 cursor-not-allowed">
                                {item.total.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                })}
                              </div>
                            </td>
                            <td className="py-2 pl-2 text-right">
                              <button
                                onClick={() => {
                                  setDeleteId(item.id);
                                  setShowDeleteDialog(true);
                                }}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                aria-label={`Delete ${item.item}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  <div className="mt-4 flex justify-end">
                    <div className="bg-blue-50 border border-blue-100 rounded-xl px-6 py-3 flex items-center gap-4">
                      <span className="text-sm font-bold text-blue-800 uppercase">
                        Grand Total:
                      </span>
                      <span className="text-xl font-black text-blue-900">
                        ₱{" "}
                        {calculateGrandTotal().toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="md:hidden p-3 space-y-3">
                  {quoteItems.length === 0 ? (
                    <div className="py-8 text-center text-sm text-gray-400 font-medium">
                      No items added yet. Tap "Add Item" to build the quote.
                    </div>
                  ) : (
                    quoteItems.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs uppercase tracking-wider font-bold text-gray-400">
                            Line Item
                          </p>
                          <button
                            onClick={() => {
                              setDeleteId(item.id);
                              setShowDeleteDialog(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            aria-label={`Delete ${item.item}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <input
                          type="text"
                          value={item.item}
                          onChange={(e) =>
                            handleItemChange(item.id, "item", e.target.value)
                          }
                          className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                          placeholder="Item name"
                        />
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              "description",
                              e.target.value,
                            )
                          }
                          className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                          placeholder="Description"
                        />

                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            min="1"
                            value={item.qty}
                            onChange={(e) =>
                              handleItemChange(item.id, "qty", e.target.value)
                            }
                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                            placeholder="Qty"
                          />
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.rate}
                            onChange={(e) =>
                              handleItemChange(item.id, "rate", e.target.value)
                            }
                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                            placeholder="Rate"
                          />
                        </div>

                        <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-bold text-blue-900">
                          Total: ₱{" "}
                          {item.total.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </div>
                      </div>
                    ))
                  )}

                  <div className="mt-4 flex justify-end">
                    <div className="bg-blue-50 border border-blue-100 rounded-xl px-6 py-3 flex items-center gap-4">
                      <span className="text-sm font-bold text-blue-800 uppercase">
                        Grand Total:
                      </span>
                      <span className="text-xl font-black text-blue-900">
                        ₱{" "}
                        {calculateGrandTotal().toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status & PO Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <p className="text-[11px] font-black text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Package className="w-4 h-4" /> Purchase Order (PO)
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => setHasPO(true)}
                      className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-all ${hasPO ? "bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-600/20" : "bg-white border-gray-200 text-gray-600 hover:bg-purple-50"}`}
                    >
                      Yes, PO Confirmed
                    </button>
                    <button
                      type="button"
                      onClick={() => setHasPO(false)}
                      className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-all ${!hasPO ? "bg-gray-700 border-gray-700 text-white shadow-md shadow-gray-700/20" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-100"}`}
                    >
                      No PO Needed
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <p className="text-[11px] font-black text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <PhilippinePeso className="w-4 h-4" /> Payment Status
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentStatus("Paid")}
                      className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-all ${paymentStatus === "Paid" ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/20" : "bg-white border-gray-200 text-gray-600 hover:bg-emerald-50"}`}
                    >
                      Mark as Paid
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentStatus("Unpaid")}
                      className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-all ${paymentStatus === "Unpaid" ? "bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-500/20" : "bg-white border-gray-200 text-gray-600 hover:bg-amber-50"}`}
                    >
                      Unpaid
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-wider mb-1.5">
                  Additional Notes / Warranty Exclusions (Visible to Customer)
                </label>
                <textarea
                  rows={4}
                  value={quoteMessage}
                  onChange={(e) => setQuoteMessage(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-600 outline-none resize-none transition-all"
                  placeholder="Enter terms, lead times, or warranty details..."
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 md:p-6 border-t border-gray-100 bg-gray-50 shrink-0">
              <button
                onClick={handleSaveQuote}
                disabled={isSaving}
                className="w-full bg-blue-600 text-white font-black py-3.5 rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/20 active:scale-[0.98]"
              >
                {isSaving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Save Quote & Notify Customer"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-[9999] pointer-events-auto flex items-center justify-center p-4 bg-gray-900/50">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-5">
            <h4 className="text-lg font-bold text-gray-900 mb-2">
              Confirm delete
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to remove this line item? This action cannot
              be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeleteId(null);
                }}
                className="px-4 py-2 rounded-lg bg-white border text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteId) handleRemoveItem(deleteId);
                  setShowDeleteDialog(false);
                  setDeleteId(null);
                }}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-gray-900/60">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
            <h4 className="text-lg font-bold text-emerald-700 mb-2">Success</h4>
            <p className="text-sm text-gray-700 mb-4">{successMessage}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowSuccess(false)}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
