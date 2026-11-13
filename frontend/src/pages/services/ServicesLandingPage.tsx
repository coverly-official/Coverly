import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { BusinessServiceCategory, BusinessService } from "@/types";
import {
  Search,
  FileCheck,
  Calculator,
  Megaphone,
  Factory,
  Truck,
  Cpu,
  Briefcase,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

const categoryIconMap: Record<string, React.ReactNode> = {
  "business-registration-legal": <FileCheck className="w-5 h-5" />,
  "accounting-finance": <Calculator className="w-5 h-5" />,
  "branding-marketing": <Megaphone className="w-5 h-5" />,
  "manufacturing-product-development": <Factory className="w-5 h-5" />,
  "logistics-supply-chain": <Truck className="w-5 h-5" />,
  "technology-it": <Cpu className="w-5 h-5" />,
  "business-consulting": <Briefcase className="w-5 h-5" />,
};

export const ServicesLandingPage: React.FC = () => {
  const [categories, setCategories] = useState<BusinessServiceCategory[]>([]);
  const [featuredServices, setFeaturedServices] = useState<BusinessService[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetch(`${API_BASE}/business-services/categories`).then((r) => r.json()),
      fetch(`${API_BASE}/business-services`).then((r) => r.json()),
    ])
      .then(([catRes, servRes]) => {
        if (catRes.success) setCategories(catRes.data);
        if (servRes.success) setFeaturedServices(servRes.data.slice(0, 6));
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/services/search?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/services/all");
    }
  };

  return (
    <div className="space-y-16 py-10">
      {/* 1. Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-200/70 text-stone-800 text-xs font-semibold uppercase tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5 text-stone-900" />
          Verified B2B Professional Services
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-stone-900 tracking-tight max-w-3xl mx-auto leading-tight">
          Everything You Need to Start, Scale & Operate Your Business
        </h1>

        <p className="mt-4 text-sm sm:text-base text-stone-600 max-w-2xl mx-auto leading-relaxed">
          Connect with certified CA/CS firms, legal consultants, logistics providers, marketing agencies, and software partners trusted by verified Indian enterprises.
        </p>

        {/* Global Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="mt-8 max-w-2xl mx-auto bg-white border border-stone-300 rounded-2xl p-2 shadow-sm flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search services (e.g. GST Registration, Trademark, ERP, Warehousing)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 text-xs sm:text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-stone-900 text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-stone-800 transition shrink-0"
          >
            Find Services
          </button>
        </form>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-stone-500">
          <span className="font-semibold text-stone-700">Popular:</span>
          <Link to="/services/search?search=GST+Registration" className="hover:text-stone-900 underline">GST Filing</Link>
          <span>•</span>
          <Link to="/services/search?search=Company+Registration" className="hover:text-stone-900 underline">Pvt Ltd Setup</Link>
          <span>•</span>
          <Link to="/services/search?search=Trademark" className="hover:text-stone-900 underline">Trademark</Link>
          <span>•</span>
          <Link to="/services/search?search=Packaging" className="hover:text-stone-900 underline">Packaging Design</Link>
          <span>•</span>
          <Link to="/services/search?search=Freight" className="hover:text-stone-900 underline">Freight Forwarding</Link>
        </div>
      </section>

      {/* 2. Core Service Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
              Explore Professional Categories
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Comprehensive regulatory, operational, and commercial service domains
            </p>
          </div>
          <Link
            to="/services/all"
            className="text-xs font-semibold text-stone-800 hover:underline flex items-center gap-1"
          >
            All 47 Subcategories <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/services/category/${cat.slug}`}
              className="group bg-white border border-stone-200 hover:border-stone-400 rounded-2xl p-6 transition shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-800 mb-4 group-hover:bg-stone-900 group-hover:text-white transition">
                  {categoryIconMap[cat.slug] || <Briefcase className="w-5 h-5" />}
                </div>

                <h3 className="font-bold text-base text-stone-900 group-hover:text-stone-700 transition mb-1">
                  {cat.name}
                </h3>

                <p className="text-xs text-stone-500 leading-relaxed line-clamp-2">
                  {cat.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-stone-800">
                <span>{cat.subcategories?.length || 0} Specializations</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. How Business Services Works */}
      <section className="bg-white border-y border-stone-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
              How COVERLY Services Connect Works
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Transparent procurement of professional services with milestone tracking and no hidden fees
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="border border-stone-200 rounded-xl p-6 bg-stone-50/50">
              <div className="text-xs font-bold text-stone-400 mb-2">STEP 01</div>
              <h4 className="font-bold text-sm text-stone-900 mb-1">Discover & Inspect</h4>
              <p className="text-xs text-stone-600">
                Browse verified service offerings, scope of deliverables, and turnaround schedules.
              </p>
            </div>

            <div className="border border-stone-200 rounded-xl p-6 bg-stone-50/50">
              <div className="text-xs font-bold text-stone-400 mb-2">STEP 02</div>
              <h4 className="font-bold text-sm text-stone-900 mb-1">Submit Requirement</h4>
              <p className="text-xs text-stone-600">
                Send structured requirements, target timeline, and budget directly to the provider firm.
              </p>
            </div>

            <div className="border border-stone-200 rounded-xl p-6 bg-stone-50/50">
              <div className="text-xs font-bold text-stone-400 mb-2">STEP 03</div>
              <h4 className="font-bold text-sm text-stone-900 mb-1">Receive Quotation</h4>
              <p className="text-xs text-stone-600">
                Review formal scope of work, milestone deliverables, and transparent pricing proposal.
              </p>
            </div>

            <div className="border border-stone-200 rounded-xl p-6 bg-stone-50/50">
              <div className="text-xs font-bold text-stone-400 mb-2">STEP 04</div>
              <h4 className="font-bold text-sm text-stone-900 mb-1">Track & Sign-Off</h4>
              <p className="text-xs text-stone-600">
                Monitor execution stages and confirm completion directly through your portal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Provider & Custom Consultation Banners */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-stone-900 text-white rounded-2xl p-8 flex flex-col justify-between shadow-xs">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-stone-800 text-[11px] font-semibold text-stone-300 mb-3">
                For Service Providers & Agencies
              </div>
              <h3 className="text-xl font-bold mb-2">List Your Professional Firm on COVERLY</h3>
              <p className="text-xs text-stone-300 leading-relaxed mb-6">
                Connect with thousands of verified manufacturing plants, wholesalers, and retail chains actively seeking compliance, accounting, branding, and logistics assistance.
              </p>
            </div>
            <Link
              to="/provider/onboarding"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-stone-900 font-semibold text-xs rounded-xl hover:bg-stone-100 transition self-start"
            >
              Register as Service Provider
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl p-8 flex flex-col justify-between shadow-xs">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-50 text-[11px] font-semibold text-emerald-800 mb-3">
                Custom Enterprise Requirement
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-2">Need Bespoke Business Assistance?</h3>
              <p className="text-xs text-stone-600 leading-relaxed mb-6">
                Tell our business concierge team what services you require. We match your scope with verified partner firms within 4 business hours.
              </p>
            </div>
            <Link
              to="/services/request"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-stone-900 text-white font-semibold text-xs rounded-xl hover:bg-stone-800 transition self-start"
            >
              Post a Service Request
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
