import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  ShieldCheck,
  Search,
  Filter,
  MapPin,
  Building2,
  Briefcase,
  Languages,
  CheckCircle,
  ArrowRight,
  TrendingUp,
  FileText,
  UserCheck,
} from "lucide-react";
import { SalesAgentProfile } from "../../types";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const SalesAgentDirectoryPage: React.FC = () => {
  const [agents, setAgents] = useState<SalesAgentProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [agentType, setAgentType] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [territoryFilter, setTerritoryFilter] = useState("all");

  const fallbackAgents: SalesAgentProfile[] = [
    {
      id: "sa-fallback-01",
      user_id: "usr-01",
      agent_type: "independent",
      full_name: "Rajeshwar Rao",
      phone: "+91 98490 12345",
      email: "rajeshwar.rao@b2bagents.in",
      bio: "Senior industrial machinery and electrical equipment broker with 14 years across South India. Specializes in plant machinery procurement, heavy industrial tools, and long-term supply negotiations.",
      product_categories: ["Industrial Machinery", "Electrical Equipment", "Packaging Materials"],
      service_categories: ["Machinery Maintenance & AMC"],
      operating_cities: ["Hyderabad", "Bengaluru", "Chennai"],
      operating_states: ["Telangana", "Karnataka", "Tamil Nadu"],
      languages: ["English", "Telugu", "Hindi", "Kannada"],
      experience_years: 14,
      verification_status: "verified",
      is_public_discovery_enabled: true,
      slug: "rajeshwar-rao-industrial-machinery",
      total_leads_assigned: 38,
      total_conversions: 29,
      created_at: new Date().toISOString(),
    },
    {
      id: "sa-fallback-02",
      user_id: "usr-02",
      agent_type: "company_representative",
      full_name: "Anita Deshmukh",
      phone: "+91 98220 54321",
      email: "anita.deshmukh@apexmetals.com",
      bio: "Authorized Regional Sales Representative for Apex Steel & Alloys Pvt Ltd. Handling bulk structural steel, TMT bars, and industrial fasteners with factory-direct pricing for Western India builders.",
      affiliated_business_id: "biz-apex-01",
      businesses: {
        id: "biz-apex-01",
        name: "Apex Steel & Alloys Pvt Ltd",
        city: "Mumbai",
      },
      product_categories: ["Raw Materials", "Construction Materials"],
      service_categories: ["Custom Fabrication"],
      operating_cities: ["Mumbai", "Pune", "Nashik"],
      operating_states: ["Maharashtra", "Gujarat"],
      languages: ["English", "Marathi", "Hindi"],
      experience_years: 8,
      verification_status: "verified",
      is_public_discovery_enabled: true,
      slug: "anita-deshmukh-apex-steel",
      total_leads_assigned: 45,
      total_conversions: 37,
      created_at: new Date().toISOString(),
    },
    {
      id: "sa-fallback-03",
      user_id: "usr-03",
      agent_type: "independent",
      full_name: "Vikramjit Singh",
      phone: "+91 98140 99887",
      email: "vikramjit.singh@punjabsourcing.in",
      bio: "North India regional sourcing agent for Agriculture, Food & Beverages, and Bulk Packaging materials. Extensive ground network with FPOs, grain millers, and processing facilities.",
      product_categories: ["Agriculture Products", "Food & Beverages", "Packaging Materials"],
      service_categories: ["Quality Inspection", "Cold Chain Logistics"],
      operating_cities: ["Ludhiana", "Amritsar", "Chandigarh", "Delhi NCR"],
      operating_states: ["Punjab", "Haryana", "Delhi"],
      languages: ["English", "Punjabi", "Hindi"],
      experience_years: 11,
      verification_status: "verified",
      is_public_discovery_enabled: true,
      slug: "vikramjit-singh-agri-sourcing",
      total_leads_assigned: 52,
      total_conversions: 41,
      created_at: new Date().toISOString(),
    },
    {
      id: "sa-fallback-04",
      user_id: "usr-04",
      agent_type: "company_representative",
      full_name: "Sneha Nair",
      phone: "+91 94470 66554",
      email: "sneha.nair@malabarspices.com",
      bio: "Authorized Sales Representative for Malabar Organic Spices & Extracts. Direct factory representation for export-grade spices, essential oils, and herbal extracts for pharma and FMCG buyers.",
      affiliated_business_id: "biz-malabar-01",
      businesses: {
        id: "biz-malabar-01",
        name: "Malabar Organic Spices & Extracts",
        city: "Kochi",
      },
      product_categories: ["Agriculture Products", "Healthcare Supplies"],
      service_categories: ["Organic Certification Assistance"],
      operating_cities: ["Kochi", "Kozhikode", "Bengaluru"],
      operating_states: ["Kerala", "Karnataka"],
      languages: ["English", "Malayalam", "Tamil", "Hindi"],
      experience_years: 7,
      verification_status: "verified",
      is_public_discovery_enabled: true,
      slug: "sneha-nair-malabar-spices",
      total_leads_assigned: 31,
      total_conversions: 24,
      created_at: new Date().toISOString(),
    },
  ];

  const fetchAgents = () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (agentType !== "all") params.set("type", agentType);
    if (categoryFilter !== "all") params.set("category", categoryFilter);
    if (territoryFilter !== "all") params.set("territory", territoryFilter);

    fetch(`${API_BASE}/sales-agents?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setAgents(data.data);
        } else {
          setAgents(fallbackAgents);
        }
      })
      .catch(() => {
        setAgents(fallbackAgents);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchAgents();
  }, [agentType, categoryFilter, territoryFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAgents();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* Hero Header */}
      <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white py-14 px-4 sm:px-6 lg:px-8 border-b border-indigo-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="space-y-4 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Verified B2B Sales Network
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Authorized Sales Agents & Business Representatives
              </h1>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                Connect with verified field agents and company sales representatives across India. Gain local ground presence, multi-lingual commercial negotiations, and factory-direct procurement support.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row md:flex-col gap-3 min-w-[240px]">
              <Link
                to="/sales-agents/requirement"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/30 text-center"
              >
                <FileText className="w-4 h-4" />
                Submit Sourcing Lead
              </Link>
              <Link
                to="/agent/dashboard"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors text-center"
              >
                <UserCheck className="w-4 h-4" />
                Agent Portal Access
              </Link>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10 pt-8 border-t border-slate-800/80">
            <div>
              <div className="text-2xl font-bold text-white">500+</div>
              <div className="text-xs text-slate-400 font-medium">Verified Field Agents</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-400">100%</div>
              <div className="text-xs text-slate-400 font-medium">Identity & Credential Verified</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-indigo-400">28 States</div>
              <div className="text-xs text-slate-400 font-medium">Pan-India Territory Coverage</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-400">₹450 Cr+</div>
              <div className="text-xs text-slate-400 font-medium">Facilitated B2B Sourcing</div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4 sm:p-5">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative lg:col-span-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by agent name, category, or keyword..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <select
                value={agentType}
                onChange={(e) => setAgentType(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              >
                <option value="all">All Agent Roles</option>
                <option value="independent">Independent Agents</option>
                <option value="company_representative">Company Representatives</option>
              </select>
            </div>

            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              >
                <option value="all">All Industry Categories</option>
                <option value="Industrial Machinery">Industrial Machinery</option>
                <option value="Electrical Equipment">Electrical Equipment</option>
                <option value="Packaging Materials">Packaging Materials</option>
                <option value="Raw Materials">Raw Materials</option>
                <option value="Construction Materials">Construction Materials</option>
                <option value="Agriculture Products">Agriculture Products</option>
                <option value="Food & Beverages">Food & Beverages</option>
                <option value="Healthcare Supplies">Healthcare Supplies</option>
              </select>
            </div>

            <div>
              <button
                type="submit"
                className="w-full h-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Filter className="w-4 h-4" />
                Filter Agents
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Directory Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Verified Representatives ({agents.length})
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            Active Pan-India Representatives
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse space-y-4">
                <div className="h-6 bg-slate-200 rounded w-1/3"></div>
                <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                <div className="h-16 bg-slate-100 rounded"></div>
              </div>
            ))}
          </div>
        ) : agents.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-md mx-auto">
            <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-900">No representatives matched your filter</h3>
            <p className="text-xs text-slate-500 mt-1">Try broadening your search term or selecting All Categories.</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setAgentType("all");
                setCategoryFilter("all");
              }}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="bg-white rounded-xl border border-slate-200 hover:border-indigo-300 transition-all hover:shadow-lg flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-6">
                  {/* Top Badge & Representative Typology */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center font-bold text-indigo-700 text-base">
                        {agent.full_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .substring(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {agent.full_name}
                          </h3>
                          {agent.verification_status === "verified" && (
                            <span title="Verified Representative" className="text-emerald-600">
                              <CheckCircle className="w-4 h-4 fill-emerald-100" />
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                          {agent.agent_type === "company_representative" ? (
                            <span className="font-semibold text-slate-700">
                              Authorized Rep • {agent.businesses?.name || "Verified Enterprise"}
                            </span>
                          ) : (
                            <span className="font-medium text-slate-600">
                              Independent Sales Representative ({agent.experience_years} yrs exp)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                        agent.agent_type === "company_representative"
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                    >
                      {agent.agent_type === "company_representative" ? "Company Rep" : "Independent"}
                    </span>
                  </div>

                  {/* Bio */}
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                    {agent.bio || "Authorized representative dedicated to connecting verified buyers and suppliers."}
                  </p>

                  {/* Categories Tags */}
                  <div className="space-y-2 mb-4">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Product Specializations
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {agent.product_categories && agent.product_categories.length > 0 ? (
                        agent.product_categories.map((cat, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-medium border border-slate-200"
                          >
                            {cat}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">General Sourcing</span>
                      )}
                    </div>
                  </div>

                  {/* Territory & Languages */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
                    <div>
                      <div className="text-slate-400 font-medium flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        Territory
                      </div>
                      <div className="text-slate-700 font-medium truncate mt-0.5">
                        {agent.operating_cities?.slice(0, 3).join(", ") || "Pan-India"}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 font-medium flex items-center gap-1">
                        <Languages className="w-3.5 h-3.5 text-slate-400" />
                        Languages
                      </div>
                      <div className="text-slate-700 font-medium truncate mt-0.5">
                        {agent.languages?.slice(0, 3).join(", ") || "English, Hindi"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="bg-slate-50/80 px-6 py-3.5 border-t border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-semibold text-emerald-700">
                      <TrendingUp className="w-3.5 h-3.5" />
                      {agent.total_conversions || 0} Deals Closed
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/sales-agents/${agent.slug || agent.id}`}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 bg-white border border-slate-300 rounded-lg hover:border-indigo-400 transition-colors"
                    >
                      View Profile
                    </Link>
                    <Link
                      to={`/sales-agents/requirement?agent=${agent.slug || agent.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
                    >
                      Direct Enquiry
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Value Proposition Callout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl p-8 sm:p-10 text-white relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-4">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Are you an experienced B2B Sales Agent or Representative?
            </h3>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Join the COVERLY Authorized Representative Network. Access verified commercial leads from buyers across India, represent high-margin manufacturers and distributors, and earn transparent commission payouts directly to your verified bank account.
            </p>
            <div className="pt-2 flex flex-wrap gap-4">
              <Link
                to="/agent/dashboard"
                className="px-6 py-3 rounded-lg font-bold text-sm bg-white text-indigo-900 hover:bg-slate-100 transition-colors"
              >
                Register as Field Representative
              </Link>
              <Link
                to="/sales-agents/requirement"
                className="px-6 py-3 rounded-lg font-semibold text-sm border border-indigo-400/40 text-indigo-200 hover:bg-white/10 transition-colors"
              >
                Post Buyer Sourcing Request
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
