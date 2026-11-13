import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Search, ShieldAlert, CheckCircle, Ban } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const AdminUsersPage: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);

    fetch(`${API_BASE}/admin/users?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setUsers(data.data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const handleToggleStatus = async (targetUser: any) => {
    if (!user) return;
    const newStatus = !targetUser.is_active;
    const reason = prompt(
      `Enter reason for ${newStatus ? "activating" : "suspending"} account ${targetUser.email}:`
    );
    if (reason === null) return;

    try {
      const res = await fetch(`${API_BASE}/admin/users/${targetUser.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_active: newStatus,
          admin_id: user.id,
          reason,
        }),
      });

      const body = await res.json();
      if (!res.ok || !body.success) {
        throw new Error(body.error || "Failed to update user status.");
      }

      fetchUsers();
    } catch (err: any) {
      alert(err.message || "Failed to toggle status.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">User Account Governance</h1>
        <p className="text-xs text-stone-500 mt-1">
          Inspect registered buyers, suppliers, and administrators; manage account authorization states
        </p>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by full name or email address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-800"
          />
        </div>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 bg-stone-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-xs text-stone-500">No users found.</div>
        ) : (
          <table className="w-full text-left text-xs text-stone-600">
            <thead className="bg-stone-50 border-b border-stone-200 text-[11px] font-semibold uppercase tracking-wider text-stone-700">
              <tr>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Assigned Roles</th>
                <th className="py-3.5 px-4">Account Status</th>
                <th className="py-3.5 px-4">Registered Date</th>
                <th className="py-3.5 px-4 text-right">Moderation Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {users.map((u) => {
                const roles = u.user_roles?.map((r: any) => r.role).join(", ") || "buyer";
                return (
                  <tr key={u.id} className="hover:bg-stone-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-stone-900">{u.full_name}</div>
                      <div className="text-[11px] text-stone-500">{u.email}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-stone-700 capitalize">
                      {roles}
                    </td>
                    <td className="py-3 px-4">
                      {u.is_active ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                          <CheckCircle className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-800 bg-red-50 px-2 py-0.5 rounded">
                          <Ban className="w-3 h-3" />
                          Suspended
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-stone-500">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`px-3 py-1 rounded text-xs font-semibold transition ${
                          u.is_active
                            ? "bg-red-50 text-red-700 hover:bg-red-100"
                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        }`}
                      >
                        {u.is_active ? "Suspend Account" : "Activate Account"}
                      </button>
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
