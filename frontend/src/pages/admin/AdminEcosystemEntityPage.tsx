import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  Factory,
  Building2,
  Truck,
  Search,
  ShieldCheck,
  Package,
  FileText,
  ShoppingBag,
  MapPin,
  Eye,
  X,
  CheckCircle2,
  RefreshCw,
  Award,
  Layers,
  Tag,
  AlertCircle,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export type EcosystemEntityType = "manufacturer" | "wholesaler" | "distributor";

interface TabDef {
  key: string;
  label: string;
}

const ENTITY_CONFIG: Record<
  EcosystemEntityType,
  {
    title: string;
    subtitle: string;
    singular: string;
    tabs: TabDef[];
  }
> = {
  manufacturer: {
    title: "Manufacturer Management",
    subtitle: "Manage verified factories, manufacturing capabilities, production capacity, products, enquiries & orders.",
    singular: "Manufacturer",
    tabs: [
      { key: "all", label: "All Manufacturers" },
      { key: "profiles", label: "Factory Profiles" },
      { key: "verification", label: "Factory Verification" },
      { key: "products", label: "Manufacturer Products" },
      { key: "capabilities", label: "Capabilities & Capacity" },
      { key: "enquiries", label: "Manufacturing Enquiries" },
      { key: "orders", label: "Manufacturing Orders" },
    ],
  },
  wholesaler: {
    title: "Wholesaler Management",
    subtitle: "Manage wholesale businesses, bulk product catalogues, MOQ pricing tiers, RFQs & wholesale orders.",
    singular: "Wholesaler",
    tabs: [
      { key: "all", label: "All Wholesalers" },
      { key: "businesses", label: "Wholesale Businesses" },
      { key: "catalogue", label: "Product Catalogue" },
      { key: "offers", label: "Wholesale Offers & MOQ" },
      { key: "rfqs", label: "Wholesaler RFQs" },
      { key: "orders", label: "Wholesale Orders" },
    ],
  },
  distributor: {
    title: "Distributor Management",
    subtitle: "Manage authorized distributors, brand authorizations, distribution territories, dealer offers & orders.",
    singular: "Distributor",
    tabs: [
      { key: "all", label: "All Distributors" },
      { key: "brands", label: "Brand & Auth Docs" },
      { key: "territories", label: "Distribution Territories" },
      { key: "dealers", label: "Dealer Offers" },
      { key: "orders", label: "Distributor Orders" },
    ],
  },
};

export const AdminEcosystemEntityPage: React.FC<{ entityType: EcosystemEntityType }> = ({
  entityType,
}) => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const cfg = ENTITY_CONFIG[entityType];

  const activeTab = searchParams.get("tab") || cfg.tabs[0].key;
  const [search, setSearch] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBiz, setSelectedBiz] = useState<any | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const getHeaders = () => ({
    "Content-Type": "application/json",
    "x-user-id": user?.id || localStorage.getItem("coverly_user_id") || "",
  });

  const loadEcosystem = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (verificationFilter !== "all") params.set("verification", verificationFilter);

      const res = await fetch(`${API_BASE}/admin/ecosystem/${entityType}?${params.toString()}`, {
        headers: getHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error(`Failed to load ${entityType} management data`, err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEcosystem();
  }, [entityType, verificationFilter]);

  const handleQuickVerify = async (businessId: string, level: string) => {
    setUpdatingId(businessId);
    try {
      const res = await fetch(`${API_BASE}/admin/businesses/${businessId}/status`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({
          verification_level: level,
          notes: `Updated ${entityType} verification level from Admin Control Center`,
        }),
      });
      const json = await res.json();
      if (json.success) {
        loadEcosystem();
        if (selectedBiz?.id === businessId) {
          setSelectedBiz({ ...selectedBiz, verification_level: level });
        }
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const setTab = (key: string) => {
    setSearchParams({ tab: key });
  };

  const stats = data?.stats || {
    total: 0,
    verified: 0,
    pendingVerification: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRfqs: 0,
    totalTerritories: 0,
    totalOffers: 0,
  };

  const businesses: any[] = data?.businesses || [];
  const products: any[] = data?.products || [];
  const orders: any[] = data?.orders || [];
  const rfqs: any[] = data?.rfqs || [];
  const verifications: any[] = data?.verifications || [];
  const territories: any[] = data?.territories || [];
  const distributorOffers: any[] = data?.distributorOffers || [];

  const HeaderIcon =
    entityType === "manufacturer" ? Factory : entityType === "wholesaler" ? Building2 : Truck;

  const formatVerificationBadge = (level?: string) => {
    if (!level || level === "unverified") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <AlertCircle className="w-3 h-3" /> Unverified
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 capitalize">
        <CheckCircle2 className="w-3 h-3" /> {level.replace(/_/g, " ")}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-stone-900 text-amber-400 flex items-center justify-center shrink-0">
            <HeaderIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-stone-900 tracking-tight">{cfg.title}</h1>
            <p className="text-xs text-stone-500 mt-0.5">{cfg.subtitle}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={loadEcosystem}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold shadow-2xs self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh Data
        </button>
      </div>

      {/* Live KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <div className="text-[10px] font-bold uppercase text-stone-400">Total {cfg.singular}s</div>
          <div className="text-xl font-extrabold text-stone-900 mt-1">{stats.total}</div>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <div className="text-[10px] font-bold uppercase text-emerald-600">Verified</div>
          <div className="text-xl font-extrabold text-emerald-700 mt-1">{stats.verified}</div>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <div className="text-[10px] font-bold uppercase text-amber-600">Pending KYC</div>
          <div className="text-xl font-extrabold text-amber-700 mt-1">{stats.pendingVerification}</div>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <div className="text-[10px] font-bold uppercase text-stone-400">Catalogue Items</div>
          <div className="text-xl font-extrabold text-stone-900 mt-1">{stats.totalProducts}</div>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <div className="text-[10px] font-bold uppercase text-stone-400">Orders</div>
          <div className="text-xl font-extrabold text-stone-900 mt-1">{stats.totalOrders}</div>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <div className="text-[10px] font-bold uppercase text-stone-400">
            {entityType === "distributor" ? "Territories" : "Active RFQs"}
          </div>
          <div className="text-xl font-extrabold text-stone-900 mt-1">
            {entityType === "distributor" ? stats.totalTerritories : stats.totalRfqs}
          </div>
        </div>
      </div>

      {/* Sub-module Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-stone-200">
        {cfg.tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-3 py-2 rounded-t-lg text-xs font-semibold whitespace-nowrap transition ${
              activeTab === t.key
                ? "bg-stone-900 text-white"
                : "text-stone-600 hover:bg-stone-200/70 hover:text-stone-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      {(activeTab === "all" ||
        activeTab === "profiles" ||
        activeTab === "businesses" ||
        activeTab === "capabilities") && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadEcosystem();
          }}
          className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl border border-stone-200"
        >
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Search ${entityType} name...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-800"
            />
          </div>
          <select
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none"
          >
            <option value="all">All Verification Statuses</option>
            <option value="unverified">Unverified</option>
            <option value="document_verified">Document Verified</option>
            <option value="factory_verified">Factory / Site Verified</option>
            <option value="enterprise_verified">Enterprise Verified</option>
          </select>
          <button
            type="submit"
            className="px-4 py-1.5 rounded-lg bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800"
          >
            Apply Filter
          </button>
        </form>
      )}

      {/* Main Tab Content */}
      {isLoading ? (
        <div className="bg-white border border-stone-200 rounded-xl p-12 text-center text-xs text-stone-500">
          Loading live {cfg.singular.toLowerCase()} records from database...
        </div>
      ) : activeTab === "products" || activeTab === "catalogue" || activeTab === "offers" ? (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-stone-100 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-2">
              <Package className="w-4 h-4 text-stone-700" />
              {cfg.singular} Product Catalogue & MOQ Pricing ({products.length})
            </h2>
            <Link to="/admin/products" className="text-xs font-semibold text-amber-800 hover:underline">
              Open Full Product Moderation &rarr;
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">{cfg.singular}</th>
                  <th className="px-4 py-3 font-semibold">MOQ</th>
                  <th className="px-4 py-3 font-semibold">Indicative Price</th>
                  <th className="px-4 py-3 font-semibold">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-stone-500">
                      No published {entityType} products found yet.
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr key={p.id} className="hover:bg-stone-50/70">
                      <td className="px-4 py-3 font-semibold text-stone-900">{p.title}</td>
                      <td className="px-4 py-3 text-stone-600">{p.businesses?.name || "—"}</td>
                      <td className="px-4 py-3 font-mono text-stone-700">
                        {p.moq || 1} {p.unit || "units"}
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-stone-900">
                        {p.indicative_price ? `₹${Number(p.indicative_price).toLocaleString("en-IN")}` : "Quote"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                            p.is_active
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {p.moderation_status || (p.is_active ? "published" : "pending")}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === "verification" || activeTab === "brands" ? (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-stone-100 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              Verification & Authorization Documents ({verifications.length})
            </h2>
            <Link to="/admin/verifications" className="text-xs font-semibold text-amber-800 hover:underline">
              Open Verification Queue &rarr;
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">Business</th>
                  <th className="px-4 py-3 font-semibold">Document Type</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {verifications.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-stone-500">
                      No verification submissions found for {entityType}s.
                    </td>
                  </tr>
                ) : (
                  verifications.map((v) => (
                    <tr key={v.id} className="hover:bg-stone-50/70">
                      <td className="px-4 py-3 font-semibold text-stone-900">
                        {v.businesses?.name || v.business_id}
                      </td>
                      <td className="px-4 py-3 text-stone-700 capitalize">
                        {String(v.document_type || "KYC").replace(/_/g, " ")}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-800 capitalize">
                          {v.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-stone-500">
                        {v.created_at ? new Date(v.created_at).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === "territories" ? (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-stone-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-700" />
              Authorized Distribution Territories ({territories.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">Distributor</th>
                  <th className="px-4 py-3 font-semibold">Region / State</th>
                  <th className="px-4 py-3 font-semibold">Coverage</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {territories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-stone-500">
                      No distribution territories configured yet.
                    </td>
                  </tr>
                ) : (
                  territories.map((t) => (
                    <tr key={t.id} className="hover:bg-stone-50/70">
                      <td className="px-4 py-3 font-semibold text-stone-900">
                        {t.businesses?.name || t.business_id}
                      </td>
                      <td className="px-4 py-3 text-stone-700">{t.state || t.region || "Pan-India"}</td>
                      <td className="px-4 py-3 text-stone-600">{t.city || t.pincode_range || "Regional"}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                          {t.is_active === false ? "Inactive" : "Active"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === "dealers" ? (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-stone-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-2">
              <Tag className="w-4 h-4 text-amber-700" />
              Distributor & Dealer Product Offers ({distributorOffers.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">Offer / Product</th>
                  <th className="px-4 py-3 font-semibold">Distributor</th>
                  <th className="px-4 py-3 font-semibold">Unit Price</th>
                  <th className="px-4 py-3 font-semibold">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {distributorOffers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-stone-500">
                      No distributor offers recorded yet.
                    </td>
                  </tr>
                ) : (
                  distributorOffers.map((o) => (
                    <tr key={o.id} className="hover:bg-stone-50/70">
                      <td className="px-4 py-3 font-semibold text-stone-900">{o.title || o.product_name || o.id}</td>
                      <td className="px-4 py-3 text-stone-700">{o.businesses?.name || o.business_id}</td>
                      <td className="px-4 py-3 font-mono font-semibold text-stone-900">
                        {o.unit_price ? `₹${Number(o.unit_price).toLocaleString("en-IN")}` : "—"}
                      </td>
                      <td className="px-4 py-3 capitalize">{o.moderation_status || "pending"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === "enquiries" || activeTab === "rfqs" ? (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-stone-100 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-700" />
              Ecosystem Enquiries & RFQs ({rfqs.length})
            </h2>
            <Link to="/admin/rfqs" className="text-xs font-semibold text-amber-800 hover:underline">
              Open Full RFQ Command &rarr;
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">RFQ #</th>
                  <th className="px-4 py-3 font-semibold">Requirement</th>
                  <th className="px-4 py-3 font-semibold">Delivery City</th>
                  <th className="px-4 py-3 font-semibold">Budget</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {rfqs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-stone-500">
                      No RFQs recorded yet.
                    </td>
                  </tr>
                ) : (
                  rfqs.map((r) => (
                    <tr key={r.id} className="hover:bg-stone-50/70">
                      <td className="px-4 py-3 font-mono font-semibold text-stone-900">
                        {r.rfq_number || r.id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 font-medium text-stone-800">{r.title}</td>
                      <td className="px-4 py-3 text-stone-600">{r.delivery_city || "—"}</td>
                      <td className="px-4 py-3 font-mono">
                        {r.target_budget ? `₹${Number(r.target_budget).toLocaleString("en-IN")}` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-800 capitalize">
                          {String(r.status || "submitted").replace(/_/g, " ")}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === "orders" ? (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-stone-100 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-700" />
              {cfg.singular} Orders ({orders.length})
            </h2>
            <Link to="/admin/orders" className="text-xs font-semibold text-amber-800 hover:underline">
              Open All Orders &rarr;
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">Order #</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-stone-500">
                      No {entityType} orders placed yet.
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o.id} className="hover:bg-stone-50/70">
                      <td className="px-4 py-3 font-mono font-semibold text-stone-900">
                        {o.order_number || o.id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-stone-900">
                        ₹{Number(o.total_amount || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-800 capitalize">
                          {String(o.status || "pending").replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-stone-500">
                        {o.created_at ? new Date(o.created_at).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Businesses / Profiles / Capabilities Directory Table */
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-stone-100 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-2">
              <Layers className="w-4 h-4 text-stone-700" />
              Registered {cfg.singular} Directory ({businesses.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">Business Name</th>
                  <th className="px-4 py-3 font-semibold">Location</th>
                  <th className="px-4 py-3 font-semibold">GST / Registration</th>
                  <th className="px-4 py-3 font-semibold">Verification</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {businesses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-stone-500">
                      No {entityType} businesses registered in the database yet.
                    </td>
                  </tr>
                ) : (
                  businesses.map((b) => (
                    <tr key={b.id} className="hover:bg-stone-50/70">
                      <td className="px-4 py-3">
                        <div className="font-bold text-stone-900">{b.name}</div>
                        <div className="text-[11px] text-stone-500 truncate max-w-xs">
                          {b.description || b.industry || cfg.singular}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-stone-600">
                        {[b.city, b.state].filter(Boolean).join(", ") || "India"}
                      </td>
                      <td className="px-4 py-3 font-mono text-stone-700">
                        {b.gst_number || b.gstin || "Not Provided"}
                      </td>
                      <td className="px-4 py-3">{formatVerificationBadge(b.verification_level)}</td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => setSelectedBiz(b)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold transition"
                        >
                          <Eye className="w-3.5 h-3.5" /> Inspect
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Business Inspection & Governance Drawer */}
      {selectedBiz && (
        <div className="fixed inset-0 z-50 bg-stone-950/50 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl p-6 space-y-5">
            <div className="flex items-start justify-between border-b border-stone-200 pb-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                  {cfg.singular} Governance Profile
                </div>
                <h3 className="text-lg font-bold text-stone-900 mt-0.5">{selectedBiz.name}</h3>
                <p className="text-xs text-stone-500">
                  {[selectedBiz.city, selectedBiz.state, selectedBiz.country].filter(Boolean).join(", ")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBiz(null)}
                className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <div className="text-[10px] font-bold uppercase text-stone-400">Verification Status</div>
                <div className="mt-1">{formatVerificationBadge(selectedBiz.verification_level)}</div>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <div className="text-[10px] font-bold uppercase text-stone-400">GSTIN / Tax ID</div>
                <div className="mt-1 font-mono font-semibold text-stone-900">
                  {selectedBiz.gst_number || selectedBiz.gstin || "Not Submitted"}
                </div>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <div className="text-[10px] font-bold uppercase text-stone-400">Established / Size</div>
                <div className="mt-1 font-semibold text-stone-900">
                  {selectedBiz.year_established || "—"} • {selectedBiz.employee_count || "MSME"}
                </div>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <div className="text-[10px] font-bold uppercase text-stone-400">Registered On</div>
                <div className="mt-1 font-semibold text-stone-900">
                  {selectedBiz.created_at ? new Date(selectedBiz.created_at).toLocaleDateString() : "—"}
                </div>
              </div>
            </div>

            {selectedBiz.description && (
              <div className="text-xs text-stone-700 bg-stone-50 p-3.5 rounded-xl border border-stone-200">
                <div className="text-[10px] font-bold uppercase text-stone-400 mb-1">Business Overview</div>
                {selectedBiz.description}
              </div>
            )}

            <div className="border-t border-stone-200 pt-4 space-y-3">
              <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-600" />
                Update Verification Level
              </div>
              <div className="flex flex-wrap gap-2">
                {["unverified", "document_verified", "factory_verified", "enterprise_verified"].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    disabled={updatingId === selectedBiz.id}
                    onClick={() => handleQuickVerify(selectedBiz.id, lvl)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition capitalize ${
                      selectedBiz.verification_level === lvl
                        ? "bg-stone-900 text-white border-stone-900"
                        : "bg-white hover:bg-stone-50 text-stone-700 border-stone-200"
                    }`}
                  >
                    {lvl.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
