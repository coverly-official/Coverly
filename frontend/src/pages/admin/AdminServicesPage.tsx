import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Briefcase,
  Layers,
  Plus,
  ShieldCheck,
  Ban,
  CheckCircle,
  FolderPlus,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const AdminServicesPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalServices: 0,
    totalProviders: 0,
    totalRequests: 0,
    totalCategories: 0,
  });

  const [activeTab, setActiveTab] = useState<"services" | "categories">("services");
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Category form state
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [isAddingCat, setIsAddingCat] = useState(false);

  // New Subcategory form state
  const [selectedCatId, setSelectedCatId] = useState("");
  const [newSubName, setNewSubName] = useState("");
  const [newSubDesc, setNewSubDesc] = useState("");
  const [isAddingSub, setIsAddingSub] = useState(false);

  const fetchStats = () => {
    fetch(`${API_BASE}/business-services/admin/stats`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setStats(data.data);
      })
      .catch(() => {});
  };

  const fetchServices = () => {
    setIsLoading(true);
    fetch(`${API_BASE}/business-services?limit=100`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setServices(data.data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  const fetchCategories = () => {
    fetch(`${API_BASE}/business-services/categories`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCategories(data.data);
          if (data.data.length > 0 && !selectedCatId) {
            setSelectedCatId(data.data[0].id);
          }
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchStats();
    fetchServices();
    fetchCategories();
  }, []);

  const handleToggleStatus = async (serviceId: string, currentStatus: boolean) => {
    if (!user) return;
    const reason = prompt(
      `Enter reason for ${!currentStatus ? "approving" : "suspending"} this service listing:`
    );
    if (reason === null) return;

    try {
      const res = await fetch(
        `${API_BASE}/business-services/admin/services/${serviceId}/moderate`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            is_active: !currentStatus,
            admin_id: user.id,
            reason,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update service status.");
      }

      fetchServices();
      fetchStats();
    } catch (err: any) {
      alert(err.message || "Failed to update status.");
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/business-services/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCatName.trim(),
          description: newCatDesc.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to add category.");
      }

      setNewCatName("");
      setNewCatDesc("");
      setIsAddingCat(false);
      fetchCategories();
      fetchStats();
    } catch (err: any) {
      alert(err.message || "Failed to add category.");
    }
  };

  const handleAddSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCatId || !newSubName.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/business-services/subcategories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category_id: selectedCatId,
          name: newSubName.trim(),
          description: newSubDesc.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to add subcategory.");
      }

      setNewSubName("");
      setNewSubDesc("");
      setIsAddingSub(false);
      fetchCategories();
    } catch (err: any) {
      alert(err.message || "Failed to add subcategory.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Business Services Administration
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Moderate service provider listings, manage service categories, and monitor procurement metrics.
          </p>
        </div>
        <button
          onClick={() => {
            fetchStats();
            fetchServices();
            fetchCategories();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-medium self-start sm:self-auto transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
            Total Services
          </div>
          <div className="text-2xl font-bold text-stone-900 mt-1">{stats.totalServices}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
            Verified Providers
          </div>
          <div className="text-2xl font-bold text-stone-900 mt-1">{stats.totalProviders}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
            Client Inquiries
          </div>
          <div className="text-2xl font-bold text-stone-900 mt-1">{stats.totalRequests}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
            Core Categories
          </div>
          <div className="text-2xl font-bold text-stone-900 mt-1">{stats.totalCategories}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 gap-6">
        <button
          onClick={() => setActiveTab("services")}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider transition border-b-2 ${
            activeTab === "services"
              ? "border-stone-900 text-stone-900"
              : "border-transparent text-stone-500 hover:text-stone-700"
          }`}
        >
          Service Listings Moderation
        </button>
        <button
          onClick={() => setActiveTab("categories")}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider transition border-b-2 ${
            activeTab === "categories"
              ? "border-stone-900 text-stone-900"
              : "border-transparent text-stone-500 hover:text-stone-700"
          }`}
        >
          Categories & Subcategories
        </button>
      </div>

      {/* Tab 1: Service Listings */}
      {activeTab === "services" && (
        <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-stone-200 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-stone-900">
              Published Business Services ({services.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-xs text-stone-500">Loading services...</div>
          ) : services.length === 0 ? (
            <div className="p-12 text-center text-xs text-stone-500">
              No services registered yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-700">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-medium">
                  <tr>
                    <th className="px-4 py-3">Service Name</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Provider</th>
                    <th className="px-4 py-3">Starting Price</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Moderation Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {services.map((item) => (
                    <tr key={item.id} className="hover:bg-stone-50/50 transition">
                      <td className="px-4 py-3 font-medium text-stone-900">
                        {item.title}
                        {item.is_featured && (
                          <span className="ml-2 px-1.5 py-0.5 text-[9px] font-semibold bg-amber-100 text-amber-800 rounded">
                            Featured
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-stone-600">
                        {item.category?.name || "Uncategorized"}
                      </td>
                      <td className="px-4 py-3 text-stone-600">
                        {item.business?.legal_name || "Unknown Business"}
                      </td>
                      <td className="px-4 py-3 font-semibold text-stone-900">
                        {item.starting_price
                          ? `₹${Number(item.starting_price).toLocaleString("en-IN")}`
                          : "On Quote"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                            item.is_active
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          {item.is_active ? "Active" : "Suspended"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleToggleStatus(item.id, item.is_active)}
                          className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                            item.is_active
                              ? "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                          }`}
                        >
                          {item.is_active ? "Suspend" : "Approve"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Categories & Subcategories */}
      {activeTab === "categories" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
            <p className="text-xs text-stone-600 max-w-xl">
              Categories and subcategories are dynamic and can be added or updated at any time without hardcoded limits.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setIsAddingCat(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-medium transition"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                Add Category
              </button>
              <button
                onClick={() => setIsAddingSub(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 rounded-lg text-xs font-medium transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Subcategory
              </button>
            </div>
          </div>

          {/* New Category Modal/Panel */}
          {isAddingCat && (
            <form
              onSubmit={handleAddCategory}
              className="bg-white p-5 rounded-xl border border-stone-300 shadow-sm space-y-4"
            >
              <h3 className="text-sm font-semibold text-stone-900">Create New Service Category</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="e.g. Export Compliance"
                    className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newCatDesc}
                    onChange={(e) => setNewCatDesc(e.target.value)}
                    placeholder="Short description of this service domain"
                    className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingCat(false)}
                  className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-medium hover:bg-stone-800 transition"
                >
                  Save Category
                </button>
              </div>
            </form>
          )}

          {/* New Subcategory Modal/Panel */}
          {isAddingSub && (
            <form
              onSubmit={handleAddSubcategory}
              className="bg-white p-5 rounded-xl border border-stone-300 shadow-sm space-y-4"
            >
              <h3 className="text-sm font-semibold text-stone-900">Create Subcategory</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Parent Category *
                  </label>
                  <select
                    value={selectedCatId}
                    onChange={(e) => setSelectedCatId(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Subcategory Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                    placeholder="e.g. Customs Documentation"
                    className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newSubDesc}
                    onChange={(e) => setNewSubDesc(e.target.value)}
                    placeholder="Brief description"
                    className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingSub(false)}
                  className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-medium hover:bg-stone-800 transition"
                >
                  Save Subcategory
                </button>
              </div>
            </form>
          )}

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-stone-900">{cat.name}</h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-stone-100 text-stone-700 rounded-full">
                    {cat.subcategories?.length || 0} subcategories
                  </span>
                </div>
                <p className="text-xs text-stone-500">{cat.description || "No description provided."}</p>

                <div className="pt-2 border-t border-stone-100">
                  <div className="flex flex-wrap gap-1.5">
                    {(cat.subcategories || []).map((sub: any) => (
                      <span
                        key={sub.id}
                        className="text-[11px] px-2 py-1 bg-stone-50 border border-stone-200 rounded text-stone-700"
                      >
                        {sub.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
