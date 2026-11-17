import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { PORTALS_REGISTRY, PortalItem } from "@/lib/portals-registry";
import {
  Store,
  Factory,
  Building2,
  Truck,
  Layers,
  Package,
  Globe,
  Briefcase,
  UserCheck,
  ShoppingBag,
  Eye,
  ExternalLink,
  LogIn,
  UserPlus,
  Search,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Lock,
} from "lucide-react";

const renderPortalIcon = (iconName: string, className = "w-5 h-5") => {
  switch (iconName) {
    case "Store":
      return <Store className={className} />;
    case "Factory":
      return <Factory className={className} />;
    case "Building2":
      return <Building2 className={className} />;
    case "Truck":
      return <Truck className={className} />;
    case "Layers":
      return <Layers className={className} />;
    case "Package":
      return <Package className={className} />;
    case "Globe":
      return <Globe className={className} />;
    case "Briefcase":
      return <Briefcase className={className} />;
    case "UserCheck":
      return <UserCheck className={className} />;
    case "ShoppingBag":
      return <ShoppingBag className={className} />;
    default:
      return <Building2 className={className} />;
  }
};

const CATEGORY_STYLES: Record<
  PortalItem["category"],
  { badge: string; iconBg: string; borderAccent: string }
> = {
  "Buyer Ecosystem": {
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
    iconBg: "bg-emerald-100/70 text-emerald-800",
    borderAccent: "hover:border-emerald-300",
  },
  "Supplier Ecosystem": {
    badge: "bg-blue-50 text-blue-800 border-blue-200",
    iconBg: "bg-blue-100/70 text-blue-800",
    borderAccent: "hover:border-blue-300",
  },
  "Service Ecosystem": {
    badge: "bg-purple-50 text-purple-800 border-purple-200",
    iconBg: "bg-purple-100/70 text-purple-800",
    borderAccent: "hover:border-purple-300",
  },
  "Public Ecosystem": {
    badge: "bg-amber-50 text-amber-800 border-amber-200",
    iconBg: "bg-amber-100/70 text-amber-800",
    borderAccent: "hover:border-amber-300",
  },
};

const CATEGORIES: PortalItem["category"][] = [
  "Buyer Ecosystem",
  "Supplier Ecosystem",
  "Service Ecosystem",
  "Public Ecosystem",
];

export const AdminPortalsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const focusId = searchParams.get("focus") || "";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const filteredPortals = PORTALS_REGISTRY.filter((portal) => {
    const matchesCategory = selectedCategory === "All" || portal.category === selectedCategory;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      portal.name.toLowerCase().includes(q) ||
      portal.description.toLowerCase().includes(q) ||
      portal.category.toLowerCase().includes(q) ||
      portal.features.some((f) => f.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-stone-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm border border-stone-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-emerald-300 text-[11px] font-semibold tracking-wide uppercase mb-3 border border-white/10">
              <ShieldCheck className="w-3.5 h-3.5" />
              Centralized Ecosystem Control
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Workspace & Portal Access Hub
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 mt-2 leading-relaxed">
              Inspect, preview, and test every portal across the COVERLY B2B ecosystem from one centralized command center.
              Preview Mode runs strictly read-only without exposing private user credentials or altering production data.
            </p>
          </div>
          <div className="flex flex-col sm:items-end gap-2 shrink-0">
            <div className="flex items-center gap-2 text-xs font-mono bg-stone-800/90 px-3 py-2 rounded-xl border border-stone-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{PORTALS_REGISTRY.length} Connected Portals Active</span>
            </div>
            <span className="text-[11px] text-stone-400 flex items-center gap-1">
              <Lock className="w-3 h-3" /> Admin session preserved across previews
            </span>
          </div>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search portals, workflows, or roles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-800"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {["All", ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedCategory === cat
                  ? "bg-stone-900 text-white shadow-2xs"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Categorized Portal Grid */}
      {CATEGORIES.map((category) => {
        const portalsInCategory = filteredPortals.filter((p) => p.category === category);
        if (portalsInCategory.length === 0) return null;

        const style = CATEGORY_STYLES[category];

        return (
          <section key={category} className="space-y-3">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <div className="flex items-center gap-2.5">
                <h2 className="text-sm font-bold uppercase tracking-wider text-stone-800">
                  {category}
                </h2>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${style.badge}`}
                >
                  {portalsInCategory.length} {portalsInCategory.length === 1 ? "Portal" : "Portals"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {portalsInCategory.map((portal) => {
                const isFocused = focusId === portal.id;
                return (
                  <div
                    key={portal.id}
                    className={`bg-white rounded-xl border transition-all duration-150 p-5 flex flex-col justify-between shadow-2xs ${
                      isFocused
                        ? "border-stone-900 ring-2 ring-stone-900/15"
                        : `border-stone-200 ${style.borderAccent}`
                    }`}
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${style.iconBg}`}>
                            {renderPortalIcon(portal.iconName, "w-5 h-5")}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-stone-900 leading-tight">
                              {portal.name}
                            </h3>
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 mt-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              {portal.status} • {portal.openRoute}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-stone-600 leading-relaxed mb-3">
                        {portal.description}
                      </p>

                      {/* Capabilities Pills */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {portal.features.map((feat) => (
                          <span
                            key={feat}
                            className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200/70"
                          >
                            {feat}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="pt-3 border-t border-stone-100 space-y-2">
                      {/* Primary Row: Preview & Open Workspace */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/portals/${portal.id}/preview`)}
                          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Preview UI
                        </button>
                        <Link
                          to={portal.openRoute}
                          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-900 text-xs font-semibold transition border border-stone-200"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Open Portal
                        </Link>
                      </div>

                      {/* Auth Flow Row: Login & Registration */}
                      <div className="grid grid-cols-2 gap-2">
                        <a
                          href={portal.loginUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-white hover:bg-stone-50 text-stone-700 text-[11px] font-medium transition border border-stone-200"
                          title={`Test ${portal.name} login in a new tab without ending Admin session`}
                        >
                          <LogIn className="w-3 h-3 text-stone-500" />
                          Login Flow
                        </a>
                        <a
                          href={portal.registerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-white hover:bg-stone-50 text-stone-700 text-[11px] font-medium transition border border-stone-200"
                          title={`Test ${portal.name} registration in a new tab`}
                        >
                          <UserPlus className="w-3 h-3 text-stone-500" />
                          Register Flow
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
};
