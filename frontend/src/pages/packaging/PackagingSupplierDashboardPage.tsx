import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  Layers,
  FileText,
  Truck,
  Building2,
  Plus,
  CheckCircle,
  Clock,
  Send,
  AlertCircle,
  Eye,
  Edit,
  Printer,
  Scale,
  Sparkles,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  PackagingProduct,
  PackagingRfq,
  PackagingQuotation,
  PackagingOrder,
  PackagingSupplierProfile,
} from "../../types";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const PackagingSupplierDashboardPage: React.FC = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<"overview" | "catalog" | "rfqs" | "orders" | "samples">("overview");
  const [stats, setStats] = useState<any>({
    total_products: 0,
    published_products: 0,
    open_rfqs: 0,
    submitted_quotations: 0,
    active_orders: 0,
    completed_orders: 0,
  });

  const [profile, setProfile] = useState<PackagingSupplierProfile | null>(null);
  const [products, setProducts] = useState<PackagingProduct[]>([]);
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [orders, setOrders] = useState<PackagingOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [selectedRfqForQuote, setSelectedRfqForQuote] = useState<any | null>(null);

  // New Product Form State
  const [prodName, setProdName] = useState("");
  const [prodCategory, setProdCategory] = useState("pkg-cat-flexible");
  const [prodSubcategory, setProdSubcategory] = useState("");
  const [prodPackagingType, setProdPackagingType] = useState("Flexible Pouch");
  const [prodMaterial, setProdMaterial] = useState("Kraft / Foil / PE 3-Ply");
  const [prodThickness, setProdThickness] = useState("100 Microns");
  const [prodCapacity, setProdCapacity] = useState("500 grams");
  const [prodMoq, setProdMoq] = useState("5000");
  const [prodPrice, setProdPrice] = useState("5.50");
  const [prodLeadTime, setProdLeadTime] = useState("10");

  // Quotation Submission Form State
  const [quoteUnitPrice, setQuoteUnitPrice] = useState("6.20");
  const [quoteQuantity, setQuoteQuantity] = useState("10000");
  const [quoteDiscount, setQuoteDiscount] = useState("1500");
  const [quotePrintCharge, setQuotePrintCharge] = useState("3500");
  const [quotePlateCharge, setQuotePlateCharge] = useState("8000");
  const [quotePackagingCharge, setQuotePackagingCharge] = useState("1000");
  const [quoteFreightCharge, setQuoteFreightCharge] = useState("2500");
  const [quoteLeadDays, setQuoteLeadDays] = useState("10");
  const [quoteSampleCharges, setQuoteSampleCharges] = useState("1000");

  // Load Supplier Data
  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const headers = {
        "Content-Type": "application/json",
        ...(user ? { "x-user-id": user.id } : {}),
      };

      const [statsRes, profRes, prodRes, rfqRes, ordRes] = await Promise.all([
        fetch(`${API_BASE}/packaging-supplier/stats`, { headers }),
        fetch(`${API_BASE}/packaging-supplier/profile`, { headers }),
        fetch(`${API_BASE}/packaging-supplier/products`, { headers }),
        fetch(`${API_BASE}/packaging-supplier/rfqs`, { headers }),
        fetch(`${API_BASE}/packaging-supplier/orders`, { headers }),
      ]);

      if (statsRes.ok) {
        const json = await statsRes.json();
        if (json.success) setStats(json.data);
      }
      if (profRes.ok) {
        const json = await profRes.json();
        if (json.success) setProfile(json.data);
      }
      if (prodRes.ok) {
        const json = await prodRes.json();
        if (json.success) setProducts(json.data);
      }
      if (rfqRes.ok) {
        const json = await rfqRes.json();
        if (json.success) setRfqs(json.data);
      }
      if (ordRes.ok) {
        const json = await ordRes.json();
        if (json.success) setOrders(json.data);
      }
    } catch (err) {
      console.error("Dashboard loading error", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  // Handle Add Product
  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: prodName,
        category_id: prodCategory,
        subcategory: prodSubcategory || undefined,
        packaging_type: prodPackagingType,
        material_type: prodMaterial,
        thickness: prodThickness,
        capacity: prodCapacity,
        unit_of_measurement: "piece",
        moq: parseInt(prodMoq, 10),
        base_price: parseFloat(prodPrice),
        lead_time_days: parseInt(prodLeadTime, 10),
        printing_options: ["Rotogravure 8 Colours", "Flexographic", "Matte Spot UV"],
        bulk_pricing_tiers: [
          { min_qty: parseInt(prodMoq, 10), max_qty: parseInt(prodMoq, 10) * 2 - 1, price_per_unit: parseFloat(prodPrice) },
          { min_qty: parseInt(prodMoq, 10) * 2, max_qty: 99999, price_per_unit: parseFloat(prodPrice) * 0.88, discount_pct: 12 },
        ],
      };

      const res = await fetch(`${API_BASE}/packaging-supplier/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(user ? { "x-user-id": user.id } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsAddProductModalOpen(false);
        setProdName("");
        loadDashboardData();
      } else {
        const json = await res.json();
        alert(json.error || "Failed to create product listing.");
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handle Submit Quote
  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRfqForQuote) return;

    try {
      const payload = {
        rfq_id: selectedRfqForQuote.rfq_id || selectedRfqForQuote.id,
        quantity: parseInt(quoteQuantity, 10),
        unit_price: parseFloat(quoteUnitPrice),
        bulk_discount_amount: parseFloat(quoteDiscount) || 0,
        printing_charges: parseFloat(quotePrintCharge) || 0,
        plate_cylinder_charges: parseFloat(quotePlateCharge) || 0,
        packaging_charges: parseFloat(quotePackagingCharge) || 0,
        freight_charges: parseFloat(quoteFreightCharge) || 0,
        production_lead_time_days: parseInt(quoteLeadDays, 10) || 10,
        sample_available: true,
        sample_charges: parseFloat(quoteSampleCharges) || 0,
      };

      const res = await fetch(`${API_BASE}/packaging-supplier/quotations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(user ? { "x-user-id": user.id } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsQuoteModalOpen(false);
        setSelectedRfqForQuote(null);
        alert("Landed-cost quotation submitted to buyer successfully!");
        loadDashboardData();
      } else {
        const json = await res.json();
        alert(json.error || "Failed to submit quotation.");
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handle Order Stepper Progression
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`${API_BASE}/packaging-supplier/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(user ? { "x-user-id": user.id } : {}),
        },
        body: JSON.stringify({
          order_status: newStatus,
          carrier_name: newStatus === "dispatched" ? "V-Trans India Ltd" : undefined,
          tracking_number: newStatus === "dispatched" ? `VT-${Date.now().toString(36).toUpperCase()}` : undefined,
          note: `Production transitioned to ${newStatus}`,
        }),
      });

      if (res.ok) {
        loadDashboardData();
      } else {
        const json = await res.json();
        alert(json.error || "Failed to advance order status.");
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="bg-[#FAF9F5] min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Strip */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                Packaging Converter Workspace
              </span>
              <span className="text-xs font-bold text-stone-500">•</span>
              <span className="text-xs font-semibold text-emerald-700">Verified Plant</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight mt-1">
              {profile?.businesses?.name || "Converter Dashboard"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddProductModalOpen(true)}
              className="bg-blue-900 hover:bg-blue-800 text-white font-bold px-4 py-2 rounded-lg text-xs shadow-xs transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Publish New Listing
            </button>
            <Link
              to="/packaging"
              className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold px-4 py-2 rounded-lg text-xs transition"
            >
              Public Marketplace
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto border-b border-stone-200 text-xs font-bold pb-2">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === "overview" ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            Overview & Metrics
          </button>
          <button
            onClick={() => setActiveTab("catalog")}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === "catalog" ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            Product Catalogues ({products.length})
          </button>
          <button
            onClick={() => setActiveTab("rfqs")}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === "rfqs" ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            Buyer RFQs & Quotes ({rfqs.length})
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === "orders" ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            Production Orders ({orders.length})
          </button>
        </div>

        {/* TAB 1: Overview */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Total Products</span>
                <div className="text-xl font-black text-stone-900 mt-1">{stats.total_products}</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Active Listings</span>
                <div className="text-xl font-black text-blue-900 mt-1">{stats.published_products}</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Open RFQs</span>
                <div className="text-xl font-black text-amber-600 mt-1">{stats.open_rfqs}</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Quotes Sent</span>
                <div className="text-xl font-black text-indigo-700 mt-1">{stats.submitted_quotations}</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Active Production</span>
                <div className="text-xl font-black text-purple-700 mt-1">{stats.active_orders}</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Completed Orders</span>
                <div className="text-xl font-black text-emerald-600 mt-1">{stats.completed_orders}</div>
              </div>
            </div>

            {/* Recent Orders Preview */}
            <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                <h3 className="font-bold text-stone-900 text-sm">Active Orders on Factory Floor</h3>
                <button onClick={() => setActiveTab("orders")} className="text-xs font-bold text-blue-900 hover:underline">
                  View All Orders →
                </button>
              </div>

              {orders.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {orders.slice(0, 3).map((ord) => (
                    <div key={ord.id} className="p-3 bg-stone-50 rounded-lg flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-stone-900">{ord.order_number}</span>
                        <div className="text-stone-500 text-[11px]">
                          Qty: {ord.quantity.toLocaleString("en-IN")} {ord.unit}s • Total: ₹{ord.total_amount.toLocaleString("en-IN")}
                        </div>
                      </div>
                      <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-900">
                        {ord.order_status.replace(/_/g, " ")}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-stone-500 mt-4">No active production runs yet.</p>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Catalog Management */}
        {activeTab === "catalog" && (
          <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <h2 className="text-base font-bold text-stone-900">Configured Packaging Listings</h2>
              <button
                onClick={() => setIsAddProductModalOpen(true)}
                className="bg-blue-900 hover:bg-blue-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
              >
                + Add Listing
              </button>
            </div>

            {products.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50 text-stone-600 border-b border-stone-200">
                      <th className="p-3 font-bold">Product Name</th>
                      <th className="p-3 font-bold">Material & Specs</th>
                      <th className="p-3 font-bold">Base Price</th>
                      <th className="p-3 font-bold">MOQ</th>
                      <th className="p-3 font-bold">Lead Time</th>
                      <th className="p-3 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-stone-50/50">
                        <td className="p-3 font-bold text-stone-900">{p.name}</td>
                        <td className="p-3 text-stone-600">{p.material_type} ({p.thickness || "std"})</td>
                        <td className="p-3 font-bold text-blue-950">₹{p.base_price.toFixed(2)}</td>
                        <td className="p-3 text-stone-700">{p.moq} {p.unit_of_measurement}s</td>
                        <td className="p-3 text-stone-700">{p.lead_time_days} days</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-50 text-emerald-800">
                            {p.moderation_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-stone-500 py-6 text-center">No listings yet. Click "+ Add Listing" to start.</p>
            )}
          </div>
        )}

        {/* TAB 3: RFQs & Quotations */}
        {activeTab === "rfqs" && (
          <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-stone-900">Received Buyer Packaging Requirements</h2>

            {rfqs.length > 0 ? (
              <div className="space-y-4">
                {rfqs.map((item) => {
                  const r = item.packaging_rfqs || item;
                  return (
                    <div key={item.id} className="p-4 bg-stone-50 rounded-xl border border-stone-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase bg-stone-200 text-stone-800 px-2 py-0.5 rounded">
                            {r.rfq_number}
                          </span>
                          <span className="text-xs font-semibold text-stone-500">• Destination: {r.delivery_city}, {r.delivery_state}</span>
                        </div>
                        <h3 className="font-bold text-stone-900 text-sm">{r.product_being_packed || r.packaging_type}</h3>
                        <p className="text-xs text-stone-600">
                          Required Quantity: <strong className="text-stone-900">{r.required_quantity} {r.unit}s</strong> • Material: {r.material_preference || "Flexible"}
                        </p>
                        {r.printing_details && (
                          <div className="text-[11px] text-blue-900 font-medium">
                            Printing: {r.printing_details}
                          </div>
                        )}
                      </div>

                      <div className="shrink-0">
                        {item.status === "quoted" ? (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                            Quotation Sent
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedRfqForQuote(r);
                              setQuoteQuantity(r.required_quantity.toString());
                              setIsQuoteModalOpen(true);
                            }}
                            className="px-4 py-2 bg-blue-900 text-white font-bold text-xs rounded-lg hover:bg-blue-800 transition"
                          >
                            Submit Landed Quote
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-stone-500 py-6 text-center">No incoming RFQs matching your categories currently.</p>
            )}
          </div>
        )}

        {/* TAB 4: Orders & Production Stepper */}
        {activeTab === "orders" && (
          <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-xs space-y-6">
            <h2 className="text-base font-bold text-stone-900">Packaging Production & Dispatch Stepper</h2>

            {orders.length > 0 ? (
              <div className="space-y-6">
                {orders.map((ord) => (
                  <div key={ord.id} className="p-5 border border-stone-200 rounded-xl bg-stone-50/50 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-200">
                      <div>
                        <span className="font-bold text-stone-900 text-sm">{ord.order_number}</span>
                        <div className="text-xs text-stone-500">
                          Quantity: {ord.quantity.toLocaleString("en-IN")} {ord.unit}s • Total: ₹{ord.total_amount.toLocaleString("en-IN")}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold uppercase px-2.5 py-1 rounded bg-blue-900 text-white">
                          Status: {ord.order_status.replace(/_/g, " ")}
                        </span>
                        {ord.tracking_number && (
                          <div className="text-[11px] font-mono text-stone-600 mt-1">
                            Carrier: {ord.carrier_name} ({ord.tracking_number})
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stepper Actions */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
                      <span className="font-semibold text-stone-700">Advance Production:</span>
                      {ord.order_status === "order_created" && (
                        <button
                          onClick={() => handleUpdateOrderStatus(ord.id, "production_scheduled")}
                          className="px-3 py-1 bg-stone-900 text-white rounded font-bold"
                        >
                          Schedule Production
                        </button>
                      )}
                      {ord.order_status === "production_scheduled" && (
                        <button
                          onClick={() => handleUpdateOrderStatus(ord.id, "production_in_progress")}
                          className="px-3 py-1 bg-blue-900 text-white rounded font-bold"
                        >
                          Start Converting & Printing
                        </button>
                      )}
                      {ord.order_status === "production_in_progress" && (
                        <button
                          onClick={() => handleUpdateOrderStatus(ord.id, "quality_inspection")}
                          className="px-3 py-1 bg-indigo-900 text-white rounded font-bold"
                        >
                          Pass Quality Inspection
                        </button>
                      )}
                      {ord.order_status === "quality_inspection" && (
                        <button
                          onClick={() => handleUpdateOrderStatus(ord.id, "ready_for_dispatch")}
                          className="px-3 py-1 bg-purple-900 text-white rounded font-bold"
                        >
                          Mark Ready for Dispatch
                        </button>
                      )}
                      {ord.order_status === "ready_for_dispatch" && (
                        <button
                          onClick={() => handleUpdateOrderStatus(ord.id, "dispatched")}
                          className="px-3 py-1 bg-amber-600 text-white rounded font-bold"
                        >
                          Dispatch via Transporter
                        </button>
                      )}
                      {ord.order_status === "dispatched" && (
                        <button
                          onClick={() => handleUpdateOrderStatus(ord.id, "delivered")}
                          className="px-3 py-1 bg-emerald-700 text-white rounded font-bold"
                        >
                          Confirm Delivery
                        </button>
                      )}
                      {ord.order_status === "delivered" && (
                        <button
                          onClick={() => handleUpdateOrderStatus(ord.id, "completed")}
                          className="px-3 py-1 bg-emerald-900 text-white rounded font-bold"
                        >
                          Complete Order
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-500 py-6 text-center">No customer purchase orders received yet.</p>
            )}
          </div>
        )}
      </div>

      {/* Modal 1: Add Listing Modal */}
      {isAddProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-stone-900">Publish Packaging Item</h3>
            <form onSubmit={handleAddProductSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Item Title</label>
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="e.g. 3-Ply Matte Stand-Up Zipper Pouch"
                  className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 bg-stone-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Category</label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="w-full text-xs border border-stone-300 rounded-lg px-2.5 py-2 bg-stone-50"
                  >
                    <option value="pkg-cat-flexible">Flexible Packaging</option>
                    <option value="pkg-cat-corrugated">Corrugated Boxes</option>
                    <option value="pkg-cat-rigid">Rigid Containers</option>
                    <option value="pkg-cat-paper">Paper Packaging</option>
                    <option value="pkg-cat-labels">Labels & Printing</option>
                    <option value="pkg-cat-food">Food Packaging</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Packaging Format</label>
                  <input
                    type="text"
                    value={prodPackagingType}
                    onChange={(e) => setProdPackagingType(e.target.value)}
                    className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 bg-stone-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Material Substrate</label>
                  <input
                    type="text"
                    required
                    value={prodMaterial}
                    onChange={(e) => setProdMaterial(e.target.value)}
                    className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 bg-stone-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Thickness</label>
                  <input
                    type="text"
                    value={prodThickness}
                    onChange={(e) => setProdThickness(e.target.value)}
                    className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 bg-stone-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">MOQ</label>
                  <input
                    type="number"
                    required
                    value={prodMoq}
                    onChange={(e) => setProdMoq(e.target.value)}
                    className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 bg-stone-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Base Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 bg-stone-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Lead Days</label>
                  <input
                    type="number"
                    required
                    value={prodLeadTime}
                    onChange={(e) => setProdLeadTime(e.target.value)}
                    className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 bg-stone-50"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAddProductModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-900 text-white font-bold rounded-lg text-xs hover:bg-blue-800"
                >
                  Publish Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Submit Quotation Modal */}
      {isQuoteModalOpen && selectedRfqForQuote && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-stone-900">
              Submit Landed-Cost Quotation for RFQ: {selectedRfqForQuote.rfq_number}
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              Itemize tooling, printing plates, and freight to calculate net cost with 18% GST.
            </p>

            <form onSubmit={handleQuoteSubmit} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    required
                    value={quoteQuantity}
                    onChange={(e) => setQuoteQuantity(e.target.value)}
                    className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 bg-stone-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Unit Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={quoteUnitPrice}
                    onChange={(e) => setQuoteUnitPrice(e.target.value)}
                    className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 bg-stone-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Print Run Charges (₹)</label>
                  <input
                    type="number"
                    value={quotePrintCharge}
                    onChange={(e) => setQuotePrintCharge(e.target.value)}
                    className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 bg-stone-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Plate / Cylinder Tooling (₹)</label>
                  <input
                    type="number"
                    value={quotePlateCharge}
                    onChange={(e) => setQuotePlateCharge(e.target.value)}
                    className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 bg-stone-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Freight Charges (₹)</label>
                  <input
                    type="number"
                    value={quoteFreightCharge}
                    onChange={(e) => setQuoteFreightCharge(e.target.value)}
                    className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 bg-stone-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Lead Time (Days)</label>
                  <input
                    type="number"
                    value={quoteLeadDays}
                    onChange={(e) => setQuoteLeadDays(e.target.value)}
                    className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 bg-stone-50"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsQuoteModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-900 text-white font-bold rounded-lg text-xs hover:bg-blue-800"
                >
                  Send Quotation to Buyer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackagingSupplierDashboardPage;
