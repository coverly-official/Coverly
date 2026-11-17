import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Users,
  UserPlus,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Mail,
  Trash2,
  Edit2,
  Key,
  Clock,
  Copy,
  Activity,
  MapPin,
  X,
} from "lucide-react";
import { BusinessMember, BusinessInvitation, BusinessRole, BusinessPermission } from "@/types";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

const ALL_PERMISSIONS: Array<{ key: BusinessPermission; label: string }> = [
  { key: "view", label: "View Records" },
  { key: "create", label: "Create RFQs & Requests" },
  { key: "edit", label: "Edit Drafts" },
  { key: "approve", label: "Approve Purchases" },
  { key: "reject", label: "Reject Requisitions" },
  { key: "manage", label: "Manage Team" },
  { key: "export", label: "Export Invoices & Data" },
];

export const BuyerTeamPage: React.FC = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<BusinessInvitation[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Invite Modal
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("procurement_manager");
  const [inviteDept, setInviteDept] = useState("Procurement");
  const [inviteSpendingLimit, setInviteSpendingLimit] = useState("500000");
  const [inviteBranchId, setInviteBranchId] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<BusinessPermission[]>([
    "view",
    "create",
    "edit",
    "approve",
    "reject",
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState("");

  // Activity Log Modal
  const [selectedMemberForActivity, setSelectedMemberForActivity] = useState<any | null>(null);
  const [memberActivities, setMemberActivities] = useState<any[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);

  const getHeaders = () => ({
    "Content-Type": "application/json",
    ...(user ? { "x-user-id": user.id } : {}),
  });

  const loadTeam = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [teamRes, branchRes] = await Promise.all([
        fetch(`${API_BASE}/buyer/team`, { headers: getHeaders() }).then((r) => r.json()),
        fetch(`${API_BASE}/buyer/branches`, { headers: getHeaders() }).then((r) => r.json()).catch(() => ({ data: [] })),
      ]);

      if (teamRes.success && teamRes.data) {
        setMembers(teamRes.data.members || []);
        setInvitations(teamRes.data.invitations || []);
      }
      if (branchRes.data) {
        setBranches(branchRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTeam();
  }, [user]);

  const togglePermission = (perm: BusinessPermission) => {
    if (selectedPermissions.includes(perm)) {
      setSelectedPermissions(selectedPermissions.filter((p) => p !== perm));
    } else {
      setSelectedPermissions([...selectedPermissions, perm]);
    }
  };

  const handleRoleChange = (role: string) => {
    setInviteRole(role);
    if (role === "procurement_manager") {
      setInviteSpendingLimit("500000");
      setInviteDept("Procurement");
      setSelectedPermissions(["view", "create", "edit", "approve", "reject", "export"]);
    } else if (role === "purchase_staff" || role === "purchase_executive") {
      setInviteSpendingLimit("");
      setInviteDept("Purchasing");
      setSelectedPermissions(["view", "create", "edit"]);
    } else if (role === "finance_staff" || role === "accounts_executive") {
      setInviteSpendingLimit("");
      setInviteDept("Accounts");
      setSelectedPermissions(["view", "create", "edit", "export"]);
    } else {
      setInviteSpendingLimit("100000");
      setSelectedPermissions(["view", "create"]);
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setInviteSuccessMsg("");

    try {
      const res = await fetch(`${API_BASE}/buyer/team/invite`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          email: inviteEmail.trim(),
          full_name: inviteName.trim(),
          role_in_business: inviteRole,
          department: inviteDept.trim(),
          spending_limit: inviteSpendingLimit ? parseFloat(inviteSpendingLimit) : null,
          branch_id: inviteBranchId || null,
          permissions: selectedPermissions,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setInviteSuccessMsg(`Invitation dispatched! Invitation token: ${json.invitation.invitation_token}`);
        setInviteEmail("");
        setInviteName("");
        await loadTeam();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (memberId: string) => {
    if (!confirm("Are you sure you want to revoke this member's access? Historical orders and PRs will remain intact."))
      return;
    try {
      await fetch(`${API_BASE}/buyer/team/${memberId}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      await loadTeam();
    } catch (err) {
      console.error(err);
    }
  };

  const openMemberActivity = async (member: any) => {
    setSelectedMemberForActivity(member);
    setIsLoadingActivity(true);
    setMemberActivities([]);

    try {
      const res = await fetch(`${API_BASE}/buyer/team/${member.id}/activity`, {
        headers: getHeaders(),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setMemberActivities(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingActivity(false);
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case "procurement_manager":
        return "bg-blue-100 text-blue-900 border-blue-200";
      case "purchase_staff":
      case "purchase_executive":
        return "bg-teal-100 text-teal-900 border-teal-200";
      case "finance_staff":
      case "accounts_executive":
        return "bg-amber-100 text-amber-900 border-amber-200";
      case "owner":
        return "bg-purple-100 text-purple-900 border-purple-200";
      default:
        return "bg-stone-100 text-stone-800 border-stone-200";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">Business Team & Roles</h1>
          <p className="text-xs text-stone-500 mt-1">
            Delegate procurement, set purchasing spending limits, and manage individual employee accounts.
          </p>
        </div>
        <button
          onClick={() => {
            setInviteSuccessMsg("");
            setIsInviteModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-stone-950 font-bold rounded-lg text-xs hover:bg-amber-400 transition shadow-xs"
        >
          <UserPlus className="w-4 h-4" />
          Invite Team Member
        </button>
      </div>

      {/* Active Members Table */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs space-y-4">
        <div className="p-4 border-b border-stone-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-stone-600" />
            Active Team Members ({members.length})
          </h3>
          <span className="text-xs text-stone-500">Individual Accounts Linked</span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-stone-400">Loading team roster...</div>
        ) : members.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-400">
            No team members added yet. Click 'Invite Team Member' to add employees.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider border-b border-stone-200">
                <tr>
                  <th className="p-3">Member</th>
                  <th className="p-3">Assigned Role</th>
                  <th className="p-3">Assigned Branch</th>
                  <th className="p-3">Spending Authority</th>
                  <th className="p-3">Permissions</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-stone-50/50">
                    <td className="p-3">
                      <div className="font-bold text-stone-900">{m.users?.full_name || "Employee"}</div>
                      <div className="text-[11px] text-stone-500">{m.users?.email}</div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getRoleBadgeStyle(
                          m.role_in_business
                        )}`}
                      >
                        {m.role_in_business.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 text-stone-600">
                        <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                        <span>
                          {m.business_branches?.branch_name
                            ? `${m.business_branches.branch_name} (${m.business_branches.city})`
                            : "HQ / All Branches"}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 font-mono font-bold text-stone-900">
                      {m.spending_limit
                        ? `₹${m.spending_limit.toLocaleString()}`
                        : m.role_in_business === "owner"
                        ? "Unlimited"
                        : "No Approval Power"}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {m.permissions?.map((p: string) => (
                          <span
                            key={p}
                            className="text-[10px] bg-stone-50 border border-stone-200 px-1.5 py-0.2 rounded text-stone-600"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => openMemberActivity(m)}
                          className="p-1 rounded text-stone-400 hover:text-blue-600 transition"
                          title="View Member Activity Log"
                        >
                          <Activity className="w-3.5 h-3.5" />
                        </button>
                        {m.role_in_business !== "owner" && (
                          <button
                            onClick={() => handleRevoke(m.id)}
                            className="p-1 rounded text-stone-400 hover:text-rose-600 transition"
                            title="Revoke access"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pending Invitations Table */}
      {invitations.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs space-y-4">
          <div className="p-4 border-b border-stone-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              Pending Invitations ({invitations.length})
            </h3>
            <span className="text-xs text-stone-500">Awaiting Employee Acceptance</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider border-b border-stone-200">
                <tr>
                  <th className="p-3">Invited Candidate</th>
                  <th className="p-3">Assigned Role</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Invitation Token</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {invitations.map((inv) => (
                  <tr key={inv.id}>
                    <td className="p-3">
                      <div className="font-semibold text-stone-900">{inv.full_name}</div>
                      <div className="text-[11px] text-stone-500 font-mono">{inv.email}</div>
                    </td>
                    <td className="p-3 uppercase font-semibold text-[11px]">
                      {inv.role_in_business.replace(/_/g, " ")}
                    </td>
                    <td className="p-3 text-stone-600">{inv.department || "Procurement"}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 font-mono text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 w-fit">
                        <span>{inv.invitation_token}</span>
                        <button
                          onClick={() => navigator.clipboard.writeText(inv.invitation_token)}
                          title="Copy Token"
                          className="hover:text-amber-950"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INVITE MODAL */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 border border-stone-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="text-base font-bold text-stone-900">Invite Employee to Business Account</h3>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 font-bold"
              >
                ✕
              </button>
            </div>

            {inviteSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="break-all">{inviteSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-stone-600 block mb-1 font-medium">Candidate Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Saxena"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200"
                  />
                </div>
                <div>
                  <label className="text-xs text-stone-600 block mb-1 font-medium">Work Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rahul@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-stone-600 block mb-1 font-medium">Designated Role *</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 bg-white"
                  >
                    <option value="procurement_manager">Procurement Manager (Approver)</option>
                    <option value="purchase_staff">Purchase Staff (Requisitions)</option>
                    <option value="finance_staff">Finance / Accounts Staff</option>
                    <option value="business_manager">Business Manager</option>
                    <option value="store_manager">Store Manager</option>
                    <option value="staff">General Staff</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-stone-600 block mb-1 font-medium">Assigned Branch (Optional)</label>
                  <select
                    value={inviteBranchId}
                    onChange={(e) => setInviteBranchId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 bg-white"
                  >
                    <option value="">Headquarters / All Branches</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.branch_name} ({b.city})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-stone-600 block mb-1 font-medium">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Procurement"
                    value={inviteDept}
                    onChange={(e) => setInviteDept(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200"
                  />
                </div>
                <div>
                  <label className="text-xs text-stone-600 block mb-1 font-medium">Approval Limit (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 500000"
                    value={inviteSpendingLimit}
                    onChange={(e) => setInviteSpendingLimit(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-stone-600 block mb-2 font-medium">Permission Matrix</label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_PERMISSIONS.map((perm) => (
                    <label
                      key={perm.key}
                      className="flex items-center gap-2 p-2 rounded border border-stone-200 text-xs hover:bg-stone-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(perm.key)}
                        onChange={() => togglePermission(perm.key)}
                        className="rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span>{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold rounded-lg bg-amber-500 text-stone-950 hover:bg-amber-400 disabled:opacity-50"
                >
                  {isSubmitting ? "Generating..." : "Generate Invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MEMBER ACTIVITY AUDIT TRAIL MODAL */}
      {selectedMemberForActivity && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-stone-200 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-100 text-blue-900">
                  <Activity className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-stone-900">
                    Activity Audit: {selectedMemberForActivity.users?.full_name}
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    {selectedMemberForActivity.role_in_business.replace(/_/g, " ")} •{" "}
                    {selectedMemberForActivity.users?.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMemberForActivity(null)}
                className="text-stone-400 hover:text-stone-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {isLoadingActivity ? (
                <div className="p-8 text-center text-xs text-stone-400">Loading audit trail...</div>
              ) : memberActivities.length === 0 ? (
                <div className="p-8 text-center text-xs text-stone-400">No recent activity logged for this member.</div>
              ) : (
                memberActivities.map((act) => (
                  <div key={act.id} className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-stone-200 text-stone-800">
                        {act.activity_type.replace(/_/g, " ")}
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {new Date(act.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="font-medium text-stone-900">{act.description}</div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-stone-200 flex justify-end">
              <button
                onClick={() => setSelectedMemberForActivity(null)}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-800"
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
