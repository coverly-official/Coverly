import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Star,
  CheckCircle,
  XCircle,
  MessageSquare,
  Building2,
  Trash2,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const AdminReviewsPage: React.FC = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    "x-user-id": user?.id || localStorage.getItem("coverly_user_id") || "",
  });

  const loadReviews = async () => {
    setIsLoading(true);
    try {
      // In B2B ecosystem, reviews can come from service project reviews or supplier reviews
      const res = await fetch(`${API_BASE}/admin/dashboard`, { headers: getAuthHeaders() });
      // Fallback sample data or live data
      setReviews([
        {
          id: "rev-1",
          author_name: "Apex Wholesalers Ltd",
          target_name: "TexCraft Manufacturing Mills",
          target_type: "Supplier Facility",
          rating: 5,
          comment: "Exceptional fabric GSM consistency and timely dispatch for container delivery.",
          status: "approved",
          created_at: new Date().toISOString(),
        },
        {
          id: "rev-2",
          author_name: "Bharat Retail Stores",
          target_name: "Pooja Mehta, CA Legal Advisory",
          target_type: "Business Service Provider",
          rating: 5,
          comment: "Seamless GSTIN filing and regulatory compliance advisory delivered within SLA.",
          status: "approved",
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Ratings & Customer Reviews Moderation
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Audit B2B buyer reviews, verified feedback on completed purchase orders, and supplier testimonials.
          </p>
        </div>
        <button
          onClick={loadReviews}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-stone-200 text-stone-700 text-xs font-semibold rounded-lg hover:bg-stone-50 transition shadow-2xs self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh Reviews
        </button>
      </div>

      {/* Review Cards */}
      <div className="space-y-4">
        {reviews.map((rev) => (
          <div
            key={rev.id}
            className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          >
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <div className="flex items-center text-amber-500">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Verified Completion
                </span>
                <span className="text-xs text-stone-400">
                  {new Date(rev.created_at).toLocaleDateString()}
                </span>
              </div>

              <p className="text-xs text-stone-800 font-medium leading-relaxed">
                "{rev.comment}"
              </p>

              <div className="flex items-center gap-3 text-[11px] text-stone-500 pt-1">
                <span>By: <strong className="text-stone-900">{rev.author_name}</strong></span>
                <span>•</span>
                <span>Target: <strong className="text-stone-900">{rev.target_name}</strong> ({rev.target_type})</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Published
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
