import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Globe,
  Building2,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Anchor,
  Ship,
  Award,
  ChevronRight,
  Send,
  Star,
  Package,
  Layers,
  FileText,
  Clock,
  ExternalLink,
  Phone,
  Mail,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { TradeParty, InternationalProduct } from "../../types";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const TradePartyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [party, setParty] = useState<(TradeParty & { products?: InternationalProduct[] }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "ports" | "compliance" | "catalog">("overview");

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    fetch(`${API_BASE}/import-export/parties/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setParty(json.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div className="bg-[#FAF9F5] min-h-screen py-20 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-stone-300 border-t-amber-500 mb-3" />
        <p className="text-xs text-stone-500">Loading verified trade dossier...</p>
      </div>
    );
  }

  if (!party) {
    return (
      <div className="bg-[#FAF9F5] min-h-screen py-16 px-4">
        <div className="max-w-xl mx-auto bg-white border border-stone-200 rounded-xl p-8 text-center">
          <Building2 className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-stone-900">Trade Partner Not Found</h2>
          <p className="text-xs text-stone-500 mt-1">The requested importer or exporter dossier could not be located.</p>
          <Link
            to="/import-export"
            className="inline-block mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-amber-500 text-stone-950 hover:bg-amber-400"
          >
            Back to Global Trade Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const biz = party.businesses;
  const isExporter = party.party_type === "exporter" || party.party_type === "importer_exporter";
  const isImporter = party.party_type === "importer" || party.party_type === "importer_exporter";

  return (
    <div className="bg-[#FAF9F5] min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-stone-500 mb-4">
          <Link to="/" className="hover:text-stone-900">Home</Link>
          <ChevronRight className="w-3 h-3 text-stone-400" />
          <Link to="/import-export" className="hover:text-stone-900">Import & Export</Link>
          <ChevronRight className="w-3 h-3 text-stone-400" />
          <Link
            to={isExporter ? "/import-export/exporters" : "/import-export/importers"}
            className="hover:text-stone-900"
          >
            {isExporter ? "Exporters" : "Importers"}
          </Link>
          <ChevronRight className="w-3 h-3 text-stone-400" />
          <span className="font-semibold text-stone-800">{biz?.name || "Company Dossier"}</span>
        </div>

        {/* Hero Card */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 sm:p-8 shadow-sm mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                  party.party_type === "importer_exporter"
                    ? "bg-purple-100 text-purple-800 border border-purple-200"
                    : isExporter
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : "bg-blue-100 text-blue-800 border border-blue-200"
                }`}>
                  {party.party_type === "importer_exporter"
                    ? "Importer & Exporter"
                    : isExporter
                    ? "Verified Exporter"
                    : "Verified Importer"}
                </span>

                {party.verification_status === "verified" && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    DGFT & IEC Verified
                  </span>
                )}

                <span className="text-xs font-mono text-stone-600 bg-stone-100 px-2 py-0.5 rounded">
                  IEC: {party.iec_code || "PENDING"}
                </span>
                {party.authorized_dealer_code && (
                  <span className="text-xs font-mono text-stone-600 bg-stone-100 px-2 py-0.5 rounded">
                    AD Code: {party.authorized_dealer_code}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
                {biz?.name || party.headline || "Cross-Border Enterprise"}
              </h1>

              {party.headline && (
                <p className="text-sm font-medium text-stone-700 max-w-3xl">
                  {party.headline}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs text-stone-600 flex-wrap pt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-stone-400" />
                  {biz?.city ? `${biz.city}, ` : ""}{biz?.state ? `${biz.state}, ` : ""}{party.country_name || "India"}
                </span>
                {party.rating && (
                  <span className="flex items-center gap-1 font-semibold text-amber-700">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {party.rating.toFixed(1)} / 5.0
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-stone-400" />
                  Completed Export Deals: <strong className="text-stone-900">{party.total_export_deals_completed || 0}</strong>
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
              <Link
                to={`/import-export/rfq?party_id=${party.id}&party_name=${encodeURIComponent(biz?.name || "Trader")}`}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-lg bg-amber-500 text-stone-950 hover:bg-amber-400 transition-colors shadow-sm"
              >
                <Send className="w-4 h-4" />
                Request Custom Quotation
              </Link>
              {biz?.email && (
                <a
                  href={`mailto:${biz.email}`}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-semibold rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Inquire by Email
                </a>
              )}
            </div>
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
            Overview & Facilities
          </button>
          <button
            onClick={() => setActiveTab("ports")}
            className={`pb-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "ports"
                ? "border-amber-500 text-stone-900"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            Ports & Trade Corridors
          </button>
          <button
            onClick={() => setActiveTab("compliance")}
            className={`pb-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "compliance"
                ? "border-amber-500 text-stone-900"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            Certifications & Customs
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
              Export Catalog
              {party.products && party.products.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                  {party.products.length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {activeTab === "overview" && (
              <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-6 shadow-sm">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-2">
                    Company Profile
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                    {party.description || biz?.legal_name || "Specialized cross-border trading company with active supply channels, customs-bonded processing, and international delivery networks."}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-stone-100">
                  <div className="bg-stone-50 p-3.5 rounded-lg border border-stone-200">
                    <span className="text-[11px] text-stone-500 block">Annual Trade Turnover</span>
                    <span className="text-sm font-bold text-stone-900 font-mono mt-0.5 block">
                      {party.annual_trade_turnover || "$1M - $5M USD"}
                    </span>
                  </div>
                  <div className="bg-stone-50 p-3.5 rounded-lg border border-stone-200">
                    <span className="text-[11px] text-stone-500 block">Typical Logistics Modes</span>
                    <span className="text-sm font-bold text-stone-900 mt-0.5 block">
                      {party.typical_shipment_modes?.join(", ") || "FCL 20'/40' Containers, Air Cargo"}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-stone-900 mb-2">Key Trade Categories</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {party.product_categories && party.product_categories.length > 0 ? (
                      party.product_categories.map((cat, idx) => (
                        <span key={idx} className="bg-stone-100 text-stone-800 text-xs px-2.5 py-1 rounded-md border border-stone-200 font-medium">
                          {cat}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-stone-500">General Cross-Border Commodities</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "ports" && (
              <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-6 shadow-sm">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Anchor className="w-4 h-4 text-stone-500" />
                    Primary Ports of Loading (POL)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {party.primary_loading_ports && party.primary_loading_ports.length > 0 ? (
                      party.primary_loading_ports.map((port, idx) => (
                        <div key={idx} className="bg-stone-50 p-3.5 rounded-lg border border-stone-200 flex items-center gap-3">
                          <Ship className="w-5 h-5 text-stone-400" />
                          <div>
                            <span className="text-xs font-bold text-stone-800 block">{port}</span>
                            <span className="text-[11px] text-stone-500">Regular Container & Bulk Dispatch</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-stone-500">Primary Indian Sea & Air Gateway Ports (JNPT, Mundra, Chennai)</p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-100">
                  <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-stone-500" />
                    {isExporter ? "Export Destination Markets" : "International Sourcing Corridors"}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {((isExporter ? party.export_markets : party.sourcing_countries) || []).map((country, idx) => (
                      <span key={idx} className="bg-amber-50 text-amber-900 text-xs px-3 py-1 rounded-lg border border-amber-200 font-semibold">
                        {country}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "compliance" && (
              <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-6 shadow-sm">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-3">
                    Government & Trade Registrations
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                      <span className="text-stone-500 block">Directorate General of Foreign Trade (DGFT) IEC</span>
                      <span className="font-mono font-bold text-stone-900 mt-1 block">
                        {party.iec_code || "DGFT-VERIFIED"}
                      </span>
                    </div>
                    <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                      <span className="text-stone-500 block">Authorized Dealer (AD) Code</span>
                      <span className="font-mono font-bold text-stone-900 mt-1 block">
                        {party.authorized_dealer_code || "AD-REGISTERED"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-100">
                  <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-3">
                    Accreditations & Quality Certifications
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {party.certifications && party.certifications.length > 0 ? (
                      party.certifications.map((cert, idx) => (
                        <div key={idx} className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-200 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="text-xs font-semibold text-stone-800">{cert}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-stone-500">ISO 9001:2015, APEDA, Spice Board, Halal</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "catalog" && isExporter && (
              <div className="space-y-4">
                {party.products && party.products.length > 0 ? (
                  party.products.map((prod) => (
                    <div
                      key={prod.id}
                      className="bg-white border border-stone-200 rounded-xl p-5 hover:border-amber-400 hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base text-stone-900">{prod.name}</span>
                          {prod.hs_code && (
                            <span className="text-[11px] font-mono bg-stone-100 text-stone-600 px-2 py-0.5 rounded">
                              HS {prod.hs_code}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-600 line-clamp-1">{prod.description}</p>
                        <div className="flex items-center gap-3 text-xs text-stone-500 pt-1">
                          <span>MOQ: <strong className="text-stone-800">{prod.moq} {prod.unit_of_measurement}</strong></span>
                          <span>•</span>
                          <span>Port: <strong className="text-stone-800">{prod.loading_port || "Nhava Sheva"}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
                        <div className="text-right">
                          <span className="text-xs text-stone-500 block font-mono">{prod.incoterm_basis} Price</span>
                          <span className="text-base font-black text-stone-900 font-mono">
                            {prod.currency} {prod.base_price_fob.toLocaleString()}
                          </span>
                        </div>
                        <Link
                          to={`/import-export/products/${prod.slug}`}
                          className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-stone-900 text-white hover:bg-stone-800 transition-colors"
                        >
                          Details
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white border border-stone-200 rounded-xl p-8 text-center">
                    <Package className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                    <p className="text-xs text-stone-500">No active products published in public catalog currently.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sticky Sidebar */}
          <div className="space-y-6">
            <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                Direct Trade Inquiry
              </h3>
              <p className="text-xs text-stone-600">
                Submit an export enquiry or request custom ocean freight quotations directly from this verified trader.
              </p>
              <Link
                to={`/import-export/rfq?party_id=${party.id}&party_name=${encodeURIComponent(biz?.name || "Trader")}`}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold rounded-lg bg-amber-500 text-stone-950 hover:bg-amber-400 transition-colors shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                Submit RFQ to this Partner
              </Link>
              <div className="pt-3 border-t border-stone-100 space-y-2 text-xs text-stone-600">
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Typical Quote Time:</span>
                  <span className="font-semibold text-stone-900">Within 24 Hours</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Escrow / LC Accepted:</span>
                  <span className="font-semibold text-emerald-700">Irrevocable LC at Sight</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Inspection Available:</span>
                  <span className="font-semibold text-stone-900">SGS / Intertek Pre-Shipment</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-3">
                Trading Office
              </h4>
              <div className="space-y-2 text-xs text-stone-600">
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                  <span>
                    {biz?.city ? `${biz.city}, ` : ""}{biz?.state ? `${biz.state} - ` : ""}{party.country_name || "India"}
                  </span>
                </div>
                {biz?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span>{biz.phone}</span>
                  </div>
                )}
                {biz?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span>{biz.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
