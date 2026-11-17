import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import {
  Globe,
  Send,
  Ship,
  Anchor,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  DollarSign,
  HelpCircle,
  FileText,
  Boxes,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { TradeCategory, TradeIncoterm, TradeCurrency } from "../../types";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

const INCOTERM_EXPLANATIONS: Record<TradeIncoterm, string> = {
  EXW: "Ex Works: Buyer handles transport & customs from seller factory.",
  FCA: "Free Carrier: Seller clears export & hands to carrier at named origin.",
  FOB: "Free On Board: Seller pays inland freight & loads cargo on board ship.",
  CFR: "Cost & Freight: Seller pays ocean freight to destination port.",
  CIF: "Cost, Insurance & Freight: Seller covers ocean freight & marine transit insurance to destination port.",
  CPT: "Carriage Paid To: Seller pays carriage to named place of destination.",
  CIP: "Carriage & Insurance Paid: Seller pays carriage & all-risks insurance.",
  DAP: "Delivered at Place: Seller delivers goods ready for unloading at buyer location.",
  DPU: "Delivered at Place Unloaded: Seller delivers and unloads at destination terminal.",
  DDP: "Delivered Duty Paid: Seller covers all shipping, customs duty & delivery to buyer doorstep.",
};

const BENCHMARK_RATES: Record<string, number> = {
  USD: 86.50,
  EUR: 91.20,
  AED: 23.55,
  GBP: 109.80,
  JPY: 0.56,
  CNY: 11.90,
  SGD: 64.20,
  INR: 1.00,
};

export const SubmitTradeRequirementPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const partyId = searchParams.get("party_id") || "";
  const partyName = searchParams.get("party_name") || "";
  const initialProduct = searchParams.get("product_name") || "";
  const initialDirection = (searchParams.get("direction") as "import" | "export") || "export";

  const [categories, setCategories] = useState<TradeCategory[]>([]);
  const [direction, setDirection] = useState<"import" | "export">(initialDirection);

  // Form State
  const [productName, setProductName] = useState(initialProduct);
  const [categoryId, setCategoryId] = useState("");
  const [hsCode, setHsCode] = useState("");
  const [preferredIncoterm, setPreferredIncoterm] = useState<TradeIncoterm>("CIF");
  const [originCountryPreference, setOriginCountryPreference] = useState(initialDirection === "export" ? "India" : "");
  const [destinationCountry, setDestinationCountry] = useState(initialDirection === "import" ? "India" : "United Arab Emirates");
  const [destinationPort, setDestinationPort] = useState("Jebel Ali Port (AE)");
  const [requiredQuantity, setRequiredQuantity] = useState("50");
  const [unit, setUnit] = useState("metric_ton");
  const [packagingPreference, setPackagingPreference] = useState("Export Standard Palletized Bags");
  const [targetCurrency, setTargetCurrency] = useState<TradeCurrency>("USD");
  const [targetBudget, setTargetBudget] = useState("1200");
  const [inspectionAgency, setInspectionAgency] = useState("SGS Pre-Shipment Inspection");
  const [paymentTerms, setPaymentTerms] = useState("Irrevocable Letter of Credit (LC at Sight)");
  const [additionalInstructions, setAdditionalInstructions] = useState("");

  // Guest Contact Info
  const [guestName, setGuestName] = useState("");
  const [guestCompany, setGuestCompany] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestCountry, setGuestCountry] = useState("India");

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successData, setSuccessData] = useState<{ rfq_number: string; id: string } | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/import-export/categories`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setCategories(json.data);
          if (json.data.length > 0) {
            setCategoryId(json.data[0].id);
          }
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const indicativeInrTotal = (parseFloat(targetBudget || "0") * parseFloat(requiredQuantity || "0") * (BENCHMARK_RATES[targetCurrency] || 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!productName.trim()) {
      setErrorMsg("Please specify the product or commodity name.");
      return;
    }
    if (!destinationCountry.trim() || !destinationPort.trim()) {
      setErrorMsg("Please provide destination country and named discharge port.");
      return;
    }
    if (!guestEmail.trim() || !guestName.trim()) {
      setErrorMsg("Please enter your name and email so suppliers can send quotations.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        direction,
        product_name: productName.trim(),
        category_id: categoryId || undefined,
        hs_code_preference: hsCode.trim() || undefined,
        origin_country_preference: originCountryPreference.trim() || undefined,
        destination_country: destinationCountry.trim(),
        destination_port: destinationPort.trim(),
        preferred_incoterm: preferredIncoterm,
        required_quantity: parseFloat(requiredQuantity) || 1,
        unit,
        packaging_preference: packagingPreference.trim() || undefined,
        target_currency: targetCurrency,
        target_budget: targetBudget ? parseFloat(targetBudget) : undefined,
        inspection_agency: inspectionAgency || undefined,
        payment_terms_preferred: paymentTerms || undefined,
        additional_instructions: additionalInstructions.trim() || undefined,
        guest_name: guestName.trim(),
        guest_company: guestCompany.trim() || undefined,
        guest_email: guestEmail.trim(),
        guest_phone: guestPhone.trim() || undefined,
        guest_country: guestCountry.trim() || undefined,
      };

      if (partyId) {
        payload.target_party_ids = [partyId];
      }

      const res = await fetch(`${API_BASE}/import-export/rfqs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to submit trade requirement");
      }

      setSuccessData({
        rfq_number: json.data.rfq_number,
        id: json.data.id,
      });
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while transmitting your RFQ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#FAF9F5] min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-stone-500 mb-4">
          <Link to="/" className="hover:text-stone-900">Home</Link>
          <ChevronRight className="w-3 h-3 text-stone-400" />
          <Link to="/import-export" className="hover:text-stone-900">Import & Export</Link>
          <ChevronRight className="w-3 h-3 text-stone-400" />
          <span className="font-semibold text-stone-800">Submit Trade Requirement (RFQ)</span>
        </div>

        {/* Success Modal / State */}
        {successData ? (
          <div className="bg-white border border-emerald-200 rounded-2xl p-8 sm:p-10 shadow-sm text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              International RFQ Successfully Published
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 mt-3">
              Trade Requirement Broadcasted
            </h2>
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 my-6 max-w-md mx-auto text-center font-mono">
              <span className="text-xs text-stone-500 block uppercase">RFQ Tracking Reference</span>
              <span className="text-xl font-black text-amber-600 tracking-wider">
                {successData.rfq_number}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto">
              Verified international suppliers and licensed export trading houses matching your commodity have been alerted. You will receive itemized CIF/FOB quotations at <strong className="text-stone-900">{guestEmail}</strong>.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/import-export/products"
                className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-lg bg-stone-900 text-white hover:bg-stone-800 transition-colors"
              >
                Browse International Products
              </Link>
              <Link
                to="/import-export/exporters"
                className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-lg border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 transition-colors"
              >
                Explore Exporters Directory
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            {/* Header */}
            <div className="pb-6 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                  Global Trade Enquiry Engine
                </span>
                <span className="text-xs text-stone-500 font-mono">Incoterms® 2020 Compliant</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight mt-1">
                Post Cross-Border Trade Requirement
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 mt-1">
                Receive competitive CIF, FOB and DDP quotations with transparent ocean freight, marine insurance, and customs clearance charges from verified international traders.
              </p>

              {partyName && (
                <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Direct Inquiry for <strong>{partyName}</strong>. Your requirement will be prioritized for this supplier.
                  </span>
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="my-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              {/* 1. Trade Direction */}
              <div>
                <label className="text-xs font-bold text-stone-900 uppercase tracking-wider block mb-2">
                  1. Trade Intent & Flow
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setDirection("export");
                      setOriginCountryPreference("India");
                      setDestinationCountry("United Arab Emirates");
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      direction === "export"
                        ? "border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20"
                        : "border-stone-200 hover:border-stone-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-stone-900">
                      <Ship className="w-4 h-4 text-amber-600" />
                      Export from India (Sourcing)
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1">
                      Source Indian manufactured goods, agricultural produce, or bulk commodities for export overseas.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDirection("import");
                      setOriginCountryPreference("");
                      setDestinationCountry("India");
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      direction === "import"
                        ? "border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20"
                        : "border-stone-200 hover:border-stone-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-stone-900">
                      <Anchor className="w-4 h-4 text-blue-600" />
                      Import into India
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1">
                      Procure industrial machinery, raw chemicals, or commodities from overseas suppliers into Indian ports.
                    </p>
                  </button>
                </div>
              </div>

              {/* 2. Commodity Specifications */}
              <div className="pt-4 border-t border-stone-100 space-y-4">
                <label className="text-xs font-bold text-stone-900 uppercase tracking-wider block">
                  2. Commodity & Tariff Details
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-stone-600 block mb-1 font-medium">
                      Product / Commodity Title *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Basmati Rice 1121 Sella, Spun Yarn 30s, Stainless Steel Flanges"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-stone-600 block mb-1 font-medium">
                      Commodity Category
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-stone-600 block mb-1 font-medium">
                      Harmonized System (HS) Tariff Code (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1006.30, 8479.89, 5205.12"
                      value={hsCode}
                      onChange={(e) => setHsCode(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-stone-600 block mb-1 font-medium">
                      Origin Country Preference
                    </label>
                    <input
                      type="text"
                      placeholder={direction === "export" ? "India" : "e.g. Germany, Japan, Vietnam, USA"}
                      value={originCountryPreference}
                      onChange={(e) => setOriginCountryPreference(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Incoterm & Port Logistics */}
              <div className="pt-4 border-t border-stone-100 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-900 uppercase tracking-wider block">
                    3. Shipping Corridor & Incoterm
                  </label>
                  <span className="text-[11px] text-stone-500">Incoterms® 2020</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-stone-600 block mb-1 font-medium">
                      Preferred Incoterm *
                    </label>
                    <select
                      value={preferredIncoterm}
                      onChange={(e) => setPreferredIncoterm(e.target.value as TradeIncoterm)}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white font-mono"
                    >
                      <option value="CIF">CIF — Cost, Insurance & Freight (Recommended for Sea)</option>
                      <option value="FOB">FOB — Free On Board (Buyer nominates vessel)</option>
                      <option value="CFR">CFR — Cost & Freight</option>
                      <option value="EXW">EXW — Ex Works (Factory pickup)</option>
                      <option value="FCA">FCA — Free Carrier</option>
                      <option value="CIP">CIP — Carriage & Insurance Paid (Air/Multimodal)</option>
                      <option value="CPT">CPT — Carriage Paid To</option>
                      <option value="DAP">DAP — Delivered at Place</option>
                      <option value="DDP">DDP — Delivered Duty Paid (Doorstep)</option>
                    </select>
                    <p className="text-[11px] text-amber-800 bg-amber-50/70 p-2 rounded mt-1.5 border border-amber-200">
                      {INCOTERM_EXPLANATIONS[preferredIncoterm]}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs text-stone-600 block mb-1 font-medium">
                      Destination Country *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. United Arab Emirates, Saudi Arabia, Germany, USA"
                      value={destinationCountry}
                      onChange={(e) => setDestinationCountry(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-stone-600 block mb-1 font-medium">
                      Named Port of Discharge (Destination Port) *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Jebel Ali (AE), Rotterdam (NL), New York (US), Nhava Sheva (IN)"
                      value={destinationPort}
                      onChange={(e) => setDestinationPort(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-stone-600 block mb-1 font-medium">
                      Packaging & Stowage Preference
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Palletized 25kg bags, 200L Steel Drums, 1-Ton Jumbo Bags"
                      value={packagingPreference}
                      onChange={(e) => setPackagingPreference(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Commercials & Quantity */}
              <div className="pt-4 border-t border-stone-100 space-y-4">
                <label className="text-xs font-bold text-stone-900 uppercase tracking-wider block">
                  4. Commercial Quantities & Target Budget
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-xs text-stone-600 block mb-1 font-medium">
                      Required Quantity *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={requiredQuantity}
                      onChange={(e) => setRequiredQuantity(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-stone-600 block mb-1 font-medium">
                      Unit
                    </label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
                    >
                      <option value="metric_ton">Metric Tons (MT)</option>
                      <option value="kg">Kilograms (KG)</option>
                      <option value="twenty_foot_container">20' FCL Containers</option>
                      <option value="forty_foot_container">40' HC Containers</option>
                      <option value="piece">Pieces / Units</option>
                      <option value="barrel">Barrels / Drums</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-stone-600 block mb-1 font-medium">
                      Target Currency
                    </label>
                    <select
                      value={targetCurrency}
                      onChange={(e) => setTargetCurrency(e.target.value as TradeCurrency)}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white font-mono font-bold"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="AED">AED (د.إ)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="SGD">SGD (S$)</option>
                      <option value="JPY">JPY (¥)</option>
                      <option value="CNY">CNY (¥)</option>
                      <option value="INR">INR (₹)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-stone-600 block mb-1 font-medium">
                      Target Unit Price ({targetCurrency})
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        value={targetBudget}
                        onChange={(e) => setTargetBudget(e.target.value)}
                        placeholder="e.g. 1200"
                        className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono"
                      />
                    </div>
                    {targetBudget && (
                      <p className="text-[11px] text-stone-500 mt-1">
                        Est. total order: <span className="font-semibold text-stone-800 font-mono">{targetCurrency} {(parseFloat(targetBudget || "0") * parseFloat(requiredQuantity || "0")).toLocaleString()}</span>
                        {targetCurrency !== "INR" && (
                          <span className="text-stone-400"> (approx. ₹{Math.round(indicativeInrTotal).toLocaleString()})</span>
                        )}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs text-stone-600 block mb-1 font-medium">
                      Inspection Standard
                    </label>
                    <select
                      value={inspectionAgency}
                      onChange={(e) => setInspectionAgency(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
                    >
                      <option value="SGS Pre-Shipment Inspection">SGS Pre-Shipment Inspection</option>
                      <option value="Intertek Inspection Certificate">Intertek Quality & Quantity Audit</option>
                      <option value="Bureau Veritas">Bureau Veritas Certificate</option>
                      <option value="Internal Manufacturer COA">Internal Manufacturer COA Only</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-stone-600 block mb-1 font-medium">
                    Technical Specifications / Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={additionalInstructions}
                    onChange={(e) => setAdditionalInstructions(e.target.value)}
                    placeholder="Provide details on grain length, purity percentage, moisture content, tensile strength, or required destination customs paperwork..."
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>

              {/* 5. Contact & Retroactive Claim Info */}
              <div className="pt-4 border-t border-stone-100 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-900 uppercase tracking-wider block">
                    5. Buyer / Requester Coordinates
                  </label>
                  <span className="text-[11px] text-stone-500">Quotes delivered direct</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-stone-600 block mb-1 font-medium">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Johnathan Smith"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-stone-600 block mb-1 font-medium">
                      Company / Trading House Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Gulf Oasis Trading FZE"
                      value={guestCompany}
                      onChange={(e) => setGuestCompany(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-stone-600 block mb-1 font-medium">
                      Business Email Address *
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. procurement@gulfoasis.com"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-stone-600 block mb-1 font-medium">
                      Phone / WhatsApp (with Country Code)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. +971 50 123 4567"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-6 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-stone-500">
                  By transmitting this RFQ, your requirement will be matched with licensed DGFT/Customs verified export entities.
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 py-3 rounded-xl bg-amber-500 text-stone-950 font-bold hover:bg-amber-400 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
                      Broadcasting RFQ...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Publish Trade Requirement
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
