import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Eye,
  Key,
  Lock,
  Building,
  MapPin,
  Clock,
  Briefcase,
  DollarSign,
  FileText,
  RotateCcw,
  Trash2,
  Edit3,
  Activity,
  Layers,
  Check,
  X,
  RefreshCw,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

interface Employee {
  id: string;
  user_id: string;
  business_id: string;
  branch_id?: string | null;
  role_in_business: string;
  permissions: string[];
  spending_limit?: number | null;
  is_active: boolean;
  created_at: string;
  users?: {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
  };
  businesses?: {
    id: string;
    name: string;
    city?: string;
    state?: string;
  };
  business_branches?: {
    id: string;
    branch_name: string;
    city?: string;
    state?: string;
  };
}

interface DashboardMetrics {
  total_employees: number;
  procurement_managers: number;
  purchase_staff: number;
  finance_staff: number;
  active_employees: number;
  suspended_employees: number;
  pending_invitations: number;
  recent_activities?: any[];
}

const PERMISSION_OPTIONS = [
  { key: "view", label: "View Records & Lists" },
  { key: "create", label: "Create RFQs / Requisitions" },
  { key: "edit", label: "Edit Drafts & Pricing" },
  { key: "approve", label: "Approve Purchases / Invoices" },
  { key: "reject", label: "Reject Requests" },
  { key: "delete", label: "Delete Records" },
  { key: "export", label: "Export Data & Reports" },
  { key: "manage", label: "Manage Team & Settings" },
];

export const AdminEmployeesPage: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    total_employees: 0,
    procurement_managers: 0,
    purchase_staff: 0,
    finance_staff: 0,
    active_employees: 0,
    suspended_employees: 0,
    pending_invitations: 0,
  });

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionError, setActionError] = useState("");

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    business_id: "",
    branch_id: "",
    role_in_business: "procurement_manager",
    spending_limit: "500000",
    permissions: ["view", "create", "edit", "approve", "reject", "export"] as string[],
  });
  const [businessBranches, setBusinessBranches] = useState<any[]>([]);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  // Edit Permissions Modal State
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [editRole, setEditRole] = useState("");
  const [editSpendingLimit, setEditSpendingLimit] = useState("");
  const [editBranchId, setEditBranchId] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Activity Log Modal State
  const [activityEmployee, setActivityEmployee] = useState<Employee | null>(null);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);

  const getHeaders = () => ({
    "Content-Type": "application/json",
    ...(user ? { "x-user-id": user.id } : {}),
  });

  const loadData = async () => {
    setIsLoading(true);
    setActionSuccess("");
    setActionError("");
    try {
      const [dashRes, empRes, bizRes] = await Promise.all([
        fetch(`${API_BASE}/admin/employee-dashboard`, { headers: getHeaders() }).then((r) => r.json()),
        fetch(`${API_BASE}/admin/employees`, { headers: getHeaders() }).then((r) => r.json()),
        fetch(`${API_BASE}/businesses`, { headers: getHeaders() }).then((r) => r.json()).catch(() => ({ data: [] })),
      ]);

      if (dashRes.success && dashRes.data) {
        setMetrics(dashRes.data);
      }
      if (empRes.success && empRes.data) {
        setEmployees(empRes.data);
      }
      if (bizRes.data) {
        setBusinesses(bizRes.data);
        if (bizRes.data.length > 0 && !createForm.business_id) {
          setCreateForm((prev) => ({ ...prev, business_id: bizRes.data[0].id }));
        }
      }
    } catch (err: any) {
      console.error(err);
      setActionError("Failed to load employee records.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Load branches when business_id changes in Create Modal
  useEffect(() => {
    if (!createForm.business_id) return;
    fetch(`${API_BASE}/buyer/branches`, {
      headers: { ...getHeaders(), "x-business-id": createForm.business_id },
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          setBusinessBranches(json.data);
        } else {
          setBusinessBranches([]);
        }
      })
      .catch(() => setBusinessBranches([]));
  }, [createForm.business_id]);

  // Handle Preset Permissions by Role
  const applyRolePreset = (role: string) => {
    if (role === "procurement_manager") {
      setCreateForm((prev) => ({
        ...prev,
        role_in_business: role,
        spending_limit: "500000",
        permissions: ["view", "create", "edit", "approve", "reject", "export"],
      }));
    } else if (role === "purchase_staff" || role === "purchase_executive") {
      setCreateForm((prev) => ({
        ...prev,
        role_in_business: role,
        spending_limit: "",
        permissions: ["view", "create", "edit"],
      }));
    } else if (role === "finance_staff" || role === "accounts_executive") {
      setCreateForm((prev) => ({
        ...prev,
        role_in_business: role,
        spending_limit: "",
        permissions: ["view", "create", "edit", "export"],
      }));
    } else if (role === "store_manager") {
      setCreateForm((prev) => ({
        ...prev,
        role_in_business: role,
        spending_limit: "100000",
        permissions: ["view", "create", "edit"],
      }));
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.full_name || !createForm.email || !createForm.business_id) {
      setActionError("Please complete all required fields.");
      return;
    }

    setIsSubmittingCreate(true);
    setActionError("");
    setActionSuccess("");

    try {
      const res = await fetch(`${API_BASE}/admin/employees`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          full_name: createForm.full_name,
          email: createForm.email,
          password: createForm.password || "Password@123",
          phone: createForm.phone,
          business_id: createForm.business_id,
          branch_id: createForm.branch_id || null,
          role_in_business: createForm.role_in_business,
          spending_limit: createForm.spending_limit ? parseFloat(createForm.spending_limit) : null,
          permissions: createForm.permissions,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setActionSuccess(`Employee account created for ${createForm.full_name} (${createForm.email}).`);
        setIsCreateModalOpen(false);
        setCreateForm({
          full_name: "",
          email: "",
          password: "",
          phone: "",
          business_id: businesses[0]?.id || "",
          branch_id: "",
          role_in_business: "procurement_manager",
          spending_limit: "500000",
          permissions: ["view", "create", "edit", "approve", "reject", "export"],
        });
        await loadData();
      } else {
        setActionError(json.error || "Failed to create employee.");
      }
    } catch (err: any) {
      setActionError(err.message || "Network error.");
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  const handleToggleStatus = async (employee: Employee) => {
    const newStatus = !employee.is_active;
    const confirmMsg = newStatus
      ? `Reactivate account for ${employee.users?.full_name}?`
      : `Suspend account for ${employee.users?.full_name}? They will lose access immediately.`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`${API_BASE}/admin/employees/${employee.id}/status`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({
          is_active: newStatus,
          reason: newStatus ? "Admin reactivated account access." : "Admin suspended employee access.",
        }),
      });

      const json = await res.json();
      if (json.success) {
        setActionSuccess(json.message);
        await loadData();
      } else {
        setActionError(json.error || "Failed to update status.");
      }
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleRevoke = async (employee: Employee) => {
    if (
      !confirm(
        `Are you sure you want to revoke access for ${employee.users?.full_name}? Historical orders, RFQs, and approval audits will be preserved.`
      )
    )
      return;

    try {
      const res = await fetch(`${API_BASE}/admin/employees/${employee.id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        setActionSuccess(json.message);
        await loadData();
      } else {
        setActionError(json.error || "Failed to revoke access.");
      }
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setEditRole(emp.role_in_business);
    setEditPermissions(emp.permissions || ["view"]);
    setEditSpendingLimit(emp.spending_limit ? emp.spending_limit.toString() : "");
    setEditBranchId(emp.branch_id || "");
  };

  const handleSaveEdit = async () => {
    if (!editingEmployee) return;
    setIsSavingEdit(true);

    try {
      const res = await fetch(`${API_BASE}/admin/employees/${editingEmployee.id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({
          role_in_business: editRole,
          permissions: editPermissions,
          spending_limit: editSpendingLimit ? parseFloat(editSpendingLimit) : null,
          branch_id: editBranchId || null,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setActionSuccess("Employee permissions & role updated successfully.");
        setEditingEmployee(null);
        await loadData();
      } else {
        setActionError(json.error || "Failed to update permissions.");
      }
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const openActivityModal = async (emp: Employee) => {
    setActivityEmployee(emp);
    setIsLoadingActivity(true);
    setActivityLogs([]);

    try {
      const res = await fetch(`${API_BASE}/admin/employees/${emp.id}/activity`, {
        headers: getHeaders(),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setActivityLogs(json.data);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoadingActivity(false);
    }
  };

  // Filter employees
  const filteredEmployees = employees.filter((emp) => {
    const nameMatch =
      emp.users?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.users?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.businesses?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.role_in_business?.toLowerCase().includes(searchQuery.toLowerCase());

    const roleMatch = selectedRole === "all" || emp.role_in_business === selectedRole;
    const statusMatch =
      selectedStatus === "all" ||
      (selectedStatus === "active" && emp.is_active) ||
      (selectedStatus === "suspended" && !emp.is_active);

    return nameMatch && roleMatch && statusMatch;
  });

  const getRoleBadge = (role: string) => {
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
      case "store_manager":
        return "bg-emerald-100 text-emerald-900 border-emerald-200";
      default:
        return "bg-stone-100 text-stone-800 border-stone-200";
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-stone-900 text-white shadow-xs">
              <Users className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">Employee Roles & RBAC Governance</h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Enterprise administration for Procurement Managers, Purchasing Executives, and Finance / Accounts Teams.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2 rounded-xl border border-stone-200 bg-white text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition shadow-xs"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 text-white font-bold text-xs hover:bg-stone-800 transition shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            Create Employee Account
          </button>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess("")} className="text-emerald-500 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError("")} className="text-rose-500 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Total Staff</div>
          <div className="text-2xl font-black text-stone-900 mt-1">{metrics.total_employees}</div>
          <div className="text-[10px] text-stone-400 mt-0.5">Across all businesses</div>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 shadow-xs">
          <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Procurement</div>
          <div className="text-2xl font-black text-blue-900 mt-1">{metrics.procurement_managers}</div>
          <div className="text-[10px] text-blue-600 mt-0.5">Approval Managers</div>
        </div>

        <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200 shadow-xs">
          <div className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">Purchase Staff</div>
          <div className="text-2xl font-black text-teal-900 mt-1">{metrics.purchase_staff}</div>
          <div className="text-[10px] text-teal-600 mt-0.5">Requisition Creators</div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 shadow-xs">
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Finance / Accts</div>
          <div className="text-2xl font-black text-amber-900 mt-1">{metrics.finance_staff}</div>
          <div className="text-[10px] text-amber-600 mt-0.5">Invoices & Expenses</div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 shadow-xs">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Active Staff</div>
          <div className="text-2xl font-black text-emerald-900 mt-1">{metrics.active_employees}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Full Platform Access</div>
        </div>

        <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 shadow-xs">
          <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Suspended</div>
          <div className="text-2xl font-black text-stone-600 mt-1">{metrics.suspended_employees}</div>
          <div className="text-[10px] text-stone-400 mt-0.5">Access Blocked</div>
        </div>

        <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 shadow-xs">
          <div className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Pending Invites</div>
          <div className="text-2xl font-black text-purple-900 mt-1">{metrics.pending_invitations}</div>
          <div className="text-[10px] text-purple-600 mt-0.5">Awaiting Acceptance</div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
          <input
            type="text"
            placeholder="Search by employee name, email, business, role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-stone-200 rounded-xl text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-stone-600">
            <Filter className="w-3.5 h-3.5 text-stone-400" />
            <span>Role:</span>
          </div>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="border border-stone-200 rounded-xl px-3 py-1.5 text-xs bg-white focus:outline-none"
          >
            <option value="all">All Roles</option>
            <option value="procurement_manager">Procurement Manager</option>
            <option value="purchase_staff">Purchase Staff</option>
            <option value="finance_staff">Finance / Accounts Staff</option>
            <option value="business_manager">Business Manager</option>
            <option value="store_manager">Store Manager</option>
            <option value="owner">Business Owner</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border border-stone-200 rounded-xl px-3 py-1.5 text-xs bg-white focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
          </select>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-stone-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-stone-600" />
            Registered Staff Roster ({filteredEmployees.length})
          </h3>
          <span className="text-xs text-stone-400">Authenticated via Individual Credentials</span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-stone-400">Loading employee directory...</div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-400">
            No employees match your search query or filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider border-b border-stone-200">
                <tr>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Assigned Business & Branch</th>
                  <th className="p-3">Designated Role</th>
                  <th className="p-3">Authority Limit</th>
                  <th className="p-3">Permissions Matrix</th>
                  <th className="p-3">Account Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-stone-50/50">
                    <td className="p-3">
                      <div className="font-bold text-stone-900">{emp.users?.full_name || "Employee"}</div>
                      <div className="text-[11px] text-stone-500 font-mono">{emp.users?.email}</div>
                      {emp.users?.phone && <div className="text-[10px] text-stone-400">{emp.users.phone}</div>}
                    </td>

                    <td className="p-3">
                      <div className="font-semibold text-stone-800 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>{emp.businesses?.name || "Independent"}</span>
                      </div>
                      <div className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                        <span>
                          {emp.business_branches?.branch_name
                            ? `${emp.business_branches.branch_name} (${emp.business_branches.city})`
                            : "HQ / All Branches"}
                        </span>
                      </div>
                    </td>

                    <td className="p-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getRoleBadge(
                          emp.role_in_business
                        )}`}
                      >
                        {emp.role_in_business.replace(/_/g, " ")}
                      </span>
                    </td>

                    <td className="p-3">
                      {emp.spending_limit ? (
                        <div className="font-mono font-bold text-stone-900">
                          ₹{emp.spending_limit.toLocaleString()}
                        </div>
                      ) : emp.role_in_business === "owner" ? (
                        <div className="font-semibold text-purple-700 text-[11px]">Unlimited</div>
                      ) : (
                        <div className="text-[11px] text-stone-400">No Approval Limit</div>
                      )}
                    </td>

                    <td className="p-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {emp.permissions?.map((p) => (
                          <span
                            key={p}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200 text-stone-600 font-medium"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="p-3">
                      <button
                        onClick={() => handleToggleStatus(emp)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition ${
                          emp.is_active
                            ? "bg-emerald-100 text-emerald-800 hover:bg-rose-100 hover:text-rose-800"
                            : "bg-rose-100 text-rose-800 hover:bg-emerald-100 hover:text-emerald-800"
                        }`}
                        title="Click to toggle status"
                      >
                        {emp.is_active ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <X className="w-3 h-3" />
                            <span>Suspended</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="p-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => openActivityModal(emp)}
                          className="p-1.5 rounded-lg text-stone-500 hover:text-blue-700 hover:bg-blue-50 transition"
                          title="View Employee Activity Log"
                        >
                          <Activity className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(emp)}
                          className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition"
                          title="Edit Permissions & Authority"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {emp.role_in_business !== "owner" && (
                          <button
                            onClick={() => handleRevoke(emp)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Soft Revoke Employee Access"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* CREATE EMPLOYEE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 border border-stone-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-500 text-stone-950 font-bold">
                  <UserPlus className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-stone-900">Provision New Employee Account</h3>
                  <p className="text-xs text-stone-500">Create individual login credentials with RBAC permissions.</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-stone-400 hover:text-stone-800 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kulkarni"
                    value={createForm.full_name}
                    onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-1">
                    Email Address (Login ID) *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. ramesh.k@company.in"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-1">
                    Initial Password *
                  </label>
                  <input
                    type="password"
                    placeholder="Temporary login password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none"
                  />
                  <div className="text-[10px] text-stone-400 mt-0.5">Defaults to Password@123 if empty.</div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-1">
                    Contact Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 98200 11223"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Business & Branch Assignment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-stone-100">
                <div>
                  <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-1">
                    Assign Business *
                  </label>
                  <select
                    required
                    value={createForm.business_id}
                    onChange={(e) => setCreateForm({ ...createForm, business_id: e.target.value, branch_id: "" })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-white focus:outline-none"
                  >
                    {businesses.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.city || "India"})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-1">
                    Assign Branch (Optional)
                  </label>
                  <select
                    value={createForm.branch_id}
                    onChange={(e) => setCreateForm({ ...createForm, branch_id: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-white focus:outline-none"
                  >
                    <option value="">Headquarters / All Branches</option>
                    {businessBranches.map((br) => (
                      <option key={br.id} value={br.id}>
                        {br.branch_name} ({br.city})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Role Selection & Quick Presets */}
              <div className="pt-2 border-t border-stone-100">
                <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-1">
                  Designated Role & Authority *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                  {[
                    { id: "procurement_manager", label: "Procurement Mgr", desc: "Approves PRs & POs" },
                    { id: "purchase_staff", label: "Purchase Staff", desc: "Requisitions & RFQs" },
                    { id: "finance_staff", label: "Finance / Accounts", desc: "Invoices & Payments" },
                    { id: "store_manager", label: "Store Manager", desc: "Branch Inventory" },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => applyRolePreset(r.id)}
                      className={`p-2.5 text-left rounded-xl border text-xs transition ${
                        createForm.role_in_business === r.id
                          ? "border-stone-900 bg-stone-900 text-white shadow-xs"
                          : "border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800"
                      }`}
                    >
                      <div className="font-bold">{r.label}</div>
                      <div
                        className={`text-[10px] mt-0.5 ${
                          createForm.role_in_business === r.id ? "text-stone-300" : "text-stone-500"
                        }`}
                      >
                        {r.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Spending Limit */}
              {createForm.role_in_business === "procurement_manager" && (
                <div>
                  <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-1">
                    Approval Authority Limit (₹ INR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-stone-400 font-bold text-xs">₹</span>
                    <input
                      type="number"
                      placeholder="e.g. 500000"
                      value={createForm.spending_limit}
                      onChange={(e) => setCreateForm({ ...createForm, spending_limit: e.target.value })}
                      className="w-full pl-7 pr-4 py-2 border border-stone-200 rounded-xl text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none"
                    />
                  </div>
                  <div className="text-[10px] text-stone-400 mt-0.5">
                    Orders exceeding this limit require Business Owner authorization.
                  </div>
                </div>
              )}

              {/* Permissions Checkboxes */}
              <div>
                <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-1.5">
                  Granular Permissions Matrix
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PERMISSION_OPTIONS.map((opt) => {
                    const isChecked = createForm.permissions.includes(opt.key);
                    return (
                      <label
                        key={opt.key}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-[11px] cursor-pointer transition ${
                          isChecked
                            ? "bg-amber-50/80 border-amber-300 text-amber-950 font-semibold"
                            : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setCreateForm({
                                ...createForm,
                                permissions: createForm.permissions.filter((p) => p !== opt.key),
                              });
                            } else {
                              setCreateForm({
                                ...createForm,
                                permissions: [...createForm.permissions, opt.key],
                              });
                            }
                          }}
                          className="rounded text-amber-600 focus:ring-0 w-3.5 h-3.5"
                        />
                        <span>{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCreate}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-50 transition shadow-sm"
                >
                  {isSubmittingCreate ? "Creating Employee..." : "Create Account & Grant Access"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PERMISSIONS MODAL */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-stone-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  Edit Role & Permissions: {editingEmployee.users?.full_name}
                </h3>
                <p className="text-xs text-stone-500">{editingEmployee.users?.email}</p>
              </div>
              <button onClick={() => setEditingEmployee(null)} className="text-stone-400 hover:text-stone-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-1">
                  Role Assignment
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-white focus:outline-none"
                >
                  <option value="procurement_manager">Procurement Manager</option>
                  <option value="purchase_staff">Purchase Staff</option>
                  <option value="finance_staff">Finance / Accounts Staff</option>
                  <option value="business_manager">Business Manager</option>
                  <option value="store_manager">Store Manager</option>
                  <option value="owner">Business Owner</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-1">
                  Spending Limit (₹)
                </label>
                <input
                  type="number"
                  placeholder="Unlimited if empty"
                  value={editSpendingLimit}
                  onChange={(e) => setEditSpendingLimit(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-1.5">
                  Permissions Matrix
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PERMISSION_OPTIONS.map((opt) => {
                    const isChecked = editPermissions.includes(opt.key);
                    return (
                      <label
                        key={opt.key}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-[11px] cursor-pointer ${
                          isChecked
                            ? "bg-amber-50/80 border-amber-300 text-amber-950 font-semibold"
                            : "bg-white border-stone-200 text-stone-600"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setEditPermissions(editPermissions.filter((p) => p !== opt.key));
                            } else {
                              setEditPermissions([...editPermissions, opt.key]);
                            }
                          }}
                          className="rounded text-amber-600 focus:ring-0 w-3.5 h-3.5"
                        />
                        <span>{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setEditingEmployee(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingEdit}
                onClick={handleSaveEdit}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-50 shadow-sm"
              >
                {isSavingEdit ? "Saving Changes..." : "Save Permissions"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVITY AUDIT LOG MODAL */}
      {activityEmployee && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 border border-stone-200 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-100 text-blue-900">
                  <Activity className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-stone-900">
                    Activity Audit Trail: {activityEmployee.users?.full_name}
                  </h3>
                  <p className="text-xs text-stone-500">
                    Role: {activityEmployee.role_in_business.replace(/_/g, " ")} • Business:{" "}
                    {activityEmployee.businesses?.name}
                  </p>
                </div>
              </div>
              <button onClick={() => setActivityEmployee(null)} className="text-stone-400 hover:text-stone-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-3">
              {isLoadingActivity ? (
                <div className="p-12 text-center text-xs text-stone-400">Loading audit trail...</div>
              ) : activityLogs.length === 0 ? (
                <div className="p-12 text-center text-xs text-stone-400">
                  No recorded activities found for this employee account yet.
                </div>
              ) : (
                activityLogs.map((act) => (
                  <div
                    key={act.id}
                    className="p-3 rounded-2xl bg-stone-50 border border-stone-200 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-stone-200 text-stone-800">
                        {act.activity_type.replace(/_/g, " ")}
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {new Date(act.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="font-semibold text-stone-900">{act.description}</div>
                    {act.business_branches?.branch_name && (
                      <div className="text-[11px] text-stone-500">
                        Branch: {act.business_branches.branch_name} ({act.business_branches.city})
                      </div>
                    )}
                    {act.metadata && Object.keys(act.metadata).length > 0 && (
                      <pre className="text-[10px] font-mono bg-stone-100 p-2 rounded-lg text-stone-700 overflow-x-auto">
                        {JSON.stringify(act.metadata, null, 2)}
                      </pre>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-stone-200 flex justify-end">
              <button
                onClick={() => setActivityEmployee(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-800 transition"
              >
                Close Audit Trail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
