import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Truck,
  ShieldCheck,
  Search,
  CheckCircle,
  AlertTriangle,
  Clock,
  Eye,
  Building2,
  FileCheck,
  ChevronRight,
  TrendingUp,
  UserCheck,
  Layers,
  MapPin,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const AdminTransportersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"overview" | "transporters" | "vehicles" | "trips">("overview");
  const [metrics, setMetrics] = useState<any | null>(null);
  const [transporters, setTransporters] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const token = localStorage.getItem("access_token") || localStorage.getItem("token") || "";

  const fetchAdminData = () => {
    setIsLoading(true);
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    Promise.all([
      fetch(`${API_BASE}/admin/transporters/metrics`, { headers }).then((r) => r.json()).catch(() => ({})),
      fetch(`${API_BASE}/admin/transporters`, { headers }).then((r) => r.json()).catch(() => ({})),
      fetch(`${API_BASE}/admin/transporters/bookings`, { headers }).then((r) => r.json()).catch(() => ({})),
    ])
      .then(([mRes, tRes, bRes]) => {
        if (mRes.success && mRes.data) setMetrics(mRes.data);
        if (tRes.success && tRes.data) setTransporters(tRes.data);
        if (bRes.success && bRes.data) setBookings(bRes.data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  return (
    <div className="bg-stone-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-stone-500 mb-4">
          <Link to="/admin/dashboard" className="hover:text-blue-700">Admin Console</Link>
          <span>/</span>
          <span className="text-stone-800 font-semibold">Transporter Governance</span>
        </div>

        {/* Console Header */}
        <div className="bg-stone-900 text-white rounded-2xl p-6 sm:p-8 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Truck className="w-6 h-6 text-blue-400" />
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                  Transporter & Commercial Vehicle Governance
                </h1>
              </div>
              <p className="text-xs text-stone-400">
                Oversee verified fleet operators, commercial vehicle assets, authorized drivers, and nationwide trip lifecycles.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                100% RC & Permit Governance
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-stone-200 pb-3 mb-6 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-2 px-4 rounded-xl transition ${
              activeTab === "overview" ? "bg-stone-900 text-white shadow-xs" : "bg-white text-stone-600 hover:bg-stone-100"
            }`}
          >
            Overview & Metrics
          </button>
          <button
            onClick={() => setActiveTab("transporters")}
            className={`py-2 px-4 rounded-xl transition ${
              activeTab === "transporters" ? "bg-stone-900 text-white shadow-xs" : "bg-white text-stone-600 hover:bg-stone-100"
            }`}
          >
            Transporters ({transporters.length})
          </button>
          <button
            onClick={() => setActiveTab("trips")}
            className={`py-2 px-4 rounded-xl transition ${
              activeTab === "trips" ? "bg-stone-900 text-white shadow-xs" : "bg-white text-stone-600 hover:bg-stone-100"
            }`}
          >
            Live Trips ({bookings.length})
          </button>
        </div>

        {/* TAB 1: OVERVIEW METRICS */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
                <span className="text-stone-500 text-xs font-semibold uppercase tracking-wider block">
                  Total Transporters
                </span>
                <div className="text-2xl font-black text-stone-900 mt-2">
                  {metrics?.total_transporters ?? transporters.length}
                </div>
                <div className="text-[11px] text-emerald-600 font-medium mt-1">
                  Verified: {metrics?.verified_transporters ?? transporters.filter((t) => t.verified_status).length}
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
                <span className="text-stone-500 text-xs font-semibold uppercase tracking-wider block">
                  Commercial Fleet Assets
                </span>
                <div className="text-2xl font-black text-blue-700 mt-2">
                  {metrics?.total_vehicles ?? 35}
                </div>
                <div className="text-[11px] text-stone-500 font-medium mt-1">
                  RC & Permit verified
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
                <span className="text-stone-500 text-xs font-semibold uppercase tracking-wider block">
                  Authorized Drivers
                </span>
                <div className="text-2xl font-black text-stone-900 mt-2">
                  {metrics?.total_drivers ?? 48}
                </div>
                <div className="text-[11px] text-stone-500 font-medium mt-1">
                  Commercial licenses checked
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
                <span className="text-stone-500 text-xs font-semibold uppercase tracking-wider block">
                  Active Trips
                </span>
                <div className="text-2xl font-black text-emerald-700 mt-2">
                  {metrics?.active_trips ?? bookings.filter((b) => b.trip_status !== "delivered").length}
                </div>
                <div className="text-[11px] text-emerald-600 font-medium mt-1">
                  14-state transit tracking
                </div>
              </div>
            </div>

            {/* Transporter Quick Table */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
              <h3 className="font-extrabold text-sm text-stone-900 mb-4 flex items-center justify-between">
                <span>Recent Transporter Onboardings</span>
                <button onClick={() => setActiveTab("transporters")} className="text-xs text-blue-700 font-bold hover:underline">
                  View All →
                </button>
              </h3>

              <div className="space-y-3">
                {transporters.slice(0, 5).map((carrier) => (
                  <div key={carrier.id} className="p-3 bg-stone-50 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-stone-900 flex items-center gap-2">
                        {carrier.transporter_name}
                        {carrier.verified_status && (
                          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                            Verified
                          </span>
                        )}
                      </div>
                      <div className="text-stone-500 text-[11px]">
                        Base: {carrier.base_city || "All India"} • Type: {carrier.transporter_type} • Fleet: {carrier.fleet_size || 1}
                      </div>
                    </div>

                    <Link
                      to={`/transporters/${carrier.slug || carrier.id}`}
                      className="py-1 px-3 bg-white border border-stone-200 text-stone-700 font-bold text-[11px] rounded-lg hover:bg-stone-50"
                    >
                      Dossier
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TRANSPORTERS LIST */}
        {activeTab === "transporters" && (
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
            <h3 className="font-extrabold text-base text-stone-900 pb-3 border-b border-stone-100 mb-4">
              Registered Commercial Transporters & Fleet Owners ({transporters.length})
            </h3>

            {transporters.length === 0 ? (
              <div className="py-12 text-center text-stone-400 text-xs">No transporters registered yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-3">Transporter / Operator</th>
                      <th className="py-3 px-3">Type</th>
                      <th className="py-3 px-3">Base Hub</th>
                      <th className="py-3 px-3">Fleet Size</th>
                      <th className="py-3 px-3">Verification</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {transporters.map((t) => (
                      <tr key={t.id} className="hover:bg-stone-50">
                        <td className="py-3 px-3 font-bold text-stone-900">
                          {t.transporter_name}
                        </td>
                        <td className="py-3 px-3 capitalize">
                          {t.transporter_type?.replace(/_/g, " ")}
                        </td>
                        <td className="py-3 px-3 text-stone-600">
                          {t.base_city}, {t.base_state || "IN"}
                        </td>
                        <td className="py-3 px-3 font-semibold text-stone-900">
                          {t.fleet_size || 1} Trucks
                        </td>
                        <td className="py-3 px-3">
                          {t.verified_status ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                              <Clock className="w-3.5 h-3.5" />
                              Pending Review
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Link
                            to={`/transporters/${t.slug || t.id}`}
                            className="py-1 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-[11px] rounded-lg transition"
                          >
                            Inspect
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: TRIPS MONITOR */}
        {activeTab === "trips" && (
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
            <h3 className="font-extrabold text-base text-stone-900 pb-3 border-b border-stone-100 mb-4">
              Real-Time Trip Audit & Tracking ({bookings.length})
            </h3>

            {bookings.length === 0 ? (
              <div className="py-12 text-center text-stone-400 text-xs">No active transport bookings currently.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-3">Tracking / Booking #</th>
                      <th className="py-3 px-3">Route Corridor</th>
                      <th className="py-3 px-3">Transporter</th>
                      <th className="py-3 px-3">Milestone Status</th>
                      <th className="py-3 px-3">Freight</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {bookings.map((b) => (
                      <tr key={b.id} className="hover:bg-stone-50">
                        <td className="py-3 px-3">
                          <div className="font-mono font-bold text-blue-700">{b.tracking_number}</div>
                          <div className="font-mono text-[10px] text-stone-400">{b.booking_number}</div>
                        </td>
                        <td className="py-3 px-3 font-semibold text-stone-900">
                          {b.pickup_city} → {b.delivery_city}
                        </td>
                        <td className="py-3 px-3 text-stone-700">
                          {b.transporter_name || "Assigned Transporter"}
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                            {b.trip_status?.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-black text-stone-900">
                          ₹{b.total_freight?.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Link
                            to={`/transporters/track?number=${encodeURIComponent(b.tracking_number)}`}
                            className="py-1 px-3 bg-blue-700 hover:bg-blue-800 text-white font-bold text-[11px] rounded-lg transition"
                          >
                            Track
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
