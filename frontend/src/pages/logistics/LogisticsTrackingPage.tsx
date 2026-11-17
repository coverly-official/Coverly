import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Truck,
  ShieldCheck,
  Search,
  CheckCircle,
  Clock,
  MapPin,
  Package,
  Calendar,
  AlertCircle,
  FileCheck,
  ExternalLink,
  ChevronRight,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const LogisticsTrackingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialNumber = searchParams.get("number") || "";

  const [trackingNumber, setTrackingNumber] = useState(initialNumber);
  const [trackingData, setTrackingData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchTracking = (num: string) => {
    if (!num.trim()) return;
    setIsLoading(true);
    setErrorMessage(null);

    fetch(`${API_BASE}/logistics/track/${encodeURIComponent(num.trim())}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setTrackingData(data.data);
        } else {
          setTrackingData(null);
          setErrorMessage(data.error || "Shipment tracking record not found.");
        }
      })
      .catch((err) => {
        setTrackingData(null);
        setErrorMessage(err.message || "Failed to load tracking data.");
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (initialNumber) {
      fetchTracking(initialNumber);
    }
  }, [initialNumber]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingNumber.trim()) {
      setSearchParams({ number: trackingNumber.trim() });
      fetchTracking(trackingNumber.trim());
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Delivered</span>;
      case "in_transit":
      case "reached_sorting_facility":
      case "reached_destination_hub":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">In Transit</span>;
      case "out_for_delivery":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900">Out for Delivery</span>;
      case "delayed":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">Delayed</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-stone-100 text-stone-800">{status?.replace(/_/g, " ")}</span>;
    }
  };

  return (
    <div className="bg-stone-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-stone-500 mb-6">
          <Link to="/" className="hover:text-stone-900">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/logistics" className="hover:text-stone-900">Logistics</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-stone-900 font-medium">Track Consignment</span>
        </div>

        {/* Tracking Search Input Bar */}
        <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs mb-8">
          <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 mb-2">
            Amazon / Flipkart-Style Live Shipment Tracking
          </h1>
          <p className="text-xs text-stone-500 mb-6">
            Enter your booking reference or tracking number to view real-time timeline updates.
          </p>

          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="Enter Tracking ID (e.g. CVL-TRK-... or LBK-...)"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm border border-stone-300 rounded-xl focus:outline-none focus:border-blue-900 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-xs disabled:opacity-50 shrink-0"
            >
              {isLoading ? "Locating..." : "Track Consignment"}
            </button>
          </form>

          {/* Safe Privacy Notice */}
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center gap-1.5 text-[11px] text-stone-500">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-900" />
            <span>Privacy Protected: Private customer phone numbers, addresses, and invoices are securely masked.</span>
          </div>
        </div>

        {/* Error State */}
        {errorMessage && (
          <div className="bg-white border border-rose-200 rounded-2xl p-6 text-center shadow-xs mb-8">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-stone-900 mb-1">No Shipment Found</h3>
            <p className="text-xs text-stone-500 mb-4">{errorMessage}</p>
            <p className="text-[11px] text-stone-400">
              Please check your booking reference from your quotation confirmation email or SMS.
            </p>
          </div>
        )}

        {/* Tracking Details View */}
        {trackingData && (
          <div className="space-y-6">
            {/* Overview Card */}
            <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-stone-100 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-stone-500">Tracking Number:</span>
                    <span className="font-mono font-bold text-sm text-blue-950">{trackingData.tracking_number}</span>
                    {getStatusBadge(trackingData.status)}
                  </div>
                  <h2 className="text-lg font-bold text-stone-900 mt-1">
                    Carrier: {trackingData.carrier_name}
                  </h2>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-[11px] text-stone-500 uppercase tracking-wider">Estimated Delivery</div>
                  <div className="text-sm font-bold text-stone-900 mt-0.5">{trackingData.estimated_delivery_date}</div>
                </div>
              </div>

              {/* Transit Route Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-xs">
                <div className="border border-stone-200/80 bg-stone-50/50 rounded-xl p-3.5">
                  <span className="text-[11px] text-stone-500 uppercase tracking-wider">Origin</span>
                  <div className="font-semibold text-stone-900 mt-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-800" /> {trackingData.origin}
                  </div>
                </div>

                <div className="border border-stone-200/80 bg-stone-50/50 rounded-xl p-3.5">
                  <span className="text-[11px] text-stone-500 uppercase tracking-wider">Current Location</span>
                  <div className="font-semibold text-stone-900 mt-1 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-amber-600" /> {trackingData.current_location}
                  </div>
                </div>

                <div className="border border-stone-200/80 bg-stone-50/50 rounded-xl p-3.5">
                  <span className="text-[11px] text-stone-500 uppercase tracking-wider">Destination</span>
                  <div className="font-semibold text-stone-900 mt-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700" /> {trackingData.destination}
                  </div>
                </div>
              </div>
            </div>

            {/* Amazon-Style Timeline Event Stepper */}
            <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs">
              <h3 className="text-base font-bold text-stone-900 mb-6 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-900" />
                Shipment Activity & Milestone History
              </h3>

              <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-2.5 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-stone-200">
                {(trackingData.timeline || []).map((evt: any, idx: number) => {
                  const isLatest = idx === (trackingData.timeline.length - 1);
                  return (
                    <div key={evt.id || idx} className="relative">
                      {/* Step Circle Pin */}
                      <div
                        className={`absolute -left-6 sm:-left-8 top-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 ${
                          isLatest
                            ? "bg-blue-900 border-blue-200 text-white"
                            : "bg-white border-blue-900 text-blue-900"
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-current" />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                            {evt.status?.replace(/_/g, " ")}
                          </h4>
                          <span className="text-[11px] text-stone-400">
                            {new Date(evt.created_at).toLocaleString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        {evt.location && (
                          <div className="text-xs text-blue-900 font-semibold mt-0.5">
                            {evt.location}
                          </div>
                        )}

                        <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                          {evt.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
