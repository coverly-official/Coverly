import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { ProductImage } from "@/components/ui/ProductImage";
import { insforge } from "@/lib/insforge";
import {
  Search,
  Filter,
  Plus,
  Edit2,
  Archive,
  RotateCcw,
  Image as ImageIcon,
  CheckCircle2,
  X,
  Upload,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  PackageCheck,
  Building,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const AdminProductsPage: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "archived">("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals state
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [imageModalProduct, setImageModalProduct] = useState<any | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Image upload state
  const [uploadUrl, setUploadUrl] = useState("");
  const [uploadAlt, setUploadAlt] = useState("");
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  // New product form
  const [newProduct, setNewProduct] = useState({
    title: "",
    description: "",
    category_id: "",
    subcategory_id: "",
    supplier_id: "",
    indicative_price: "",
    unit: "Piece",
    moq: "100",
  });

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    "x-user-id": user?.id || localStorage.getItem("coverly_user_id") || "",
  });

  // Fetch categories & suppliers for dropdowns
  useEffect(() => {
    fetch(`${API_BASE}/categories`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setCategories(data.data);
        }
      })
      .catch(() => {});

    fetch(`${API_BASE}/admin/businesses?limit=100`, { headers: getAuthHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.businesses) {
          setBusinesses(data.data.businesses);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch products
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "15");
      if (search) params.set("search", search);
      if (selectedCategory) params.set("category", selectedCategory);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`${API_BASE}/admin/products?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setProducts(data.data.products || []);
        setTotalPages(data.data.totalPages || 1);
        setTotalCount(data.data.total || 0);
      }
    } catch (err) {
      console.error("Failed to load admin products", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, search, selectedCategory, statusFilter]);

  // Toggle Moderate Status (Archive / Restore)
  const handleToggleModerate = async (product: any) => {
    const newStatus = !product.is_active;
    const confirmMsg = newStatus
      ? `Restore "${product.title}" to public active catalog?`
      : `Archive "${product.title}"? It will no longer appear in public marketplace search.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`${API_BASE}/admin/products/${product.id}/moderate`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          is_active: newStatus,
          reason: newStatus ? "Admin restored catalog item" : "Admin archived catalog item",
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchProducts();
      } else {
        alert(data.error || "Failed to update product status.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to moderate product.");
    }
  };

  // Save Edit Product
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setActionLoading(true);

    try {
      const res = await fetch(`${API_BASE}/admin/products/${editingProduct.id}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: editingProduct.title,
          description: editingProduct.description,
          indicative_price: Number(editingProduct.indicative_price) || 0,
          unit: editingProduct.unit,
          moq: Number(editingProduct.moq) || 1,
          category_id: editingProduct.category_id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingProduct(null);
        fetchProducts();
      } else {
        alert(data.error || "Failed to update product.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to update product.");
    } finally {
      setActionLoading(false);
    }
  };

  // Create New Product
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.title || !newProduct.category_id || !newProduct.supplier_id) {
      alert("Please fill in Title, Category, and Supplier.");
      return;
    }
    setActionLoading(true);

    try {
      const res = await fetch(`${API_BASE}/admin/products`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: newProduct.title,
          description: newProduct.description,
          category_id: newProduct.category_id,
          subcategory_id: newProduct.subcategory_id || null,
          supplier_id: newProduct.supplier_id,
          indicative_price: Number(newProduct.indicative_price) || 0,
          unit: newProduct.unit,
          moq: Number(newProduct.moq) || 1,
          is_active: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsAddModalOpen(false);
        setNewProduct({
          title: "",
          description: "",
          category_id: "",
          subcategory_id: "",
          supplier_id: "",
          indicative_price: "",
          unit: "Piece",
          moq: "100",
        });
        fetchProducts();
      } else {
        alert(data.error || "Failed to create product.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to create product.");
    } finally {
      setActionLoading(false);
    }
  };

  // Image Upload File to InsForge Storage
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !imageModalProduct) return;

    setIsUploadingFile(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const fileKey = `prod_${imageModalProduct.id}_${Date.now()}.${ext}`;

      const { data, error } = await (insforge.storage.from("products") as any).upload(fileKey, file);

      if (error) throw error;

      const { data: pubData } = insforge.storage.from("products").getPublicUrl(data?.key || fileKey);
      const publicUrl = pubData?.publicUrl || `https://4vwfw2w8.ap-southeast.insforge.app/api/storage/buckets/products/objects/${fileKey}`;

      // Attach to product
      const res = await fetch(`${API_BASE}/admin/products/${imageModalProduct.id}/images`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          image_url: publicUrl,
          image_key: data?.key || fileKey,
          alt_text: file.name,
          is_primary: !(imageModalProduct.images && imageModalProduct.images.length > 0),
        }),
      });
      const attachData = await res.json();
      if (attachData.success) {
        // Refresh product in modal
        const refreshedRes = await fetch(`${API_BASE}/admin/products/${imageModalProduct.id}`, {
          headers: getAuthHeaders(),
        });
        const refreshed = await refreshedRes.json();
        if (refreshed.success) {
          setImageModalProduct(refreshed.data);
          fetchProducts();
        }
      }
    } catch (err: any) {
      alert(err.message || "Failed to upload image file.");
    } finally {
      setIsUploadingFile(false);
    }
  };

  // Add Image via Direct URL
  const handleAddImageUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadUrl || !imageModalProduct) return;
    setIsUploadingFile(true);

    try {
      const res = await fetch(`${API_BASE}/admin/products/${imageModalProduct.id}/images`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          image_url: uploadUrl,
          alt_text: uploadAlt || imageModalProduct.title,
          is_primary: !(imageModalProduct.images && imageModalProduct.images.length > 0),
        }),
      });
      const attachData = await res.json();
      if (attachData.success) {
        setUploadUrl("");
        setUploadAlt("");
        const refreshedRes = await fetch(`${API_BASE}/admin/products/${imageModalProduct.id}`, {
          headers: getAuthHeaders(),
        });
        const refreshed = await refreshedRes.json();
        if (refreshed.success) {
          setImageModalProduct(refreshed.data);
          fetchProducts();
        }
      } else {
        alert(attachData.error || "Failed to attach image.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to attach image.");
    } finally {
      setIsUploadingFile(false);
    }
  };

  // Delete Image
  const handleDeleteImage = async (imageId: string) => {
    if (!imageModalProduct || !window.confirm("Remove this image from product?")) return;

    try {
      const res = await fetch(
        `${API_BASE}/admin/products/${imageModalProduct.id}/images/${imageId}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );
      const data = await res.json();
      if (data.success) {
        const refreshedRes = await fetch(`${API_BASE}/admin/products/${imageModalProduct.id}`, {
          headers: getAuthHeaders(),
        });
        const refreshed = await refreshedRes.json();
        if (refreshed.success) {
          setImageModalProduct(refreshed.data);
          fetchProducts();
        }
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete image.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Wholesale Catalog & Product Governance
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Manage live marketplace inventory, moderate listings, assign pricing tiers, and curate product media.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Add Product Listing
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
            <input
              type="text"
              placeholder="Search products by title, description, or supplier..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="text-xs border border-stone-200 rounded-lg px-3 py-2 bg-white text-stone-700 focus:outline-none focus:border-stone-900"
            >
              <option value="">All Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <div className="inline-flex bg-stone-100 p-0.5 rounded-lg text-xs font-medium">
              <button
                onClick={() => {
                  setStatusFilter("all");
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-md transition ${
                  statusFilter === "all" ? "bg-white text-stone-900 shadow-xs" : "text-stone-600"
                }`}
              >
                All
              </button>
              <button
                onClick={() => {
                  setStatusFilter("active");
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-md transition ${
                  statusFilter === "active" ? "bg-white text-emerald-800 shadow-xs" : "text-stone-600"
                }`}
              >
                Active
              </button>
              <button
                onClick={() => {
                  setStatusFilter("archived");
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-md transition ${
                  statusFilter === "archived" ? "bg-white text-stone-800 shadow-xs" : "text-stone-600"
                }`}
              >
                Archived
              </button>
            </div>
          </div>
        </div>

        <div className="text-xs text-stone-500 flex items-center justify-between pt-1">
          <span>Found {totalCount} matching products</span>
          <span>
            Page {page} of {totalPages}
          </span>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
              <tr>
                <th className="py-3 px-4">Product Details</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Indicative Price</th>
                <th className="py-3 px-4">MOQ</th>
                <th className="py-3 px-4">Supplier & Location</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    <div className="inline-block animate-spin w-5 h-5 border-2 border-stone-300 border-t-stone-900 rounded-full mb-2"></div>
                    <p>Loading catalog inventory from database...</p>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    No products matched your search or filters.
                  </td>
                </tr>
              ) : (
                products.map((item) => {
                  const primaryImage =
                    item.images?.find((img: any) => img.is_primary)?.image_url ||
                    item.images?.[0]?.image_url ||
                    "";
                  const supplierName = item.supplier?.name || "Independent Supplier";
                  const city = item.supplier?.city || "India";

                  return (
                    <tr key={item.id} className="hover:bg-stone-50/60 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-stone-200 bg-stone-100">
                            <ProductImage
                              src={primaryImage}
                              alt={item.title}
                              category={item.category_id}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <div className="font-semibold text-stone-900 truncate" title={item.title}>
                              {item.title}
                            </div>
                            <div className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                              {item.description || "No description provided"}
                            </div>
                            <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                              ID: {item.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-stone-100 text-stone-700 capitalize">
                          {item.category?.name || item.category_id?.replace("-", " ") || "General"}
                        </span>
                        {item.subcategory && (
                          <div className="text-[10px] text-stone-400 mt-0.5 truncate">
                            {item.subcategory.name}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-stone-900">
                          ₹{Number(item.indicative_price || 0).toLocaleString("en-IN")}
                        </div>
                        <div className="text-[10px] text-stone-500">per {item.unit || "unit"}</div>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-stone-800">
                        {item.moq || 1} {item.unit || "units"}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-stone-900 truncate max-w-[150px]">
                          {supplierName}
                        </div>
                        <div className="text-[11px] text-stone-500">{city}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        {item.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-600 border border-stone-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-stone-400"></span>
                            Archived
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Image Manager */}
                          <button
                            onClick={() => setImageModalProduct(item)}
                            title="Manage Images"
                            className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition"
                          >
                            <ImageIcon className="w-4 h-4" />
                          </button>

                          {/* Edit Product */}
                          <button
                            onClick={() => setEditingProduct({ ...item })}
                            title="Edit Product Details"
                            className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Archive/Restore */}
                          <button
                            onClick={() => handleToggleModerate(item)}
                            title={item.is_active ? "Archive Product" : "Restore Product"}
                            className={`p-1.5 rounded-lg transition ${
                              item.is_active
                                ? "text-amber-600 hover:bg-amber-50"
                                : "text-emerald-600 hover:bg-emerald-50"
                            }`}
                          >
                            {item.is_active ? (
                              <Archive className="w-4 h-4" />
                            ) : (
                              <RotateCcw className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="px-4 py-3 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs text-stone-600">
          <div>
            Showing {(page - 1) * 15 + 1} to {Math.min(page * 15, totalCount)} of {totalCount} records
          </div>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 font-medium">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: EDIT PRODUCT */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-stone-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-bold text-base text-stone-900">Edit Catalog Product</h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1 text-stone-400 hover:text-stone-900 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={editingProduct.title}
                  onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingProduct.description || ""}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Indicative Price (₹ INR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={editingProduct.indicative_price}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, indicative_price: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    required
                    placeholder="Piece, kg, Ton, Meter"
                    value={editingProduct.unit}
                    onChange={(e) => setEditingProduct({ ...editingProduct, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Minimum Order Qty (MOQ)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editingProduct.moq}
                    onChange={(e) => setEditingProduct({ ...editingProduct, moq: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Category</label>
                  <select
                    value={editingProduct.category_id}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, category_id: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white focus:outline-none focus:border-stone-900"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 border border-stone-200 rounded-lg font-medium text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded-lg shadow-sm disabled:opacity-50"
                >
                  {actionLoading ? "Saving..." : "Save Product Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD PRODUCT */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-stone-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-bold text-base text-stone-900">Add New Wholesale Product</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-900 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Assign to Supplier *</label>
                <select
                  required
                  value={newProduct.supplier_id}
                  onChange={(e) => setNewProduct({ ...newProduct, supplier_id: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white focus:outline-none focus:border-stone-900"
                >
                  <option value="">Select registered business supplier...</option>
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.business_type} • {b.city || "India"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Industrial Grade Centrifugal Pump"
                  value={newProduct.title}
                  onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Technical description, manufacturing material, compliance standards..."
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Category *</label>
                  <select
                    required
                    value={newProduct.category_id}
                    onChange={(e) => setNewProduct({ ...newProduct, category_id: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white focus:outline-none focus:border-stone-900"
                  >
                    <option value="">Select Category...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Indicative Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Wholesale price"
                    value={newProduct.indicative_price}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, indicative_price: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Unit</label>
                  <input
                    type="text"
                    placeholder="Piece, kg, Set, Box"
                    value={newProduct.unit}
                    onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">MOQ</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="100"
                    value={newProduct.moq}
                    onChange={(e) => setNewProduct({ ...newProduct, moq: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 rounded-lg font-medium text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded-lg shadow-sm disabled:opacity-50"
                >
                  {actionLoading ? "Creating..." : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: MANAGE IMAGES */}
      {imageModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-stone-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div>
                <h3 className="font-bold text-base text-stone-900">Manage Product Media</h3>
                <p className="text-xs text-stone-500 truncate max-w-md">{imageModalProduct.title}</p>
              </div>
              <button
                onClick={() => setImageModalProduct(null)}
                className="p-1 text-stone-400 hover:text-stone-900 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Images Gallery */}
            <div className="mt-4">
              <label className="block text-xs font-semibold text-stone-700 mb-2">
                Existing Product Photos ({imageModalProduct.images?.length || 0})
              </label>
              {imageModalProduct.images && imageModalProduct.images.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-48 overflow-y-auto p-1">
                  {imageModalProduct.images.map((img: any) => (
                    <div
                      key={img.id}
                      className="relative group border border-stone-200 rounded-lg overflow-hidden bg-stone-100 aspect-square"
                    >
                      <img
                        src={img.image_url}
                        alt={img.alt_text || "Product image"}
                        className="w-full h-full object-cover"
                      />
                      {img.is_primary && (
                        <span className="absolute top-1 left-1 bg-stone-900 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                          Primary
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(img.id)}
                        className="absolute bottom-1 right-1 p-1 bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition hover:bg-red-700"
                        title="Delete image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-stone-50 rounded-lg border border-dashed border-stone-200 text-xs text-stone-400">
                  No images uploaded yet. The marketplace displays a high-contrast SVG fallback.
                </div>
              )}
            </div>

            {/* Upload File to Storage */}
            <div className="mt-5 pt-4 border-t border-stone-200 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Upload to InsForge Storage (`products` bucket)
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={isUploadingFile}
                      className="hidden"
                    />
                    <div className="border border-stone-300 border-dashed rounded-lg p-3 text-center hover:bg-stone-50 transition text-xs text-stone-600 flex items-center justify-center gap-2">
                      <Upload className="w-4 h-4 text-stone-400" />
                      {isUploadingFile ? "Uploading to InsForge Storage..." : "Choose image file (PNG, JPG, WebP)"}
                    </div>
                  </label>
                </div>
              </div>

              {/* Or Add Image URL */}
              <form onSubmit={handleAddImageUrl} className="space-y-2 text-xs">
                <label className="block font-semibold text-stone-700">Or Attach Public Image URL</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={uploadUrl}
                    onChange={(e) => setUploadUrl(e.target.value)}
                    className="flex-1 px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900"
                  />
                  <button
                    type="submit"
                    disabled={!uploadUrl || isUploadingFile}
                    className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded-lg disabled:opacity-50"
                  >
                    Attach URL
                  </button>
                </div>
              </form>
            </div>

            <div className="flex justify-end pt-4 mt-4 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setImageModalProduct(null)}
                className="px-4 py-2 border border-stone-200 rounded-lg text-xs font-medium text-stone-700 hover:bg-stone-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
