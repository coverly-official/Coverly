import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  Plus,
  Upload,
  FileCheck,
  AlertTriangle,
  ChevronRight,
  Eye,
  Check,
  RotateCcw,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const ProviderActiveProjectsPage: React.FC = () => {
  const { user, business } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isAddMilestoneOpen, setIsAddMilestoneOpen] = useState(false);
  const [isUploadDeliverableOpen, setIsUploadDeliverableOpen] = useState(false);

  // Add Milestone Form
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [milestoneDesc, setMilestoneDesc] = useState("");
  const [milestoneAmount, setMilestoneAmount] = useState("");
  const [milestoneDueDate, setMilestoneDueDate] = useState("");

  // Upload Deliverable Form
  const [delivTitle, setDelivTitle] = useState("");
  const [delivFileUrl, setDelivFileUrl] = useState("");
  const [delivDesc, setDelivDesc] = useState("");

  const fetchProjects = () => {
    if (!business) return;
    setIsLoading(true);

    fetch(`${API_BASE}/business-services/projects?provider_business_id=${business.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const list = Array.isArray(data.data) ? data.data : (data.data?.items || []);
          setProjects(list);
          if (list.length > 0 && !selectedProject) {
            fetchProjectDetails(list[0].id);
          }
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  const fetchProjectDetails = (id: string) => {
    fetch(`${API_BASE}/business-services/projects/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setSelectedProject(d.data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchProjects();
  }, [business]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!user || !selectedProject) return;

    try {
      const res = await fetch(`${API_BASE}/business-services/projects/${selectedProject.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          changed_by: user.id,
          note: `Provider updated project status to ${newStatus}.`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchProjectDetails(selectedProject.id);
        fetchProjects();
      } else {
        alert(data.error || "Failed to update project status.");
      }
    } catch {
      alert("Network error.");
    }
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !milestoneTitle.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/business-services/projects/${selectedProject.id}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: milestoneTitle.trim(),
          description: milestoneDesc.trim() || null,
          amount: milestoneAmount ? Number.parseFloat(milestoneAmount) : 0,
          due_date: milestoneDueDate || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsAddMilestoneOpen(false);
        setMilestoneTitle("");
        setMilestoneDesc("");
        setMilestoneAmount("");
        fetchProjectDetails(selectedProject.id);
      } else {
        alert(data.error || "Failed to add milestone.");
      }
    } catch {
      alert("Network error.");
    }
  };

  const handleUploadDeliverable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !delivTitle.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/business-services/projects/${selectedProject.id}/deliverables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: delivTitle.trim(),
          file_url: delivFileUrl.trim() || "https://storage.coverly.in/documents/deliverable.pdf",
          description: delivDesc.trim() || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsUploadDeliverableOpen(false);
        setDelivTitle("");
        setDelivFileUrl("");
        setDelivDesc("");
        fetchProjectDetails(selectedProject.id);
        fetchProjects();
      } else {
        alert(data.error || "Failed to submit deliverable.");
      }
    } catch {
      alert("Network error.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">Active Service Projects</h1>
          <p className="text-xs text-stone-500 mt-1">
            Track confirmed client projects, manage milestones, advance status, and submit deliverables for approval.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-xs text-stone-400">Loading active projects...</div>
      ) : projects.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center">
          <FolderKanban className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-stone-800">No active projects yet</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
            When clients accept your quotations, active project workspaces will automatically appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Projects Left List */}
          <div className="lg:col-span-4 bg-white border border-stone-200 rounded-2xl p-4 shadow-xs space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 px-2 py-1">
              Projects ({projects.length})
            </h3>
            {projects.map((p) => {
              const isSelected = selectedProject?.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => fetchProjectDetails(p.id)}
                  className={`p-3.5 rounded-xl cursor-pointer transition text-xs ${
                    isSelected
                      ? "bg-stone-900 text-white shadow-xs"
                      : "bg-stone-50 text-stone-800 hover:bg-stone-100"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] opacity-70">{p.project_number}</span>
                    <span
                      className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                        isSelected
                          ? "bg-stone-800 text-stone-200"
                          : "bg-stone-200 text-stone-700"
                      }`}
                    >
                      {p.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="font-bold text-sm mt-1 truncate">{p.title}</div>
                  <div className="text-[11px] mt-1 opacity-80">
                    Agreed: <strong>₹{Number(p.agreed_price).toLocaleString("en-IN")}</strong>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Project Details Right Workspace */}
          {selectedProject && (
            <div className="lg:col-span-8 space-y-6">
              {/* Project Status Banner */}
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
                  <div>
                    <span className="font-mono text-xs text-blue-700 font-bold">
                      {selectedProject.project_number}
                    </span>
                    <h2 className="text-xl font-extrabold text-stone-900 mt-1">
                      {selectedProject.title}
                    </h2>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Client Engagement • Agreed Price: <strong>₹{Number(selectedProject.agreed_price).toLocaleString("en-IN")}</strong>
                    </p>
                  </div>

                  {/* Status Progression Controls */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {selectedProject.status.replace(/_/g, " ")}
                    </span>
                    <select
                      value={selectedProject.status}
                      onChange={(e) => handleUpdateStatus(e.target.value)}
                      className="text-xs font-semibold p-2 bg-stone-50 border border-stone-200 rounded-lg cursor-pointer"
                    >
                      <option value="project_created">Project Created</option>
                      <option value="awaiting_start">Awaiting Start</option>
                      <option value="in_progress">In Progress</option>
                      <option value="waiting_for_customer">Waiting for Customer</option>
                      <option value="under_review">Under Review</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>

                {/* Scope of Work */}
                {selectedProject.scope_of_work && (
                  <div className="mt-4 text-xs text-stone-600 bg-stone-50 p-4 rounded-xl">
                    <span className="font-bold text-stone-800 block mb-1">Scope of Work:</span>
                    {selectedProject.scope_of_work}
                  </div>
                )}
              </div>

              {/* Milestones Section */}
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
                  <h3 className="font-bold text-sm text-stone-900">
                    Execution Milestones ({selectedProject.milestones?.length || 0})
                  </h3>
                  <button
                    onClick={() => setIsAddMilestoneOpen(true)}
                    className="py-1 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-lg transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Milestone
                  </button>
                </div>

                {selectedProject.milestones?.length === 0 ? (
                  <div className="text-center py-6 text-xs text-stone-400">No milestones configured yet.</div>
                ) : (
                  <div className="space-y-3">
                    {selectedProject.milestones.map((m: any) => (
                      <div key={m.id} className="p-3 bg-stone-50 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-stone-900">{m.title}</div>
                          {m.description && <div className="text-stone-500 text-[11px]">{m.description}</div>}
                          {m.due_date && <div className="text-stone-400 text-[10px]">Due: {m.due_date}</div>}
                        </div>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {m.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Deliverables Section */}
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
                  <h3 className="font-bold text-sm text-stone-900">
                    Uploaded Deliverables ({selectedProject.deliverables?.length || 0})
                  </h3>
                  <button
                    onClick={() => setIsUploadDeliverableOpen(true)}
                    className="py-1.5 px-3.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Submit Deliverable
                  </button>
                </div>

                {selectedProject.deliverables?.length === 0 ? (
                  <div className="text-center py-6 text-xs text-stone-400">No deliverables uploaded yet.</div>
                ) : (
                  <div className="space-y-3">
                    {selectedProject.deliverables.map((d: any) => (
                      <div key={d.id} className="p-3.5 border border-stone-200 rounded-xl space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-stone-900 flex items-center gap-1.5">
                            <FileCheck className="w-4 h-4 text-blue-700" />
                            {d.title}
                          </div>
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                              d.status === "approved"
                                ? "bg-emerald-100 text-emerald-800"
                                : d.status === "revision_requested"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {d.status.replace(/_/g, " ")}
                          </span>
                        </div>
                        {d.description && <p className="text-stone-600 text-[11px]">{d.description}</p>}
                        {d.customer_feedback && (
                          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px]">
                            <strong>Client Feedback:</strong> {d.customer_feedback}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADD MILESTONE */}
      {isAddMilestoneOpen && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="font-bold text-base text-stone-900 mb-3">Add Project Milestone</h3>
            <form onSubmit={handleAddMilestone} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-stone-500 uppercase mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Draft Agreement Review"
                  value={milestoneTitle}
                  onChange={(e) => setMilestoneTitle(e.target.value)}
                  className="w-full p-2.5 border border-stone-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-500 uppercase mb-1">Description</label>
                <textarea
                  rows={2}
                  value={milestoneDesc}
                  onChange={(e) => setMilestoneDesc(e.target.value)}
                  className="w-full p-2.5 border border-stone-200 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-stone-500 uppercase mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    value={milestoneAmount}
                    onChange={(e) => setMilestoneAmount(e.target.value)}
                    className="w-full p-2.5 border border-stone-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-500 uppercase mb-1">Due Date</label>
                  <input
                    type="date"
                    value={milestoneDueDate}
                    onChange={(e) => setMilestoneDueDate(e.target.value)}
                    className="w-full p-2.5 border border-stone-200 rounded-lg"
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddMilestoneOpen(false)}
                  className="py-2 px-4 bg-stone-100 text-stone-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 bg-stone-900 text-white font-bold rounded-xl"
                >
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: UPLOAD DELIVERABLE */}
      {isUploadDeliverableOpen && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="font-bold text-base text-stone-900 mb-3">Submit Project Deliverable</h3>
            <form onSubmit={handleUploadDeliverable} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-stone-500 uppercase mb-1">Deliverable Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Incorporated Certificate & PAN/TAN Allotment"
                  value={delivTitle}
                  onChange={(e) => setDelivTitle(e.target.value)}
                  className="w-full p-2.5 border border-stone-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-500 uppercase mb-1">File URL / Storage Link</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={delivFileUrl}
                  onChange={(e) => setDelivFileUrl(e.target.value)}
                  className="w-full p-2.5 border border-stone-200 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-500 uppercase mb-1">Submission Notes</label>
                <textarea
                  rows={2}
                  placeholder="Briefly describe the completed work..."
                  value={delivDesc}
                  onChange={(e) => setDelivDesc(e.target.value)}
                  className="w-full p-2.5 border border-stone-200 rounded-lg"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadDeliverableOpen(false)}
                  className="py-2 px-4 bg-stone-100 text-stone-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 bg-stone-900 text-white font-bold rounded-xl"
                >
                  Submit for Client Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
