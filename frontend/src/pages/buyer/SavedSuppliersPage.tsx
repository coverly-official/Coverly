import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Bookmark, MapPin, ShieldCheck, ArrowRight, Trash2, Building2 } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const SavedSuppliersPage: React.FC = () => {
  const { user } = useAuth();
  const [savedSuppliers, setSavedSuppliers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSuppliers = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/buyer/saved-suppliers`, {
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
      });
      const json = await res.json();
      if (json.success) {
        setSavedSuppliers(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, [user]);

  const handleRemove = async (supplierBizId: string) => {
    if (!user) return;
    try {
      await fetch(`${API_BASE}/buyer/saved-suppliers/${supplierBizId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
      });
      await loadSuppliers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">Saved Suppliers</h1>
          <p className="text-xs text-stone-500 mt-1">
            Keep your trusted manufacturers, distributors, and converters accessible for fast RFQ broadcasting.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-lg bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-700">
          <Bookmark className="h-3.5 w-3.5" /> {savedSuppliers.length} Shortlisted
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-xs text-stone-400">Loading saved suppliers...</div>
      ) : savedSuppliers.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center">
          <Building2 className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-stone-800">No suppliers saved yet</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            Discover vetted manufacturers, raw material suppliers, and trade houses across the marketplace and bookmark them here.
          </p>
          <Link
            to="/manufacturers"
            className="inline-block mt-4 px-4 py-2 text-xs font-bold rounded-lg bg-amber-500 text-stone-950 hover:bg-amber-400"
          >
            Explore Suppliers
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {savedSuppliers.map((entry) => {
            const biz = entry.businesses;
            return (
              <div key={entry.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-600 px-2 py-0.5 rounded">
                      {biz?.business_type || "Supplier"}
                    </span>
                    {biz?.verification_level === "document_verified" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 border border-emerald-200">
                        <ShieldCheck className="h-3 w-3" /> Verified
                      </span>
                    )}
                  </div>

                  <h3 className="mt-2.5 text-base font-bold text-stone-900">{biz?.name || "Supplier Business"}</h3>

                  <div className="mt-3 flex items-center gap-1.5 text-xs text-stone-500">
                    <MapPin className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                    <span>{biz?.city ? `${biz.city}, ` : ""}{biz?.state || "India"}</span>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-3">
                  <button
                    onClick={() => handleRemove(biz?.id || entry.supplier_business_id)}
                    className="text-stone-400 hover:text-rose-600 text-xs flex items-center gap-1"
                    title="Remove from saved"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Remove</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/suppliers/${biz?.slug || biz?.id}`}
                      className="text-xs font-semibold text-stone-700 hover:text-stone-900"
                    >
                      Profile
                    </Link>
                    <Link
                      to={`/buyer/rfq/new?supplier_id=${biz?.id}`}
                      className="px-3 py-1.5 bg-amber-500 text-stone-950 font-bold rounded-lg text-xs hover:bg-amber-400 flex items-center gap-1"
                    >
                      RFQ
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
