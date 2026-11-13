import React, { useState, useEffect } from "react";
import { List, Shield } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/admin/audit-logs`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setLogs(data.data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">
          Immutable Administrative Audit Trail
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Cryptographically stamped log of all administrative interventions, verification tier assignments, and account status transitions
        </p>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 bg-stone-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 text-xs text-stone-500">No audit records yet.</div>
        ) : (
          <table className="w-full text-left text-xs text-stone-600">
            <thead className="bg-stone-50 border-b border-stone-200 text-[11px] font-semibold uppercase tracking-wider text-stone-700">
              <tr>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Admin Actor</th>
                <th className="py-3.5 px-4">Target Type & ID</th>
                <th className="py-3.5 px-4">Metadata</th>
                <th className="py-3.5 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-mono text-[11px]">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-stone-50/70 transition">
                  <td className="py-3 px-4 font-bold text-stone-900">{l.action}</td>
                  <td className="py-3 px-4 font-sans text-stone-700">
                    {l.users?.full_name || l.admin_id}
                  </td>
                  <td className="py-3 px-4 text-stone-600">
                    {l.target_type} ({l.target_id.substring(0, 8)}...)
                  </td>
                  <td className="py-3 px-4 text-stone-500 max-w-xs truncate">
                    {JSON.stringify(l.metadata)}
                  </td>
                  <td className="py-3 px-4 text-right text-stone-400 font-sans">
                    {new Date(l.created_at).toLocaleString()}
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
