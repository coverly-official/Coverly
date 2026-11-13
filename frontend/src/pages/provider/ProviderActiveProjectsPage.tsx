import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import type { ServiceRequest } from "@/types";
import { FolderKanban, CheckCircle2, Clock } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const ProviderActiveProjectsPage: React.FC = () => {
  const { user, business } = useAuth();
  const [projects, setProjects] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchProjects = () => {
    if (!business) return;
    setIsLoading(true);

    fetch(`${API_BASE}/business-services/requests?provider_business_id=${business.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          // Filter to accepted, in_progress, completed
          setProjects(data.data.filter((p: any) => ["accepted", "in_progress", "completed"].includes(p.status)));
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchProjects();
  }, [business]);

  const handleUpdateStatus = async (projectId: string, newStatus: string) => {
    if (!user) return;
    setIsUpdating(true);

    try {
      const res = await fetch(`${API_BASE}/business-services/requests/${projectId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          new_status: newStatus,
          changed_by: user.id,
          note: `Provider updated project status to ${newStatus}.`,
        }),
      });

      const body = await res.json();
      if (!res.ok || !body.success) {
        throw new Error(body.error || "Failed to update project status.");
      }

      fetchProjects();
    } catch (err: any) {
      alert(err.message || "Failed to update status.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">Active Service Projects</h1>
        <p className="text-xs text-stone-500 mt-1">
          Track accepted engagements, advance execution milestones, and submit completed deliverables
        </p>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-stone-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16">
            <FolderKanban className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-stone-800">No active projects</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
              When clients accept your formal quotations, projects will transition here for execution.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs text-stone-600">
            <thead className="bg-stone-50 border-b border-stone-200 text-[11px] font-semibold uppercase tracking-wider text-stone-700">
              <tr>
                <th className="py-3.5 px-4">Project Title & ID</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Target Timeline</th>
                <th className="py-3.5 px-4">Start Date</th>
                <th className="py-3.5 px-4 text-right">Execution Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {projects.map((proj) => (
                <tr key={proj.id} className="hover:bg-stone-50/70 transition">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-stone-900">{proj.title}</div>
                    <div className="text-[10px] text-stone-400 font-mono">{proj.request_number}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
                        proj.status === "completed"
                          ? "bg-emerald-100 text-emerald-800"
                          : proj.status === "in_progress"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {proj.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-stone-700">{proj.target_timeline || "Standard"}</td>
                  <td className="py-3 px-4 text-stone-500">
                    {new Date(proj.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {proj.status === "accepted" && (
                      <button
                        onClick={() => handleUpdateStatus(proj.id, "in_progress")}
                        disabled={isUpdating}
                        className="px-3 py-1 bg-blue-700 text-white rounded text-xs font-semibold hover:bg-blue-800 transition"
                      >
                        Start Execution
                      </button>
                    )}
                    {proj.status === "in_progress" && (
                      <button
                        onClick={() => handleUpdateStatus(proj.id, "completed")}
                        disabled={isUpdating}
                        className="px-3 py-1 bg-emerald-700 text-white rounded text-xs font-semibold hover:bg-emerald-800 transition flex items-center gap-1 ml-auto"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Mark Completed
                      </button>
                    )}
                    {proj.status === "completed" && (
                      <span className="text-emerald-700 font-medium text-[11px]">✓ Delivered</span>
                    )}
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
