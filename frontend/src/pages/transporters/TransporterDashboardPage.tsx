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
  DollarSign,
  Plus,
  UserCheck,
  MapPin,
  Calendar,
  X,
  Phone,
  Mail,
  Award,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const TransporterDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"overview" | "fleet" | "drivers" | "enquiries" | "bookings" | "profile">("overview");
  const [metrics, setMetrics] = useState<any | null>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [profile, setProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [isAddDriverOpen, setIsAddDriverOpen] = useState(false);
  const [selectedEnquiryForQuote, setSelectedEnquiryForQuote] = useState<any | null>(null);
  const [selectedBookingForStatus, setSelectedBookingForStatus] = useState<any | null>(null);
  const [selectedBookingForAssign, setSelectedBookingForAssign] = useState<any | null>(null);

  // Add Vehicle Form State
  const [regNumber, setRegNumber] = useState("");
  const [vehCategory, setVehCategory] = useState("lcv_14ft");
  const [modelName, setModelName] = useState("");
  const [capacityTons, setCapacityTons] = useState("6.5");
  const [bodyType, setBodyType] = useState("Closed Container");
  const [permitType, setPermitType] = useState("national");
  const [fuelType, setFuelType] = useState("diesel");
  const [isSubmittingVehicle, setIsSubmittingVehicle] = useState(false);

  // Add Driver Form State
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseValidity, setLicenseValidity] = useState("");
  const [driverVehicleId, setDriverVehicleId] = useState("");
  const [isSubmittingDriver, setIsSubmittingDriver] = useState(false);

  // Quote Builder State
  const [quoteBaseFreight, setQuoteBaseFreight] = useState("18000");
  const [quoteLoadingCharges, setQuoteLoadingCharges] = useState("1200");
  const [quoteTollFuel, setQuoteTollFuel] = useState("2500");
  const [quoteVehicleId, setQuoteVehicleId] = useState("");
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);

  // Booking Milestone State
  const [nextMilestoneStatus, setNextMilestoneStatus] = useState("in_transit");
  const [milestoneRemarks, setMilestoneRemarks] = useState("");
  const [milestoneLocation, setMilestoneLocation] = useState("");
  const [podReceiverName, setPodReceiverName] = useState("");
  const [isAdvancingStatus, setIsAdvancingStatus] = useState(false);

  // Assign State
  const [assignVehicleId, setAssignVehicleId] = useState("");
  const [assignDriverId, setAssignDriverId] = useState("");

  const token = localStorage.getItem("access_token") || localStorage.getItem("token") || "";

  const fetchDashboardData = () => {
    setIsLoading(true);
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    Promise.all([
      fetch(`${API_BASE}/transporter/analytics`, { headers }).then((r) => r.json()).catch(() => ({})),
      fetch(`${API_BASE}/transporter/profile`, { headers }).then((r) => r.json()).catch(() => ({})),
      fetch(`${API_BASE}/transporter/vehicles`, { headers }).then((r) => r.json()).catch(() => ({})),
      fetch(`${API_BASE}/transporter/drivers`, { headers }).then((r) => r.json()).catch(() => ({})),
      fetch(`${API_BASE}/transporter/enquiries`, { headers }).then((r) => r.json()).catch(() => ({})),
      fetch(`${API_BASE}/transporter/bookings`, { headers }).then((r) => r.json()).catch(() => ({})),
    ])
      .then(([aRes, pRes, vRes, dRes, eRes, bRes]) => {
        if (aRes.success && aRes.data) setMetrics(aRes.data);
        if (pRes.success && pRes.data) setProfile(pRes.data);
        if (vRes.success && vRes.data) setVehicles(vRes.data);
        if (dRes.success && dRes.data) setDrivers(dRes.data);
        if (eRes.success && eRes.data) setEnquiries(eRes.data);
        if (bRes.success && bRes.data) setBookings(bRes.data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Handle Add Vehicle
  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNumber || !capacityTons) return;
    setIsSubmittingVehicle(true);
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      const res = await fetch(`${API_BASE}/transporter/vehicles`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          registration_number: regNumber,
          vehicle_category: vehCategory,
          model_name: modelName,
          capacity_tons: parseFloat(capacityTons),
          body_type: bodyType,
          permit_type: permitType,
          fuel_type: fuelType,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsAddVehicleOpen(false);
        setRegNumber("");
        setModelName("");
        fetchDashboardData();
      } else {
        alert(data.message || "Failed to add vehicle.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setIsSubmittingVehicle(false);
    }
  };

  // Handle Add Driver
  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverName || !driverPhone || !licenseNumber) return;
    setIsSubmittingDriver(true);
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      const res = await fetch(`${API_BASE}/transporter/drivers`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          driver_name: driverName,
          phone: driverPhone,
          license_number: licenseNumber,
          license_validity: licenseValidity || "2030-01-01",
          vehicle_id: driverVehicleId || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsAddDriverOpen(false);
        setDriverName("");
        setDriverPhone("");
        setLicenseNumber("");
        fetchDashboardData();
      } else {
        alert(data.message || "Failed to register driver.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setIsSubmittingDriver(false);
    }
  };

  // Handle Submit Quote
  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnquiryForQuote) return;
    setIsSubmittingQuote(true);
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const base = parseFloat(quoteBaseFreight) || 0;
    const load = parseFloat(quoteLoadingCharges) || 0;
    const toll = parseFloat(quoteTollFuel) || 0;
    const sub = base + load + toll;
    const gst = Math.round(sub * 0.18);
    const total = sub + gst;

    try {
      const res = await fetch(`${API_BASE}/transporter/enquiries/${selectedEnquiryForQuote.id}/quotation`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          base_freight: base,
          loading_unloading_charges: load,
          toll_fuel_surcharge: toll,
          gst_amount: gst,
          total_amount: total,
          vehicle_id: quoteVehicleId || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedEnquiryForQuote(null);
        fetchDashboardData();
      } else {
        alert(data.message || "Failed to submit quote.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  // Handle Advance Booking Status
  const handleAdvanceStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForStatus) return;
    setIsAdvancingStatus(true);
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      const res = await fetch(`${API_BASE}/transporter/bookings/${selectedBookingForStatus.id}/status`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          status: nextMilestoneStatus,
          remarks: milestoneRemarks || `Status updated to ${nextMilestoneStatus}`,
          location: milestoneLocation || "En route highway checkpoint",
          pod_receiver_name: nextMilestoneStatus === "delivered" ? podReceiverName || "Authorized Consignee" : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedBookingForStatus(null);
        fetchDashboardData();
      } else {
        alert(data.message || "Failed to advance trip status.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setIsAdvancingStatus(false);
    }
  };

  // Handle Assign Vehicle & Driver
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForAssign) return;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      const res = await fetch(`${API_BASE}/transporter/bookings/${selectedBookingForAssign.id}/assign`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          vehicle_id: assignVehicleId,
          driver_id: assignDriverId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedBookingForAssign(null);
        fetchDashboardData();
      } else {
        alert(data.message || "Assignment failed.");
      }
    } catch {
      alert("Network error.");
    }
  };

  return (
    <div className="bg-stone-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-stone-500 mb-4">
          <Link to="/" className="hover:text-blue-700">Home</Link>
          <span>/</span>
          <span className="text-stone-800 font-semibold">Transporter Portal</span>
        </div>

        {/* Transporter Portal Header */}
        <div className="bg-stone-900 text-white rounded-2xl p-6 sm:p-8 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Truck className="w-6 h-6 text-blue-400" />
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                  {profile?.transporter_name || "Transporter & Fleet Portal"}
                </h1>
                {profile?.verified_status && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Carrier
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-400">
                Manage commercial vehicle assets, authorized drivers, incoming load bids and 14-state live trip advancement.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setIsAddVehicleOpen(true)}
                className="py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Vehicle
              </button>
              <button
                onClick={() => setIsAddDriverOpen(true)}
                className="py-2.5 px-4 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs rounded-xl transition flex items-center gap-1.5 border border-stone-700"
              >
                <Plus className="w-4 h-4" />
                Add Driver
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-stone-200 pb-3 mb-6 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-2 px-4 rounded-xl transition whitespace-nowrap ${
              activeTab === "overview" ? "bg-stone-900 text-white shadow-xs" : "bg-white text-stone-600 hover:bg-stone-100"
            }`}
          >
            Overview & Metrics
          </button>
          <button
            onClick={() => setActiveTab("fleet")}
            className={`py-2 px-4 rounded-xl transition whitespace-nowrap ${
              activeTab === "fleet" ? "bg-stone-900 text-white shadow-xs" : "bg-white text-stone-600 hover:bg-stone-100"
            }`}
          >
            Fleet Vehicles ({vehicles.length})
          </button>
          <button
            onClick={() => setActiveTab("drivers")}
            className={`py-2 px-4 rounded-xl transition whitespace-nowrap ${
              activeTab === "drivers" ? "bg-stone-900 text-white shadow-xs" : "bg-white text-stone-600 hover:bg-stone-100"
            }`}
          >
            Drivers ({drivers.length})
          </button>
          <button
            onClick={() => setActiveTab("enquiries")}
            className={`py-2 px-4 rounded-xl transition whitespace-nowrap ${
              activeTab === "enquiries" ? "bg-stone-900 text-white shadow-xs" : "bg-white text-stone-600 hover:bg-stone-100"
            }`}
          >
            Load Enquiries ({enquiries.length})
          </button>
          <button
            onClick={() => setActiveTab("bookings")}
            className={`py-2 px-4 rounded-xl transition whitespace-nowrap ${
              activeTab === "bookings" ? "bg-stone-900 text-white shadow-xs" : "bg-white text-stone-600 hover:bg-stone-100"
            }`}
          >
            Trips & Bookings ({bookings.length})
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
                <span className="text-stone-500 text-xs font-semibold uppercase tracking-wider block">
                  Registered Vehicles
                </span>
                <div className="text-2xl font-black text-stone-900 mt-2">
                  {metrics?.total_vehicles ?? vehicles.length}
                </div>
                <div className="text-[11px] text-emerald-600 font-medium mt-1">
                  100% Commercial Permit Compliant
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
                <span className="text-stone-500 text-xs font-semibold uppercase tracking-wider block">
                  Authorized Drivers
                </span>
                <div className="text-2xl font-black text-stone-900 mt-2">
                  {metrics?.total_drivers ?? drivers.length}
                </div>
                <div className="text-[11px] text-stone-500 font-medium mt-1">
                  Verified commercial licenses
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
                <span className="text-stone-500 text-xs font-semibold uppercase tracking-wider block">
                  Active Trips
                </span>
                <div className="text-2xl font-black text-blue-700 mt-2">
                  {metrics?.active_trips ?? bookings.filter((b) => b.trip_status !== "delivered").length}
                </div>
                <div className="text-[11px] text-stone-500 font-medium mt-1">
                  On-highway & transit tracking
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
                <span className="text-stone-500 text-xs font-semibold uppercase tracking-wider block">
                  Total Completed Trips
                </span>
                <div className="text-2xl font-black text-emerald-700 mt-2">
                  {metrics?.completed_trips ?? bookings.filter((b) => b.trip_status === "delivered").length}
                </div>
                <div className="text-[11px] text-emerald-600 font-medium mt-1">
                  Digital POD sign-off verified
                </div>
              </div>
            </div>

            {/* Quick Actions & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
                <h3 className="font-extrabold text-sm text-stone-900 mb-4 flex items-center justify-between">
                  <span>Recent Load Enquiries</span>
                  <button onClick={() => setActiveTab("enquiries")} className="text-xs text-blue-700 font-bold hover:underline">
                    View All →
                  </button>
                </h3>
                {enquiries.length === 0 ? (
                  <p className="text-xs text-stone-400 py-6 text-center">No open enquiries currently.</p>
                ) : (
                  <div className="space-y-3">
                    {enquiries.slice(0, 3).map((enq) => (
                      <div key={enq.id} className="p-3 bg-stone-50 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-stone-900">
                            {enq.pickup_city} → {enq.delivery_city}
                          </div>
                          <div className="text-stone-500 text-[11px]">
                            {enq.weight_tons}T • {enq.required_vehicle_category?.replace(/_/g, " ").toUpperCase()}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedEnquiryForQuote(enq);
                          }}
                          className="py-1 px-3 bg-blue-700 text-white font-bold text-[11px] rounded-lg"
                        >
                          Quote
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
                <h3 className="font-extrabold text-sm text-stone-900 mb-4 flex items-center justify-between">
                  <span>Ongoing Linehaul Trips</span>
                  <button onClick={() => setActiveTab("bookings")} className="text-xs text-blue-700 font-bold hover:underline">
                    View All →
                  </button>
                </h3>
                {bookings.length === 0 ? (
                  <p className="text-xs text-stone-400 py-6 text-center">No active trips currently.</p>
                ) : (
                  <div className="space-y-3">
                    {bookings.slice(0, 3).map((b) => (
                      <div key={b.id} className="p-3 bg-stone-50 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-stone-900 font-mono">
                            {b.tracking_number}
                          </div>
                          <div className="text-stone-500 text-[11px]">
                            Status: <span className="font-semibold text-blue-700">{b.trip_status?.replace(/_/g, " ")}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedBookingForStatus(b)}
                          className="py-1 px-3 bg-stone-900 text-white font-bold text-[11px] rounded-lg"
                        >
                          Advance
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FLEET VEHICLES */}
        {activeTab === "fleet" && (
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 gap-3">
              <div>
                <h3 className="font-extrabold text-base text-stone-900">
                  Registered Commercial Vehicles ({vehicles.length})
                </h3>
                <p className="text-xs text-stone-500">
                  Manage individual registration certificates, fitness validity, and permit types.
                </p>
              </div>
              <button
                onClick={() => setIsAddVehicleOpen(true)}
                className="py-2 px-4 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                Register Vehicle
              </button>
            </div>

            {vehicles.length === 0 ? (
              <div className="py-12 text-center text-stone-400 text-xs">
                No vehicles registered yet. Click "Register Vehicle" to add your first commercial truck.
              </div>
            ) : (
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-3">Reg. Number</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3">Model</th>
                      <th className="py-3 px-3">Payload (Tons)</th>
                      <th className="py-3 px-3">Permit</th>
                      <th className="py-3 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {vehicles.map((v) => (
                      <tr key={v.id} className="hover:bg-stone-50">
                        <td className="py-3 px-3 font-mono font-bold text-stone-900">
                          {v.registration_number}
                        </td>
                        <td className="py-3 px-3 capitalize">
                          {v.vehicle_category?.replace(/_/g, " ")}
                        </td>
                        <td className="py-3 px-3 text-stone-700">
                          {v.model_name || "Commercial Truck"}
                        </td>
                        <td className="py-3 px-3 font-semibold text-stone-900">
                          {v.capacity_tons} T
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                            {v.permit_type}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Verified
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DRIVERS */}
        {activeTab === "drivers" && (
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 gap-3">
              <div>
                <h3 className="font-extrabold text-base text-stone-900">
                  Authorized Commercial Drivers ({drivers.length})
                </h3>
                <p className="text-xs text-stone-500">
                  Manage driver commercial license numbers, contact credentials, and vehicle bindings.
                </p>
              </div>
              <button
                onClick={() => setIsAddDriverOpen(true)}
                className="py-2 px-4 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                Add Driver
              </button>
            </div>

            {drivers.length === 0 ? (
              <div className="py-12 text-center text-stone-400 text-xs">
                No drivers registered yet. Click "Add Driver" to register certified commercial drivers.
              </div>
            ) : (
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-3">Driver Name</th>
                      <th className="py-3 px-3">Phone</th>
                      <th className="py-3 px-3">License Number</th>
                      <th className="py-3 px-3">License Validity</th>
                      <th className="py-3 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {drivers.map((d) => (
                      <tr key={d.id} className="hover:bg-stone-50">
                        <td className="py-3 px-3 font-bold text-stone-900">
                          {d.driver_name}
                        </td>
                        <td className="py-3 px-3 font-mono text-stone-700">
                          {d.phone}
                        </td>
                        <td className="py-3 px-3 font-mono font-medium text-stone-700">
                          {d.license_number}
                        </td>
                        <td className="py-3 px-3 text-stone-600">
                          {d.license_validity || "Active"}
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Authorized
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: LOAD ENQUIRIES */}
        {activeTab === "enquiries" && (
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
            <h3 className="font-extrabold text-base text-stone-900 pb-3 border-b border-stone-100 mb-4">
              Incoming Shipper Load Enquiries ({enquiries.length})
            </h3>

            {enquiries.length === 0 ? (
              <div className="py-12 text-center text-stone-400 text-xs">
                No matching open load enquiries currently.
              </div>
            ) : (
              <div className="space-y-4">
                {enquiries.map((enq) => (
                  <div
                    key={enq.id}
                    className="border border-stone-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-700">
                          {enq.enquiry_number}
                        </span>
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
                          {enq.required_vehicle_category?.replace(/_/g, " ")}
                        </span>
                      </div>
                      <div className="font-bold text-sm text-stone-900">
                        {enq.pickup_city} → {enq.delivery_city}
                      </div>
                      <div className="text-stone-500">
                        Weight: <strong className="text-stone-800">{enq.weight_tons} Tons</strong> • Goods: {enq.goods_description}
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedEnquiryForQuote(enq)}
                      className="py-2 px-4 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl transition shadow-xs self-start md:self-auto"
                    >
                      Submit Freight Quotation
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: TRIPS & BOOKINGS */}
        {activeTab === "bookings" && (
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
            <h3 className="font-extrabold text-base text-stone-900 pb-3 border-b border-stone-100 mb-4">
              Confirmed Consignment Bookings & Trips ({bookings.length})
            </h3>

            {bookings.length === 0 ? (
              <div className="py-12 text-center text-stone-400 text-xs">
                No confirmed trips currently.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-3">Booking / Tracking #</th>
                      <th className="py-3 px-3">Route</th>
                      <th className="py-3 px-3">Vehicle / Driver</th>
                      <th className="py-3 px-3">Freight</th>
                      <th className="py-3 px-3">Trip Status</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {bookings.map((b) => (
                      <tr key={b.id} className="hover:bg-stone-50">
                        <td className="py-3 px-3">
                          <div className="font-mono font-bold text-stone-900">{b.booking_number}</div>
                          <div className="font-mono text-[11px] text-blue-700">{b.tracking_number}</div>
                        </td>
                        <td className="py-3 px-3 font-semibold text-stone-800">
                          {b.pickup_city} → {b.delivery_city}
                        </td>
                        <td className="py-3 px-3 text-stone-600">
                          <div>{b.vehicle_registration || "Unassigned"}</div>
                          <div className="text-[11px] text-stone-400">{b.driver_name || "No Driver"}</div>
                        </td>
                        <td className="py-3 px-3 font-black text-stone-900">
                          ₹{b.total_freight?.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                            {b.trip_status?.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right space-x-2">
                          <button
                            onClick={() => setSelectedBookingForAssign(b)}
                            className="py-1 px-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-[11px] rounded-lg transition"
                          >
                            Assign
                          </button>
                          <button
                            onClick={() => setSelectedBookingForStatus(b)}
                            className="py-1 px-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-[11px] rounded-lg transition"
                          >
                            Advance
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* MODAL: ADD VEHICLE */}
        {isAddVehicleOpen && (
          <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
                <h3 className="font-extrabold text-base text-stone-900">Register Commercial Vehicle</h3>
                <button onClick={() => setIsAddVehicleOpen(false)}><X className="w-5 h-5 text-stone-400" /></button>
              </div>

              <form onSubmit={handleAddVehicle} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Registration Number (RC) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MH-04-AB-1234"
                    value={regNumber}
                    onChange={(e) => setRegNumber(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-mono font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                      Vehicle Category
                    </label>
                    <select
                      value={vehCategory}
                      onChange={(e) => setVehCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-semibold"
                    >
                      <option value="mini_truck">Tata Ace / Mini Truck</option>
                      <option value="pickup">Pickup</option>
                      <option value="lcv_14ft">LCV 14ft - 19ft</option>
                      <option value="mcv_20ft">MCV 20ft - 24ft</option>
                      <option value="heavy_truck_32ft">32ft Multi-Axle</option>
                      <option value="trailer_multi_axle">Multi-Axle Trailer</option>
                      <option value="reefer_truck">Refrigerated Reefer</option>
                      <option value="industrial_tanker">Liquid Tanker</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                      Model / Make
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Tata Signa 4825"
                      value={modelName}
                      onChange={(e) => setModelName(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                      Payload Capacity (Tons) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={capacityTons}
                      onChange={(e) => setCapacityTons(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                      Permit Type
                    </label>
                    <select
                      value={permitType}
                      onChange={(e) => setPermitType(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-semibold"
                    >
                      <option value="national">National Goods Permit</option>
                      <option value="state">State Carrier Permit</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddVehicleOpen(false)}
                    className="py-2 px-4 bg-stone-100 text-stone-700 font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingVehicle}
                    className="py-2 px-5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl"
                  >
                    {isSubmittingVehicle ? "Saving..." : "Save Vehicle"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ADD DRIVER */}
        {isAddDriverOpen && (
          <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
                <h3 className="font-extrabold text-base text-stone-900">Add Authorized Commercial Driver</h3>
                <button onClick={() => setIsAddDriverOpen(false)}><X className="w-5 h-5 text-stone-400" /></button>
              </div>

              <form onSubmit={handleAddDriver} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Driver Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Singh"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                      Mobile Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={driverPhone}
                      onChange={(e) => setDriverPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                      Commercial Driving License *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. MH0420190012345"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-mono"
                    />
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddDriverOpen(false)}
                    className="py-2 px-4 bg-stone-100 text-stone-700 font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingDriver}
                    className="py-2 px-5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl"
                  >
                    {isSubmittingDriver ? "Saving..." : "Save Driver"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: QUOTATION BUILDER */}
        {selectedEnquiryForQuote && (
          <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
                <div>
                  <h3 className="font-extrabold text-base text-stone-900">Submit Freight Quotation</h3>
                  <p className="text-[11px] text-stone-500">
                    Enquiry {selectedEnquiryForQuote.enquiry_number}: {selectedEnquiryForQuote.pickup_city} → {selectedEnquiryForQuote.delivery_city}
                  </p>
                </div>
                <button onClick={() => setSelectedEnquiryForQuote(null)}><X className="w-5 h-5 text-stone-400" /></button>
              </div>

              <form onSubmit={handleSubmitQuote} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Select Vehicle for Route
                  </label>
                  <select
                    value={quoteVehicleId}
                    onChange={(e) => setQuoteVehicleId(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-semibold"
                  >
                    <option value="">Any Suitable Vehicle</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.registration_number} - {v.vehicle_category?.replace(/_/g, " ")} ({v.capacity_tons}T)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                      Base Freight (₹)
                    </label>
                    <input
                      type="number"
                      required
                      value={quoteBaseFreight}
                      onChange={(e) => setQuoteBaseFreight(e.target.value)}
                      className="w-full px-2.5 py-2 bg-stone-50 border border-stone-200 rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                      Loading/Unloading (₹)
                    </label>
                    <input
                      type="number"
                      value={quoteLoadingCharges}
                      onChange={(e) => setQuoteLoadingCharges(e.target.value)}
                      className="w-full px-2.5 py-2 bg-stone-50 border border-stone-200 rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                      Toll/Fuel (₹)
                    </label>
                    <input
                      type="number"
                      value={quoteTollFuel}
                      onChange={(e) => setQuoteTollFuel(e.target.value)}
                      className="w-full px-2.5 py-2 bg-stone-50 border border-stone-200 rounded-lg font-bold"
                    />
                  </div>
                </div>

                {/* Subtotal calculation */}
                <div className="p-3 bg-stone-100 rounded-xl space-y-1 text-[11px]">
                  <div className="flex justify-between text-stone-600">
                    <span>Taxable Subtotal:</span>
                    <span className="font-semibold">
                      ₹{(parseFloat(quoteBaseFreight || "0") + parseFloat(quoteLoadingCharges || "0") + parseFloat(quoteTollFuel || "0")).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>GST (18%):</span>
                    <span className="font-semibold">
                      ₹{Math.round((parseFloat(quoteBaseFreight || "0") + parseFloat(quoteLoadingCharges || "0") + parseFloat(quoteTollFuel || "0")) * 0.18).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between font-extrabold text-stone-900 border-t border-stone-200 pt-1">
                    <span>Total Landed Freight:</span>
                    <span>
                      ₹{Math.round((parseFloat(quoteBaseFreight || "0") + parseFloat(quoteLoadingCharges || "0") + parseFloat(quoteTollFuel || "0")) * 1.18).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedEnquiryForQuote(null)}
                    className="py-2 px-4 bg-stone-100 text-stone-700 font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingQuote}
                    className="py-2 px-5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl"
                  >
                    {isSubmittingQuote ? "Submitting..." : "Send Quotation"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ADVANCE TRIP STATUS & POD */}
        {selectedBookingForStatus && (
          <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
                <div>
                  <h3 className="font-extrabold text-base text-stone-900">Advance Trip Milestone</h3>
                  <p className="text-[11px] text-stone-500">
                    Trip {selectedBookingForStatus.tracking_number} ({selectedBookingForStatus.trip_status?.replace(/_/g, " ")})
                  </p>
                </div>
                <button onClick={() => setSelectedBookingForStatus(null)}><X className="w-5 h-5 text-stone-400" /></button>
              </div>

              <form onSubmit={handleAdvanceStatus} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Target Milestone Status
                  </label>
                  <select
                    value={nextMilestoneStatus}
                    onChange={(e) => setNextMilestoneStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-bold"
                  >
                    <option value="reached_pickup_location">Reached Pickup Location</option>
                    <option value="goods_loaded">Goods Loaded</option>
                    <option value="trip_started">Trip Started / Highway Departure</option>
                    <option value="in_transit">In Transit (Highway Checkpoint)</option>
                    <option value="reached_destination">Reached Destination</option>
                    <option value="goods_unloaded">Goods Unloaded</option>
                    <option value="delivered">Delivered & Digital POD</option>
                    <option value="delayed">Delayed (Adverse Weather / Traffic)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Current Location / Toll Checkpoint
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Surat Toll Plaza, NH 48"
                    value={milestoneLocation}
                    onChange={(e) => setMilestoneLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Milestone Notes / Remarks
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Cleared state border crossing without delays..."
                    value={milestoneRemarks}
                    onChange={(e) => setMilestoneRemarks(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg"
                  />
                </div>

                {nextMilestoneStatus === "delivered" && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-900">
                      Consignee / Receiver Name (POD Sign-off)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Warehouse Incharge Suresh"
                      value={podReceiverName}
                      onChange={(e) => setPodReceiverName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg font-bold"
                    />
                  </div>
                )}

                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedBookingForStatus(null)}
                    className="py-2 px-4 bg-stone-100 text-stone-700 font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAdvancingStatus}
                    className="py-2 px-5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl"
                  >
                    {isAdvancingStatus ? "Updating..." : "Confirm Milestone"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ASSIGN VEHICLE & DRIVER */}
        {selectedBookingForAssign && (
          <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
                <h3 className="font-extrabold text-base text-stone-900">Assign Vehicle & Driver</h3>
                <button onClick={() => setSelectedBookingForAssign(null)}><X className="w-5 h-5 text-stone-400" /></button>
              </div>

              <form onSubmit={handleAssignSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Select Commercial Vehicle
                  </label>
                  <select
                    value={assignVehicleId}
                    onChange={(e) => setAssignVehicleId(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-semibold"
                  >
                    <option value="">Select vehicle...</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.registration_number} - {v.vehicle_category?.replace(/_/g, " ")} ({v.capacity_tons}T)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Select Authorized Driver
                  </label>
                  <select
                    value={assignDriverId}
                    onChange={(e) => setAssignDriverId(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-semibold"
                  >
                    <option value="">Select driver...</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.driver_name} ({d.phone})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedBookingForAssign(null)}
                    className="py-2 px-4 bg-stone-100 text-stone-700 font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl"
                  >
                    Confirm Assignment
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
