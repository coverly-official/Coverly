import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  Filter,
  Package,
  Layers,
  MapPin,
  ChevronRight,
  ArrowUpDown,
  Check,
  X,
  SlidersHorizontal,
  Scale,
  Sparkles,
  ArrowRight,
  Info,
} from "lucide-react";
import { PackagingProduct, PackagingCategory } from "../../types";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const PackagingProductListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<PackagingProduct[]>([]);
  const [categories, setCategories] = useState<PackagingCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all");
  const [selectedMaterial, setSelectedMaterial] = useState(searchParams.get("material") || "");
  const [selectedPackagingType, setSelectedPackagingType] = useState(searchParams.get("packaging_type") || "all");
  const [minMoq, setMinMoq] = useState(searchParams.get("min_moq") || "");
  const [maxMoq, setMaxMoq] = useState(searchParams.get("max_moq") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Comparison State (Max 4 items)
  const [compareItems, setCompareItems] = useState<PackagingProduct[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Fetch Categories
  useEffect(() => {
    fetch(`${API_BASE}/packaging/categories`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setCategories(json.data || []);
      })
      .catch((err) => console.error(err));
  }, []);

  // Fetch Products
  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (selectedCategory && selectedCategory !== "all") params.append("category", selectedCategory);
      if (selectedMaterial) params.append("material", selectedMaterial);
      if (selectedPackagingType && selectedPackagingType !== "all") params.append("packaging_type", selectedPackagingType);
      if (minMoq) params.append("min_moq", minMoq);
      if (maxMoq) params.append("max_moq", maxMoq);
      if (sort) params.append("sort", sort);
      params.append("page", page.toString());
      params.append("limit", "16");

      const res = await fetch(`${API_BASE}/packaging/products?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setProducts(json.data || []);
          if (json.pagination) {
            setTotalPages(Math.max(1, Math.ceil(json.pagination.total / json.pagination.limit)));
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
    loadProducts();
  }, [selectedCategory, selectedPackagingType, sort, page]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadProducts();
  };

  const toggleCompare = (product: PackagingProduct) => {
    if (compareItems.some((item) => item.id === product.id)) {
      setCompareItems(compareItems.filter((item) => item.id !== product.id));
    } else {
      if (compareItems.length >= 4) {
        alert("You can compare up to 4 packaging products at a time.");
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
          <Link to="/packaging" className="hover:text-stone-900">Packaging Marketplace</Link>
          <ChevronRight className="w-3 h-3 text-stone-400" />
          <span className="font-semibold text-stone-800">Products & Catalogues</span>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              Packaging Product Catalogues
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              Filter by material structure, thickness, dimensions, MOQ, and printing capabilities.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/packaging/rfq"
              className="bg-blue-900 hover:bg-blue-800 text-white font-bold px-4 py-2 rounded-lg text-xs shadow-xs transition flex items-center gap-1.5"
            >
              <Package className="w-3.5 h-3.5" /> Post Custom RFQ
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
                  <SlidersHorizontal className="w-3.5 h-3.5 text-blue-900" /> Filter Criteria
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setSelectedCategory("all");
                    setSelectedMaterial("");
                    setSelectedPackagingType("all");
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

              {/* Keyword Search */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Keywords</label>
                <div className="relative">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search pouch, carton, roll..."
                    className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-900 bg-stone-50"
                  />
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute right-3 top-2.5" />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Packaging Domain</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full text-xs border border-stone-300 rounded-lg px-2.5 py-2 focus:outline-none focus:border-blue-900 bg-stone-50"
                >
                  <option value="all">All Domains</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Packaging Type */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Packaging Type</label>
                <select
                  value={selectedPackagingType}
                  onChange={(e) => setSelectedPackagingType(e.target.value)}
                  className="w-full text-xs border border-stone-300 rounded-lg px-2.5 py-2 focus:outline-none focus:border-blue-900 bg-stone-50"
                >
                  <option value="all">All Types</option>
                  <option value="Flexible Pouch">Flexible Pouches</option>
                  <option value="Corrugated Box">Corrugated Boxes</option>
                  <option value="Rigid Container">Rigid Containers</option>
                  <option value="Roll">Packaging Rolls</option>
                  <option value="Label">Labels & Stickers</option>
                  <option value="Sack">Industrial Sacks / Bulk Bags</option>
                </select>
              </div>

              {/* Material Type */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Material Substrate</label>
                <input
                  type="text"
                  value={selectedMaterial}
                  onChange={(e) => setSelectedMaterial(e.target.value)}
                  placeholder="e.g. PET, Kraft, Virgin HDPE..."
                  className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-900 bg-stone-50"
                />
              </div>

              {/* MOQ Range */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">MOQ Range</label>
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
                className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded-lg text-xs transition shadow-xs"
              >
                Apply Filters
              </button>
            </form>
          </div>

          {/* Main Catalog Grid */}
          <div className="lg:col-span-3 space-y-4">
            {/* Sorting Header */}
            <div className="bg-white rounded-xl border border-stone-200 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-stone-600">
                Showing <strong className="text-stone-900">{products.length}</strong> packaging listings
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

            {/* Products Grid */}
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
                      className="bg-white rounded-xl border border-stone-200 hover:border-blue-300 hover:shadow-md transition flex flex-col justify-between overflow-hidden"
                    >
                      <div>
                        {/* Image Header */}
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
                            {product.packaging_type || "Packaging"}
                          </span>

                          <button
                            type="button"
                            onClick={() => toggleCompare(product)}
                            title="Add to side-by-side comparison"
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

                        {/* Body Details */}
                        <div className="p-4">
                          <Link to={`/packaging/products/${product.slug}`}>
                            <h2 className="font-bold text-stone-900 text-xs line-clamp-2 hover:text-blue-950 transition">
                              {product.name}
                            </h2>
                          </Link>

                          <div className="mt-2 space-y-1 text-[11px] text-stone-600">
                            <div><span className="font-semibold text-stone-700">Material:</span> {product.material_type}</div>
                            {product.thickness && (
                              <div><span className="font-semibold text-stone-700">Thickness:</span> {product.thickness}</div>
                            )}
                            {product.capacity && (
                              <div><span className="font-semibold text-stone-700">Capacity:</span> {product.capacity}</div>
                            )}
                          </div>

                          {/* Printing options pills */}
                          {product.printing_options && product.printing_options.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1">
                              {product.printing_options.slice(0, 2).map((opt, idx) => (
                                <span key={idx} className="text-[10px] font-medium bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded">
                                  {opt}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer: Price & MOQ */}
                      <div className="p-4 pt-2 border-t border-stone-100 flex items-center justify-between bg-stone-50/50">
                        <div>
                          <div className="text-[10px] text-stone-400 font-semibold uppercase">Base Price</div>
                          <div className="text-sm font-extrabold text-blue-950">
                            ₹{product.base_price.toLocaleString("en-IN")}{" "}
                            <span className="text-[10px] font-normal text-stone-500">/ {product.unit_of_measurement}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-[10px] text-stone-400 font-semibold uppercase">MOQ</div>
                          <div className="text-xs font-bold text-stone-700">
                            {product.moq.toLocaleString("en-IN")} {product.unit_of_measurement}s
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
                <Package className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <h3 className="font-bold text-stone-800 text-sm">No Packaging Products Found</h3>
                <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
                  Try adjusting your search keywords, MOQ or category filters.
                </p>
                <Link
                  to="/packaging/rfq"
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-900 text-white font-bold text-xs rounded-lg hover:bg-blue-800 transition"
                >
                  Post a Custom Requirement for Converters
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Side-by-Side Product Comparison Modal */}
      {isCompareModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-blue-900" />
                <h3 className="text-lg font-bold text-stone-900">
                  Technical Packaging Comparison ({compareItems.length} Products)
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
                    <th className="p-3 bg-stone-50 font-bold text-stone-700 w-1/5">Attribute</th>
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
                    <td className="p-3 bg-stone-50 font-semibold text-stone-600">Material Substrate</td>
                    {compareItems.map((item) => (
                      <td key={item.id} className="p-3 text-stone-800">{item.material_type}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 bg-stone-50 font-semibold text-stone-600">Thickness / Structure</td>
                    {compareItems.map((item) => (
                      <td key={item.id} className="p-3 text-stone-800">{item.thickness || "Configurable"}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 bg-stone-50 font-semibold text-stone-600">Capacity / Volume</td>
                    {compareItems.map((item) => (
                      <td key={item.id} className="p-3 text-stone-800">{item.capacity || "Customizable"}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 bg-stone-50 font-semibold text-stone-600">Base Unit Price</td>
                    {compareItems.map((item) => (
                      <td key={item.id} className="p-3 font-bold text-blue-950">
                        ₹{item.base_price.toLocaleString("en-IN")} / {item.unit_of_measurement}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 bg-stone-50 font-semibold text-stone-600">Minimum Order Qty (MOQ)</td>
                    {compareItems.map((item) => (
                      <td key={item.id} className="p-3 font-semibold text-stone-800">
                        {item.moq.toLocaleString("en-IN")} {item.unit_of_measurement}s
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 bg-stone-50 font-semibold text-stone-600">Production Lead Time</td>
                    {compareItems.map((item) => (
                      <td key={item.id} className="p-3 text-stone-800">{item.lead_time_days} Days</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 bg-stone-50 font-semibold text-stone-600">Printing Capabilities</td>
                    {compareItems.map((item) => (
                      <td key={item.id} className="p-3 text-stone-700">
                        {item.printing_options && item.printing_options.length > 0
                          ? item.printing_options.join(", ")
                          : "Custom printing on request"}
                      </td>
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
                className="px-5 py-2 bg-blue-900 text-white rounded-lg text-xs font-bold hover:bg-blue-800"
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

export default PackagingProductListPage;
