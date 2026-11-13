import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { ServiceRequest } from "@/types";
import { Briefcase, ArrowRight, Clock, PlusCircle } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const CustomerRequestsPage: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);

    fetch(`${API_BASE}/business-services/requests?customer_id=${user.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setRequests(data.data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [user]);

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">My Service Requests</h1>
          <p className="text-xs text-stone-500 mt-1">
            Track inquiries, evaluate received proposals, and sign-off on milestone deliverables
          </p>
        </div>

        <Link
          to="/services/all"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 transition shadow-xs self-start"
        >
          <PlusCircle className="w-4 h-4" />
          Browse Services
        </Link>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-stone-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16">
            <Briefcase className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-stone-800">No service requests submitted yet</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 mb-4">
              Explore verified legal, tax, branding, and manufacturing services to submit an inquiry.
            </p>
            <Link
              to="/services"
              className="text-xs font-semibold px-4 py-2 bg-stone-900 text-white rounded-lg inline-block"
            >
              Explore Business Services
            </Link>
          </div>
        ) : (
          <table className="w-full text-left text-xs text-stone-600">
            <thead className="bg-stone-50 border-b border-stone-200 text-[11px] font-semibold uppercase tracking-wider text-stone-700">
              <tr>
                <th className="py-3.5 px-4">Request Title & ID</th>
                <th className="py-3.5 px-4">Target Provider</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Budget / Timeline</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-stone-50/70 transition">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-stone-900">{req.title}</div>
                    <div className="text-[10px] text-stone-400 font-mono">{req.request_number}</div>
                  </td>
                  <td className="py-3 px-4 font-medium text-stone-800">
                    {req.businesses?.name || "Provider"}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
                        req.status === "completed"
                          ? "bg-emerald-100 text-emerald-800"
                          : req.status === "quoted"
                          ? "bg-purple-100 text-purple-800"
                          : req.status === "in_progress"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-stone-100 text-stone-700"
                      }`}
                    >
                      {req.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-stone-700">
                    {req.budget ? `₹${Number(req.budget).toLocaleString("en-IN")}` : "Custom"} • {req.target_timeline || "Flexible"}
                  </td>
                  <td className="py-3 px-4 text-stone-500">
                    {new Date(req.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/services/my-requests/${req.id}`}
                      className="font-semibold text-stone-900 hover:underline inline-flex items-center gap-1"
                    >
                      Manage <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
