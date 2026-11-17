import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Truck,
  ShieldCheck,
  Package,
  Layers,
  Send,
  MapPin,
  Clock,
  CheckCircle,
  PlusCircle,
  DollarSign,
  TrendingUp,
  FileCheck,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const PartnerDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"enquiries" | "bookings" | "services" | "analytics">("enquiries");
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Quote modal
  const [selectedEnquiry, setSelectedEnquiry] = useState<any | null>(null);
  const [quoteForm, setQuoteForm] = useState({
    base_freight: "",
    fuel_surcharge: "0",
    handling_charges: "0",
    pickup_drop_charges: "0",
    insurance_charges: "0",
    gst_rate: "0.18",
    estimated_delivery_days: "3",
    valid_until: new Date(Date.now() + 86400000 * 7).toISOString().split("T")[0],
    terms_and_conditions: "Standard B2B Carrier Terms & Transit Conditions apply.",
  });
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);

  // Status update modal
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [statusUpdateForm, setStatusUpdateForm] = useState({
    status: "in_transit",
    location: "",
    description: "",
    driver_name: "",
    driver_phone: "",
    vehicle_number: "",
    delivery_proof_url: "",
  });
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const token = localStorage.getItem("access_token") || localStorage.getItem("token") || "";

  const fetchDashboardData = () => {
    setIsLoading(true);
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    Promise.all([
      fetch(`${API_BASE}/logistics/partner/analytics`, { headers }).then((r) => r.json()),
      fetch(`${API_BASE}/logistics/partner/enquiries`, { headers }).then((r) => r.json()),
      fetch(`${API_BASE}/logistics/partner/bookings`, { headers }).then((r) => r.json()),
      fetch(`${API_BASE}/logistics/partner/services`, { headers }).then((r) => r.json()),
    ])
      .then(([aRes, eRes, bRes, sRes]) => {
        if (aRes.success) setAnalytics(aRes.data);
        if (eRes.success) setEnquiries(eRes.data || []);
        if (bRes.success && bRes.data?.bookings) setBookings(bRes.data.bookings || []);
        if (sRes.success) setServices(sRes.data || []);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnquiry) return;
    setIsSubmittingQuote(true);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/logistics/partner/enquiries/${selectedEnquiry.id}/quotation`, {
        method: "POST",
        headers,
        body: JSON.stringify(quoteForm),
      });

      const data = await res.json();
      if (data.success) {
        setSelectedEnquiry(null);
        fetchDashboardData();
      } else {
        alert(data.error || "Failed to submit quote.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to submit quotation.");
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    setIsUpdatingStatus(true);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/logistics/partner/bookings/${selectedBooking.id}/status`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(statusUpdateForm),
      });

      const data = await res.json();
      if (data.success) {
        setSelectedBooking(null);
        fetchDashboardData();
      } else {
        alert(data.error || "Failed to update status.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to update status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="bg-stone-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-stone-200 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                Logistics Partner Portal
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              Carrier Operations & Dispatch Hub
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Formulate landed-cost quotations, manage incoming customer leads, and advance live shipment tracking.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/logistics"
              className="text-xs font-semibold px-4 py-2 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 text-stone-700 transition"
            >
              Public Marketplace
            </Link>
          </div>
        </div>

        {/* Analytics KPI Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
            <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Total Enquiries</div>
            <div className="text-xl font-extrabold text-stone-900 mt-1">{analytics?.totalEnquiries || enquiries.length}</div>
          </div>
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
            <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Quotes Submitted</div>
            <div className="text-xl font-extrabold text-stone-900 mt-1">{analytics?.quotesSubmitted || 0}</div>
          </div>
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
            <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Accepted Quotes</div>
            <div className="text-xl font-extrabold text-emerald-700 mt-1">{analytics?.quotesAccepted || 0}</div>
          </div>
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
            <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Active Shipments</div>
            <div className="text-xl font-extrabold text-blue-900 mt-1">{analytics?.activeShipments || bookings.length}</div>
          </div>
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
            <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Delivered</div>
            <div className="text-xl font-extrabold text-stone-900 mt-1">{analytics?.deliveredShipments || 0}</div>
          </div>
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
            <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Conversion Rate</div>
            <div className="text-xl font-extrabold text-stone-900 mt-1">{analytics?.conversionRate || 0}%</div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-stone-200 mb-6 space-x-6 text-xs font-bold">
          <button
            onClick={() => setActiveTab("enquiries")}
            className={`pb-3 border-b-2 transition ${activeTab === "enquiries" ? "border-blue-900 text-blue-900" : "border-transparent text-stone-500 hover:text-stone-800"}`}
          >
            Incoming Enquiries ({enquiries.length})
          </button>
          <button
            onClick={() => setActiveTab("bookings")}
            className={`pb-3 border-b-2 transition ${activeTab === "bookings" ? "border-blue-900 text-blue-900" : "border-transparent text-stone-500 hover:text-stone-800"}`}
          >
            Active Bookings & Tracking ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab("services")}
            className={`pb-3 border-b-2 transition ${activeTab === "services" ? "border-blue-900 text-blue-900" : "border-transparent text-stone-500 hover:text-stone-800"}`}
          >
            Published Services ({services.length})
          </button>
        </div>

        {/* TAB 1: INCOMING ENQUIRIES */}
        {activeTab === "enquiries" && (
          <div className="space-y-4">
            {enquiries.length === 0 ? (
              <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center text-xs text-stone-500">
                No active shipment enquiries matching your operating corridors right now.
              </div>
            ) : (
              enquiries.map((enq) => (
                <div
                  key={enq.id}
                  className="bg-white border border-stone-200 hover:border-blue-900/50 rounded-2xl p-6 transition shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-blue-900">{enq.request_number}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                        {enq.status}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-stone-900 mt-1">
                      {enq.pickup_city} &rarr; {enq.delivery_city}
                    </h3>
                    <p className="text-xs text-stone-600 mt-0.5">
                      {enq.goods_description} • <span className="font-medium">{enq.weight_kg} kg</span> ({enq.goods_category})
                    </p>

                    <div className="flex flex-wrap gap-4 text-xs text-stone-500 mt-3">
                      <span>Pickup: <strong>{enq.preferred_pickup_date}</strong></span>
                      <span>Customer: {enq.customer_name}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setSelectedEnquiry(enq);
                        setQuoteForm((prev) => ({
                          ...prev,
                          base_freight: String(Number(enq.weight_kg) * 8),
                        }));
                      }}
                      className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Submit Quotation
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: ACTIVE BOOKINGS & TRACKING PROGRESSION */}
        {activeTab === "bookings" && (
          <div className="space-y-4">
            {bookings.length === 0 ? (
              <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center text-xs text-stone-500">
                No active bookings assigned yet. Enquiries you quote will appear here once accepted by buyers.
              </div>
            ) : (
              bookings.map((bk) => (
                <div
                  key={bk.id}
                  className="bg-white border border-stone-200 rounded-2xl p-6 transition shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-blue-900">{bk.booking_number}</span>
                      <span className="font-mono text-[11px] text-stone-500">Tracking: {bk.tracking_number}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-900">
                        {bk.status?.replace(/_/g, " ")}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-stone-900 mt-1">
                      {bk.shipment_requests?.pickup_city || "Origin"} &rarr; {bk.shipment_requests?.delivery_city || "Destination"}
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Customer: {bk.customer_name} ({bk.customer_phone}) • Total: ₹{Number(bk.total_amount).toLocaleString("en-IN")}
                    </p>

                    <div className="text-xs text-stone-600 mt-2">
                      Current Location: <strong>{bk.current_location || "In Depot"}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setSelectedBooking(bk);
                        setStatusUpdateForm({
                          status: "in_transit",
                          location: bk.current_location || "",
                          description: "",
                          driver_name: bk.driver_name || "",
                          driver_phone: bk.driver_phone || "",
                          vehicle_number: bk.vehicle_number || "",
                          delivery_proof_url: "",
                        });
                      }}
                      className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition"
                    >
                      Advance Status & Track
                    </button>
                    <Link
                      to={`/logistics/track?number=${bk.tracking_number}`}
                      className="text-xs font-semibold text-blue-900 hover:underline px-2 py-1"
                    >
                      Live View &rarr;
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: PUBLISHED SERVICES */}
        {activeTab === "services" && (
          <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-100">
              <h3 className="font-bold text-base text-stone-900">Published Freight Services</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50 text-stone-600">
                    <th className="py-2.5 px-3">Service</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Pricing Model</th>
                    <th className="py-2.5 px-3">Base Rate</th>
                    <th className="py-2.5 px-3">Min Charge</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {services.map((srv) => (
                    <tr key={srv.id}>
                      <td className="py-3 px-3 font-semibold text-stone-900">{srv.service_name}</td>
                      <td className="py-3 px-3 uppercase text-stone-600">{srv.category}</td>
                      <td className="py-3 px-3 text-stone-600">{srv.pricing_model}</td>
                      <td className="py-3 px-3 font-bold text-stone-900">₹{srv.base_rate}</td>
                      <td className="py-3 px-3 text-stone-600">₹{srv.min_charge}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUBMIT QUOTATION MODAL */}
        {selectedEnquiry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center pb-3 mb-4 border-b border-stone-100">
                <h3 className="font-bold text-base text-stone-900">Formulate Landed Freight Quotation</h3>
                <button
                  type="button"
                  onClick={() => setSelectedEnquiry(null)}
                  className="text-stone-400 hover:text-stone-700 text-lg font-bold"
                >
                  &times;
                </button>
              </div>

              <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs mb-4">
                <div>Route: <strong>{selectedEnquiry.pickup_city} &rarr; {selectedEnquiry.delivery_city}</strong></div>
                <div>Cargo: {selectedEnquiry.weight_kg}kg ({selectedEnquiry.goods_description})</div>
              </div>

              <form onSubmit={handleQuoteSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">Base Freight (₹) *</label>
                  <input
                    type="number"
                    required
                    value={quoteForm.base_freight}
                    onChange={(e) => setQuoteForm({ ...quoteForm, base_freight: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-none focus:border-blue-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">Fuel Surcharge (₹)</label>
                    <input
                      type="number"
                      value={quoteForm.fuel_surcharge}
                      onChange={(e) => setQuoteForm({ ...quoteForm, fuel_surcharge: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-none focus:border-blue-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">Handling / Loading (₹)</label>
                    <input
                      type="number"
                      value={quoteForm.handling_charges}
                      onChange={(e) => setQuoteForm({ ...quoteForm, handling_charges: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-none focus:border-blue-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">Transit Days</label>
                    <input
                      type="number"
                      min="1"
                      value={quoteForm.estimated_delivery_days}
                      onChange={(e) => setQuoteForm({ ...quoteForm, estimated_delivery_days: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-none focus:border-blue-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">Valid Until</label>
                    <input
                      type="date"
                      value={quoteForm.valid_until}
                      onChange={(e) => setQuoteForm({ ...quoteForm, valid_until: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-none focus:border-blue-900"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedEnquiry(null)}
                    className="px-4 py-2 border border-stone-200 rounded-xl hover:bg-stone-50 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingQuote}
                    className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl disabled:opacity-50"
                  >
                    {isSubmittingQuote ? "Sending Quote..." : "Submit Quotation"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ADVANCE STATUS MODAL */}
        {selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center pb-3 mb-4 border-b border-stone-100">
                <h3 className="font-bold text-base text-stone-900">Update Shipment Tracking Status</h3>
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="text-stone-400 hover:text-stone-700 text-lg font-bold"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleStatusUpdate} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">Next Milestone Status *</label>
                  <select
                    value={statusUpdateForm.status}
                    onChange={(e) => setStatusUpdateForm({ ...statusUpdateForm, status: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-none focus:border-blue-900"
                  >
                    <option value="pickup_scheduled">Pickup Scheduled</option>
                    <option value="pickup_completed">Pickup Completed</option>
                    <option value="in_transit">In Transit (Linehaul Freight)</option>
                    <option value="reached_sorting_facility">Reached Sorting Facility</option>
                    <option value="reached_destination_hub">Reached Destination Hub</option>
                    <option value="out_for_delivery">Out for Delivery</option>
                    <option value="delivered">Delivered to Recipient</option>
                    <option value="delayed">Delayed (Exception)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">Current Location (City / Depot)</label>
                  <input
                    type="text"
                    placeholder="e.g. Ahmedabad Toll Plaza Depot"
                    value={statusUpdateForm.location}
                    onChange={(e) => setStatusUpdateForm({ ...statusUpdateForm, location: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-none focus:border-blue-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">Assigned Driver Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Jaswinder Singh"
                      value={statusUpdateForm.driver_name}
                      onChange={(e) => setStatusUpdateForm({ ...statusUpdateForm, driver_name: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-none focus:border-blue-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">Vehicle Registration #</label>
                    <input
                      type="text"
                      placeholder="e.g. GJ-01-AB-1234"
                      value={statusUpdateForm.vehicle_number}
                      onChange={(e) => setStatusUpdateForm({ ...statusUpdateForm, vehicle_number: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-none focus:border-blue-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">Milestone Description / Remarks</label>
                  <textarea
                    rows={2}
                    placeholder="Cargo picked up and safely secured in container..."
                    value={statusUpdateForm.description}
                    onChange={(e) => setStatusUpdateForm({ ...statusUpdateForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-none focus:border-blue-900"
                  />
                </div>

                <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedBooking(null)}
                    className="px-4 py-2 border border-stone-200 rounded-xl hover:bg-stone-50 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingStatus}
                    className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl disabled:opacity-50"
                  >
                    {isUpdatingStatus ? "Updating Timeline..." : "Advance Timeline Event"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
