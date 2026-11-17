import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Receipt,
  DollarSign,
  PlusCircle,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building,
  FileText,
  Truck,
  Shield,
  Layers,
  Calendar,
  CreditCard,
  Download,
  Eye,
  Edit2,
  RefreshCw,
  X,
  TrendingUp,
  Percent,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date?: string | null;
  currency: string;
  subtotal: number;
  freight_charges: number;
  additional_charges: number;
  gst_rate: number;
  gst_amount: number;
  total_amount: number;
  payment_status: "unpaid" | "partially_paid" | "paid" | "disputed";
  amount_paid: number;
  payment_reference?: string | null;
  file_url?: string | null;
  notes?: string | null;
  created_at: string;
  businesses?: {
    name: string;
    city?: string;
    state?: string;
    gstin?: string;
  };
  purchase_orders?: {
    po_number: string;
    total_amount: number;
  };
  users?: {
    full_name: string;
    email: string;
  };
}

interface PurchaseExpense {
  id: string;
  expense_category: string;
  amount: number;
  description: string;
  vendor_name?: string | null;
  payment_reference?: string | null;
  payment_date: string;
  purchase_orders?: {
    po_number: string;
  };
  purchase_invoices?: {
    invoice_number: string;
  };
  users?: {
    full_name: string;
    email: string;
  };
}

export const InvoicesExpensesPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"invoices" | "expenses" | "summary">("invoices");

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<PurchaseExpense[]>([]);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [invoiceFilter, setInvoiceFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionError, setActionError] = useState("");

  // Record Invoice Modal State
  const [isRecordInvoiceModalOpen, setIsRecordInvoiceModalOpen] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    supplier_business_id: "",
    purchase_order_id: "",
    invoice_number: "",
    invoice_date: new Date().toISOString().split("T")[0],
    due_date: "",
    subtotal: "",
    freight_charges: "0",
    additional_charges: "0",
    gst_rate: "0.18",
    payment_status: "unpaid",
    amount_paid: "0",
    payment_reference: "",
    notes: "",
  });
  const [isSubmittingInvoice, setIsSubmittingInvoice] = useState(false);

  // Update Payment Modal State
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    payment_status: "paid" as "unpaid" | "partially_paid" | "paid" | "disputed",
    amount_paid: "",
    payment_reference: "",
    notes: "",
  });
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Record Expense Modal State
  const [isRecordExpenseModalOpen, setIsRecordExpenseModalOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    expense_category: "freight",
    amount: "",
    description: "",
    vendor_name: "",
    payment_reference: "",
    purchase_order_id: "",
    payment_date: new Date().toISOString().split("T")[0],
  });
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);

  const getHeaders = () => ({
    "Content-Type": "application/json",
    ...(user ? { "x-user-id": user.id } : {}),
  });

  const loadAll = async () => {
    if (!user) return;
    setIsLoading(true);
    setActionSuccess("");
    setActionError("");
    try {
      const [invRes, expRes, sumRes, poRes, suppRes] = await Promise.all([
        fetch(`${API_BASE}/buyer/invoices`, { headers: getHeaders() }).then((r) => r.json()),
        fetch(`${API_BASE}/buyer/expenses`, { headers: getHeaders() }).then((r) => r.json()),
        fetch(`${API_BASE}/buyer/financial-summary`, { headers: getHeaders() }).then((r) => r.json()),
        fetch(`${API_BASE}/buyer/purchase-orders`, { headers: getHeaders() }).then((r) => r.json()),
        fetch(`${API_BASE}/buyer/saved-suppliers`, { headers: getHeaders() }).then((r) => r.json()),
      ]);

      if (invRes.success && invRes.data) setInvoices(invRes.data);
      if (expRes.success && expRes.data) setExpenses(expRes.data);
      if (sumRes.success && sumRes.data) setSummaryData(sumRes.data);
      if (poRes.success && poRes.data) setPurchaseOrders(poRes.data);
      if (suppRes.success && suppRes.data) {
        setSuppliers(suppRes.data.map((s: any) => s.businesses).filter(Boolean));
      }
    } catch (err: any) {
      console.error(err);
      setActionError("Failed to load financial records.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [user]);

  // Compute live totals for Create Invoice
  const previewSubtotal = parseFloat(invoiceForm.subtotal) || 0;
  const previewFreight = parseFloat(invoiceForm.freight_charges) || 0;
  const previewAdditional = parseFloat(invoiceForm.additional_charges) || 0;
  const previewRate = parseFloat(invoiceForm.gst_rate) || 0.18;
  const previewBase = previewSubtotal + previewFreight + previewAdditional;
  const previewGst = Math.round(previewBase * previewRate * 100) / 100;
  const previewTotal = Math.round((previewBase + previewGst) * 100) / 100;

  const handleRecordInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceForm.supplier_business_id || !invoiceForm.invoice_number || !invoiceForm.subtotal) {
      setActionError("Please complete all required fields (Supplier, Invoice No, Subtotal).");
      return;
    }

    setIsSubmittingInvoice(true);
    setActionError("");

    try {
      const res = await fetch(`${API_BASE}/buyer/invoices`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          supplier_business_id: invoiceForm.supplier_business_id,
          purchase_order_id: invoiceForm.purchase_order_id || null,
          invoice_number: invoiceForm.invoice_number.trim(),
          invoice_date: invoiceForm.invoice_date,
          due_date: invoiceForm.due_date || null,
          subtotal: previewSubtotal,
          freight_charges: previewFreight,
          additional_charges: previewAdditional,
          gst_rate: previewRate,
          gst_amount: previewGst,
          total_amount: previewTotal,
          payment_status: invoiceForm.payment_status,
          amount_paid: parseFloat(invoiceForm.amount_paid) || 0,
          payment_reference: invoiceForm.payment_reference.trim() || null,
          notes: invoiceForm.notes.trim() || null,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setActionSuccess(`Invoice ${invoiceForm.invoice_number} recorded successfully.`);
        setIsRecordInvoiceModalOpen(false);
        setInvoiceForm({
          supplier_business_id: "",
          purchase_order_id: "",
          invoice_number: "",
          invoice_date: new Date().toISOString().split("T")[0],
          due_date: "",
          subtotal: "",
          freight_charges: "0",
          additional_charges: "0",
          gst_rate: "0.18",
          payment_status: "unpaid",
          amount_paid: "0",
          payment_reference: "",
          notes: "",
        });
        await loadAll();
      } else {
        setActionError(json.error || "Failed to record invoice.");
      }
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsSubmittingInvoice(false);
    }
  };

  const openPaymentModal = (inv: Invoice) => {
    setSelectedInvoiceForPayment(inv);
    setPaymentForm({
      payment_status: inv.payment_status === "unpaid" ? "paid" : inv.payment_status,
      amount_paid: inv.amount_paid > 0 ? inv.amount_paid.toString() : inv.total_amount.toString(),
      payment_reference: inv.payment_reference || "",
      notes: inv.notes || "",
    });
  };

  const handleUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForPayment) return;

    setIsSubmittingPayment(true);
    setActionError("");

    try {
      const res = await fetch(`${API_BASE}/buyer/invoices/${selectedInvoiceForPayment.id}/payment`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({
          payment_status: paymentForm.payment_status,
          amount_paid: parseFloat(paymentForm.amount_paid) || 0,
          payment_reference: paymentForm.payment_reference.trim() || null,
          notes: paymentForm.notes.trim() || null,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setActionSuccess(
          `Payment updated for invoice ${selectedInvoiceForPayment.invoice_number} (${paymentForm.payment_status}).`
        );
        setSelectedInvoiceForPayment(null);
        await loadAll();
      } else {
        setActionError(json.error || "Failed to update payment.");
      }
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleRecordExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.expense_category || !expenseForm.amount || !expenseForm.description) {
      setActionError("Please complete Category, Amount, and Description.");
      return;
    }

    setIsSubmittingExpense(true);
    setActionError("");

    try {
      const res = await fetch(`${API_BASE}/buyer/expenses`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          expense_category: expenseForm.expense_category,
          amount: parseFloat(expenseForm.amount),
          description: expenseForm.description.trim(),
          vendor_name: expenseForm.vendor_name.trim() || null,
          payment_reference: expenseForm.payment_reference.trim() || null,
          payment_date: expenseForm.payment_date,
          purchase_order_id: expenseForm.purchase_order_id || null,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setActionSuccess(`Expense of ₹${expenseForm.amount} recorded.`);
        setIsRecordExpenseModalOpen(false);
        setExpenseForm({
          expense_category: "freight",
          amount: "",
          description: "",
          vendor_name: "",
          payment_reference: "",
          purchase_order_id: "",
          payment_date: new Date().toISOString().split("T")[0],
        });
        await loadAll();
      } else {
        setActionError(json.error || "Failed to record expense.");
      }
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsSubmittingExpense(false);
    }
  };

  // Filter invoices
  const filteredInvoices = invoices.filter((inv) => {
    const matchesStatus = invoiceFilter === "all" || inv.payment_status === invoiceFilter;
    const matchesQuery =
      inv.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.businesses?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.purchase_orders?.po_number?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesQuery;
  });

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "partially_paid":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "disputed":
        return "bg-rose-100 text-rose-800 border-rose-200";
      default:
        return "bg-amber-100 text-amber-800 border-amber-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500 text-stone-950 font-bold">
              <Receipt className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">Invoices & Financial Management</h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Supplier invoice tracking, GST audit details, freight & landed expenses, and payment reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAll}
            className="p-2 rounded-xl border border-stone-200 bg-white text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition shadow-xs"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsRecordExpenseModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-200 bg-white text-stone-800 font-bold text-xs hover:bg-stone-50 transition shadow-xs"
          >
            <Truck className="w-4 h-4 text-stone-500" />
            Record Expense
          </button>
          <button
            onClick={() => setIsRecordInvoiceModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 text-white font-bold text-xs hover:bg-stone-800 transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Record Supplier Invoice
          </button>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess("")} className="text-emerald-500 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError("")} className="text-rose-500 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Financial Overview KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">PO Commitments</div>
          <div className="text-xl font-black text-stone-900 mt-1">
            ₹{summaryData ? summaryData.po_commitments.toLocaleString() : "0"}
          </div>
          <div className="text-[10px] text-stone-400 mt-0.5">{summaryData?.po_count || 0} Issued POs</div>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 shadow-xs">
          <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Total Invoiced</div>
          <div className="text-xl font-black text-blue-900 mt-1">
            ₹{summaryData ? summaryData.total_invoiced.toLocaleString() : "0"}
          </div>
          <div className="text-[10px] text-blue-600 mt-0.5">{summaryData?.invoice_count || 0} Invoices Recorded</div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 shadow-xs">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Total Paid</div>
          <div className="text-xl font-black text-emerald-900 mt-1">
            ₹{summaryData ? summaryData.total_paid.toLocaleString() : "0"}
          </div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Disbursed Funds</div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 shadow-xs">
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Pending Payment</div>
          <div className="text-xl font-black text-amber-900 mt-1">
            ₹{summaryData ? summaryData.total_pending.toLocaleString() : "0"}
          </div>
          <div className="text-[10px] text-amber-600 mt-0.5">Outstanding Invoices</div>
        </div>

        <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 shadow-xs">
          <div className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">GST Tracked</div>
          <div className="text-xl font-black text-purple-900 mt-1">
            ₹{summaryData ? summaryData.total_gst.toLocaleString() : "0"}
          </div>
          <div className="text-[10px] text-purple-600 mt-0.5">Input Credit Eligible</div>
        </div>

        <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 shadow-xs">
          <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Freight & Landing</div>
          <div className="text-xl font-black text-stone-800 mt-1">
            ₹
            {summaryData
              ? (summaryData.total_freight + (summaryData.other_expenses_total || 0)).toLocaleString()
              : "0"}
          </div>
          <div className="text-[10px] text-stone-400 mt-0.5">Logistics & Handling</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200">
        <button
          onClick={() => setActiveTab("invoices")}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
            activeTab === "invoices"
              ? "border-stone-900 text-stone-900"
              : "border-transparent text-stone-500 hover:text-stone-800"
          }`}
        >
          Supplier Invoices ({invoices.length})
        </button>
        <button
          onClick={() => setActiveTab("expenses")}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
            activeTab === "expenses"
              ? "border-stone-900 text-stone-900"
              : "border-transparent text-stone-500 hover:text-stone-800"
          }`}
        >
          Purchase Expenses ({expenses.length})
        </button>
        <button
          onClick={() => setActiveTab("summary")}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
            activeTab === "summary"
              ? "border-stone-900 text-stone-900"
              : "border-transparent text-stone-500 hover:text-stone-800"
          }`}
        >
          Financial Landed Summary
        </button>
      </div>

      {/* TAB 1: SUPPLIER INVOICES */}
      {activeTab === "invoices" && (
        <div className="space-y-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
              <input
                type="text"
                placeholder="Search by invoice number, supplier, PO..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-stone-200 rounded-xl text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-xs text-stone-500">Status:</span>
              <select
                value={invoiceFilter}
                onChange={(e) => setInvoiceFilter(e.target.value)}
                className="border border-stone-200 rounded-xl px-3 py-1.5 text-xs bg-white focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="unpaid">Unpaid Only</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="paid">Paid Only</option>
                <option value="disputed">Disputed</option>
              </select>
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
            {isLoading ? (
              <div className="p-12 text-center text-xs text-stone-400">Loading invoices...</div>
            ) : filteredInvoices.length === 0 ? (
              <div className="p-12 text-center text-xs text-stone-400">
                No invoices found. Click 'Record Supplier Invoice' to add one.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider border-b border-stone-200">
                    <tr>
                      <th className="p-3">Invoice Details</th>
                      <th className="p-3">Supplier & GSTIN</th>
                      <th className="p-3">Linked PO</th>
                      <th className="p-3">Subtotal & Freight</th>
                      <th className="p-3">GST (18%)</th>
                      <th className="p-3">Total Amount</th>
                      <th className="p-3">Paid / Pending</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-700">
                    {filteredInvoices.map((inv) => {
                      const pendingAmt = Math.max(0, inv.total_amount - inv.amount_paid);
                      return (
                        <tr key={inv.id} className="hover:bg-stone-50/50">
                          <td className="p-3">
                            <div className="font-bold text-stone-900 font-mono">{inv.invoice_number}</div>
                            <div className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3 h-3 text-stone-400" />
                              <span>{inv.invoice_date}</span>
                            </div>
                          </td>

                          <td className="p-3">
                            <div className="font-semibold text-stone-900">{inv.businesses?.name || "Supplier"}</div>
                            <div className="text-[11px] text-stone-400 font-mono">
                              {inv.businesses?.gstin ? `GST: ${inv.businesses.gstin}` : "GST Not Linked"}
                            </div>
                          </td>

                          <td className="p-3">
                            {inv.purchase_orders?.po_number ? (
                              <span className="font-mono text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                {inv.purchase_orders.po_number}
                              </span>
                            ) : (
                              <span className="text-stone-400 text-[11px]">Direct Order</span>
                            )}
                          </td>

                          <td className="p-3">
                            <div className="font-mono text-stone-900">₹{inv.subtotal.toLocaleString()}</div>
                            {inv.freight_charges > 0 && (
                              <div className="text-[10px] text-stone-500 font-mono">
                                +₹{inv.freight_charges.toLocaleString()} Freight
                              </div>
                            )}
                          </td>

                          <td className="p-3 font-mono text-purple-700 font-semibold">
                            ₹{inv.gst_amount.toLocaleString()}
                          </td>

                          <td className="p-3 font-mono font-bold text-stone-900 text-sm">
                            ₹{inv.total_amount.toLocaleString()}
                          </td>

                          <td className="p-3">
                            <div className="font-mono text-emerald-700 font-semibold">
                              ₹{inv.amount_paid.toLocaleString()} Paid
                            </div>
                            {pendingAmt > 0 && (
                              <div className="font-mono text-amber-700 text-[10px]">
                                ₹{pendingAmt.toLocaleString()} Due
                              </div>
                            )}
                          </td>

                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getPaymentStatusBadge(
                                inv.payment_status
                              )}`}
                            >
                              {inv.payment_status.replace(/_/g, " ")}
                            </span>
                          </td>

                          <td className="p-3 text-right">
                            <button
                              onClick={() => openPaymentModal(inv)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 text-stone-800 text-[11px] font-bold transition shadow-xs"
                              title="Update Payment Record"
                            >
                              <CreditCard className="w-3.5 h-3.5 text-stone-500" />
                              Payment
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PURCHASE EXPENSES */}
      {activeTab === "expenses" && (
        <div className="space-y-4">
          <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-stone-900">Purchase Landed Expenses</h3>
                <p className="text-xs text-stone-500">Freight, packaging, loading, and transit insurance charges.</p>
              </div>
              <button
                onClick={() => setIsRecordExpenseModalOpen(true)}
                className="px-3 py-1.5 bg-stone-900 text-white font-bold text-xs rounded-xl hover:bg-stone-800"
              >
                + Add Expense
              </button>
            </div>

            {isLoading ? (
              <div className="p-12 text-center text-xs text-stone-400">Loading expenses...</div>
            ) : expenses.length === 0 ? (
              <div className="p-12 text-center text-xs text-stone-400">
                No extra purchase expenses recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider border-b border-stone-200">
                    <tr>
                      <th className="p-3">Category</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Description</th>
                      <th className="p-3">Vendor</th>
                      <th className="p-3">Linked PO / Inv</th>
                      <th className="p-3">Payment Ref</th>
                      <th className="p-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-700">
                    {expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-stone-50/50">
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-800 border border-stone-200">
                            {exp.expense_category.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold text-stone-900 text-sm">
                          ₹{exp.amount.toLocaleString()}
                        </td>
                        <td className="p-3 text-stone-800 max-w-xs">{exp.description}</td>
                        <td className="p-3 text-stone-600">{exp.vendor_name || "Direct Vendor"}</td>
                        <td className="p-3 font-mono text-[11px] text-stone-500">
                          {exp.purchase_orders?.po_number || exp.purchase_invoices?.invoice_number || "Standalone"}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-stone-500">
                          {exp.payment_reference || "Cash / Direct"}
                        </td>
                        <td className="p-3 text-stone-500 text-[11px]">{exp.payment_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: FINANCIAL SUMMARY */}
      {activeTab === "summary" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-stone-600" />
              Landed Procurement Expenditure Breakdown
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50">
                <span className="text-xs text-stone-600">Goods Base Cost (Invoiced)</span>
                <span className="font-mono font-bold text-stone-900 text-sm">
                  ₹
                  {summaryData
                    ? (summaryData.total_invoiced - summaryData.total_gst - summaryData.total_freight).toLocaleString()
                    : "0"}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50/60 border border-purple-200">
                <span className="text-xs text-purple-900 font-semibold">Total GST (18% Average)</span>
                <span className="font-mono font-bold text-purple-900 text-sm">
                  ₹{summaryData ? summaryData.total_gst.toLocaleString() : "0"}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/60 border border-blue-200">
                <span className="text-xs text-blue-900 font-semibold">Freight & Shipping Total</span>
                <span className="font-mono font-bold text-blue-900 text-sm">
                  ₹{summaryData ? summaryData.total_freight.toLocaleString() : "0"}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50">
                <span className="text-xs text-stone-600">Standalone Additional Expenses</span>
                <span className="font-mono font-bold text-stone-900 text-sm">
                  ₹{summaryData ? summaryData.other_expenses_total.toLocaleString() : "0"}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-stone-900 text-white mt-4">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-300">
                  Total Disbursed Landed Cost
                </span>
                <span className="font-mono font-black text-lg">
                  ₹{summaryData ? summaryData.total_landed_expenditure.toLocaleString() : "0"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Download className="w-4 h-4 text-stone-600" />
              Tax & Accounting Audit Summary
            </h3>
            <p className="text-xs text-stone-500">
              Download complete purchase reports with supplier GSTINs, HSN itemizations, freight charges, and payment
              vouchers for month-end GST filing.
            </p>

            <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 space-y-3">
              <div className="text-xs font-bold text-stone-900">Included in Financial Report:</div>
              <ul className="text-xs text-stone-600 space-y-1 list-disc list-inside">
                <li>Supplier Tax Invoices & Verified GSTINs</li>
                <li>Purchase Order cross-reference numbers</li>
                <li>Itemized Freight, Transit Insurance, and Custom Duties</li>
                <li>Paid vs Pending Accounts Payable ledger</li>
                <li>Payment Vouchers & Bank UTR Transaction References</li>
              </ul>
            </div>

            <button
              onClick={() => {
                const jsonStr = `data:text/json;charset=utf-8,${encodeURIComponent(
                  JSON.stringify({ summaryData, invoices, expenses }, null, 2)
                )}`;
                const dl = document.createElement("a");
                dl.setAttribute("href", jsonStr);
                dl.setAttribute("download", `coverly-finance-report-${new Date().toISOString().split("T")[0]}.json`);
                dl.click();
              }}
              className="w-full py-2.5 rounded-xl bg-stone-900 text-white font-bold text-xs hover:bg-stone-800 transition flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Full Financial Audit Dataset (.JSON)
            </button>
          </div>
        </div>
      )}

      {/* RECORD INVOICE MODAL */}
      {isRecordInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 border border-stone-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-500 text-stone-950 font-bold">
                  <Receipt className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-stone-900">Record Incoming Supplier Invoice</h3>
                  <p className="text-xs text-stone-500">Record B2B tax invoice against Purchase Order or Supplier.</p>
                </div>
              </div>
              <button
                onClick={() => setIsRecordInvoiceModalOpen(false)}
                className="text-stone-400 hover:text-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordInvoice} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-1">
                    Select Supplier *
                  </label>
                  <select
                    required
                    value={invoiceForm.supplier_business_id}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, supplier_business_id: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-white focus:outline-none"
                  >
                    <option value="">Choose Supplier...</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.city || "India"})
                      </option>
                    ))}
                    {purchaseOrders.map((po) => (
                      <option key={po.supplier_business_id} value={po.supplier_business_id}>
                        {po.businesses?.name || "PO Supplier"} (PO: {po.po_number})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-1">
                    Link Purchase Order (Optional)
                  </label>
                  <select
                    value={invoiceForm.purchase_order_id}
                    onChange={(e) => {
                      const poId = e.target.value;
                      const selectedPo = purchaseOrders.find((p) => p.id === poId);
                      setInvoiceForm({
                        ...invoiceForm,
                        purchase_order_id: poId,
                        supplier_business_id: selectedPo?.supplier_business_id || invoiceForm.supplier_business_id,
                        subtotal: selectedPo ? selectedPo.subtotal.toString() : invoiceForm.subtotal,
                        freight_charges: selectedPo ? selectedPo.freight.toString() : invoiceForm.freight_charges,
                      });
                    }}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-white focus:outline-none"
                  >
                    <option value="">No PO Linked (Direct Invoice)</option>
                    {purchaseOrders.map((po) => (
                      <option key={po.id} value={po.id}>
                        {po.po_number} (₹{po.total_amount?.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-1">
                    Invoice Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. INV-2026-9921"
                    value={invoiceForm.invoice_number}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, invoice_number: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-1">
                    Invoice Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={invoiceForm.invoice_date}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, invoice_date: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-1">
                    Payment Due Date
                  </label>
                  <input
                    type="date"
                    value={invoiceForm.due_date}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Amounts and Calculations */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                <div className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                  Itemized Pricing & GST Calculations
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-stone-600 block mb-1">Subtotal (₹) *</label>
                    <input
                      type="number"
                      required
                      placeholder="0.00"
                      value={invoiceForm.subtotal}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, subtotal: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-stone-200 rounded-lg text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-stone-600 block mb-1">Freight (₹)</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={invoiceForm.freight_charges}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, freight_charges: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-stone-200 rounded-lg text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-stone-600 block mb-1">Other Charges (₹)</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={invoiceForm.additional_charges}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, additional_charges: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-stone-200 rounded-lg text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-stone-600 block mb-1">GST Rate</label>
                    <select
                      value={invoiceForm.gst_rate}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, gst_rate: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-stone-200 rounded-lg text-xs bg-white font-mono"
                    >
                      <option value="0.18">18% GST (Standard)</option>
                      <option value="0.12">12% GST</option>
                      <option value="0.05">5% GST</option>
                      <option value="0.28">28% GST</option>
                      <option value="0">0% (Exempt)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-stone-500">GST Computed: </span>
                    <span className="font-mono font-bold text-purple-700">₹{previewGst.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-stone-700 font-bold">Total Invoiced: </span>
                    <span className="font-mono font-black text-stone-900 text-sm">
                      ₹{previewTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Initial Payment Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-1">
                    Payment Status
                  </label>
                  <select
                    value={invoiceForm.payment_status}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, payment_status: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-white focus:outline-none"
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="partially_paid">Partially Paid</option>
                    <option value="paid">Fully Paid</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-1">
                    Initial Amount Paid (₹)
                  </label>
                  <input
                    type="number"
                    value={invoiceForm.amount_paid}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, amount_paid: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-1">
                    Payment Reference (UTR/NEFT)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UTR-HDFC-99120"
                    value={invoiceForm.payment_reference}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, payment_reference: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsRecordInvoiceModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingInvoice}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-50 shadow-sm"
                >
                  {isSubmittingInvoice ? "Recording Invoice..." : "Record Invoice & Track Payable"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE PAYMENT MODAL */}
      {selectedInvoiceForPayment && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-stone-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  Update Payment: {selectedInvoiceForPayment.invoice_number}
                </h3>
                <p className="text-xs text-stone-500">
                  Total Invoiced: ₹{selectedInvoiceForPayment.total_amount.toLocaleString()} • Currently Paid: ₹
                  {selectedInvoiceForPayment.amount_paid.toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedInvoiceForPayment(null)}
                className="text-stone-400 hover:text-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdatePayment} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-1">
                  Payment Status *
                </label>
                <select
                  value={paymentForm.payment_status}
                  onChange={(e: any) => setPaymentForm({ ...paymentForm, payment_status: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-white focus:outline-none"
                >
                  <option value="unpaid">Unpaid</option>
                  <option value="partially_paid">Partially Paid</option>
                  <option value="paid">Fully Paid</option>
                  <option value="disputed">Disputed / On Hold</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-1">
                  Cumulative Amount Paid (₹) *
                </label>
                <input
                  type="number"
                  required
                  value={paymentForm.amount_paid}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount_paid: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-1">
                  Bank / Payment Reference (UTR, Cheque, NEFT)
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR-AXIS-881290"
                  value={paymentForm.payment_reference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_reference: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-1">
                  Reconciliation Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Paid via ICICI Current Account..."
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setSelectedInvoiceForPayment(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-50 shadow-sm"
                >
                  {isSubmittingPayment ? "Updating..." : "Save Payment Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD EXPENSE MODAL */}
      {isRecordExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-stone-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-100 text-blue-900">
                  <Truck className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-stone-900">Record Purchase Expense</h3>
                  <p className="text-xs text-stone-500">Freight, packaging, insurance, or customs charges.</p>
                </div>
              </div>
              <button
                onClick={() => setIsRecordExpenseModalOpen(false)}
                className="text-stone-400 hover:text-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordExpense} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-1">
                  Expense Category *
                </label>
                <select
                  value={expenseForm.expense_category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, expense_category: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-white focus:outline-none"
                >
                  <option value="freight">Freight & Transportation</option>
                  <option value="packaging">Packaging & Crating</option>
                  <option value="insurance">Transit Cargo Insurance</option>
                  <option value="loading_unloading">Loading & Unloading Charges</option>
                  <option value="customs_duty">Customs Duty & Clearance</option>
                  <option value="storage_warehouse">Warehouse & Storage Charges</option>
                  <option value="other">Other Landed Expense</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-1">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 7500"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-1">
                  Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Loading charges at Bhiwandi warehouse"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-1">
                  Vendor / Transporter Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. VRL Logistics Ltd"
                  value={expenseForm.vendor_name}
                  onChange={(e) => setExpenseForm({ ...expenseForm, vendor_name: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={expenseForm.payment_date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, payment_date: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-1">
                    Payment Ref (UTR)
                  </label>
                  <input
                    type="text"
                    placeholder="Ref or Cash"
                    value={expenseForm.payment_reference}
                    onChange={(e) => setExpenseForm({ ...expenseForm, payment_reference: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsRecordExpenseModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingExpense}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-50 shadow-sm"
                >
                  {isSubmittingExpense ? "Recording..." : "Save Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
