import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Inbox, ArrowRight, MapPin, Calendar } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const SupplierIncomingRfqsPage: React.FC = () => {
  const { business } = useAuth();
  const [recipients, setRecipients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!business) return;
    setIsLoading(true);

    fetch(`${API_BASE}/rfqs/supplier/incoming?business_id=${business.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setRecipients(data.data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [business]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">Incoming Buyer RFQs</h1>
        <p className="text-xs text-stone-500 mt-1">
          Review buyer requirements dispatched to your business and prepare customized landed-cost proposals
        </p>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-stone-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : recipients.length === 0 ? (
          <div className="text-center py-16">
            <Inbox className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-stone-800">No incoming RFQs right now</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
              When buyers post requirements matching your manufacturing categories, they will appear here.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs text-stone-600">
            <thead className="bg-stone-50 border-b border-stone-200 text-[11px] font-semibold uppercase tracking-wider text-stone-700">
              <tr>
                <th className="py-3.5 px-4">RFQ Title & Number</th>
                <th className="py-3.5 px-4">Destination</th>
                <th className="py-3.5 px-4">Required By</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {recipients.map((rec) => {
                const rfq = rec.rfqs;
                if (!rfq) return null;
                return (
                  <tr key={rec.id} className="hover:bg-stone-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-stone-900">{rfq.title}</div>
                      <div className="text-[10px] text-stone-400 font-mono">{rfq.rfq_number}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="flex items-center gap-1 text-stone-700">
                        <MapPin className="w-3.5 h-3.5 text-stone-400" />
                        {rfq.delivery_city} ({rfq.delivery_pincode})
                      </span>
                    </td>
                    <td className="py-3 px-4 text-stone-500">
                      {rfq.target_delivery_date || "Flexible"}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
                          rec.status === "quoted"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/supplier/rfqs/${rfq.id}/quote`}
                        className="px-3 py-1.5 bg-stone-900 text-white rounded text-xs font-semibold hover:bg-stone-800 transition inline-flex items-center gap-1"
                      >
                        Submit Quote <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
