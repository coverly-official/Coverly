import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  Filter,
  Globe,
  Ship,
  Package,
  Layers,
  MapPin,
  ChevronRight,
  SlidersHorizontal,
  Scale,
  Sparkles,
  X,
  ArrowRight,
  Info,
} from "lucide-react";
import { InternationalProduct, TradeCategory } from "../../types";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const InternationalProductListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<InternationalProduct[]>([]);
  const [categories, setCategories] = useState<TradeCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all");
  const [selectedOrigin, setSelectedOrigin] = useState(searchParams.get("origin_country") || "");
  const [selectedIncoterm, setSelectedIncoterm] = useState(searchParams.get("incoterm") || "all");
  const [selectedCurrency, setSelectedCurrency] = useState(searchParams.get("currency") || "all");
  const [minMoq, setMinMoq] = useState(searchParams.get("min_moq") || "");
  const [maxMoq, setMaxMoq] = useState(searchParams.get("max_moq") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");
  const [page, setPage] = useState(1);

  // Comparison State
  const [compareItems, setCompareItems] = useState<InternationalProduct[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/import-export/categories`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setCategories(json.data || []);
      })
      .catch((err) => console.error(err));
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (selectedCategory && selectedCategory !== "all") params.append("category", selectedCategory);
      if (selectedOrigin) params.append("origin_country", selectedOrigin);
      if (selectedIncoterm && selectedIncoterm !== "all") params.append("incoterm", selectedIncoterm);
      if (selectedCurrency && selectedCurrency !== "all") params.append("currency", selectedCurrency);
      if (minMoq) params.append("min_moq", minMoq);
      if (maxMoq) params.append("max_moq", maxMoq);
      if (sort) params.append("sort", sort);
      params.append("page", page.toString());
      params.append("limit", "16");

      const res = await fetch(`${API_BASE}/import-export/products?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) setProducts(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [selectedCategory, selectedIncoterm, selectedCurrency, sort, page]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadProducts();
  };

  const toggleCompare = (product: InternationalProduct) => {
    if (compareItems.some((item) => item.id === product.id)) {
      setCompareItems(compareItems.filter((item) => item.id !== product.id));
    } else {
      if (compareItems.length >= 4) {
        alert("You can compare up to 4 trade products at a time.");
        return;
      }
      setCompareItems([...compareItems, product]);
    }
  };

  return (
    <div className="bg-[#FAF9F5] min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-stone-500 mb-4">
          <Link to="/" className="hover:text-stone-900">Home</Link>
          <ChevronRight className="w-3 h-3 text-stone-400" />
          <Link to="/import-export" className="hover:text-stone-900">Global Trade</Link>
          <ChevronRight className="w-3 h-3 text-stone-400" />
          <span className="font-semibold text-stone-800">Export Catalogues</span>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              International Export Catalogues
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              Source verified export products with standardized Incoterm rates, HS codes and container packaging.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/import-export/rfq"
              className="bg-indigo-900 hover:bg-indigo-800 text-white font-bold px-4 py-2 rounded-lg text-xs shadow-xs transition flex items-center gap-1.5"
            >
              <Ship className="w-3.5 h-3.5" /> Post Trade RFQ
            </Link>

            {compareItems.length > 0 && (
              <button
                onClick={() => setIsCompareModalOpen(true)}
                className="bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold px-3.5 py-2 rounded-lg text-xs shadow-xs transition flex items-center gap-1.5"
              >
                <Scale className="w-3.5 h-3.5 text-stone-950" />
                Compare ({compareItems.length})
              </button>
            )}
          </div>
        </div>

        {/* Layout: Sidebar Filters + Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <form onSubmit={handleFilterSubmit} className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-900" /> Filter Criteria
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setSelectedCategory("all");
                    setSelectedOrigin("");
                    setSelectedIncoterm("all");
                    setSelectedCurrency("all");
                    setMinMoq("");
                    setMaxMoq("");
                    setSort("newest");
                    setPage(1);
                  }}
                  className="text-[11px] text-stone-400 hover:text-stone-700 font-semibold"
                >
                  Reset
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Keywords</label>
                <div className="relative">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search product, HS code..."
                    className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 bg-stone-50 focus:outline-none focus:border-indigo-900"
                  />
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute right-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Product Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full text-xs border border-stone-300 rounded-lg px-2.5 py-2 bg-stone-50 focus:outline-none focus:border-indigo-900"
                >
                  <option value="all">All 8 Domains</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Incoterm Basis</label>
                <select
                  value={selectedIncoterm}
                  onChange={(e) => setSelectedIncoterm(e.target.value)}
                  className="w-full text-xs border border-stone-300 rounded-lg px-2.5 py-2 bg-stone-50 focus:outline-none focus:border-indigo-900"
                >
                  <option value="all">All Incoterms</option>
                  <option value="FOB">FOB (Free On Board)</option>
                  <option value="CIF">CIF (Cost, Insurance & Freight)</option>
                  <option value="CFR">CFR (Cost & Freight)</option>
                  <option value="EXW">EXW (Ex Works)</option>
                  <option value="DDP">DDP (Delivered Duty Paid)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Origin Country</label>
                <input
                  type="text"
                  value={selectedOrigin}
                  onChange={(e) => setSelectedOrigin(e.target.value)}
                  placeholder="e.g. India, Vietnam..."
                  className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 bg-stone-50 focus:outline-none focus:border-indigo-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Currency</label>
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="w-full text-xs border border-stone-300 rounded-lg px-2.5 py-2 bg-stone-50 focus:outline-none focus:border-indigo-900"
                >
                  <option value="all">All Currencies</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="AED">AED (د.إ)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">MOQ Range (MT/Units)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={minMoq}
                    onChange={(e) => setMinMoq(e.target.value)}
                    placeholder="Min MOQ"
                    className="w-full text-xs border border-stone-300 rounded-lg px-2 py-1.5 bg-stone-50 focus:outline-none"
                  />
                  <input
                    type="number"
                    value={maxMoq}
                    onChange={(e) => setMaxMoq(e.target.value)}
                    placeholder="Max MOQ"
                    className="w-full text-xs border border-stone-300 rounded-lg px-2 py-1.5 bg-stone-50 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-900 hover:bg-indigo-800 text-white font-bold py-2 px-4 rounded-lg text-xs transition shadow-xs"
              >
                Apply Trade Filters
              </button>
            </form>
          </div>

          {/* Main Grid */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-xl border border-stone-200 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-stone-600">
                Showing <strong className="text-stone-900">{products.length}</strong> international export listings
              </span>

              <div className="flex items-center gap-2">
                <span className="text-stone-500 font-medium">Sort by:</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="border border-stone-300 rounded-lg px-2 py-1 bg-stone-50 text-stone-800 focus:outline-none font-medium"
                >
                  <option value="newest">Recently Published</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="moq_asc">MOQ: Lowest First</option>
                </select>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-72 bg-stone-200/60 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => {
                  const isCompared = compareItems.some((item) => item.id === product.id);

                  return (
                    <div
                      key={product.id}
                      className="bg-white rounded-xl border border-stone-200 hover:border-indigo-300 hover:shadow-md transition flex flex-col justify-between overflow-hidden"
                    >
                      <div>
                        <div className="h-44 bg-stone-100 flex items-center justify-center relative overflow-hidden">
                          {product.images && product.images[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-12 h-12 text-stone-300" />
                          )}

                          <span className="absolute top-2 left-2 bg-stone-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded">
                            {product.incoterm_basis} • {product.currency}
                          </span>

                          {product.hs_code && (
                            <span className="absolute bottom-2 left-2 bg-indigo-900/80 backdrop-blur-xs text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
                              HS {product.hs_code}
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => toggleCompare(product)}
                            className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-1 rounded shadow-xs flex items-center gap-1 transition ${
                              isCompared
                                ? "bg-amber-400 text-stone-950 font-bold"
                                : "bg-white/90 text-stone-700 hover:bg-white"
                            }`}
                          >
                            <Scale className="w-3 h-3" />
                            {isCompared ? "Compared" : "Compare"}
                          </button>
                        </div>

                        <div className="p-4">
                          <Link to={`/import-export/products/${product.slug}`}>
                            <h2 className="font-bold text-stone-900 text-xs line-clamp-2 hover:text-indigo-950 transition">
                              {product.name}
                            </h2>
                          </Link>

                          <div className="mt-2 space-y-1 text-[11px] text-stone-600">
                            <div><span className="font-semibold text-stone-700">Origin:</span> {product.origin_country}</div>
                            {product.loading_port && (
                              <div><span className="font-semibold text-stone-700">Port:</span> {product.loading_port}</div>
                            )}
                            <div><span className="font-semibold text-stone-700">Lead Time:</span> {product.export_lead_time_days} days</div>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 pt-2 border-t border-stone-100 flex items-center justify-between bg-stone-50/50">
                        <div>
                          <div className="text-[10px] text-stone-400 font-semibold uppercase">{product.incoterm_basis} Rate</div>
                          <div className="text-sm font-extrabold text-indigo-950">
                            ${product.base_price_fob.toLocaleString("en-IN")}{" "}
                            <span className="text-[10px] font-normal text-stone-500">/ {product.unit_of_measurement}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-[10px] text-stone-400 font-semibold uppercase">MOQ</div>
                          <div className="text-xs font-bold text-stone-700">
                            {product.moq} {product.unit_of_measurement}s
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
                <Globe className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <h3 className="font-bold text-stone-800 text-sm">No Export Products Found</h3>
                <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
                  Try adjusting your country or category criteria.
                </p>
                <Link
                  to="/import-export/rfq"
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-900 text-white font-bold text-xs rounded-lg hover:bg-indigo-800 transition"
                >
                  Post an Import Requirement for Verified Exporters
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Side-by-Side Trade Product Comparison Modal */}
      {isCompareModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-indigo-900" />
                <h3 className="text-lg font-bold text-stone-900">
                  International Trade Comparison ({compareItems.length} Products)
                </h3>
              </div>
              <button
                onClick={() => setIsCompareModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-200">
                    <th className="p-3 bg-stone-50 font-bold text-stone-700 w-1/5">Trade Parameter</th>
                    {compareItems.map((item) => (
                      <th key={item.id} className="p-3 font-bold text-stone-900 w-1/5">
                        <div className="line-clamp-2">{item.name}</div>
                        <button
                          onClick={() => toggleCompare(item)}
                          className="text-[10px] text-red-600 hover:underline mt-1 font-semibold block"
                        >
                          Remove
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  <tr>
                    <td className="p-3 bg-stone-50 font-semibold text-stone-600">Harmonized Tariff (HS) Code</td>
                    {compareItems.map((item) => (
                      <td key={item.id} className="p-3 font-mono font-bold text-indigo-950">{item.hs_code || "N/A"}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 bg-stone-50 font-semibold text-stone-600">Incoterm Basis</td>
                    {compareItems.map((item) => (
                      <td key={item.id} className="p-3 text-stone-800">{item.incoterm_basis}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 bg-stone-50 font-semibold text-stone-600">Origin Country</td>
                    {compareItems.map((item) => (
                      <td key={item.id} className="p-3 text-stone-800">{item.origin_country}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 bg-stone-50 font-semibold text-stone-600">Primary Loading Port</td>
                    {compareItems.map((item) => (
                      <td key={item.id} className="p-3 text-stone-800">{item.loading_port || "Port of India"}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 bg-stone-50 font-semibold text-stone-600">Base Unit Rate</td>
                    {compareItems.map((item) => (
                      <td key={item.id} className="p-3 font-bold text-indigo-950">
                        ${item.base_price_fob.toLocaleString("en-IN")} / {item.unit_of_measurement}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 bg-stone-50 font-semibold text-stone-600">MOQ (FCL/LCL)</td>
                    {compareItems.map((item) => (
                      <td key={item.id} className="p-3 font-semibold text-stone-800">
                        {item.moq} {item.unit_of_measurement}s
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 bg-stone-50 font-semibold text-stone-600">Packaging Specifications</td>
                    {compareItems.map((item) => (
                      <td key={item.id} className="p-3 text-stone-700">{item.packaging_details || "Standard Export Packing"}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-stone-200">
              <button
                onClick={() => setCompareItems([])}
                className="px-4 py-2 border border-stone-300 rounded-lg text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                Clear Comparison
              </button>
              <button
                onClick={() => setIsCompareModalOpen(false)}
                className="px-5 py-2 bg-indigo-900 text-white rounded-lg text-xs font-bold hover:bg-indigo-800"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InternationalProductListPage;
