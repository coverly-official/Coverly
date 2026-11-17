import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Truck,
  Package,
  Layers,
  Boxes,
  ThermometerSnowflake,
  Warehouse,
  Globe,
  Home,
  Train,
  Plane,
  Ship,
  Repeat,
  ShieldCheck,
  Search,
  ArrowRight,
  MapPin,
  Calendar,
  Weight,
  Sparkles,
  CheckCircle,
  FileCheck,
  Clock,
} from "lucide-react";

export const LogisticsHomePage: React.FC = () => {
  const navigate = useNavigate();

  // Hero Search State
  const [pickupCity, setPickupCity] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [goodsCategory, setGoodsCategory] = useState("Industrial Machinery");
  const [weightKg, setWeightKg] = useState("");
  const [serviceType, setServiceType] = useState("ftl");
  const [trackingNumber, setTrackingNumber] = useState("");

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (pickupCity) params.set("pickup", pickupCity);
    if (deliveryCity) params.set("delivery", deliveryCity);
    if (goodsCategory) params.set("category", goodsCategory);
    if (weightKg) params.set("weight", weightKg);
    if (serviceType) params.set("service", serviceType);
    navigate(`/logistics/book?${params.toString()}`);
  };

  const handleTrackingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingNumber.trim()) {
      navigate(`/logistics/track?number=${encodeURIComponent(trackingNumber.trim())}`);
    }
  };

  const categories = [
    {
      id: "ftl",
      title: "Full Truck Load (FTL)",
      desc: "Dedicated vehicles for high-capacity direct factory-to-destination transit.",
      icon: Truck,
      tag: "Direct Linehaul",
      weightRange: "3T - 35T",
    },
    {
      id: "ptl",
      title: "Part Truck Load (PTL)",
      desc: "Shared consolidation cargo for cost-effective partial shipments.",
      icon: Layers,
      tag: "Consolidation",
      weightRange: "50kg - 3T",
    },
    {
      id: "parcel",
      title: "Express Parcel & Courier",
      desc: "Time-critical door-to-door courier dispatch for urgent spares and samples.",
      icon: Package,
      tag: "Next-Day",
      weightRange: "0.5kg - 50kg",
    },
    {
      id: "bulk",
      title: "Bulk Cargo Transportation",
      desc: "Heavy industrial commodities, raw materials & break-bulk logistics.",
      icon: Boxes,
      tag: "Industrial",
      weightRange: "10T - 100T+",
    },
    {
      id: "cold_chain",
      title: "Cold Chain Refrigerated",
      desc: "Temperature-controlled reefers for pharmaceuticals and perishables.",
      icon: ThermometerSnowflake,
      tag: "Pharma / Agri",
      weightRange: "2°C to -25°C",
    },
    {
      id: "warehousing",
      title: "Warehouse & Storage Hubs",
      desc: "Strategic 3PL fulfillment depots, buffer storage & inventory management.",
      icon: Warehouse,
      tag: "Storage & 3PL",
      weightRange: "Short/Long Term",
    },
    {
      id: "container",
      title: "Container Freight (20ft/40ft)",
      desc: "ISO container movement for port connectivity and intermodal export lanes.",
      icon: Boxes,
      tag: "EXIM & Ports",
      weightRange: "20ft / 40ft HQ",
    },
    {
      id: "packers_movers",
      title: "Industrial Relocation & Movers",
      desc: "Turnkey factory machinery shifting, heavy equipment & office relocation.",
      icon: Home,
      tag: "Turnkey Shifting",
      weightRange: "Plant Relocation",
    },
    {
      id: "freight_forwarding",
      title: "Freight Forwarding & Customs",
      desc: "EXIM documentation, customs clearing & multimodal international transit.",
      icon: Globe,
      tag: "Global Trade",
      weightRange: "Air / Sea",
    },
  ];

  const transportModes = [
    { name: "Road Express Freight", icon: Truck, desc: "Pan-India National Highway lanes with verified fleet operators." },
    { name: "Rail Cargo (Indian Railways)", icon: Train, desc: "High-capacity, cost-efficient bulk cargo rail transport." },
    { name: "Air Cargo & Express", icon: Plane, desc: "Fastest transit for high-value components & emergency inventory." },
    { name: "Coastal & Sea Freight", icon: Ship, desc: "Inter-port container coastal shipping connecting major Indian ports." },
    { name: "Multimodal Logistics", icon: Repeat, desc: "Integrated road-rail-air corridors for optimized landed transport costs." },
  ];

  return (
    <div className="bg-stone-50 min-h-screen">
      {/* 1. Hero Section with Dual Search & Quick Booking Form */}
      <section className="bg-gradient-to-b from-blue-950 via-slate-900 to-blue-950 text-white pt-12 pb-20 px-4 sm:px-6 lg:px-8 border-b border-blue-900/60 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.15),transparent_50%)]" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 mb-4">
              <Truck className="w-3.5 h-3.5 text-blue-400" />
              Pan-India B2B Freight & Multi-Carrier Marketplace
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
              Compare Logistics Providers & Book Freight at Guaranteed Landed Rates
            </h1>
            <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
              Connect with multiple independently verified logistics companies across India. Compare FTL, PTL, Express Parcel, and Cold Chain rates, request instant quotes, and track deliveries with an Amazon-style live status timeline.
            </p>
          </div>

          {/* Quick Action Widget: Book Freight OR Track Shipment */}
          <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl border border-stone-200 p-6 sm:p-8 text-stone-900">
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-stone-100 flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-900" />
                <h2 className="text-lg font-bold text-stone-900">Request Multi-Provider Freight Quotation</h2>
              </div>

              {/* Fast Track Widget */}
              <form onSubmit={handleTrackingSubmit} className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Enter Tracking # or Booking ID"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:border-blue-900"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold transition shrink-0"
                >
                  Track
                </button>
              </form>
            </div>

            {/* Freight Booking Query Form */}
            <form onSubmit={handleHeroSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-1">
                  Pickup Location
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="City or Pincode (e.g. Surat)"
                    value={pickupCity}
                    onChange={(e) => setPickupCity(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-blue-900 bg-stone-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-1">
                  Delivery Destination
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="City or Pincode (e.g. Delhi)"
                    value={deliveryCity}
                    onChange={(e) => setDeliveryCity(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-blue-900 bg-stone-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-1">
                  Service Mode
                </label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-blue-900 bg-stone-50/50"
                >
                  <option value="ftl">Full Truck Load (FTL)</option>
                  <option value="ptl">Part Truck Load (PTL)</option>
                  <option value="parcel">Express Parcel & Courier</option>
                  <option value="bulk">Bulk Cargo</option>
                  <option value="cold_chain">Cold Chain Reefer</option>
                  <option value="warehousing">Warehousing</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-1">
                  Approx Weight (kg)
                </label>
                <div className="relative">
                  <Weight className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min="1"
                    placeholder="Weight (e.g. 500)"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-blue-900 bg-stone-50/50"
                  />
                </div>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs rounded-xl shadow-xs border border-amber-500 transition flex items-center justify-center gap-1.5"
                >
                  <span>Compare Carriers</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>

            <div className="mt-4 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between text-xs text-stone-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Zero obligation • Compare up to 4 competitive quotes • Real verified fleet operators
              </span>
              <Link to="/logistics/companies" className="text-blue-900 font-semibold hover:underline">
                Browse Directory of All Logistics Partners &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Primary Logistics Services Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-900">
              Logistics Services
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight mt-1">
              Comprehensive B2B Freight & Transport Categories
            </h2>
          </div>
          <Link
            to="/logistics/companies"
            className="text-xs font-semibold text-blue-900 hover:text-blue-800 flex items-center gap-1"
          >
            View all companies <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.id}
                to={`/logistics/book?service=${cat.id}`}
                className="group bg-white border border-stone-200 hover:border-blue-900/60 rounded-2xl p-6 transition shadow-xs hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center group-hover:bg-blue-900 group-hover:text-white transition">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                      {cat.tag}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-stone-900 group-hover:text-blue-900 transition mb-2">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-stone-500 leading-relaxed mb-4">
                    {cat.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="text-stone-500 font-medium">{cat.weightRange}</span>
                  <span className="text-blue-900 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition">
                    Book Service <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. Transportation Modes Overview */}
      <section className="bg-white border-y border-stone-200 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-900">
              Intermodal Transit
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight mt-1">
              Multi-Modal Freight Coverage Across India
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-2">
              Book road express, high-capacity rail wagons, rapid air cargo, and port container shipments through one unified workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {transportModes.map((m, idx) => {
              const Icon = m.icon;
              return (
                <div key={idx} className="bg-stone-50 border border-stone-200 rounded-xl p-5 text-center">
                  <div className="w-10 h-10 mx-auto rounded-lg bg-blue-900 text-white flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-stone-900 mb-1">{m.name}</h4>
                  <p className="text-[11px] text-stone-500 leading-snug">{m.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Why Book on COVERLY Logistics */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-br from-blue-950 to-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl">
          <div className="max-w-2xl mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              The COVERLY Advantage
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">
              Enterprise B2B Logistics Built for Manufacturers, Wholesalers & Buyers
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-400/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">100% Verified Fleet Operators</h4>
              <p className="text-xs text-stone-300 leading-relaxed">
                All transport partners undergo GSTIN registration verification, carriage permit checks, and fleet audits before accepting consignments.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-400/30">
                <FileCheck className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Amazon/Flipkart-Style Tracking</h4>
              <p className="text-xs text-stone-300 leading-relaxed">
                Live timeline status updates from pickup scheduled, linehaul corridor transit, destination sorting hub, to digital proof of delivery.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-400/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Transparent Landed Freight Pricing</h4>
              <p className="text-xs text-stone-300 leading-relaxed">
                Itemized breakdown showing base freight, fuel surcharge, handling charges, insurance, and exact GST. Zero hidden destination surprises.
              </p>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-blue-900/60 flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-stone-300">
              Are you an authorized logistics company or fleet owner?
            </div>
            <Link
              to="/auth/register?role=logistics"
              className="px-5 py-2.5 bg-white text-blue-950 font-bold text-xs rounded-xl hover:bg-stone-100 transition shadow-xs"
            >
              Register as Logistics Partner &rarr;
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
