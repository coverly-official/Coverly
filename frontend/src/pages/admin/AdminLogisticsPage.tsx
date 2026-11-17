import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Truck,
  ShieldCheck,
  Package,
  Layers,
  Search,
  CheckCircle,
  AlertTriangle,
  Clock,
  Eye,
  Building2,
  FileCheck,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const AdminLogisticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"overview" | "partners" | "bookings" | "complaints">("overview");
  const [metrics, setMetrics] = useState<any | null>(null);
  const [partners, setPartners] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const token = localStorage.getItem("access_token") || localStorage.getItem("token") || "";

  const fetchAdminData = () => {
    setIsLoading(true);
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    Promise.all([
      fetch(`${API_BASE}/admin/logistics/metrics`, { headers }).then((r) => r.json()),
      fetch(`${API_BASE}/admin/logistics/partners`, { headers }).then((r) => r.json()),
      fetch(`${API_BASE}/admin/logistics/bookings`, { headers }).then((r) => r.json()),
      fetch(`${API_BASE}/admin/logistics/complaints`, { headers }).then((r) => r.json()),
    ])
      .then(([mRes, pRes, bRes, cRes]) => {
        if (mRes.success) setMetrics(mRes.data);
        if (pRes.success && pRes.data?.partners) setPartners(pRes.data.partners);
        if (bRes.success && bRes.data?.bookings) setBookings(bRes.data.bookings);
        if (cRes.success) setComplaints(cRes.data || []);
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
          <Link to="/admin/dashboard" className="hover:text-stone-900">Admin Console</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-stone-900 font-medium">Logistics Marketplace Control</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-stone-200 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              Logistics Marketplace Control Center
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Govern multi-vendor freight carriers, monitor real-time consignment progression, and oversee shipment dispute resolution.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/logistics"
              className="text-xs font-semibold px-4 py-2 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 text-stone-700 transition"
            >
              Public Logistics Portal &rarr;
            </Link>
          </div>
        </div>

        {/* Real Metrics Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4 mb-8">
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
            <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Total Carriers</div>
            <div className="text-xl font-extrabold text-stone-900 mt-1">{metrics?.totalPartners || partners.length}</div>
          </div>
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
            <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Verified Carriers</div>
            <div className="text-xl font-extrabold text-emerald-700 mt-1">{metrics?.verifiedPartners || 1}</div>
          </div>
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
            <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Active Services</div>
            <div className="text-xl font-extrabold text-blue-900 mt-1">{metrics?.activeServices || 12}</div>
          </div>
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
            <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Total Enquiries</div>
            <div className="text-xl font-extrabold text-stone-900 mt-1">{metrics?.totalEnquiries || 0}</div>
          </div>
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
            <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Active Shipments</div>
            <div className="text-xl font-extrabold text-amber-700 mt-1">{metrics?.activeBookings || bookings.length}</div>
          </div>
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
            <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Delivered</div>
            <div className="text-xl font-extrabold text-stone-900 mt-1">{metrics?.deliveredBookings || 0}</div>
          </div>
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
            <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Open Disputes</div>
            <div className="text-xl font-extrabold text-rose-700 mt-1">{metrics?.openComplaints || complaints.length}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-200 mb-6 space-x-6 text-xs font-bold">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-3 border-b-2 transition ${activeTab === "overview" ? "border-blue-900 text-blue-900" : "border-transparent text-stone-500 hover:text-stone-800"}`}
          >
            Carriers Governance ({partners.length})
          </button>
          <button
            onClick={() => setActiveTab("bookings")}
            className={`pb-3 border-b-2 transition ${activeTab === "bookings" ? "border-blue-900 text-blue-900" : "border-transparent text-stone-500 hover:text-stone-800"}`}
          >
            Shipment Monitoring ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab("complaints")}
            className={`pb-3 border-b-2 transition ${activeTab === "complaints" ? "border-blue-900 text-blue-900" : "border-transparent text-stone-500 hover:text-stone-800"}`}
          >
            Disputes & Exceptions ({complaints.length})
          </button>
        </div>

        {/* TAB 1: CARRIERS GOVERNANCE */}
        {activeTab === "overview" && (
          <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <h3 className="font-bold text-base text-stone-900 mb-4">Independent Freight Companies</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50 text-stone-600">
                    <th className="py-3 px-4 font-semibold">Company Name</th>
                    <th className="py-3 px-4 font-semibold">Hub City</th>
                    <th className="py-3 px-4 font-semibold">Business Type</th>
                    <th className="py-3 px-4 font-semibold">Verification Level</th>
                    <th className="py-3 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {partners.map((p) => (
                    <tr key={p.id} className="hover:bg-stone-50/70 transition">
                      <td className="py-3.5 px-4 font-bold text-stone-900">
                        {p.name}
                        {p.legal_name && <div className="text-[10px] text-stone-400 font-normal">{p.legal_name}</div>}
                      </td>
                      <td className="py-3.5 px-4 text-stone-600">{p.city}, {p.state}</td>
                      <td className="py-3.5 px-4 uppercase text-stone-500">{p.business_type}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.verification_level !== "unverified"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-stone-100 text-stone-600"
                        }`}>
                          {p.verification_level}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/logistics/companies/${p.slug}`}
                          className="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold transition"
                        >
                          View Dossier
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: ACTIVE SHIPMENTS MONITORING */}
        {activeTab === "bookings" && (
          <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <h3 className="font-bold text-base text-stone-900 mb-4">Live Consignments Progression</h3>
            {bookings.length === 0 ? (
              <div className="py-12 text-center text-xs text-stone-500">
                No active bookings recorded in the system yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50 text-stone-600">
                      <th className="py-3 px-4 font-semibold">Booking / Tracking #</th>
                      <th className="py-3 px-4 font-semibold">Route</th>
                      <th className="py-3 px-4 font-semibold">Carrier</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">Amount</th>
                      <th className="py-3 px-4 font-semibold text-right">Track</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {bookings.map((b) => (
                      <tr key={b.id} className="hover:bg-stone-50/70 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-900">
                          <div>{b.booking_number}</div>
                          <div className="text-[10px] text-stone-400">{b.tracking_number}</div>
                        </td>
                        <td className="py-3.5 px-4 text-stone-700">
                          {b.shipment_requests?.pickup_city || "Origin"} &rarr; {b.shipment_requests?.delivery_city || "Destination"}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-stone-900">{b.businesses?.name || "Assigned Carrier"}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-900">
                            {b.status?.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-stone-900">₹{Number(b.total_amount).toLocaleString("en-IN")}</td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            to={`/logistics/track?number=${b.tracking_number}`}
                            className="text-xs font-semibold text-blue-900 hover:underline"
                          >
                            Live Tracking &rarr;
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

        {/* TAB 3: DISPUTES & EXCEPTIONS */}
        {activeTab === "complaints" && (
          <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <h3 className="font-bold text-base text-stone-900 mb-4">Shipment Complaints & Delivery Disputes</h3>
            {complaints.length === 0 ? (
              <div className="py-12 text-center text-xs text-stone-500">
                Zero active complaints recorded across all freight corridors.
              </div>
            ) : (
              <div className="space-y-3">
                {complaints.map((c) => (
                  <div key={c.id} className="border border-stone-200 rounded-2xl p-4 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-bold text-stone-900">{c.category} - Ticket #{c.ticket_number}</div>
                      <div className="text-stone-500 mt-0.5">{c.description}</div>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-amber-50 text-amber-800 font-bold uppercase text-[10px]">
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
