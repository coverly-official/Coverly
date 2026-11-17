import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  List,
  Plus,
  Edit2,
  FolderTree,
  Tag,
  ShoppingBag,
  Search,
  X,
  Layers,
  ArrowRight,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const AdminCategoriesPage: React.FC = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modals
  const [isAddCatModal, setIsAddCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState<any | null>(null);
  const [subcatParent, setSubcatParent] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [catForm, setCatForm] = useState({
    id: "",
    name: "",
    description: "",
    icon: "Layers",
  });

  const [subcatName, setSubcatName] = useState("");
  const [subcatDesc, setSubcatDesc] = useState("");

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    "x-user-id": user?.id || localStorage.getItem("coverly_user_id") || "",
  });

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/categories`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setCategories(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch admin categories", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.name) return;
    setActionLoading(true);

    try {
      const slug = catForm.id
        ? catForm.id.toLowerCase().replace(/[^a-z0-9-]/g, "-")
        : catForm.name.toLowerCase().replace(/[^a-z0-9-]/g, "-");

      const res = await fetch(`${API_BASE}/admin/categories`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          id: slug,
          name: catForm.name,
          description: catForm.description,
          icon: catForm.icon,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsAddCatModal(false);
        setCatForm({ id: "", name: "", description: "", icon: "Layers" });
        fetchCategories();
      } else {
        alert(data.error || "Failed to create category.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to create category.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat) return;
    setActionLoading(true);

    try {
      const res = await fetch(`${API_BASE}/admin/categories/${editingCat.id}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: editingCat.name,
          description: editingCat.description,
          icon: editingCat.icon,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingCat(null);
        fetchCategories();
      } else {
        alert(data.error || "Failed to update category.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to update category.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subcatParent || !subcatName) return;
    setActionLoading(true);

    try {
      const res = await fetch(`${API_BASE}/admin/categories/${subcatParent.id}/subcategories`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: subcatName,
          description: subcatDesc,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubcatParent(null);
        setSubcatName("");
        setSubcatDesc("");
        fetchCategories();
      } else {
        alert(data.error || "Failed to add subcategory.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to add subcategory.");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredCategories = categories.filter((c) => {
    if (!search) return true;
    const term = search.toLowerCase();
    const nameMatch = c.name?.toLowerCase().includes(term);
    const descMatch = c.description?.toLowerCase().includes(term);
    const subMatch = c.subcategories?.some((s: any) => s.name?.toLowerCase().includes(term));
    return nameMatch || descMatch || subMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Marketplace Category Taxonomy
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Organize B2B industry verticals, maintain subcategory hierarchies, and audit live inventory distribution.
          </p>
        </div>
        <button
          onClick={() => setIsAddCatModal(true)}
          className="inline-flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Add Primary Category
        </button>
      </div>

      {/* Search & Stats */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white border border-stone-200 rounded-xl p-4 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
          <input
            type="text"
            placeholder="Search categories and subcategories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900"
          />
        </div>
        <div className="flex items-center gap-4 text-xs text-stone-600">
          <span>
            Total Categories: <strong className="text-stone-900">{categories.length}</strong>
          </span>
          <span>
            Total Subcategories:{" "}
            <strong className="text-stone-900">
              {categories.reduce((acc, c) => acc + (c.subcategories?.length || 0), 0)}
            </strong>
          </span>
        </div>
      </div>

      {/* Category Cards Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-stone-400 bg-white border border-stone-200 rounded-xl">
          <div className="inline-block animate-spin w-5 h-5 border-2 border-stone-300 border-t-stone-900 rounded-full mb-2"></div>
          <p className="text-xs">Loading taxonomy hierarchy from database...</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="py-16 text-center text-stone-400 bg-white border border-stone-200 rounded-xl text-xs">
          No categories found matching your query.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCategories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-700 font-bold shrink-0">
                      <FolderTree className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                        {cat.name}
                        <span className="text-[10px] font-mono text-stone-400 font-normal">
                          ({cat.id})
                        </span>
                      </h3>
                      <p className="text-xs text-stone-500 mt-0.5 line-clamp-2">
                        {cat.description || "No description configured."}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setEditingCat({ ...cat })}
                    className="p-1.5 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition"
                    title="Edit Category"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Subcategories list */}
                <div className="mt-4 pt-3 border-t border-stone-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                      Subcategories ({cat.subcategories?.length || 0})
                    </span>
                    <button
                      onClick={() => setSubcatParent(cat)}
                      className="text-[11px] font-semibold text-stone-900 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Add Subcategory
                    </button>
                  </div>

                  {cat.subcategories && cat.subcategories.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {cat.subcategories.map((sub: any) => (
                        <span
                          key={sub.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] bg-stone-50 border border-stone-200 text-stone-700"
                        >
                          <Tag className="w-2.5 h-2.5 text-stone-400" />
                          {sub.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-stone-400 italic">No subcategories defined.</p>
                  )}
                </div>
              </div>

              {/* Footer info */}
              <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                <span className="inline-flex items-center gap-1.5 font-medium text-stone-800">
                  <ShoppingBag className="w-3.5 h-3.5 text-stone-400" />
                  {cat.product_count || 0} active catalog items
                </span>
                <span className="text-[10px] text-stone-400">Order: {cat.display_order ?? 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: ADD CATEGORY */}
      {isAddCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-bold text-base text-stone-900">Add Primary Category</h3>
              <button
                onClick={() => setIsAddCatModal(false)}
                className="p-1 text-stone-400 hover:text-stone-900 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Solar & Renewable Energy"
                  value={catForm.name}
                  onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Unique Slug / ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. solar-renewable-energy"
                  value={catForm.id}
                  onChange={(e) => setCatForm({ ...catForm, id: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900"
                />
                <p className="text-[10px] text-stone-400 mt-1">
                  Leave empty to generate automatically from name.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="B2B wholesale category scope and applications..."
                  value={catForm.description}
                  onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsAddCatModal(false)}
                  className="px-4 py-2 border border-stone-200 rounded-lg font-medium text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded-lg shadow-sm disabled:opacity-50"
                >
                  {actionLoading ? "Saving..." : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT CATEGORY */}
      {editingCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-bold text-base text-stone-900">Edit Category: {editingCat.name}</h3>
              <button
                onClick={() => setEditingCat(null)}
                className="p-1 text-stone-400 hover:text-stone-900 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCategory} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={editingCat.name}
                  onChange={(e) => setEditingCat({ ...editingCat, name: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingCat.description || ""}
                  onChange={(e) => setEditingCat({ ...editingCat, description: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setEditingCat(null)}
                  className="px-4 py-2 border border-stone-200 rounded-lg font-medium text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded-lg shadow-sm disabled:opacity-50"
                >
                  {actionLoading ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD SUBCATEGORY */}
      {subcatParent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div>
                <h3 className="font-bold text-base text-stone-900">Add Subcategory</h3>
                <p className="text-xs text-stone-500">Under: {subcatParent.name}</p>
              </div>
              <button
                onClick={() => setSubcatParent(null)}
                className="p-1 text-stone-400 hover:text-stone-900 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubcategory} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Subcategory Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Corrugated Cardboard Boxes"
                  value={subcatName}
                  onChange={(e) => setSubcatName(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Specific product scope within this subcategory..."
                  value={subcatDesc}
                  onChange={(e) => setSubcatDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setSubcatParent(null)}
                  className="px-4 py-2 border border-stone-200 rounded-lg font-medium text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded-lg shadow-sm disabled:opacity-50"
                >
                  {actionLoading ? "Adding..." : "Add Subcategory"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
