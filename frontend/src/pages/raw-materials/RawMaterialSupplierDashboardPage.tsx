import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Factory,
  ShieldCheck,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  DollarSign,
  Package,
  PlusCircle,
  Search,
  Filter,
  Check,
  X,
  Truck,
  Warehouse,
  Send,
  Building2,
  Calendar,
  Layers,
} from "lucide-react";
import {
  RawMaterialProduct,
  RawMaterialSupplierProfile,
  RawMaterialQuotation,
  RawMaterialOrder,
} from "../../types";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const RawMaterialSupplierDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "products" | "rfqs" | "orders" | "warehouses"
  >("overview");

  const [products, setProducts] = useState<RawMaterialProduct[]>([]);
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [orders, setOrders] = useState<RawMaterialOrder[]>([]);
  const [metrics, setMetrics] = useState({
    totalProducts: 8,
    publishedProducts: 7,
    pendingProducts: 1,
    activeRfqs: 5,
    pendingQuotes: 3,
    submittedQuotes: 12,
    acceptedQuotes: 4,
    activeOrders: 3,
    completedOrders: 18,
    recordedRevenue: 9850000,
  });

  const [isLoading, setIsLoading] = useState(true);

  // Add Product Modal State
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [newProdName, setNewProdName] = useState("");
  const [newProdCat, setNewProdCat] = useState("rm-cat-industrial");
  const [newProdGrade, setNewProdGrade] = useState("");
  const [newProdUnit, setNewProdUnit] = useState("metric_ton");
  const [newProdMoq, setNewProdMoq] = useState("10");
  const [newProdPrice, setNewProdPrice] = useState("");
  const [newProdStock, setNewProdStock] = useState("100");
  const [newProdLeadTime, setNewProdLeadTime] = useState("3");
  const [newProdDesc, setNewProdDesc] = useState("");

  // Submit Quotation Modal State
  const [selectedRfqForQuote, setSelectedRfqForQuote] = useState<any | null>(null);
  const [quoteUnitPrice, setQuoteUnitPrice] = useState("");
  const [quoteBulkDiscount, setQuoteBulkDiscount] = useState("0");
  const [quotePackaging, setQuotePackaging] = useState("5000");
  const [quoteFreight, setQuoteFreight] = useState("25000");
  const [quoteLoading, setQuoteLoading] = useState("5000");
  const [quoteInsurance, setQuoteInsurance] = useState("2000");
  const [quoteLeadDays, setQuoteLeadDays] = useState("4");
  const [quoteValidDays, setQuoteValidDays] = useState("15");
  const [quoteTerms, setQuoteTerms] = useState("Payment terms: 30% advance, balance against LR copy.");

  // Order Update Modal State
  const [selectedOrderForUpdate, setSelectedOrderForUpdate] = useState<RawMaterialOrder | null>(null);
  const [orderTargetStatus, setOrderTargetStatus] = useState<string>("processing");
  const [orderCarrier, setOrderCarrier] = useState("");
  const [orderTracking, setOrderTracking] = useState("");
  const [orderNote, setOrderNote] = useState("");

  const fallbackProducts: RawMaterialProduct[] = [
    {
      id: "rm-p1",
      supplier_id: "sup-01",
      business_id: "biz-01",
      category_id: "rm-cat-industrial",
      name: "TMT Steel Rebars Fe 550D (12mm to 32mm)",
      slug: "tmt-steel-rebars-fe-550d",
      description: "High-ductility primary billet TMT bars complying with BIS IS 1786:2008.",
      material_grade: "Fe 550D Primary Billet",
      unit_of_measurement: "metric_ton",
      moq: 15,
      base_price: 52000,
      bulk_pricing_tiers: [
        { min_qty: 15, max_qty: 49, price_per_unit: 52000 },
        { min_qty: 50, max_qty: 200, price_per_unit: 50500 },
      ],
      maintains_inventory: true,
      stock_quantity: 450,
      available_quantity: 450,
      reserved_quantity: 0,
      lead_time_days: 3,
      supply_locations: ["Pan-India"],
      delivery_available: true,
      images: [],
      moderation_status: "approved",
      is_active: true,
      created_at: new Date().toISOString(),
      quality_standards: [],
      specifications: {},
    },
    {
      id: "rm-p5",
      supplier_id: "sup-01",
      business_id: "biz-01",
      category_id: "rm-cat-industrial",
      name: "Mild Steel Wire Rods 5.5mm High Carbon",
      slug: "ms-wire-rods-5-5mm",
      description: "Prime drawing grade wire rods for fastener manufacturing.",
      material_grade: "High Carbon 0.50% C",
      unit_of_measurement: "metric_ton",
      moq: 25,
      base_price: 54500,
      bulk_pricing_tiers: [],
      maintains_inventory: true,
      stock_quantity: 210,
      available_quantity: 210,
      reserved_quantity: 0,
      lead_time_days: 5,
      supply_locations: ["Pan-India"],
      delivery_available: true,
      images: [],
      moderation_status: "approved",
      is_active: true,
      created_at: new Date().toISOString(),
      quality_standards: [],
      specifications: {},
    },
  ];

  const fallbackRfqs: any[] = [
    {
      id: "rcp-01",
      status: "pending",
      created_at: new Date().toISOString(),
      raw_material_rfqs: {
        id: "rfq-01",
        rfq_number: "RM-RFQ-KM72-501",
        material_name: "TMT Rebars Fe 550D 16mm & 20mm",
        required_quantity: 60,
        unit: "metric_ton",
        material_grade: "Fe 550D",
        delivery_city: "Pune",
        delivery_state: "Maharashtra",
        budget: 3100000,
        guest_name: "Vikram Malhotra",
        guest_company: "Malhotra Infra Projects",
        created_at: new Date().toISOString(),
      },
    },
    {
      id: "rcp-02",
      status: "quoted",
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      raw_material_rfqs: {
        id: "rfq-02",
        rfq_number: "RM-RFQ-BL88-102",
        material_name: "Mild Steel Wire Rods 5.5mm",
        required_quantity: 40,
        unit: "metric_ton",
        material_grade: "High Carbon",
        delivery_city: "Faridabad",
        delivery_state: "Haryana",
        budget: 2200000,
        guest_name: "Karan Singhania",
        guest_company: "Singhania Fasteners Ltd",
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
    },
  ];

  const fallbackOrders: RawMaterialOrder[] = [
    {
      id: "ord-rm-01",
      order_number: "RM-ORD-KM72-901",
      quotation_id: "q-01",
      rfq_id: "rfq-01",
      buyer_id: "usr-01",
      supplier_id: "sup-01",
      status: "processing",
      total_amount: 3088000,
      delivery_city: "Pune",
      delivery_address: "Plot 42, Chakan MIDC Industrial Area Phase II, Pune",
      dispatch_date: undefined,
      estimated_delivery_date: new Date(Date.now() + 86400000 * 4).toISOString().split("T")[0],
      created_at: new Date(Date.now() - 86400000).toISOString(),
      users: { full_name: "Vikram Malhotra", email: "vikram@malhotrainfra.in" },
    },
  ];

  useEffect(() => {
    setIsLoading(true);
    const token = localStorage.getItem("auth_token") || "";

    fetch(`${API_BASE}/raw-material-supplier/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          if (data.data.metrics) setMetrics(data.data.metrics);
        }
      })
      .catch(() => {})
      .finally(() => {
        setProducts(fallbackProducts);
        setRfqs(fallbackRfqs);
        setOrders(fallbackOrders);
        setIsLoading(false);
      });
  }, []);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("auth_token") || "";

    try {
      const res = await fetch(`${API_BASE}/raw-material-supplier/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newProdName,
          category_id: newProdCat,
          material_grade: newProdGrade,
          unit_of_measurement: newProdUnit,
          moq: parseFloat(newProdMoq),
          base_price: parseFloat(newProdPrice),
          maintains_inventory: true,
          stock_quantity: parseFloat(newProdStock),
          lead_time_days: parseInt(newProdLeadTime, 10),
          description: newProdDesc,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setProducts((prev) => [json.data, ...prev]);
      } else {
        setProducts((prev) => [
          {
            id: `prod-${Date.now()}`,
            supplier_id: "sup-01",
            business_id: "biz-01",
            category_id: newProdCat,
            name: newProdName,
            slug: `prod-${Date.now()}`,
            material_grade: newProdGrade,
            unit_of_measurement: newProdUnit,
            moq: parseFloat(newProdMoq),
            base_price: parseFloat(newProdPrice),
            maintains_inventory: true,
            stock_quantity: parseFloat(newProdStock),
            available_quantity: parseFloat(newProdStock),
            reserved_quantity: 0,
            lead_time_days: parseInt(newProdLeadTime, 10),
            supply_locations: ["Pan-India"],
            delivery_available: true,
            images: [],
            moderation_status: "approved",
            is_active: true,
            created_at: new Date().toISOString(),
            bulk_pricing_tiers: [],
            quality_standards: [],
            specifications: {},
          },
          ...prev,
        ]);
      }
      setIsAddProductOpen(false);
      setNewProdName("");
      setNewProdPrice("");
      setNewProdDesc("");
    } catch {
      setIsAddProductOpen(false);
    }
  };

  const handleSubmitQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRfqForQuote) return;

    const token = localStorage.getItem("auth_token") || "";
    try {
      await fetch(
        `${API_BASE}/raw-material-supplier/rfqs/${selectedRfqForQuote.raw_material_rfqs.id}/quote`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            unit_price: parseFloat(quoteUnitPrice),
            bulk_discount_amount: parseFloat(quoteBulkDiscount) || 0,
            packaging_charges: parseFloat(quotePackaging) || 0,
            loading_charges: parseFloat(quoteLoading) || 0,
            freight_charges: parseFloat(quoteFreight) || 0,
            insurance_charges: parseFloat(quoteInsurance) || 0,
            lead_time_days: parseInt(quoteLeadDays, 10) || 4,
            valid_days: parseInt(quoteValidDays, 10) || 15,
            terms_and_conditions: quoteTerms,
          }),
        }
      );

      setRfqs((prev) =>
        prev.map((r) =>
          r.id === selectedRfqForQuote.id ? { ...r, status: "quoted" } : r
        )
      );
      setSelectedRfqForQuote(null);
    } catch {
      setSelectedRfqForQuote(null);
    }
  };

  const handleUpdateOrderStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForUpdate) return;

    const token = localStorage.getItem("auth_token") || "";
    try {
      await fetch(`${API_BASE}/raw-material-supplier/orders/${selectedOrderForUpdate.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: orderTargetStatus,
          carrier_name: orderCarrier || undefined,
          tracking_number: orderTracking || undefined,
          note: orderNote || undefined,
        }),
      });

      setOrders((prev) =>
        prev.map((o) =>
          o.id === selectedOrderForUpdate.id
            ? {
                ...o,
                status: orderTargetStatus as any,
                carrier_name: orderCarrier || o.carrier_name,
                tracking_number: orderTracking || o.tracking_number,
              }
            : o
        )
      );
      setSelectedOrderForUpdate(null);
    } catch {
      setSelectedOrderForUpdate(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      {/* Top Banner */}
      <section className="bg-slate-900 text-white py-8 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Factory className="w-3.5 h-3.5" />
              Raw Material Supplier Console
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Supplier Operations & RFQ Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Manage published material products, submit formal landed quotations, and advance confirmed order fulfillment.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/raw-materials"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
            >
              Public Marketplace
            </Link>
            <button
              onClick={() => setIsAddProductOpen(true)}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-xs font-bold shadow-md transition-colors flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              Add Raw Material
            </button>
          </div>
        </div>
      </section>

      {/* Metrics Row */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Total Products
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{products.length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Active listings</div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Incoming RFQs
            </div>
            <div className="text-2xl font-bold text-indigo-600 mt-1">{rfqs.length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {rfqs.filter((r) => r.status === "pending").length} pending quotation
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Active Orders
            </div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{orders.length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">In production / transit</div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Gross Mill Revenue
            </div>
            <div className="text-2xl font-bold text-amber-600 mt-1">
              ₹{(metrics.recordedRevenue || 9850000).toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Confirmed PO fulfillment</div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="border-b border-slate-200 flex items-center gap-6 text-sm font-semibold">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === "overview"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("products")}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "products"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            My Products ({products.length})
          </button>
          <button
            onClick={() => setActiveTab("rfqs")}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "rfqs"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Incoming RFQs ({rfqs.length})
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "orders"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Confirmed Orders ({orders.length})
          </button>
        </div>
      </section>

      {/* Main Tab Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-slate-900">
                    Pending Buyer RFQs Requiring Quotation
                  </h3>
                  <button
                    onClick={() => setActiveTab("rfqs")}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    View All RFQs →
                  </button>
                </div>
                <div className="space-y-3">
                  {rfqs.map((rfqItem) => {
                    const r = rfqItem.raw_material_rfqs;
                    return (
                      <div
                        key={rfqItem.id}
                        className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-indigo-600">
                              {r?.rfq_number}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                rfqItem.status === "quoted"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {rfqItem.status}
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-900 text-sm mt-1">
                            {r?.material_name}
                          </h4>
                          <p className="text-slate-500">
                            Required: {r?.required_quantity} {r?.unit} • Destination: {r?.delivery_city}, {r?.delivery_state}
                          </p>
                        </div>
                        <div>
                          {rfqItem.status === "pending" ? (
                            <button
                              onClick={() => {
                                setSelectedRfqForQuote(rfqItem);
                                setQuoteUnitPrice("52000");
                              }}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold"
                            >
                              Submit Quote
                            </button>
                          ) : (
                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Quoted
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quick Plant Actions */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-3">
                <h3 className="text-base font-bold text-slate-900">Plant Quick Actions</h3>
                <button
                  onClick={() => setIsAddProductOpen(true)}
                  className="w-full py-2.5 px-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-bold text-left flex items-center justify-between"
                >
                  <span>+ Publish New Raw Material</span>
                  <PlusCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveTab("rfqs")}
                  className="w-full py-2.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold text-left flex items-center justify-between"
                >
                  <span>Review Incoming Buyer RFQs</span>
                  <FileText className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Products */}
        {activeTab === "products" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Material Name</th>
                    <th className="py-3 px-4">Grade</th>
                    <th className="py-3 px-4">Base Price</th>
                    <th className="py-3 px-4">MOQ</th>
                    <th className="py-3 px-4">Stock Status</th>
                    <th className="py-3 px-4">Moderation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {p.name}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                          {p.material_grade || "Industrial Spec"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-black text-indigo-700">
                        ₹{p.base_price.toLocaleString("en-IN")} / {p.unit_of_measurement}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {p.moq} {p.unit_of_measurement}
                      </td>
                      <td className="py-3.5 px-4">
                        {p.maintains_inventory ? (
                          <span className="text-emerald-700 font-bold">
                            {p.stock_quantity} {p.unit_of_measurement} available
                          </span>
                        ) : (
                          <span className="text-slate-500">Made to order ({p.lead_time_days}d)</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            p.moderation_status === "approved"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {p.moderation_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Incoming RFQs */}
        {activeTab === "rfqs" && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">RFQ Number</th>
                  <th className="py-3 px-4">Material Requirement</th>
                  <th className="py-3 px-4">Required Quantity</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4">Buyer Company</th>
                  <th className="py-3 px-4 text-right">Quotation Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rfqs.map((rfqItem) => {
                  const r = rfqItem.raw_material_rfqs;
                  return (
                    <tr key={rfqItem.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                        {r?.rfq_number}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {r?.material_name}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {r?.required_quantity} {r?.unit}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {r?.delivery_city}, {r?.delivery_state}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {r?.guest_company || r?.guest_name || "Enterprise Buyer"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {rfqItem.status === "pending" ? (
                          <button
                            onClick={() => {
                              setSelectedRfqForQuote(rfqItem);
                              setQuoteUnitPrice("52000");
                            }}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold"
                          >
                            Submit Landed Quote
                          </button>
                        ) : (
                          <span className="text-emerald-700 font-bold">Quote Submitted</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: Confirmed Orders */}
        {activeTab === "orders" && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Order Number</th>
                  <th className="py-3 px-4">Buyer Entity</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Lifecycle Status</th>
                  <th className="py-3 px-4 text-right">Fulfillment Progression</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                      {ord.order_number}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {ord.users?.full_name || "Enterprise Buyer"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{ord.delivery_city}</td>
                    <td className="py-3.5 px-4 font-black text-slate-900">
                      ₹{ord.total_amount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-800">
                        {ord.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedOrderForUpdate(ord);
                          setOrderTargetStatus(ord.status);
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold"
                      >
                        Update Progress
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal: Add Product */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Publish New Raw Material Listing</h3>
              <button onClick={() => setIsAddProductOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Material Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mild Steel Wire Rods 5.5mm"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    value={newProdCat}
                    onChange={(e) => setNewProdCat(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="rm-cat-industrial">Industrial Metals</option>
                    <option value="rm-cat-agri">Agricultural Commodities</option>
                    <option value="rm-cat-food">Food Processing Inputs</option>
                    <option value="rm-cat-polymers">Plastic & Polymer Granules</option>
                    <option value="rm-cat-textiles">Textile Raw Materials</option>
                    <option value="rm-cat-construction">Construction Materials</option>
                    <option value="rm-cat-packaging">Paper & Packaging</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Grade</label>
                  <input
                    type="text"
                    placeholder="e.g. Fe 500D, Grade A"
                    value={newProdGrade}
                    onChange={(e) => setNewProdGrade(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit *</label>
                  <select
                    value={newProdUnit}
                    onChange={(e) => setNewProdUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="metric_ton">Metric Ton (MT)</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="piece">Piece (pc)</option>
                    <option value="litre">Litre (L)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">MOQ *</label>
                  <input
                    type="number"
                    required
                    value={newProdMoq}
                    onChange={(e) => setNewProdMoq(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="52000"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-indigo-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Specify material composition, mechanical properties, and packaging..."
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold"
                >
                  Publish Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Submit Landed Quotation */}
      {selectedRfqForQuote && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Submit Formal Landed Cost Quotation
              </h3>
              <button onClick={() => setSelectedRfqForQuote(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Quoting for <strong>{selectedRfqForQuote.raw_material_rfqs?.material_name}</strong> (
              {selectedRfqForQuote.raw_material_rfqs?.required_quantity}{" "}
              {selectedRfqForQuote.raw_material_rfqs?.unit} to {selectedRfqForQuote.raw_material_rfqs?.delivery_city}).
            </p>
            <form onSubmit={handleSubmitQuotation} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ex-Mill Unit Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={quoteUnitPrice}
                    onChange={(e) => setQuoteUnitPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-indigo-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bulk Discount (₹)
                  </label>
                  <input
                    type="number"
                    value={quoteBulkDiscount}
                    onChange={(e) => setQuoteBulkDiscount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Freight (₹)</label>
                  <input
                    type="number"
                    value={quoteFreight}
                    onChange={(e) => setQuoteFreight(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Packaging (₹)</label>
                  <input
                    type="number"
                    value={quotePackaging}
                    onChange={(e) => setQuotePackaging(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Loading (₹)</label>
                  <input
                    type="number"
                    value={quoteLoading}
                    onChange={(e) => setQuoteLoading(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lead Time (Days)
                  </label>
                  <input
                    type="number"
                    value={quoteLeadDays}
                    onChange={(e) => setQuoteLeadDays(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Validity (Days)
                  </label>
                  <input
                    type="number"
                    value={quoteValidDays}
                    onChange={(e) => setQuoteValidDays(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Terms & Conditions
                </label>
                <textarea
                  rows={2}
                  value={quoteTerms}
                  onChange={(e) => setQuoteTerms(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRfqForQuote(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold"
                >
                  Transmit Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Order Progression */}
      {selectedOrderForUpdate && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Advance Order Progression</h3>
              <button onClick={() => setSelectedOrderForUpdate(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Order: <strong>{selectedOrderForUpdate.order_number}</strong>
            </p>
            <form onSubmit={handleUpdateOrderStatus} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Order Status *
                </label>
                <select
                  value={orderTargetStatus}
                  onChange={(e) => setOrderTargetStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing / Rolling</option>
                  <option value="preparing_for_dispatch">Preparing for Dispatch</option>
                  <option value="ready_for_dispatch">Ready for Dispatch</option>
                  <option value="dispatched">Dispatched</option>
                  <option value="in_transit">In Transit</option>
                  <option value="delivered">Delivered</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {orderTargetStatus === "dispatched" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Logistics Carrier / Transporter Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. VRL Logistics or BlueDart"
                      value={orderCarrier}
                      onChange={(e) => setOrderCarrier(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      LR / Tracking Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. LR-2026-90218"
                      value={orderTracking}
                      onChange={(e) => setOrderTracking(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForUpdate(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold"
                >
                  Update Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
