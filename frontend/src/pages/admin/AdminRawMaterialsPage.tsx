import React, { useState, useEffect } from "react";
import {
  Factory,
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  DollarSign,
  Package,
  Building2,
  FileText,
  Truck,
  Check,
  X,
  Warehouse,
  Award,
} from "lucide-react";
import {
  RawMaterialSupplierProfile,
  RawMaterialProduct,
  RawMaterialRfq,
  RawMaterialOrder,
} from "../../types";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const AdminRawMaterialsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "metrics" | "suppliers" | "products" | "rfqs_orders"
  >("metrics");

  const [suppliers, setSuppliers] = useState<RawMaterialSupplierProfile[]>([]);
  const [products, setProducts] = useState<RawMaterialProduct[]>([]);
  const [rfqs, setRfqs] = useState<RawMaterialRfq[]>([]);
  const [orders, setOrders] = useState<RawMaterialOrder[]>([]);

  const [metrics, setMetrics] = useState({
    totalSuppliers: 12,
    verifiedSuppliers: 9,
    pendingSuppliers: 3,
    totalProducts: 45,
    activeProducts: 41,
    pendingProducts: 4,
    totalRfqs: 28,
    openRfqs: 14,
    acceptedRfqs: 10,
    totalOrders: 10,
    activeOrders: 4,
    totalGmv: 18500000,
  });

  const [isLoading, setIsLoading] = useState(true);

  // Supplier Verification Modal
  const [selectedSupplierForVerify, setSelectedSupplierForVerify] = useState<RawMaterialSupplierProfile | null>(null);
  const [verifyDecision, setVerifyDecision] = useState<"verified" | "rejected" | "suspended">("verified");
  const [verifyNotes, setVerifyNotes] = useState("");

  // Product Moderation Modal
  const [selectedProductForMod, setSelectedProductForMod] = useState<RawMaterialProduct | null>(null);
  const [modDecision, setModDecision] = useState<"approved" | "rejected" | "archived">("approved");
  const [modNotes, setModNotes] = useState("");

  const fallbackSuppliers: RawMaterialSupplierProfile[] = [
    {
      id: "sup-01",
      business_id: "biz-01",
      user_id: "usr-01",
      supplier_type: "manufacturer",
      headline: "Primary Steel Mills & Billets Manufacturer",
      operating_states: ["Jharkhand", "Odisha", "Maharashtra"],
      operating_cities: ["Jamshedpur", "Mumbai"],
      material_categories: ["Industrial Raw Materials", "Construction Raw Materials"],
      warehouses: [
        { name: "Central Mill Depot", city: "Jamshedpur", state: "Jharkhand", capacity: "50,000 MT" },
      ],
      supply_capacity_monthly: "65,000 MT / Month",
      certifications: ["ISO 9001:2015", "BIS IS 1786"],
      verification_status: "verified",
      rating: 4.9,
      total_deals_completed: 184,
      created_at: new Date().toISOString(),
      businesses: {
        id: "biz-01",
        name: "Bharat Alloys & Steel Mills Ltd",
        city: "Jamshedpur",
        state: "Jharkhand",
        verification_level: "registration_checked",
        is_active: true,
        created_at: new Date().toISOString(),
        slug: "bharat-alloys",
        business_type: "manufacturer",
        pincode: "831001",
      },
    },
    {
      id: "sup-02",
      business_id: "biz-02",
      user_id: "usr-02",
      supplier_type: "agricultural_commodity_supplier",
      headline: "Direct Farm Syndicate & Grain Processor",
      operating_states: ["Haryana", "Punjab"],
      operating_cities: ["Karnal", "Amritsar"],
      material_categories: ["Agricultural Raw Materials"],
      warehouses: [
        { name: "Karnal Silo Complex", city: "Karnal", state: "Haryana", capacity: "30,000 MT" },
      ],
      supply_capacity_monthly: "25,000 MT / Month",
      certifications: ["FSSAI", "AGMARK Grade 1"],
      verification_status: "pending",
      rating: 4.85,
      total_deals_completed: 14,
      created_at: new Date().toISOString(),
      businesses: {
        id: "biz-02",
        name: "Karnal Agro Commodities Syndicate",
        city: "Karnal",
        state: "Haryana",
        verification_level: "document_verified",
        is_active: true,
        created_at: new Date().toISOString(),
        slug: "karnal-agro",
        business_type: "manufacturer",
        pincode: "132001",
      },
    },
  ];

  const fallbackProducts: RawMaterialProduct[] = [
    {
      id: "rm-p1",
      supplier_id: "sup-01",
      business_id: "biz-01",
      category_id: "rm-cat-industrial",
      name: "TMT Steel Rebars Fe 550D (12mm to 32mm)",
      slug: "tmt-steel-rebars-fe-550d",
      material_grade: "Fe 550D Primary Billet",
      unit_of_measurement: "metric_ton",
      moq: 15,
      base_price: 52000,
      bulk_pricing_tiers: [],
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
      raw_material_supplier_profiles: {
        id: "sup-01",
        supplier_type: "manufacturer",
        verification_status: "verified",
        rating: 4.9,
        businesses: { id: "b1", name: "Bharat Alloys & Steel Mills Ltd", city: "Jamshedpur", state: "Jharkhand" },
      },
    },
    {
      id: "rm-p2",
      supplier_id: "sup-02",
      business_id: "biz-02",
      category_id: "rm-cat-agri",
      name: "Basmati Paddy Pusa 1121 Grade A Export Quality",
      slug: "basmati-paddy-pusa-1121",
      material_grade: "Pusa 1121 Grade A",
      unit_of_measurement: "metric_ton",
      moq: 20,
      base_price: 43500,
      bulk_pricing_tiers: [],
      maintains_inventory: true,
      stock_quantity: 280,
      available_quantity: 280,
      reserved_quantity: 0,
      lead_time_days: 4,
      supply_locations: ["North India"],
      delivery_available: true,
      images: [],
      moderation_status: "pending",
      is_active: true,
      created_at: new Date().toISOString(),
      quality_standards: [],
      specifications: {},
      raw_material_supplier_profiles: {
        id: "sup-02",
        supplier_type: "agricultural_commodity_supplier",
        verification_status: "pending",
        rating: 4.85,
        businesses: { id: "b2", name: "Karnal Agro Commodities Syndicate", city: "Karnal", state: "Haryana" },
      },
    },
  ];

  const fallbackRfqs: RawMaterialRfq[] = [
    {
      id: "rfq-01",
      rfq_number: "RM-RFQ-KM72-501",
      material_name: "TMT Rebars Fe 550D 16mm",
      category_id: "rm-cat-industrial",
      required_quantity: 60,
      unit: "metric_ton",
      material_grade: "Fe 550D",
      delivery_city: "Pune",
      delivery_state: "Maharashtra",
      guest_name: "Vikram Malhotra",
      guest_company: "Malhotra Infra Projects",
      status: "quotes_received",
      required_specifications: {},
      created_at: new Date().toISOString(),
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
      created_at: new Date().toISOString(),
      raw_material_supplier_profiles: {
        businesses: { name: "Bharat Alloys & Steel Mills Ltd", city: "Jamshedpur" },
      },
      users: { full_name: "Vikram Malhotra", email: "vikram@malhotra.in" },
    },
  ];

  useEffect(() => {
    setIsLoading(true);
    const token = localStorage.getItem("auth_token") || localStorage.getItem("coverly_user_id") || "";

    Promise.all([
      fetch(`${API_BASE}/admin/raw-materials/metrics`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()).catch(() => null),
      fetch(`${API_BASE}/admin/raw-materials/suppliers`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()).catch(() => null),
      fetch(`${API_BASE}/admin/raw-materials/products`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()).catch(() => null),
      fetch(`${API_BASE}/admin/raw-materials/rfqs`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()).catch(() => null),
      fetch(`${API_BASE}/admin/raw-materials/orders`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()).catch(() => null),
    ])
      .then(([mRes, sRes, pRes, rRes, oRes]) => {
        if (mRes?.success && mRes.data) setMetrics(mRes.data);
        if (sRes?.success && Array.isArray(sRes.data) && sRes.data.length > 0) setSuppliers(sRes.data);
        else setSuppliers(fallbackSuppliers);
        if (pRes?.success && Array.isArray(pRes.data) && pRes.data.length > 0) setProducts(pRes.data);
        else setProducts(fallbackProducts);
        if (rRes?.success && Array.isArray(rRes.data) && rRes.data.length > 0) setRfqs(rRes.data);
        else setRfqs(fallbackRfqs);
        if (oRes?.success && Array.isArray(oRes.data) && oRes.data.length > 0) setOrders(oRes.data);
        else setOrders(fallbackOrders);
      })
      .catch(() => {
        setSuppliers(fallbackSuppliers);
        setProducts(fallbackProducts);
        setRfqs(fallbackRfqs);
        setOrders(fallbackOrders);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleVerifySupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierForVerify) return;

    const token = localStorage.getItem("auth_token") || localStorage.getItem("coverly_user_id") || "";
    try {
      await fetch(`${API_BASE}/admin/raw-materials/suppliers/${selectedSupplierForVerify.id}/verify`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: verifyDecision,
          verification_notes: verifyNotes,
        }),
      });

      setSuppliers((prev) =>
        prev.map((s) =>
          s.id === selectedSupplierForVerify.id ? { ...s, verification_status: verifyDecision } : s
        )
      );
      setSelectedSupplierForVerify(null);
      setVerifyNotes("");
    } catch {
      setSelectedSupplierForVerify(null);
    }
  };

  const handleModerateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForMod) return;

    const token = localStorage.getItem("auth_token") || localStorage.getItem("coverly_user_id") || "";
    try {
      await fetch(`${API_BASE}/admin/raw-materials/products/${selectedProductForMod.id}/moderate`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: modDecision,
          notes: modNotes,
        }),
      });

      setProducts((prev) =>
        prev.map((p) =>
          p.id === selectedProductForMod.id ? { ...p, moderation_status: modDecision } : p
        )
      );
      setSelectedProductForMod(null);
      setModNotes("");
    } catch {
      setSelectedProductForMod(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      {/* Header */}
      <section className="bg-slate-900 text-white py-8 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              COVERLY Administration & Governance
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Raw Material Marketplace Console
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Audit primary mill suppliers, moderate material specifications, and monitor wholesale orders.
            </p>
          </div>
        </div>
      </section>

      {/* Metrics Row */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Total Mills & Suppliers
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{suppliers.length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {suppliers.filter((s) => s.verification_status === "pending").length} pending audit
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Active Material Listings
            </div>
            <div className="text-2xl font-bold text-indigo-600 mt-1">{products.length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {products.filter((p) => p.moderation_status === "pending").length} awaiting moderation
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Broadcast RFQs
            </div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{rfqs.length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Dispatched to mills</div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Gross Sourcing Value
            </div>
            <div className="text-2xl font-bold text-amber-600 mt-1">
              ₹{(metrics.totalGmv || 18500000).toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Confirmed PO fulfillment</div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="border-b border-slate-200 flex items-center gap-6 text-sm font-semibold">
          <button
            onClick={() => setActiveTab("metrics")}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === "metrics"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Marketplace Overview
          </button>
          <button
            onClick={() => setActiveTab("suppliers")}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "suppliers"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Supplier Verification Queue ({suppliers.length})
          </button>
          <button
            onClick={() => setActiveTab("products")}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "products"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Product Moderation ({products.length})
          </button>
          <button
            onClick={() => setActiveTab("rfqs_orders")}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "rfqs_orders"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            RFQs & Orders Monitoring
          </button>
        </div>
      </section>

      {/* Tab Contents */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Tab 1: Overview */}
        {activeTab === "metrics" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                Supplier Audit & Compliance Status
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                  <span className="font-semibold text-emerald-800">Verified & Active Mills</span>
                  <span className="font-bold text-emerald-900">
                    {suppliers.filter((s) => s.verification_status === "verified").length}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                  <span className="font-semibold text-amber-800">Pending Credential Audit</span>
                  <span className="font-bold text-amber-900">
                    {suppliers.filter((s) => s.verification_status === "pending").length}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                Raw Material Fulfillment Volume
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="font-semibold text-slate-700">Total Confirmed Orders</span>
                  <span className="font-bold text-slate-900">{orders.length}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                  <span className="font-semibold text-indigo-800">Gross Procurement GMV</span>
                  <span className="font-bold text-indigo-900">
                    ₹{(metrics.totalGmv || 18500000).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Supplier Verification */}
        {activeTab === "suppliers" && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Supplier Enterprise</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4">Warehouses</th>
                  <th className="py-3 px-4">Monthly Capacity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {suppliers.map((sup) => (
                  <tr key={sup.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{sup.businesses?.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {sup.businesses?.city}, {sup.businesses?.state}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 capitalize font-semibold text-slate-800">
                      {sup.supplier_type.replace(/_/g, " ")}
                    </td>
                    <td className="py-3.5 px-4">{sup.warehouses?.length || 1} Depots</td>
                    <td className="py-3.5 px-4 font-bold text-indigo-700">
                      {sup.supply_capacity_monthly || "50,000 MT"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          sup.verification_status === "verified"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {sup.verification_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedSupplierForVerify(sup)}
                        className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded text-xs font-semibold"
                      >
                        Audit / Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Product Moderation */}
        {activeTab === "products" && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Material Name</th>
                  <th className="py-3 px-4">Grade</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Base Price</th>
                  <th className="py-3 px-4">Moderation Status</th>
                  <th className="py-3 px-4 text-right">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{p.name}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                        {p.material_grade || "Industrial Spec"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {p.raw_material_supplier_profiles?.businesses?.name || "Verified Mill"}
                    </td>
                    <td className="py-3.5 px-4 font-black text-slate-900">
                      ₹{p.base_price.toLocaleString("en-IN")} / {p.unit_of_measurement}
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
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedProductForMod(p)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold"
                      >
                        Moderate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: RFQs & Orders */}
        {activeTab === "rfqs_orders" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900">Active Platform RFQs</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">RFQ Number</th>
                      <th className="py-2.5 px-3">Material</th>
                      <th className="py-2.5 px-3">Quantity</th>
                      <th className="py-2.5 px-3">Buyer Company</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rfqs.map((r) => (
                      <tr key={r.id}>
                        <td className="py-3 px-3 font-mono font-bold text-indigo-600">
                          {r.rfq_number}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-900">{r.material_name}</td>
                        <td className="py-3 px-3">
                          {r.required_quantity} {r.unit}
                        </td>
                        <td className="py-3 px-3">{r.guest_company || r.guest_name}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800">
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900">Confirmed Orders & Deliveries</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Order Number</th>
                      <th className="py-2.5 px-3">Supplier Mill</th>
                      <th className="py-2.5 px-3">Buyer</th>
                      <th className="py-2.5 px-3">Total (₹)</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.map((o) => (
                      <tr key={o.id}>
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">
                          {o.order_number}
                        </td>
                        <td className="py-3 px-3 font-semibold">
                          {o.raw_material_supplier_profiles?.businesses?.name || "Verified Mill"}
                        </td>
                        <td className="py-3 px-3">{o.users?.full_name}</td>
                        <td className="py-3 px-3 font-black text-indigo-700">
                          ₹{o.total_amount.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                            {o.status.replace(/_/g, " ")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Modal: Audit & Verify Supplier */}
      {selectedSupplierForVerify && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Verify Supplier Credentials</h3>
              <button onClick={() => setSelectedSupplierForVerify(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Audit for <strong>{selectedSupplierForVerify.businesses?.name}</strong>.
            </p>
            <form onSubmit={handleVerifySupplier} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Verification Decision *
                </label>
                <select
                  value={verifyDecision}
                  onChange={(e) => setVerifyDecision(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="verified">Approve & Grant Verified Status</option>
                  <option value="rejected">Reject Application</option>
                  <option value="suspended">Suspend Account</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Audit Notes / Reason
                </label>
                <textarea
                  rows={2}
                  placeholder="Record GST verification or license check notes..."
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSupplierForVerify(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold"
                >
                  Confirm Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Moderate Product */}
      {selectedProductForMod && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Moderate Material Listing</h3>
              <button onClick={() => setSelectedProductForMod(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Product: <strong>{selectedProductForMod.name}</strong> ({selectedProductForMod.material_grade})
            </p>
            <form onSubmit={handleModerateProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Moderation Decision *
                </label>
                <select
                  value={modDecision}
                  onChange={(e) => setModDecision(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="approved">Approve Listing for Public Discovery</option>
                  <option value="rejected">Reject Listing (Misleading / Restricted)</option>
                  <option value="archived">Archive Listing</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Moderation Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Record reason or compliance remarks..."
                  value={modNotes}
                  onChange={(e) => setModNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedProductForMod(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold"
                >
                  Save Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
