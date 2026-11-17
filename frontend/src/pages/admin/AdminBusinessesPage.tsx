import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Building2,
  Search,
  Filter,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit,
  X,
  ChevronLeft,
  ChevronRight,
  Package,
  Users,
  MapPin,
  FileCheck,
  Ban,
  RotateCcw,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const AdminBusinessesPage: React.FC = () => {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals & Drawers
  const [selectedBusiness, setSelectedBusiness] = useState<any | null>(null);
  const [verifyModalBusiness, setVerifyModalBusiness] = useState<any | null>(null);
  const [newVerificationTier, setNewVerificationTier] = useState("document_verified");
  const [verificationNotes, setVerificationNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    "x-user-id": user?.id || localStorage.getItem("coverly_user_id") || "",
  });

  const fetchBusinesses = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "15");
      if (search) params.set("search", search);
      if (typeFilter) params.set("type", typeFilter);
      if (verificationFilter) params.set("verification", verificationFilter);

      const res = await fetch(`${API_BASE}/admin/businesses?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setBusinesses(data.data.businesses || []);
        setTotalPages(data.data.totalPages || 1);
        setTotalCount(data.data.total || 0);
      }
    } catch (err) {
      console.error("Failed to fetch admin businesses", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, [page, search, typeFilter, verificationFilter]);

  // View full business details
  const handleOpenDetail = async (businessId: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/businesses/${businessId}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setSelectedBusiness(data.data);
      }
    } catch (err) {
      console.error("Failed to load business details", err);
    }
  };

  // Submit verification level change
  const handleUpdateVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyModalBusiness) return;
    setActionLoading(true);

    try {
      const res = await fetch(`${API_BASE}/admin/businesses/${verifyModalBusiness.id}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          verification_level: newVerificationTier,
          notes: verificationNotes || "Admin updated verification level via governance panel",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setVerifyModalBusiness(null);
        setVerificationNotes("");
        fetchBusinesses();
        if (selectedBusiness && selectedBusiness.id === verifyModalBusiness.id) {
          handleOpenDetail(verifyModalBusiness.id);
        }
      } else {
        alert(data.error || "Failed to update verification level.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to update verification level.");
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle active/suspended status
  const handleToggleActive = async (business: any) => {
    const newStatus = !business.is_active;
    const notes = prompt(
      `Enter reason for ${newStatus ? "reactivating" : "suspending"} ${business.name}:`
    );
    if (notes === null) return;

    try {
      const res = await fetch(`${API_BASE}/admin/businesses/${business.id}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          is_active: newStatus,
          notes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchBusinesses();
        if (selectedBusiness && selectedBusiness.id === business.id) {
          setSelectedBusiness({ ...selectedBusiness, is_active: newStatus });
        }
      } else {
        alert(data.error || "Failed to update status.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to update business status.");
    }
  };

  const renderVerificationBadge = (level: string) => {
    switch (level) {
      case "fully_verified":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Fully Verified
          </span>
        );
      case "registration_checked":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            <FileCheck className="w-3 h-3 text-blue-600" />
            Registration Checked
          </span>
        );
      case "document_verified":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
            <FileCheck className="w-3 h-3 text-indigo-600" />
            Document Verified
          </span>
        );
      case "phone_verified":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            Phone Verified
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-600 border border-stone-200">
            Unverified
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">
          Enterprise Business & Supplier Directory
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Review registered suppliers, manufacturers, distributors, verify compliance credentials, and manage operational status.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
            <input
              type="text"
              placeholder="Search by business name, city, email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs border border-stone-200 rounded-lg px-3 py-2 bg-white text-stone-700 focus:outline-none focus:border-stone-900"
            >
              <option value="">All Business Types</option>
              <option value="manufacturer">Manufacturers</option>
              <option value="wholesaler">Wholesalers</option>
              <option value="distributor">Distributors</option>
              <option value="buyer">Buyers</option>
              <option value="service_provider">Service Providers</option>
            </select>

            <select
              value={verificationFilter}
              onChange={(e) => {
                setVerificationFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs border border-stone-200 rounded-lg px-3 py-2 bg-white text-stone-700 focus:outline-none focus:border-stone-900"
            >
              <option value="">All Verification Tiers</option>
              <option value="unverified">Unverified</option>
              <option value="phone_verified">Phone Verified</option>
              <option value="document_verified">Document Verified</option>
              <option value="registration_checked">Registration Checked</option>
              <option value="fully_verified">Fully Verified</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-stone-500 flex items-center justify-between pt-1">
          <span>Found {totalCount} businesses</span>
          <span>
            Page {page} of {totalPages}
          </span>
        </div>
      </div>

      {/* Businesses Table */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
              <tr>
                <th className="py-3 px-4">Enterprise Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Verification Tier</th>
                <th className="py-3 px-4">Products</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    <div className="inline-block animate-spin w-5 h-5 border-2 border-stone-300 border-t-stone-900 rounded-full mb-2"></div>
                    <p>Loading enterprise records from database...</p>
                  </td>
                </tr>
              ) : businesses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    No registered businesses matched your search filters.
                  </td>
                </tr>
              ) : (
                businesses.map((biz) => (
                  <tr key={biz.id} className="hover:bg-stone-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-700 font-bold shrink-0">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-stone-900 truncate">{biz.name}</div>
                          {biz.legal_name && biz.legal_name !== biz.name && (
                            <div className="text-[11px] text-stone-500 truncate">
                              {biz.legal_name}
                            </div>
                          )}
                          <div className="text-[10px] text-stone-400 font-mono">
                            ID: {biz.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-stone-100 text-stone-700 capitalize">
                        {biz.business_type}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-stone-900 font-medium">
                        {biz.city || "—"}{biz.state ? `, ${biz.state}` : ""}
                      </div>
                      <div className="text-[11px] text-stone-500">{biz.country || "India"}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      {renderVerificationBadge(biz.verification_level)}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-stone-800">
                      {biz.product_count ?? 0}
                    </td>

                    <td className="py-3.5 px-4">
                      {biz.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
                          Suspended
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* View Drawer */}
                        <button
                          onClick={() => handleOpenDetail(biz.id)}
                          className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition"
                          title="View Business Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Update Verification Tier */}
                        <button
                          onClick={() => {
                            setVerifyModalBusiness(biz);
                            setNewVerificationTier(biz.verification_level || "document_verified");
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Update Verification Level"
                        >
                          <ShieldCheck className="w-4 h-4" />
                        </button>

                        {/* Suspend/Reactivate */}
                        <button
                          onClick={() => handleToggleActive(biz)}
                          className={`p-1.5 rounded-lg transition ${
                            biz.is_active
                              ? "text-red-500 hover:bg-red-50"
                              : "text-emerald-600 hover:bg-emerald-50"
                          }`}
                          title={biz.is_active ? "Suspend Business" : "Reactivate Business"}
                        >
                          {biz.is_active ? (
                            <Ban className="w-4 h-4" />
                          ) : (
                            <RotateCcw className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="px-4 py-3 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs text-stone-600">
          <div>
            Showing {(page - 1) * 15 + 1} to {Math.min(page * 15, totalCount)} of {totalCount} businesses
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

      {/* DRAWER / MODAL: VIEW BUSINESS DETAIL */}
      {selectedBusiness && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl border border-stone-200 animate-in fade-in">
            <div className="flex items-start justify-between pb-4 border-b border-stone-200">
              <div>
                <h3 className="font-bold text-lg text-stone-900">{selectedBusiness.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-stone-500 capitalize">
                    {selectedBusiness.business_type}
                  </span>
                  <span>•</span>
                  {renderVerificationBadge(selectedBusiness.verification_level)}
                </div>
              </div>
              <button
                onClick={() => setSelectedBusiness(null)}
                className="p-1 text-stone-400 hover:text-stone-900 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-5 text-xs">
              {/* Registration & Contact */}
              <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-stone-500 block">Legal Name:</span>
                  <strong className="text-stone-900 font-medium">
                    {selectedBusiness.legal_name || "Same as trade name"}
                  </strong>
                </div>
                <div>
                  <span className="text-stone-500 block">Email Address:</span>
                  <strong className="text-stone-900 font-medium">
                    {selectedBusiness.email || "Not specified"}
                  </strong>
                </div>
                <div>
                  <span className="text-stone-500 block">Phone Number:</span>
                  <strong className="text-stone-900 font-medium">
                    {selectedBusiness.phone || "Not specified"}
                  </strong>
                </div>
                <div>
                  <span className="text-stone-500 block">Location:</span>
                  <strong className="text-stone-900 font-medium">
                    {selectedBusiness.city}, {selectedBusiness.state || "India"}
                  </strong>
                </div>
              </div>

              {/* Supplier Capability Profile */}
              {selectedBusiness.supplier_profiles && (
                <div>
                  <h4 className="font-bold text-stone-900 mb-2 uppercase tracking-wider text-[11px]">
                    Manufacturing & Supply Capabilities
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border border-stone-200 rounded-xl p-4">
                    <div>
                      <span className="text-stone-500 block">Factory Size:</span>
                      <strong className="text-stone-900">
                        {selectedBusiness.supplier_profiles.factory_size || "Not disclosed"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-stone-500 block">Annual Turnover:</span>
                      <strong className="text-stone-900">
                        {selectedBusiness.supplier_profiles.annual_turnover || "Not disclosed"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-stone-500 block">Lead Time:</span>
                      <strong className="text-stone-900">
                        {selectedBusiness.supplier_profiles.lead_time_days
                          ? `${selectedBusiness.supplier_profiles.lead_time_days} days`
                          : "Not disclosed"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-stone-500 block">Staff / Employees:</span>
                      <strong className="text-stone-900">
                        {selectedBusiness.supplier_profiles.employee_count || "Not disclosed"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-stone-500 block">Export Capabilities:</span>
                      <strong className="text-stone-900">
                        {selectedBusiness.supplier_profiles.export_percentage
                          ? `${selectedBusiness.supplier_profiles.export_percentage}%`
                          : "Domestic Only"}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Catalog Products */}
              <div>
                <h4 className="font-bold text-stone-900 mb-2 uppercase tracking-wider text-[11px] flex items-center justify-between">
                  <span>Catalog Listings ({selectedBusiness.products?.length || 0})</span>
                </h4>
                {selectedBusiness.products && selectedBusiness.products.length > 0 ? (
                  <div className="border border-stone-200 rounded-xl divide-y divide-stone-100 max-h-48 overflow-y-auto">
                    {selectedBusiness.products.map((p: any) => (
                      <div key={p.id} className="p-3 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-stone-900">{p.title}</div>
                          <div className="text-[11px] text-stone-500">
                            MOQ: {p.moq} {p.unit}
                          </div>
                        </div>
                        <div className="font-bold text-stone-900">
                          ₹{Number(p.indicative_price).toLocaleString("en-IN")}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-stone-400 italic">No products listed by this supplier.</p>
                )}
              </div>

              {/* Members */}
              {selectedBusiness.members && selectedBusiness.members.length > 0 && (
                <div>
                  <h4 className="font-bold text-stone-900 mb-2 uppercase tracking-wider text-[11px]">
                    Authorized Team Members ({selectedBusiness.members.length})
                  </h4>
                  <div className="border border-stone-200 rounded-xl divide-y divide-stone-100">
                    {selectedBusiness.members.map((m: any) => (
                      <div key={m.id} className="p-3 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-stone-900">
                            {m.user?.full_name || "Team Member"}
                          </div>
                          <div className="text-[11px] text-stone-500">{m.user?.email}</div>
                        </div>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                          {m.role_in_business}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-5 mt-5 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setSelectedBusiness(null)}
                className="px-4 py-2 border border-stone-200 rounded-lg text-xs font-medium text-stone-700 hover:bg-stone-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: UPDATE VERIFICATION TIER */}
      {verifyModalBusiness && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div>
                <h3 className="font-bold text-base text-stone-900">Update Verification Level</h3>
                <p className="text-xs text-stone-500 truncate max-w-xs">
                  {verifyModalBusiness.name}
                </p>
              </div>
              <button
                onClick={() => setVerifyModalBusiness(null)}
                className="p-1 text-stone-400 hover:text-stone-900 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateVerification} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Verification Tier
                </label>
                <select
                  value={newVerificationTier}
                  onChange={(e) => setNewVerificationTier(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white focus:outline-none focus:border-stone-900"
                >
                  <option value="unverified">Unverified (Default new account)</option>
                  <option value="phone_verified">Phone Verified (OTP confirmed)</option>
                  <option value="document_verified">
                    Document Verified (PAN / Registration uploaded)
                  </option>
                  <option value="registration_checked">
                    Registration Checked (GSTIN / MCA portal validated)
                  </option>
                  <option value="fully_verified">
                    Fully Verified (On-site / Comprehensive audit passed)
                  </option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Audit Notes & Reasoning *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Record verification justification for compliance audit logs..."
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setVerifyModalBusiness(null)}
                  className="px-4 py-2 border border-stone-200 rounded-lg font-medium text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded-lg shadow-sm disabled:opacity-50"
                >
                  {actionLoading ? "Updating..." : "Confirm Verification Level"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
