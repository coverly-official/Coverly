import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import type { InAppNotification } from "@/types";
import { Bell, CheckCircle } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);

    fetch(`${API_BASE}/notifications?user_id=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setNotifications(data.data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [user]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch(`${API_BASE}/notifications/${id}/read`, { method: "PATCH" });
      setNotifications(
        notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {}
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">Notifications</h1>
        <p className="text-xs text-stone-500 mt-1">Platform alerts, quote arrivals, and order dispatches</p>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs divide-y divide-stone-100">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-stone-400">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 text-xs text-stone-500">
            <Bell className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            No new notifications.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 flex items-start justify-between gap-4 text-xs transition ${
                n.is_read ? "bg-white" : "bg-stone-50/80 font-medium"
              }`}
            >
              <div>
                <div className="font-semibold text-stone-900">{n.title}</div>
                <div className="text-stone-600 mt-0.5">{n.message}</div>
                <div className="text-[10px] text-stone-400 mt-1">
                  {new Date(n.created_at).toLocaleString()}
                </div>
              </div>

              {!n.is_read && (
                <button
                  onClick={() => handleMarkAsRead(n.id)}
                  className="text-[11px] text-stone-500 hover:text-stone-900 underline shrink-0"
                >
                  Mark read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
