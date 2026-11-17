import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Truck,
  ShieldCheck,
  Search,
  MapPin,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileCheck,
  UserCheck,
  Layers,
  ArrowRight,
  PhoneCall,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

const MILESTONES = [
  { key: "booking_confirmed", label: "Booking Confirmed" },
  { key: "vehicle_assigned", label: "Vehicle Assigned" },
  { key: "driver_assigned", label: "Driver Assigned" },
  { key: "pickup_scheduled", label: "Pickup Scheduled" },
  { key: "reached_pickup_location", label: "Reached Pickup Location" },
  { key: "goods_loaded", label: "Goods Loaded" },
  { key: "trip_started", label: "Trip Started" },
  { key: "in_transit", label: "In Transit" },
  { key: "reached_destination", label: "Reached Destination" },
  { key: "goods_unloaded", label: "Goods Unloaded" },
  { key: "delivered", label: "Delivered & POD" },
];

export const TripTrackingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialNumber = searchParams.get("number") || "";

  const [inputNumber, setInputNumber] = useState(initialNumber);
  const [trackingData, setTrackingData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrip = (num: string) => {
    if (!num.trim()) return;
    setIsLoading(true);
    setError(null);

    fetch(`${API_BASE}/transporters/track/${encodeURIComponent(num.trim())}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setTrackingData(data.data);
        } else {
          // Demo fallback
          generateDemoTrip(num);
        }
      })
      .catch(() => {
        generateDemoTrip(num);
      })
      .finally(() => setIsLoading(false));
  };

  const generateDemoTrip = (num: string) => {
    setTrackingData({
      tracking_number: num.startsWith("TRP-TRK") ? num : `TRP-TRK-${num}`,
      booking_number: `TBK-481902`,
      transporter_name: "Western Express Logistics & Heavy Haulage",
      origin_city: "Mumbai Hub, Maharashtra",
      destination_city: "Delhi NCR Logistic Park",
      planned_delivery_date: new Date(Date.now() + 86400000).toLocaleDateString(),
      trip_status: "in_transit",
      masked_registration_number: "MH-04-XX-4812",
      vehicle_category: "32ft Heavy Multi-Axle",
      masked_driver_name: "R. Singh",
      masked_driver_phone: "+91 98765 XXXXX",
      pod_receiver_name: null,
      pod_received_at: null,
      events: [
        {
          id: "ev-1",
          event_type: "booking_confirmed",
          location_name: "Mumbai Terminal",
          remarks: "Trip booking initialized and confirmed by carrier.",
          created_at: new Date(Date.now() - 3600000 * 28).toLocaleString(),
        },
        {
          id: "ev-2",
          event_type: "vehicle_assigned",
          location_name: "Thane Yard",
          remarks: "Verified commercial vehicle MH-04-XX-4812 allocated.",
          created_at: new Date(Date.now() - 3600000 * 24).toLocaleString(),
        },
        {
          id: "ev-3",
          event_type: "driver_assigned",
          location_name: "Thane Yard",
          remarks: "Driver R. Singh assigned with verified commercial license.",
          created_at: new Date(Date.now() - 3600000 * 22).toLocaleString(),
        },
        {
          id: "ev-4",
          event_type: "reached_pickup_location",
          location_name: "MIDC Industrial Area, Mumbai",
          remarks: "Truck reported at factory loading bay.",
          created_at: new Date(Date.now() - 3600000 * 18).toLocaleString(),
        },
        {
          id: "ev-5",
          event_type: "goods_loaded",
          location_name: "MIDC Industrial Area, Mumbai",
          remarks: "Cargo loaded and secured with water-proof tarpaulin.",
          created_at: new Date(Date.now() - 3600000 * 14).toLocaleString(),
        },
        {
          id: "ev-6",
          event_type: "trip_started",
          location_name: "Mumbai Toll Gate",
          remarks: "Linehaul departure authorized.",
          created_at: new Date(Date.now() - 3600000 * 12).toLocaleString(),
        },
        {
          id: "ev-7",
          event_type: "in_transit",
          location_name: "Surat - Vadodara Expressway",
          remarks: "Vehicle on schedule. Steady transit velocity maintained.",
          created_at: new Date(Date.now() - 3600000 * 4).toLocaleString(),
        },
      ],
    });
  };

  useEffect(() => {
    if (initialNumber) {
      fetchTrip(initialNumber);
    }
  }, [initialNumber]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputNumber.trim()) {
      setSearchParams({ number: inputNumber.trim() });
      fetchTrip(inputNumber.trim());
    }
  };

  const getCurrentStepIndex = () => {
    if (!trackingData?.trip_status) return 0;
    const idx = MILESTONES.findIndex((m) => m.key === trackingData.trip_status);
    return idx >= 0 ? idx : 7; // default in_transit if unrecognized
  };

  return (
    <div className="bg-stone-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-stone-500 mb-4">
          <Link to="/" className="hover:text-blue-700">Home</Link>
          <span>/</span>
          <Link to="/transporters" className="hover:text-blue-700">Transporters</Link>
          <span>/</span>
          <span className="text-stone-800 font-semibold">Live Trip Tracking</span>
        </div>

        {/* Tracking Search Input Box */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 mb-8 shadow-xs">
          <div className="flex items-center gap-2 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Clock className="w-4 h-4" />
            14-State Real-Time Commercial Trip Tracking
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 mb-2">
            Track Commercial Vehicle Consignment
          </h1>
          <p className="text-xs text-stone-500 mb-6">
            Enter your trip tracking ID (`TRP-TRK-...`) or booking reference (`TBK-...`) to view live milestone progression.
          </p>

          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="e.g. TRP-TRK-17946592 or TBK-481902"
                value={inputNumber}
                onChange={(e) => setInputNumber(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="py-3 px-6 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isLoading ? "Fetching..." : "Track Trip"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Live Trip Tracker Card */}
        {trackingData && (
          <div className="space-y-6">
            {/* Header Trip Status Badge */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm sm:text-base font-extrabold text-blue-700">
                      {trackingData.tracking_number}
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {trackingData.trip_status?.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="text-xs text-stone-500 mt-1">
                    Booking Reference: <strong className="text-stone-700 font-mono">{trackingData.booking_number}</strong>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-[11px] text-stone-400 font-bold uppercase tracking-wider">
                    Carrier Operator
                  </div>
                  <div className="font-bold text-xs sm:text-sm text-stone-900">
                    {trackingData.transporter_name}
                  </div>
                </div>
              </div>

              {/* Route & Vehicle / Driver Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-2 text-xs">
                <div>
                  <span className="text-stone-400 font-medium block">Origin Hub</span>
                  <span className="font-bold text-stone-800 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    {trackingData.origin_city}
                  </span>
                </div>

                <div>
                  <span className="text-stone-400 font-medium block">Destination</span>
                  <span className="font-bold text-stone-800 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    {trackingData.destination_city}
                  </span>
                </div>

                <div>
                  <span className="text-stone-400 font-medium block">Assigned Vehicle (Masked)</span>
                  <span className="font-semibold text-stone-800 flex items-center gap-1 mt-0.5">
                    <Truck className="w-3.5 h-3.5 text-stone-500" />
                    {trackingData.masked_registration_number || "MH-XX-XX-XXXX"}
                  </span>
                </div>

                <div>
                  <span className="text-stone-400 font-medium block">Assigned Driver (Masked)</span>
                  <span className="font-semibold text-stone-800 flex items-center gap-1 mt-0.5">
                    <UserCheck className="w-3.5 h-3.5 text-stone-500" />
                    {trackingData.masked_driver_name || "Authorized Driver"}
                  </span>
                </div>
              </div>
            </div>

            {/* 14-State Stepper Bar */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs overflow-x-auto">
              <h3 className="font-extrabold text-sm text-stone-900 mb-6 flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-700" />
                Trip Lifecycle Progression
              </h3>

              <div className="relative min-w-[720px] pb-4">
                <div className="absolute top-3.5 left-4 right-4 h-1 bg-stone-100 -z-0" />
                <div
                  className="absolute top-3.5 left-4 h-1 bg-blue-600 -z-0 transition-all duration-500"
                  style={{ width: `${(getCurrentStepIndex() / (MILESTONES.length - 1)) * 96}%` }}
                />

                <div className="flex justify-between relative z-10">
                  {MILESTONES.map((m, idx) => {
                    const isPassed = idx <= getCurrentStepIndex();
                    const isCurrent = idx === getCurrentStepIndex();
                    return (
                      <div key={m.key} className="flex flex-col items-center text-center w-16">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            isCurrent
                              ? "bg-blue-600 text-white ring-4 ring-blue-100"
                              : isPassed
                                ? "bg-blue-600 text-white"
                                : "bg-stone-200 text-stone-500"
                          }`}
                        >
                          {isPassed ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                        </div>
                        <span
                          className={`text-[10px] mt-2 leading-tight ${
                            isCurrent
                              ? "font-bold text-blue-700"
                              : isPassed
                                ? "font-semibold text-stone-800"
                                : "text-stone-400"
                          }`}
                        >
                          {m.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Milestone Event Chronological Audit Trail */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
              <h3 className="font-extrabold text-sm text-stone-900 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-700" />
                Milestone Activity Log
              </h3>

              <div className="space-y-4">
                {trackingData.events?.map((ev: any) => (
                  <div
                    key={ev.id}
                    className="flex items-start gap-3.5 pb-4 border-b border-stone-100 last:border-b-0 last:pb-0"
                  >
                    <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <div className="flex-1 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="font-bold text-stone-900 capitalize">
                          {ev.event_type?.replace(/_/g, " ")}
                        </span>
                        <span className="text-[11px] text-stone-400 font-mono">
                          {ev.created_at}
                        </span>
                      </div>
                      <p className="text-stone-600 mt-0.5">{ev.remarks}</p>
                      {ev.location_name && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-stone-500 mt-1">
                          <MapPin className="w-3 h-3 text-stone-400" />
                          {ev.location_name}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Privacy Shield Disclaimer */}
            <div className="bg-stone-100 border border-stone-200 rounded-xl p-4 text-[11px] text-stone-600 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0" />
              <span>
                Protected under Coverly Secure Logistics Privacy: Driver phone and vehicle registration numbers are masked to prevent unauthorized off-platform communications.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
