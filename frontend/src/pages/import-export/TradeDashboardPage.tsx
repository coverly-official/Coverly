import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Globe,
  Building2,
  Package,
  Layers,
  FileText,
  Ship,
  Anchor,
  Plus,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  Eye,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  ChevronRight,
  ArrowRight,
  Filter,
  Check,
  Upload,
  Calendar,
  Truck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  TradeParty,
  InternationalProduct,
  TradeOrder,
  TradeCategory,
  TradeIncoterm,
  TradeCurrency,
  TradeOrderStatus,
} from "../../types";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

const ORDER_LIFECYCLE_STEPS: Array<{ key: TradeOrderStatus; label: string }> = [
  { key: "order_confirmed", label: "Confirmed" },
  { key: "production_procurement", label: "Production" },
  { key: "ready_for_dispatch", label: "Ready" },
  { key: "export_documentation", label: "Docs Prep" },
  { key: "customs_processing", label: "Export Customs" },
  { key: "shipment_booked", label: "Vessel Booked" },
  { key: "in_transit", label: "In Transit (Ocean/Air)" },
  { key: "arrived_at_destination", label: "Arrived Port" },
  { key: "import_customs_processing", label: "Import Clearance" },
  { key: "delivered", label: "Delivered" },
  { key: "completed", label: "Completed" },
];

export const TradeDashboardPage: React.FC = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<"overview" | "catalog" | "rfqs" | "orders" | "documents">("overview");
  const [profile, setProfile] = useState<TradeParty | null>(null);
  const [stats, setStats] = useState<any>({
    total_products: 0,
    open_rfqs: 0,
    submitted_quotes: 0,
    active_orders: 0,
    completed_orders: 0,
  });
  const [products, setProducts] = useState<InternationalProduct[]>([]);
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [orders, setOrders] = useState<TradeOrder[]>([]);
  const [categories, setCategories] = useState<TradeCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Onboarding Form State (for unregistered users)
  const [legalName, setLegalName] = useState("");
  const [partyType, setPartyType] = useState<"importer" | "exporter" | "importer_exporter">("importer_exporter");
  const [iecCode, setIecCode] = useState("");
  const [adCode, setAdCode] = useState("");
  const [gstin, setGstin] = useState("");
  const [portsInput, setPortsInput] = useState("Nhava Sheva (JNPT), Mundra Port");
  const [marketsInput, setMarketsInput] = useState("United Arab Emirates, Saudi Arabia, Germany, USA");
  const [headline, setHeadline] = useState("");
  const [isOnboardingSubmitting, setIsOnboardingSubmitting] = useState(false);
  const [onboardingError, setOnboardingError] = useState("");

  // Add Product Modal
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [pName, setPName] = useState("");
  const [pCategory, setPCategory] = useState("");
  const [pHsCode, setPHsCode] = useState("");
  const [pUnit, setPUnit] = useState("metric_ton");
  const [pMoq, setPMoq] = useState("20");
  const [pCurrency, setPCurrency] = useState<TradeCurrency>("USD");
  const [pFobPrice, setPFobPrice] = useState("850");
  const [pIncoterm, setPIncoterm] = useState<TradeIncoterm>("FOB");
  const [pPort, setPPort] = useState("Nhava Sheva (JNPT), India");
  const [pDescription, setPDescription] = useState("");

  // Build Quote Modal
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [selectedRfq, setSelectedRfq] = useState<any | null>(null);
  const [qUnitPrice, setQUnitPrice] = useState("950");
  const [qQuantity, setQQuantity] = useState("20");
  const [qCurrency, setQCurrency] = useState<TradeCurrency>("USD");
  const [qIncoterm, setQIncoterm] = useState<TradeIncoterm>("CIF");
  const [qPortLoading, setQPortLoading] = useState("Nhava Sheva (JNPT), India");
  const [qPortDischarge, setQPortDischarge] = useState("Jebel Ali Port, UAE");
  const [qInlandFreight, setQInlandFreight] = useState("450");
  const [qOceanFreight, setQOceanFreight] = useState("1200");
  const [qInsurance, setQInsurance] = useState("180");
  const [qCustomsDoc, setQCustomsDoc] = useState("250");
  const [qPaymentTerms, setQPaymentTerms] = useState("30% Advance TT, 70% against BL copy");
  const [qLeadDays, setQLeadDays] = useState("15");
  const [qTransitDays, setQTransitDays] = useState("7");

  // Update Order Status Modal
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<TradeOrder | null>(null);
  const [newStatus, setNewStatus] = useState<TradeOrderStatus>("in_transit");
  const [containerNo, setContainerNo] = useState("");
  const [blAwbNo, setBlAwbNo] = useState("");
  const [shippingLine, setShippingLine] = useState("");
  const [vesselName, setVesselName] = useState("");
  const [statusNote, setStatusNote] = useState("");

  // Upload Document Modal
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docOrderId, setDocOrderId] = useState("");
  const [docType, setDocType] = useState("bill_of_lading");
  const [docName, setDocName] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [docAuthority, setDocAuthority] = useState("");

  // Helper auth headers
  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    ...(user ? { "x-user-id": user.id } : {}),
  });

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // 1. Categories
      const catRes = await fetch(`${API_BASE}/import-export/categories`);
      if (catRes.ok) {
        const catJson = await catRes.json();
        if (catJson.success && catJson.data) {
          setCategories(catJson.data);
          if (catJson.data.length > 0 && !pCategory) {
            setPCategory(catJson.data[0].id);
          }
        }
      }

      if (!user) {
        setIsLoading(false);
        return;
      }

      const headers = getAuthHeaders();

      // 2. Profile
      const profRes = await fetch(`${API_BASE}/import-export/profile`, { headers });
      if (profRes.ok) {
        const profJson = await profRes.json();
        if (profJson.success && profJson.data) {
          setProfile(profJson.data);

          // 3. Stats, Products, RFQs, Orders
          const [statsRes, prodsRes, rfqsRes, ordsRes] = await Promise.all([
            fetch(`${API_BASE}/import-export/stats`, { headers }),
            fetch(`${API_BASE}/import-export/my-products`, { headers }),
            fetch(`${API_BASE}/import-export/my-rfqs`, { headers }),
            fetch(`${API_BASE}/import-export/my-orders`, { headers }),
          ]);

          if (statsRes.ok) {
            const sj = await statsRes.json();
            if (sj.success) setStats(sj.data);
          }
          if (prodsRes.ok) {
            const pj = await prodsRes.json();
            if (pj.success) setProducts(pj.data);
          }
          if (rfqsRes.ok) {
            const rj = await rfqsRes.json();
            if (rj.success) setRfqs(rj.data);
          }
          if (ordsRes.ok) {
            const oj = await ordsRes.json();
            if (oj.success) setOrders(oj.data);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  // Handle Onboarding Trader Registration
  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOnboardingError("");
    if (!legalName.trim()) {
      setOnboardingError("Please enter your legal business name.");
      return;
    }

    setIsOnboardingSubmitting(true);
    try {
      const payload = {
        legal_business_name: legalName.trim(),
        party_type: partyType,
        country_code: "IN",
        country_name: "India",
        iec_code: iecCode.trim() || undefined,
        authorized_dealer_code: adCode.trim() || undefined,
        gstin: gstin.trim() || undefined,
        headline: headline.trim() || undefined,
        primary_loading_ports: portsInput.split(",").map((s) => s.trim()).filter(Boolean),
        export_markets: marketsInput.split(",").map((s) => s.trim()).filter(Boolean),
      };

      const res = await fetch(`${API_BASE}/import-export/register`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to register trade profile.");
      }

      await loadDashboardData();
    } catch (err: any) {
      setOnboardingError(err.message || "An error occurred during trade onboarding.");
    } finally {
      setIsOnboardingSubmitting(false);
    }
  };

  // Handle Create Product
  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: pName.trim(),
        category_id: pCategory,
        hs_code: pHsCode.trim() || undefined,
        unit_of_measurement: pUnit,
        moq: parseFloat(pMoq) || 1,
        currency: pCurrency,
        base_price_fob: parseFloat(pFobPrice) || 100,
        incoterm_basis: pIncoterm,
        loading_port: pPort.trim(),
        description: pDescription.trim() || undefined,
      };

      const res = await fetch(`${API_BASE}/import-export/products`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsAddProductOpen(false);
        setPName("");
        setPHsCode("");
        setPDescription("");
        await loadDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Submit Quote
  const handleBuildQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRfq) return;

    try {
      const payload = {
        rfq_id: selectedRfq.id || selectedRfq.rfq_id,
        quantity: parseFloat(qQuantity),
        unit: selectedRfq.unit || "metric_ton",
        currency: qCurrency,
        unit_price: parseFloat(qUnitPrice),
        incoterm: qIncoterm,
        named_port_of_loading: qPortLoading,
        named_port_of_discharge: qPortDischarge,
        inland_freight: parseFloat(qInlandFreight) || 0,
        international_ocean_air_freight: parseFloat(qOceanFreight) || 0,
        marine_transit_insurance: parseFloat(qInsurance) || 0,
        customs_documentation_charges: parseFloat(qCustomsDoc) || 0,
        payment_terms: qPaymentTerms,
        production_dispatch_lead_days: parseInt(qLeadDays, 10) || 15,
        estimated_ocean_transit_days: parseInt(qTransitDays, 10) || 7,
      };

      const res = await fetch(`${API_BASE}/import-export/quotations`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsQuoteModalOpen(false);
        setSelectedRfq(null);
        await loadDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Update Order Status
  const handleUpdateOrderStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      const payload = {
        order_status: newStatus,
        container_numbers: containerNo ? [containerNo.trim()] : undefined,
        bl_awb_number: blAwbNo.trim() || undefined,
        shipping_line_airline: shippingLine.trim() || undefined,
        vessel_flight_details: vesselName.trim() || undefined,
        note: statusNote.trim() || undefined,
      };

      const res = await fetch(`${API_BASE}/import-export/orders/${selectedOrder.id}/status`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsStatusModalOpen(false);
        setSelectedOrder(null);
        await loadDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Document Upload
  const handleUploadDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docOrderId || !docName.trim() || !docUrl.trim()) return;

    try {
      const payload = {
        document_type: docType,
        document_name: docName.trim(),
        document_number: docNumber.trim() || undefined,
        file_url: docUrl.trim(),
        issuing_authority: docAuthority.trim() || undefined,
      };

      const res = await fetch(`${API_BASE}/import-export/orders/${docOrderId}/documents`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsDocModalOpen(false);
        setDocName("");
        setDocUrl("");
        setDocNumber("");
        await loadDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[#FAF9F5] min-h-screen py-20 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-stone-300 border-t-amber-500 mb-3" />
        <p className="text-xs text-stone-500">Connecting to International Trade Portal...</p>
      </div>
    );
  }

  // Not Logged In View
  if (!user) {
    return (
      <div className="bg-[#FAF9F5] min-h-screen py-16 px-4">
        <div className="max-w-md mx-auto bg-white border border-stone-200 rounded-2xl p-8 text-center shadow-sm">
          <Globe className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-xl font-black text-stone-900">Sign In to Trader Portal</h2>
          <p className="text-xs text-stone-600 mt-2">
            Access your cross-border export catalog, incoming buyer RFQs, live 16-stage shipment trackers, and customs documentation repository.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              to="/auth/login"
              className="w-full py-2.5 px-4 text-xs font-bold rounded-lg bg-amber-500 text-stone-950 hover:bg-amber-400 transition-colors"
            >
              Sign In to Your Account
            </Link>
            <Link
              to="/auth/register"
              className="w-full py-2.5 px-4 text-xs font-semibold rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 transition-colors"
            >
              Register New Trade Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Trader Registration / Onboarding View (if profile is null)
  if (!profile) {
    return (
      <div className="bg-[#FAF9F5] min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto bg-white border border-stone-200 rounded-2xl p-8 shadow-sm">
          <div className="pb-6 border-b border-stone-200">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                Trader Onboarding
              </span>
              <span className="text-xs text-stone-500 font-mono">DGFT / Customs Registration</span>
            </div>
            <h1 className="text-2xl font-black text-stone-900 mt-2">
              Register as Importer or Exporter
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              Set up your international trade profile to publish export products, submit FOB/CIF quotations, and process cross-border shipments.
            </p>
          </div>

          {onboardingError && (
            <div className="my-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{onboardingError}</span>
            </div>
          )}

          <form onSubmit={handleOnboardingSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs text-stone-600 block mb-1 font-medium">
                Legal Company / Enterprise Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Apex Global Exports Private Limited"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs text-stone-600 block mb-1 font-medium">
                Trade Role *
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPartyType("exporter")}
                  className={`p-2.5 rounded-lg border text-center text-xs font-semibold transition-all ${
                    partyType === "exporter"
                      ? "border-amber-500 bg-amber-50 text-amber-900 font-bold"
                      : "border-stone-200 text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  Exporter
                </button>
                <button
                  type="button"
                  onClick={() => setPartyType("importer")}
                  className={`p-2.5 rounded-lg border text-center text-xs font-semibold transition-all ${
                    partyType === "importer"
                      ? "border-amber-500 bg-amber-50 text-amber-900 font-bold"
                      : "border-stone-200 text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  Importer
                </button>
                <button
                  type="button"
                  onClick={() => setPartyType("importer_exporter")}
                  className={`p-2.5 rounded-lg border text-center text-xs font-semibold transition-all ${
                    partyType === "importer_exporter"
                      ? "border-amber-500 bg-amber-50 text-amber-900 font-bold"
                      : "border-stone-200 text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  Both (Dual Role)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-stone-600 block mb-1 font-medium">
                  DGFT Importer-Exporter Code (IEC)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 0312045678"
                  value={iecCode}
                  onChange={(e) => setIecCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-stone-600 block mb-1 font-medium">
                  Authorized Dealer (AD) Bank Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. 6421098"
                  value={adCode}
                  onChange={(e) => setAdCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-stone-600 block mb-1 font-medium">
                  Primary Loading Ports (POL)
                </label>
                <input
                  type="text"
                  placeholder="Nhava Sheva, Mundra Port"
                  value={portsInput}
                  onChange={(e) => setPortsInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs text-stone-600 block mb-1 font-medium">
                  Target Export Markets / Sourcing Countries
                </label>
                <input
                  type="text"
                  placeholder="UAE, Saudi Arabia, Germany, USA"
                  value={marketsInput}
                  onChange={(e) => setMarketsInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-stone-600 block mb-1 font-medium">
                Business Tagline / Specialty
              </label>
              <input
                type="text"
                placeholder="e.g. Premium Basmati Rice Exporter & Bulk Agro Commodites Specialist"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            <div className="pt-4 border-t border-stone-200 flex justify-end">
              <button
                type="submit"
                disabled={isOnboardingSubmitting}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-amber-500 text-stone-950 font-bold hover:bg-amber-400 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isOnboardingSubmitting ? "Registering..." : "Complete Trader Setup"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Active Dashboard View
  const biz = profile.businesses;
  const isExporter = profile.party_type === "exporter" || profile.party_type === "importer_exporter";

  return (
    <div className="bg-[#FAF9F5] min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-stone-500 mb-4">
          <Link to="/" className="hover:text-stone-900">Home</Link>
          <ChevronRight className="w-3 h-3 text-stone-400" />
          <Link to="/import-export" className="hover:text-stone-900">Import & Export</Link>
          <ChevronRight className="w-3 h-3 text-stone-400" />
          <span className="font-semibold text-stone-800">Trader Workspace</span>
        </div>

        {/* Profile Ribbon */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                {profile.party_type === "importer_exporter" ? "Importer & Exporter" : isExporter ? "Exporter" : "Importer"}
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                profile.verification_status === "verified"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}>
                {profile.verification_status === "verified" ? "Verified Trader" : "Verification Pending"}
              </span>
              <span className="font-mono text-xs text-stone-600 bg-stone-100 px-2 py-0.5 rounded">
                IEC: {profile.iec_code || "PENDING"}
              </span>
            </div>
            <h1 className="text-2xl font-black text-stone-900">
              {biz?.name || profile.headline || "Cross-Border Enterprise"}
            </h1>
            <p className="text-xs text-stone-500">
              Primary Loading: <span className="font-semibold text-stone-700">{profile.primary_loading_ports?.join(", ") || "Nhava Sheva / Mundra"}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isExporter && (
              <button
                onClick={() => setIsAddProductOpen(true)}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-amber-500 text-stone-950 hover:bg-amber-400 transition-colors shadow-sm flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add Export Product
              </button>
            )}
            <Link
              to={`/import-export/parties/${profile.id}`}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 transition-colors flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              Public Dossier
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 mb-6 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "overview"
                ? "border-amber-500 text-stone-900"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            Overview & Metrics
          </button>
          {isExporter && (
            <button
              onClick={() => setActiveTab("catalog")}
              className={`pb-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "catalog"
                  ? "border-amber-500 text-stone-900"
                  : "border-transparent text-stone-500 hover:text-stone-800"
              }`}
            >
              Export Catalog ({products.length})
            </button>
          )}
          <button
            onClick={() => setActiveTab("rfqs")}
            className={`pb-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "rfqs"
                ? "border-amber-500 text-stone-900"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            Trade RFQs Inbox ({rfqs.length})
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`pb-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "orders"
                ? "border-amber-500 text-stone-900"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            Orders & Shipments ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab("documents")}
            className={`pb-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "documents"
                ? "border-amber-500 text-stone-900"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            Customs & Shipping Docs
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
                <span className="text-xs text-stone-500 block">Catalog Products</span>
                <span className="text-2xl font-black text-stone-900 font-mono mt-1 block">
                  {stats.total_products || products.length}
                </span>
              </div>
              <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
                <span className="text-xs text-stone-500 block">Open Inquiries</span>
                <span className="text-2xl font-black text-amber-600 font-mono mt-1 block">
                  {stats.open_rfqs || rfqs.length}
                </span>
              </div>
              <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
                <span className="text-xs text-stone-500 block">Quotations Sent</span>
                <span className="text-2xl font-black text-stone-900 font-mono mt-1 block">
                  {stats.submitted_quotes || 0}
                </span>
              </div>
              <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
                <span className="text-xs text-stone-500 block">Active Shipments</span>
                <span className="text-2xl font-black text-blue-600 font-mono mt-1 block">
                  {stats.active_orders || orders.length}
                </span>
              </div>
              <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
                <span className="text-xs text-stone-500 block">Completed Deals</span>
                <span className="text-2xl font-black text-emerald-600 font-mono mt-1 block">
                  {stats.completed_orders || 0}
                </span>
              </div>
            </div>

            {/* Quick Actions & Corridors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-3">
                  Registered Trade Corridors
                </h3>
                <div className="space-y-3 text-xs text-stone-600">
                  <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                    <span className="text-stone-500 block mb-1">Loading Seaports & Air Hubs:</span>
                    <span className="font-semibold text-stone-800">
                      {profile.primary_loading_ports?.join(", ") || "Nhava Sheva (JNPT), Mundra"}
                    </span>
                  </div>
                  <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                    <span className="text-stone-500 block mb-1">Active Target Export Markets:</span>
                    <span className="font-semibold text-stone-800">
                      {profile.export_markets?.join(", ") || "GCC, European Union, North America"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-3">
                  Incoterms Compliance Support
                </h3>
                <p className="text-xs text-stone-600 mb-4 leading-relaxed">
                  Quotations submitted through COVERLY include transparent breakdowns of freight, transit insurance, and port documentation compliant with Incoterms® 2020.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {["FOB", "CIF", "CFR", "EXW", "DDP", "FCA"].map((inc) => (
                    <span key={inc} className="bg-amber-50 text-amber-900 text-xs px-2.5 py-1 rounded font-mono font-bold border border-amber-200">
                      {inc}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Export Catalog */}
        {activeTab === "catalog" && isExporter && (
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-900">Published International Products</h3>
              <button
                onClick={() => setIsAddProductOpen(true)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 text-stone-950 hover:bg-amber-400 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Product
              </button>
            </div>

            {products.length === 0 ? (
              <div className="p-8 text-center">
                <Package className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                <p className="text-xs text-stone-500">No products added yet. Click 'Add Product' to list your first commodity.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider border-b border-stone-200">
                    <tr>
                      <th className="p-3">Product / Commodity</th>
                      <th className="p-3">HS Code</th>
                      <th className="p-3">Base Price</th>
                      <th className="p-3">MOQ</th>
                      <th className="p-3">Port of Loading</th>
                      <th className="p-3">Moderation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-700">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-stone-50/50">
                        <td className="p-3 font-semibold text-stone-900">{p.name}</td>
                        <td className="p-3 font-mono text-stone-600">{p.hs_code || "—"}</td>
                        <td className="p-3 font-mono font-bold text-stone-900">
                          {p.currency} {p.base_price_fob.toLocaleString()} / {p.unit_of_measurement}
                        </td>
                        <td className="p-3">{p.moq} {p.unit_of_measurement}</td>
                        <td className="p-3 text-stone-600">{p.loading_port || "Nhava Sheva"}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            p.moderation_status === "approved"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}>
                            {p.moderation_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Trade RFQs Inbox */}
        {activeTab === "rfqs" && (
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-stone-200">
              <h3 className="text-sm font-bold text-stone-900">Matched Buyer Requirements & Inquiries</h3>
            </div>

            {rfqs.length === 0 ? (
              <div className="p-8 text-center">
                <Send className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                <p className="text-xs text-stone-500">No active buyer inquiries matching your categories currently.</p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {rfqs.map((item) => {
                  const rfq = item.trade_rfqs || item;
                  return (
                    <div key={item.id} className="p-5 hover:bg-stone-50/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-stone-900">{rfq.product_name}</span>
                          <span className="font-mono text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            {rfq.rfq_number}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                            {rfq.preferred_incoterm}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-stone-500 flex-wrap">
                          <span>Quantity: <strong className="text-stone-800">{rfq.required_quantity} {rfq.unit}</strong></span>
                          <span>•</span>
                          <span>Destination: <strong className="text-stone-800">{rfq.destination_port}, {rfq.destination_country}</strong></span>
                          {rfq.target_budget && (
                            <>
                              <span>•</span>
                              <span>Target: <strong className="text-stone-800">{rfq.target_currency} {rfq.target_budget}</strong></span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            setSelectedRfq(rfq);
                            setQQuantity(rfq.required_quantity.toString());
                            setQCurrency(rfq.target_currency || "USD");
                            setQPortDischarge(rfq.destination_port || "Destination Port");
                            setQIncoterm(rfq.preferred_incoterm || "CIF");
                            setIsQuoteModalOpen(true);
                          }}
                          className="px-4 py-2 text-xs font-bold rounded-lg bg-amber-500 text-stone-950 hover:bg-amber-400 transition-colors flex items-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Build Quotation
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Orders & Shipments (16-Stage Lifecycle) */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="bg-white border border-stone-200 rounded-xl p-8 text-center">
                <Ship className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                <p className="text-xs text-stone-500">No confirmed trade orders yet. Accepted quotations will appear here.</p>
              </div>
            ) : (
              orders.map((ord) => {
                const currentStageIdx = ORDER_LIFECYCLE_STEPS.findIndex((s) => s.key === ord.order_status);

                return (
                  <div key={ord.id} className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-stone-900">{ord.order_number}</span>
                          <span className="font-mono text-xs font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                            {ord.incoterm}
                          </span>
                        </div>
                        <div className="text-xs text-stone-500 mt-1">
                          {ord.port_of_loading} → {ord.port_of_discharge}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 justify-between sm:justify-end">
                        <div className="text-right">
                          <span className="text-[11px] text-stone-500 block">Total Contract Value</span>
                          <span className="font-mono font-black text-sm text-stone-900">
                            {ord.currency} {ord.total_amount?.toLocaleString()}
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedOrder(ord);
                            setNewStatus(ord.order_status);
                            setContainerNo(ord.container_numbers?.[0] || "");
                            setBlAwbNo(ord.bl_awb_number || "");
                            setShippingLine(ord.shipping_line_airline || "");
                            setVesselName(ord.vessel_flight_details || "");
                            setIsStatusModalOpen(true);
                          }}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-900 text-white hover:bg-stone-800 transition-colors"
                        >
                          Update Status
                        </button>
                      </div>
                    </div>

                    {/* Stepper Visual */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-bold text-stone-700 mb-2">
                        <span>Current Stage: <span className="uppercase text-amber-700">{ord.order_status.replace(/_/g, " ")}</span></span>
                        <span>{Math.max(0, currentStageIdx + 1)} / {ORDER_LIFECYCLE_STEPS.length} Milestones</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-6 lg:grid-cols-11 gap-1">
                        {ORDER_LIFECYCLE_STEPS.map((step, idx) => {
                          const isDone = currentStageIdx >= idx;
                          const isCurrent = currentStageIdx === idx;
                          return (
                            <div
                              key={step.key}
                              className={`p-1.5 rounded text-[10px] text-center font-medium border transition-colors ${
                                isCurrent
                                  ? "bg-amber-500 text-stone-950 font-bold border-amber-600"
                                  : isDone
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : "bg-stone-50 text-stone-400 border-stone-200"
                              }`}
                            >
                              {step.label}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Logistics Reference Data */}
                    {(ord.container_numbers?.length || ord.bl_awb_number || ord.shipping_line_airline) && (
                      <div className="bg-stone-50 p-3 rounded-lg border border-stone-200 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        {ord.container_numbers && ord.container_numbers.length > 0 && (
                          <div>
                            <span className="text-stone-500 block text-[11px]">Containers:</span>
                            <span className="font-mono font-bold text-stone-800">{ord.container_numbers.join(", ")}</span>
                          </div>
                        )}
                        {ord.bl_awb_number && (
                          <div>
                            <span className="text-stone-500 block text-[11px]">B/L or AWB No:</span>
                            <span className="font-mono font-bold text-stone-800">{ord.bl_awb_number}</span>
                          </div>
                        )}
                        {ord.shipping_line_airline && (
                          <div>
                            <span className="text-stone-500 block text-[11px]">Carrier / Vessel:</span>
                            <span className="font-semibold text-stone-800">{ord.shipping_line_airline} ({ord.vessel_flight_details || "Vessel"})</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 5: Customs & Shipping Documents */}
        {activeTab === "documents" && (
          <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-sm font-bold text-stone-900">Customs & Shipping Documents</h3>
                <p className="text-xs text-stone-500">Manage required cross-border clearance paperwork for customs authorities.</p>
              </div>
              <button
                onClick={() => {
                  if (orders.length > 0) setDocOrderId(orders[0].id);
                  setIsDocModalOpen(true);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-stone-900 text-white hover:bg-stone-800 transition-colors flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload Document
              </button>
            </div>

            {/* List of documents across orders */}
            {orders.flatMap((o) => o.trade_documents || []).length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                <p className="text-xs text-stone-500">No documents uploaded yet. Upload Bills of Lading, Commercial Invoices, or Certificates of Origin.</p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {orders.flatMap((o) => o.trade_documents || []).map((doc) => (
                  <div key={doc.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-amber-600 shrink-0" />
                      <div>
                        <span className="font-semibold text-xs text-stone-900 block">{doc.document_name}</span>
                        <span className="text-[11px] text-stone-500 font-mono">
                          Type: {doc.document_type} {doc.document_number ? `• No: ${doc.document_number}` : ""}
                        </span>
                      </div>
                    </div>
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 text-xs font-semibold text-stone-700 bg-stone-100 rounded hover:bg-stone-200"
                    >
                      View Document
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal: Add Product */}
        {isAddProductOpen && (
          <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <h3 className="text-base font-bold text-stone-900">Add International Product</h3>
                <button
                  onClick={() => setIsAddProductOpen(false)}
                  className="text-stone-400 hover:text-stone-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddProductSubmit} className="space-y-3">
                <div>
                  <label className="text-xs text-stone-600 block mb-1 font-medium">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={pName}
                    onChange={(e) => setPName(e.target.value)}
                    placeholder="e.g. 1121 Steam Basmati Rice"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-stone-600 block mb-1 font-medium">Category</label>
                    <select
                      value={pCategory}
                      onChange={(e) => setPCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 focus:outline-none bg-white"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-stone-600 block mb-1 font-medium">HS Code</label>
                    <input
                      type="text"
                      value={pHsCode}
                      onChange={(e) => setPHsCode(e.target.value)}
                      placeholder="e.g. 1006.30"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-stone-600 block mb-1 font-medium">Currency</label>
                    <select
                      value={pCurrency}
                      onChange={(e) => setPCurrency(e.target.value as TradeCurrency)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 bg-white font-mono font-bold"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="AED">AED (د.إ)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="INR">INR (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-stone-600 block mb-1 font-medium">Base Price (FOB)</label>
                    <input
                      type="number"
                      required
                      value={pFobPrice}
                      onChange={(e) => setPFobPrice(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-stone-600 block mb-1 font-medium">MOQ</label>
                    <input
                      type="number"
                      required
                      value={pMoq}
                      onChange={(e) => setPMoq(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-stone-600 block mb-1 font-medium">Unit</label>
                    <select
                      value={pUnit}
                      onChange={(e) => setPUnit(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 bg-white"
                    >
                      <option value="metric_ton">Metric Tons</option>
                      <option value="kg">Kilograms</option>
                      <option value="twenty_foot_container">20' Containers</option>
                      <option value="piece">Pieces</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-stone-600 block mb-1 font-medium">Port of Loading</label>
                    <input
                      type="text"
                      value={pPort}
                      onChange={(e) => setPPort(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-stone-600 block mb-1 font-medium">Description</label>
                  <textarea
                    rows={2}
                    value={pDescription}
                    onChange={(e) => setPDescription(e.target.value)}
                    placeholder="Product specifications, processing and packaging..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200"
                  />
                </div>

                <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddProductOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold rounded-lg bg-amber-500 text-stone-950 hover:bg-amber-400"
                  >
                    Publish Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Build Quotation */}
        {isQuoteModalOpen && selectedRfq && (
          <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <div>
                  <h3 className="text-base font-bold text-stone-900">Build Itemized Trade Quotation</h3>
                  <p className="text-xs text-stone-500">RFQ: {selectedRfq.rfq_number} • {selectedRfq.product_name}</p>
                </div>
                <button
                  onClick={() => setIsQuoteModalOpen(false)}
                  className="text-stone-400 hover:text-stone-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleBuildQuoteSubmit} className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-stone-600 block mb-1 font-medium">Currency</label>
                    <select
                      value={qCurrency}
                      onChange={(e) => setQCurrency(e.target.value as TradeCurrency)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 bg-white font-mono font-bold"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="AED">AED (د.إ)</option>
                      <option value="INR">INR (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-stone-600 block mb-1 font-medium">Unit Price</label>
                    <input
                      type="number"
                      required
                      value={qUnitPrice}
                      onChange={(e) => setQUnitPrice(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-stone-600 block mb-1 font-medium">Quantity</label>
                    <input
                      type="number"
                      required
                      value={qQuantity}
                      onChange={(e) => setQQuantity(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-stone-600 block mb-1 font-medium">Incoterm</label>
                    <select
                      value={qIncoterm}
                      onChange={(e) => setQIncoterm(e.target.value as TradeIncoterm)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 bg-white font-mono font-bold"
                    >
                      <option value="CIF">CIF (Cost, Insurance & Freight)</option>
                      <option value="FOB">FOB (Free On Board)</option>
                      <option value="CFR">CFR (Cost & Freight)</option>
                      <option value="EXW">EXW (Ex Works)</option>
                      <option value="DDP">DDP (Delivered Duty Paid)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-stone-600 block mb-1 font-medium">Discharge Port</label>
                    <input
                      type="text"
                      required
                      value={qPortDischarge}
                      onChange={(e) => setQPortDischarge(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200"
                    />
                  </div>
                </div>

                {/* Freight & Insurance Line Items */}
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                  <span className="text-[11px] font-bold uppercase text-stone-600 block">Itemized Shipping & Customs Charges ({qCurrency})</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <span className="text-[10px] text-stone-500 block">Ocean/Air Freight</span>
                      <input
                        type="number"
                        value={qOceanFreight}
                        onChange={(e) => setQOceanFreight(e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded border border-stone-200 font-mono bg-white"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 block">Inland Freight</span>
                      <input
                        type="number"
                        value={qInlandFreight}
                        onChange={(e) => setQInlandFreight(e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded border border-stone-200 font-mono bg-white"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 block">Marine Insurance</span>
                      <input
                        type="number"
                        value={qInsurance}
                        onChange={(e) => setQInsurance(e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded border border-stone-200 font-mono bg-white"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 block">Customs & Docs</span>
                      <input
                        type="number"
                        value={qCustomsDoc}
                        onChange={(e) => setQCustomsDoc(e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded border border-stone-200 font-mono bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsQuoteModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold rounded-lg bg-amber-500 text-stone-950 hover:bg-amber-400"
                  >
                    Transmit Quotation
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Update Order Status */}
        {isStatusModalOpen && selectedOrder && (
          <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <h3 className="text-base font-bold text-stone-900">Advance Shipment Lifecycle</h3>
                <button
                  onClick={() => setIsStatusModalOpen(false)}
                  className="text-stone-400 hover:text-stone-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdateOrderStatus} className="space-y-3">
                <div>
                  <label className="text-xs text-stone-600 block mb-1 font-medium">New Status Step</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as TradeOrderStatus)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 bg-white font-semibold"
                  >
                    {ORDER_LIFECYCLE_STEPS.map((s) => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-stone-600 block mb-1 font-medium">Container Number(s)</label>
                  <input
                    type="text"
                    placeholder="e.g. MSCU1234567, MEDU8901234"
                    value={containerNo}
                    onChange={(e) => setContainerNo(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs text-stone-600 block mb-1 font-medium">Bill of Lading / Air Waybill No</label>
                  <input
                    type="text"
                    placeholder="e.g. MAEU987654321"
                    value={blAwbNo}
                    onChange={(e) => setBlAwbNo(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-stone-600 block mb-1 font-medium">Shipping Line</label>
                    <input
                      type="text"
                      placeholder="e.g. Maersk / MSC"
                      value={shippingLine}
                      onChange={(e) => setShippingLine(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-stone-600 block mb-1 font-medium">Vessel / Voyage</label>
                    <input
                      type="text"
                      placeholder="e.g. MSC DIANA V.2401"
                      value={vesselName}
                      onChange={(e) => setVesselName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-stone-600 block mb-1 font-medium">Logistics Note</label>
                  <input
                    type="text"
                    placeholder="e.g. Vessel departed Nhava Sheva on schedule."
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200"
                  />
                </div>

                <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsStatusModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold rounded-lg bg-stone-900 text-white hover:bg-stone-800"
                  >
                    Save Status Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Upload Document */}
        {isDocModalOpen && (
          <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <h3 className="text-base font-bold text-stone-900">Upload Trade Document</h3>
                <button
                  onClick={() => setIsDocModalOpen(false)}
                  className="text-stone-400 hover:text-stone-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUploadDocumentSubmit} className="space-y-3">
                <div>
                  <label className="text-xs text-stone-600 block mb-1 font-medium">Order</label>
                  <select
                    value={docOrderId}
                    onChange={(e) => setDocOrderId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 bg-white font-mono"
                  >
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>{o.order_number}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-stone-600 block mb-1 font-medium">Document Type</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 bg-white"
                  >
                    <option value="bill_of_lading">Bill of Lading (B/L)</option>
                    <option value="commercial_invoice">Commercial Invoice</option>
                    <option value="packing_list">Packing List</option>
                    <option value="certificate_of_origin">Certificate of Origin (COO)</option>
                    <option value="shipping_bill">Shipping Bill</option>
                    <option value="bill_of_entry">Bill of Entry</option>
                    <option value="insurance_certificate">Marine Insurance Policy</option>
                    <option value="inspection_certificate">Inspection / SGS Certificate</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-stone-600 block mb-1 font-medium">Document Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Master Bill of Lading - Nhava Sheva to Jebel Ali"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-stone-600 block mb-1 font-medium">Document Number</label>
                    <input
                      type="text"
                      placeholder="e.g. BL-2026-981"
                      value={docNumber}
                      onChange={(e) => setDocNumber(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-stone-600 block mb-1 font-medium">Issuing Authority</label>
                    <input
                      type="text"
                      placeholder="e.g. Maersk Line India"
                      value={docAuthority}
                      onChange={(e) => setDocAuthority(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-stone-600 block mb-1 font-medium">File Storage URL *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://4vwfw2w8.ap-southeast.insforge.app/storage/..."
                    value={docUrl}
                    onChange={(e) => setDocUrl(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 font-mono"
                  />
                </div>

                <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDocModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold rounded-lg bg-stone-900 text-white hover:bg-stone-800"
                  >
                    Upload Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
