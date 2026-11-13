import React, { useState, useEffect } from "react";
import type { SupportTicket } from "@/types";
import { HelpCircle, Clock, AlertTriangle } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const AdminSupportPage: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/tickets`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setTickets(data.data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">Support Desk Console</h1>
        <p className="text-xs text-stone-500 mt-1">
          Support Admin Console • Respond to enterprise disputes, shipment delays, and account assistance requests
        </p>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 bg-stone-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-16 text-xs text-stone-500">
            No open support tickets at this time.
          </div>
        ) : (
          <table className="w-full text-left text-xs text-stone-600">
            <thead className="bg-stone-50 border-b border-stone-200 text-[11px] font-semibold uppercase tracking-wider text-stone-700">
              <tr>
                <th className="py-3.5 px-4">Ticket</th>
                <th className="py-3.5 px-4">Subject</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {tickets.map((t) => (
                <tr key={t.id} className="hover:bg-stone-50/70 transition">
                  <td className="py-3 px-4 font-mono font-semibold text-stone-900">
                    {t.ticket_number}
                  </td>
                  <td className="py-3 px-4 font-medium text-stone-800">{t.subject}</td>
                  <td className="py-3 px-4 capitalize">{t.category}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
                        t.priority === "urgent" || t.priority === "high"
                          ? "bg-red-100 text-red-800"
                          : "bg-stone-100 text-stone-700"
                      }`}
                    >
                      {t.priority}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-800">
                      {t.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-stone-400">
                    {new Date(t.created_at).toLocaleDateString()}
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
