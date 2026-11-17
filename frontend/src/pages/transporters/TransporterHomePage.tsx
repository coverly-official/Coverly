import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Truck,
  ShieldCheck,
  Search,
  ArrowRight,
  MapPin,
  Calendar,
  Weight,
  Layers,
  CheckCircle,
  FileCheck,
  Clock,
  Navigation,
  PhoneCall,
  UserCheck,
  DollarSign,
  Fuel,
  ChevronRight,
  Award,
} from "lucide-react";

export const TransporterHomePage: React.FC = () => {
  const navigate = useNavigate();

  // Search state
  const [pickupCity, setPickupCity] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [goodsType, setGoodsType] = useState("General Industrial Cargo");
  const [weightTons, setWeightTons] = useState("");
  const [vehicleCategory, setVehicleCategory] = useState("all");
  const [trackingNumber, setTrackingNumber] = useState("");

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (pickupCity) params.set("pickup", pickupCity);
    if (deliveryCity) params.set("delivery", deliveryCity);
    if (goodsType) params.set("goods", goodsType);
    if (weightTons) params.set("weight", weightTons);
    if (vehicleCategory && vehicleCategory !== "all") params.set("category", vehicleCategory);
    navigate(`/transporters/book?${params.toString()}`);
  };

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingNumber.trim()) {
      navigate(`/transporters/track?number=${encodeURIComponent(trackingNumber.trim())}`);
    }
  };

  const vehicleCategories = [
    {
      id: "mini_truck",
      title: "Mini Truck / Tata Ace",
      tagline: "Chhota Hathi • Urban Last-Mile",
      capacity: "0.75 - 1.5 Tons",
      bodyTypes: "Open / Semi-Closed",
      idealFor: "FMCG, intra-city deliveries, carton boxes, light industrial supplies",
      imageTag: "Tata Ace / Dost",
    },
    {
      id: "pickup",
      title: "Pickup / Bolero Maxi",
      tagline: "High Ground Clearance • Inter-District",
      capacity: "1.5 - 2.5 Tons",
      bodyTypes: "Open Deck / Cage",
      idealFor: "Agricultural produce, building hardware, steel pipes, timber",
      imageTag: "Bolero Maxi Truck",
    },
    {
      id: "lcv_14ft",
      title: "LCV 14ft - 19ft (Canter)",
      tagline: "Light Commercial • Regional Linehaul",
      capacity: "3.5 - 7.0 Tons",
      bodyTypes: "Container / High Side Open",
      idealFor: "Textiles, furniture, appliances, packaged food items",
      imageTag: "Eicher Pro 14ft",
    },
    {
      id: "mcv_20ft",
      title: "MCV 20ft - 24ft",
      tagline: "Medium Commercial • State-to-State",
      capacity: "8.0 - 15.0 Tons",
      bodyTypes: "Closed Container / Tarpaulin Open",
      idealFor: "Bulk raw materials, engineering parts, retail distribution",
      imageTag: "Eicher / Tata 22ft",
    },
    {
      id: "heavy_truck_32ft",
      title: "32ft Heavy Multi-Axle",
      tagline: "Heavy Commercial • Interstate Express",
      capacity: "16.0 - 28.0 Tons",
      bodyTypes: "HQ Container / Open Multi-Axle",
      idealFor: "Automobile spares, heavy equipment, paper reels, FMCG master cases",
      imageTag: "32ft Single/Multi Axle",
    },
    {
      id: "trailer_multi_axle",
      title: "Trailer & Multi-Axle",
      tagline: "Extreme Heavy Haulage • Project Cargo",
      capacity: "30.0 - 55.0+ Tons",
      bodyTypes: "High Bed / Low Bed Trailer",
      idealFor: "TMT bars, structural steel, transformer plants, industrial cranes",
      imageTag: "40ft - 50ft Flatbed Trailer",
    },
    {
      id: "reefer_truck",
      title: "Refrigerated Reefer",
      tagline: "Temperature Controlled • Pharma & Cold Chain",
      capacity: "3.0 - 18.0 Tons",
      bodyTypes: "Insulated Chiller / Deep Freeze",
      idealFor: "Ice creams, dairy products, vaccines, fresh fruits & seafood (-25°C to +15°C)",
      imageTag: "Active Reefer Unit",
    },
    {
      id: "industrial_tanker",
      title: "Chemical & Fuel Tanker",
      tagline: "Hazardous & Liquid Bulk Transport",
      capacity: "12,000L - 35,000L",
      bodyTypes: "SS 304/316 / Mild Steel Tank",
      idealFor: "Edible oils, industrial solvents, petrochemicals, liquid glucose",
      imageTag: "Explosive/Hazmat Certified Tanker",
    },
  ];

  const popularLanes = [
    { from: "Mumbai", to: "Delhi NCR", distance: "1,420 km", estTransit: "48 - 60 hrs", demand: "High FTL / Container" },
    { from: "Ahmedabad", to: "Bengaluru", distance: "1,490 km", estTransit: "52 - 64 hrs", demand: "Chemicals & Engineering" },
    { from: "Surat", to: "Kolkata", distance: "1,880 km", estTransit: "68 - 80 hrs", demand: "Textiles & Yarns" },
    { from: "Delhi NCR", to: "Ludhiana", distance: "310 km", estTransit: "8 - 12 hrs", demand: "Light Commercial & Auto" },
    { from: "Chennai", to: "Hyderabad", distance: "630 km", estTransit: "16 - 22 hrs", demand: "Electronics & Hardware" },
    { from: "Pune", to: "Chennai", distance: "910 km", estTransit: "28 - 36 hrs", demand: "Auto Ancillary & FTL" },
  ];

  return (
    <div className="bg-stone-50 min-h-screen text-stone-900">
      {/* 1. HERO SECTION WITH INSTANT BOOKING & TRACKING ENGINE */}
      <section className="relative bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 text-white pt-12 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Headline */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-4">
                <Truck className="w-4 h-4 text-blue-300" />
                India's Verified Commercial Transporter & Fleet Marketplace
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                Book Verified Commercial Trucks & Fleet Operators Direct
              </h1>
              <p className="mt-4 text-base sm:text-lg text-stone-300 max-w-2xl leading-relaxed">
                Connect with verified truck owners and fleet operators across India. From Tata Ace urban runs to 32ft heavy linehauls, get competitive direct quotes and track your trips in real time.
              </p>

              {/* Key Trust Badges */}
              <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-stone-300">
                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  100% RC, Fitness & National Permit Verified
                </span>
                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-xs">
                  <UserCheck className="w-4 h-4 text-blue-400" />
                  Authorized Commercial Drivers
                </span>
                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-xs">
                  <Navigation className="w-4 h-4 text-amber-400" />
                  14-State Real-Time Trip Stepper
                </span>
              </div>
            </div>

            {/* Right Quick Tracking Card */}
            <div className="lg:col-span-5">
              <div className="bg-white/10 border border-white/20 backdrop-blur-md p-6 rounded-2xl shadow-2xl">
                <div className="flex items-center gap-2.5 text-blue-200 text-xs font-bold uppercase tracking-wider mb-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  Track Live Consignment Trip
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Enter Trip Tracking or Booking Number
                </h3>
                <p className="text-xs text-stone-300 mb-4">
                  Check live trip progression, driver status, milestones and digital POD sign-off safely.
                </p>
                <form onSubmit={handleTrackSubmit} className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. TRP-TRK-17946592 or TBK-..."
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      className="w-full pl-4 pr-10 py-3 rounded-xl bg-white text-stone-900 placeholder-stone-400 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
                    />
                    <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-lg"
                  >
                    Track Trip Progression
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-stone-300">
                  <span>Privacy Protected (Masked Contact & Registration)</span>
                  <Link to="/transporters/directory" className="text-blue-300 hover:underline">
                    Browse Fleets →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* MAIN LOAD ENQUIRY & VEHICLE FINDER BAR */}
          <div className="mt-10 bg-white rounded-2xl p-4 sm:p-6 shadow-2xl border border-stone-200 text-stone-900">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-700" />
                <span className="font-extrabold text-sm sm:text-base text-stone-900">
                  Instant Load Requirement & Direct Carrier Matching
                </span>
              </div>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                Zero Middleman Markup
              </span>
            </div>

            <form onSubmit={handleHeroSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
              {/* Pickup City */}
              <div className="lg:col-span-3">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Pickup City / Hub
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mumbai, Surat, Delhi"
                    value={pickupCity}
                    onChange={(e) => setPickupCity(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Delivery City */}
              <div className="lg:col-span-3">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Delivery Destination
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bengaluru, Kolkata, Pune"
                    value={deliveryCity}
                    onChange={(e) => setDeliveryCity(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Vehicle Category Required */}
              <div className="lg:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Vehicle Type
                </label>
                <select
                  value={vehicleCategory}
                  onChange={(e) => setVehicleCategory(e.target.value)}
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer"
                >
                  <option value="all">Any Suitable Vehicle</option>
                  <option value="mini_truck">Tata Ace / Mini Truck</option>
                  <option value="pickup">Pickup / Bolero Maxi</option>
                  <option value="lcv_14ft">LCV 14ft - 19ft</option>
                  <option value="mcv_20ft">MCV 20ft - 24ft</option>
                  <option value="heavy_truck_32ft">32ft Multi-Axle</option>
                  <option value="trailer_multi_axle">Multi-Axle Trailer</option>
                  <option value="reefer_truck">Refrigerated Reefer</option>
                  <option value="industrial_tanker">Liquid Tanker</option>
                </select>
              </div>

              {/* Estimated Weight */}
              <div className="lg:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Approx Weight (Tons)
                </label>
                <div className="relative">
                  <Weight className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 5.5"
                    value={weightTons}
                    onChange={(e) => setWeightTons(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <div className="lg:col-span-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  Find Transporters
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* 2. COMMERCIAL VEHICLE FLEET CATEGORIES */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-1">
              Complete Commercial Fleet Roster
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
              Discover Commercial Vehicles for Every Load Profile
            </h2>
            <p className="text-sm text-stone-500 mt-1 max-w-2xl">
              From intracity express distribution to pan-India project haulage, browse verified commercial vehicles with compliant permits and fitness certifications.
            </p>
          </div>
          <Link
            to="/transporters/directory"
            className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900 shrink-0"
          >
            View All Verified Fleets
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {vehicleCategories.map((veh) => (
            <div
              key={veh.id}
              className="bg-white border border-stone-200 rounded-2xl p-5 hover:shadow-lg hover:border-blue-300 transition flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-stone-100 text-stone-700">
                    {veh.capacity}
                  </span>
                  <Truck className="w-5 h-5 text-blue-700 group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="font-bold text-base text-stone-900 group-hover:text-blue-700 transition">
                  {veh.title}
                </h3>
                <p className="text-[11px] font-semibold text-blue-600 mt-0.5">
                  {veh.tagline}
                </p>
                <div className="mt-3 text-xs text-stone-600 space-y-1">
                  <div className="flex items-center gap-1.5 text-stone-500">
                    <span className="font-medium text-stone-700">Body:</span> {veh.bodyTypes}
                  </div>
                  <p className="text-[11px] text-stone-500 line-clamp-2 mt-1">
                    {veh.idealFor}
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-stone-400">
                  {veh.imageTag}
                </span>
                <Link
                  to={`/transporters/book?category=${veh.id}`}
                  className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1"
                >
                  Book Truck →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. POPULAR HIGHWAY FREIGHT CORRIDORS */}
      <section className="bg-stone-100 py-16 px-4 sm:px-6 lg:px-8 border-y border-stone-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              National Freight Corridors
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-1">
              Active Transporter Lanes & Transit Estimates
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-2">
              High-frequency commercial lanes connecting manufacturing hubs, major seaports, and consumption markets across India.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularLanes.map((lane, idx) => (
              <div
                key={idx}
                className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs hover:shadow-md transition"
              >
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-2 font-bold text-sm text-stone-900">
                    <span>{lane.from}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
                    <span>{lane.to}</span>
                  </div>
                  <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    {lane.distance}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <div className="text-stone-500">
                    Est. Transit: <strong className="text-stone-800">{lane.estTransit}</strong>
                  </div>
                  <div className="text-[11px] text-stone-600 bg-stone-50 px-2 py-0.5 rounded border border-stone-200">
                    {lane.demand}
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-stone-100">
                  <Link
                    to={`/transporters/book?pickup=${encodeURIComponent(lane.from)}&delivery=${encodeURIComponent(lane.to)}`}
                    className="w-full text-center block py-1.5 px-3 bg-stone-50 hover:bg-blue-50 text-blue-700 border border-stone-200 hover:border-blue-200 text-xs font-bold rounded-lg transition"
                  >
                    Request Route Rates
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. VERIFIED TRANSPORTER ECOSYSTEM WORKFLOW */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
            How It Operates
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-1">
            End-to-End B2B Truck Booking & Real-Time Fulfillment
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4 font-black text-lg">
              1
            </div>
            <h3 className="font-bold text-sm text-stone-900">Post Load Requirement</h3>
            <p className="text-xs text-stone-500 mt-1">
              Specify origin, destination, payload weight, goods type, and vehicle category.
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4 font-black text-lg">
              2
            </div>
            <h3 className="font-bold text-sm text-stone-900">Receive Direct Carrier Quotes</h3>
            <p className="text-xs text-stone-500 mt-1">
              Verified fleet owners submit itemized freight bids with transparent GST, toll & fuel breakdowns.
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4 font-black text-lg">
              3
            </div>
            <h3 className="font-bold text-sm text-stone-900">Assign Vehicle & Driver</h3>
            <p className="text-xs text-stone-500 mt-1">
              Transporter assigns registered commercial vehicle (RC verified) and authorized driver.
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4 font-black text-lg">
              4
            </div>
            <h3 className="font-bold text-sm text-stone-900">14-State Stepper & Digital POD</h3>
            <p className="text-xs text-stone-500 mt-1">
              Track live milestone progression safely with masked PII and instant digital proof of delivery.
            </p>
          </div>
        </div>
      </section>

      {/* 5. TRANSPORTER ONBOARDING CTA BANNER */}
      <section className="bg-stone-900 text-white py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              For Commercial Truck & Fleet Owners
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold mt-1">
              Are you a Transporter or Commercial Vehicle Fleet Owner?
            </h2>
            <p className="text-sm text-stone-300 mt-2 max-w-xl">
              Register your fleet on Coverly Transporter Network. Access direct B2B load enquiries from manufacturers, distributors, and bulk shippers with zero broker fees.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <Link
              to="/transporter"
              className="py-3 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition shadow-lg text-center"
            >
              Open Transporter Portal
            </Link>
            <Link
              to="/transporters/directory"
              className="py-3 px-6 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-sm rounded-xl transition border border-stone-700 text-center"
            >
              Browse Transporters
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
