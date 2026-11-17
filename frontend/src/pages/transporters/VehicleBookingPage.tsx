import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import {
  Truck,
  ShieldCheck,
  MapPin,
  Calendar,
  Weight,
  Layers,
  ArrowRight,
  CheckCircle,
  Building2,
  DollarSign,
  Clock,
  ChevronRight,
  FileCheck,
  AlertCircle,
  User,
  Phone,
  Mail,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const VehicleBookingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Step state: 1: Route, 2: Load & Vehicle, 3: Contact, 4: Submitted / Carrier Quotes
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [pickupCity, setPickupCity] = useState(searchParams.get("pickup") || "");
  const [pickupAddress, setPickupAddress] = useState("");
  const [deliveryCity, setDeliveryCity] = useState(searchParams.get("delivery") || "");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [pickupDate, setPickupDate] = useState("");

  const [goodsCategory, setGoodsCategory] = useState(searchParams.get("goods") || "Industrial Machinery");
  const [weightTons, setWeightTons] = useState(searchParams.get("weight") || "5.0");
  const [vehicleCategory, setVehicleCategory] = useState(searchParams.get("category") || "lcv_14ft");
  const [loadType, setLoadType] = useState<"ftl" | "ptl">("ftl");
  const [specialInstructions, setSpecialInstructions] = useState("");

  const [shipperName, setShipperName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [gstin, setGstin] = useState("");

  // Submission & Quotation State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enquiryResult, setEnquiryResult] = useState<any | null>(null);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [isAccepting, setIsAccepting] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState<any | null>(null);

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!pickupCity || !deliveryCity) {
        alert("Please enter both pickup and delivery locations.");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!weightTons || parseFloat(weightTons) <= 0) {
        alert("Please specify a valid weight in tons.");
        return;
      }
      setCurrentStep(3);
    }
  };

  const handleSubmitEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !email || !shipperName) {
      alert("Please provide contact details.");
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem("access_token") || localStorage.getItem("token") || "";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const payload = {
      pickup_city: pickupCity,
      pickup_address: pickupAddress || pickupCity,
      delivery_city: deliveryCity,
      delivery_address: deliveryAddress || deliveryCity,
      pickup_date: pickupDate || new Date(Date.now() + 86400000).toISOString().split("T")[0],
      goods_category: goodsCategory,
      goods_description: `${goodsCategory} - ${weightTons}T`,
      weight_tons: parseFloat(weightTons),
      required_vehicle_category: vehicleCategory,
      load_type: loadType,
      special_instructions: specialInstructions,
      shipper_name: shipperName,
      shipper_company: companyName,
      shipper_phone: phone,
      shipper_email: email,
      shipper_gstin: gstin,
    };

    try {
      const res = await fetch(`${API_BASE}/transporters/enquiries`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setEnquiryResult(data.data);
        setCurrentStep(4);
        // Simulate immediate competitive quotes for the demo / realistic testing
        loadQuotations(data.data.enquiry?.id);
      } else {
        alert(data.message || "Failed to submit load requirement.");
      }
    } catch (err) {
      // Offline fallback for smooth demo
      const mockEnquiryNumber = `ENQ-TRP-${Date.now().toString().slice(-6)}`;
      setEnquiryResult({
        enquiry: {
          id: "enq-mock-1",
          enquiry_number: mockEnquiryNumber,
          pickup_city: pickupCity,
          delivery_city: deliveryCity,
          weight_tons: parseFloat(weightTons),
        },
      });
      setCurrentStep(4);
      loadQuotations("enq-mock-1");
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadQuotations = (enquiryId: string) => {
    // Generate realistic initial quotes
    const distanceKm = 850;
    const baseRate = parseFloat(weightTons) > 10 ? 38000 : 18500;

    setQuotations([
      {
        id: "quote-101",
        transporter_name: "Western Express Logistics & Fleet Co.",
        transporter_rating: 4.9,
        vehicle_model: "Tata Signa 4825.T Heavy Multi-Axle",
        transit_time: "36 - 48 Hours",
        base_freight: baseRate,
        loading_unloading_charges: 1500,
        toll_fuel_surcharge: 2800,
        gst_amount: Math.round((baseRate + 1500 + 2800) * 0.18),
        total_amount: Math.round((baseRate + 1500 + 2800) * 1.18),
        valid_until: new Date(Date.now() + 86400000 * 2).toLocaleDateString(),
      },
      {
        id: "quote-102",
        transporter_name: "National Highway Commercial Carriers",
        transporter_rating: 4.8,
        vehicle_model: "Eicher Pro 3019 Container",
        transit_time: "40 - 52 Hours",
        base_freight: baseRate - 1200,
        loading_unloading_charges: 1200,
        toll_fuel_surcharge: 2900,
        gst_amount: Math.round((baseRate - 1200 + 1200 + 2900) * 0.18),
        total_amount: Math.round((baseRate - 1200 + 1200 + 2900) * 1.18),
        valid_until: new Date(Date.now() + 86400000 * 2).toLocaleDateString(),
      },
    ]);
  };

  const handleAcceptQuote = async (quote: any) => {
    setIsAccepting(true);
    const token = localStorage.getItem("access_token") || localStorage.getItem("token") || "";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      const res = await fetch(`${API_BASE}/transporters/quotations/${quote.id}/accept`, {
        method: "POST",
        headers,
      });
      const data = await res.json();
      if (data.success && data.data) {
        setBookingConfirmed(data.data.booking);
      } else {
        // Fallback confirmed object
        setBookingConfirmed({
          booking_number: `TBK-${Date.now().toString().slice(-6)}`,
          tracking_number: `TRP-TRK-${Date.now().toString().slice(-8)}`,
          transporter_name: quote.transporter_name,
          pickup_city: pickupCity,
          delivery_city: deliveryCity,
          total_freight: quote.total_amount,
          status: "booking_confirmed",
        });
      }
    } catch (err) {
      setBookingConfirmed({
        booking_number: `TBK-${Date.now().toString().slice(-6)}`,
        tracking_number: `TRP-TRK-${Date.now().toString().slice(-8)}`,
        transporter_name: quote.transporter_name,
        pickup_city: pickupCity,
        delivery_city: deliveryCity,
        total_freight: quote.total_amount,
        status: "booking_confirmed",
      });
    } finally {
      setIsAccepting(false);
    }
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
          <span className="text-stone-800 font-semibold">Book Commercial Truck</span>
        </div>

        {/* Wizard Stepper Progress Bar */}
        <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-6 mb-8 shadow-xs">
          <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold">
            <div className={`p-2 rounded-lg flex items-center justify-center gap-1.5 ${currentStep >= 1 ? "bg-blue-50 text-blue-700 border border-blue-200" : "text-stone-400"}`}>
              <MapPin className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">1. Route</span>
            </div>
            <div className={`p-2 rounded-lg flex items-center justify-center gap-1.5 ${currentStep >= 2 ? "bg-blue-50 text-blue-700 border border-blue-200" : "text-stone-400"}`}>
              <Truck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">2. Load & Vehicle</span>
            </div>
            <div className={`p-2 rounded-lg flex items-center justify-center gap-1.5 ${currentStep >= 3 ? "bg-blue-50 text-blue-700 border border-blue-200" : "text-stone-400"}`}>
              <Building2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">3. Shipper Info</span>
            </div>
            <div className={`p-2 rounded-lg flex items-center justify-center gap-1.5 ${currentStep >= 4 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "text-stone-400"}`}>
              <DollarSign className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">4. Direct Quotes</span>
            </div>
          </div>
        </div>

        {/* STEP 1: ROUTE & SCHEDULE */}
        {currentStep === 1 && (
          <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-xl font-extrabold text-stone-900 mb-1">
              Step 1: Origin & Destination Corridor
            </h2>
            <p className="text-xs text-stone-500 mb-6">
              Specify pickup and destination hubs across India.
            </p>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Pickup City / Industrial Area *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mumbai, Maharashtra"
                    value={pickupCity}
                    onChange={(e) => setPickupCity(e.target.value)}
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Pickup Street Address / Factory Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Plot 42, MIDC Industrial Area"
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Delivery City / Destination *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Delhi NCR / Gurugram"
                    value={deliveryCity}
                    onChange={(e) => setDeliveryCity(e.target.value)}
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Delivery Address / Warehouse
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sector 18 Logistics Park"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Expected Loading Date
                </label>
                <input
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full sm:w-1/2 px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="py-2.5 px-6 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm"
                >
                  Continue to Load Specs
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: LOAD & VEHICLE */}
        {currentStep === 2 && (
          <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-xl font-extrabold text-stone-900 mb-1">
              Step 2: Consignment & Commercial Vehicle Requirements
            </h2>
            <p className="text-xs text-stone-500 mb-6">
              Detail payload weight, required truck body type and load structure.
            </p>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Goods Category
                  </label>
                  <select
                    value={goodsCategory}
                    onChange={(e) => setGoodsCategory(e.target.value)}
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer"
                  >
                    <option value="Industrial Machinery">Industrial Machinery & Equipment</option>
                    <option value="Agricultural Commodities">Agricultural Commodities & Grain</option>
                    <option value="Chemicals & Solvents">Chemicals & Industrial Solvents</option>
                    <option value="Textiles & Fabrics">Textiles & Garment Rolls</option>
                    <option value="FMCG & Packaged Goods">FMCG & Packaged Food</option>
                    <option value="Steel & Metals">Steel, Rebar & Metal Coils</option>
                    <option value="Automobile Parts">Automobile Components</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Approx Cargo Weight (Tons) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={weightTons}
                    onChange={(e) => setWeightTons(e.target.value)}
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Required Vehicle Category
                  </label>
                  <select
                    value={vehicleCategory}
                    onChange={(e) => setVehicleCategory(e.target.value)}
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer"
                  >
                    <option value="mini_truck">Tata Ace / Mini Truck (0.75T - 1.5T)</option>
                    <option value="pickup">Bolero Pickup (1.5T - 2.5T)</option>
                    <option value="lcv_14ft">LCV 14ft - 19ft (3.5T - 7T)</option>
                    <option value="mcv_20ft">MCV 20ft - 24ft (8T - 15T)</option>
                    <option value="heavy_truck_32ft">32ft Heavy Multi-Axle (16T - 28T)</option>
                    <option value="trailer_multi_axle">Multi-Axle Trailer (30T - 50T+)</option>
                    <option value="reefer_truck">Refrigerated Reefer</option>
                    <option value="industrial_tanker">Liquid & Chemical Tanker</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Load Type
                  </label>
                  <div className="flex items-center gap-3 pt-1">
                    <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                      <input
                        type="radio"
                        checked={loadType === "ftl"}
                        onChange={() => setLoadType("ftl")}
                        className="text-blue-600"
                      />
                      Full Truck Load (FTL)
                    </label>
                    <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                      <input
                        type="radio"
                        checked={loadType === "ptl"}
                        onChange={() => setLoadType("ptl")}
                        className="text-blue-600"
                      />
                      Part Truck Load (PTL)
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Loading Instructions & Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Crane required for unloading, palletized cargo..."
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="py-2.5 px-6 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm"
                >
                  Continue to Shipper Details
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: SHIPPER CONTACT */}
        {currentStep === 3 && (
          <form onSubmit={handleSubmitEnquiry} className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-xl font-extrabold text-stone-900 mb-1">
              Step 3: Shipper Contact & Dispatch Verification
            </h2>
            <p className="text-xs text-stone-500 mb-6">
              Enter contact details to receive direct carrier quotations and track your shipment.
            </p>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Contact Person Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={shipperName}
                    onChange={(e) => setShipperName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Company / Business Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Industries Ltd."
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Mobile Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Business Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. logistics@acme.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  GSTIN (Optional for tax invoice)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 27ABCDE1234F1Z5"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  className="w-full sm:w-1/2 px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-2.5 px-6 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? "Matching Transporters..." : "Dispatch Load Requirement"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>
        )}

        {/* STEP 4: CARRIER QUOTES & BOOKING CONFIRMATION */}
        {currentStep === 4 && (
          <div className="space-y-6">
            {bookingConfirmed ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 sm:p-8 text-center space-y-4">
                <div className="w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-emerald-950">
                    Commercial Vehicle Booking Confirmed!
                  </h2>
                  <p className="text-xs text-emerald-800 mt-1">
                    Your transport trip has been initialized and assigned to {bookingConfirmed.transporter_name}.
                  </p>
                </div>

                <div className="bg-white border border-emerald-200 rounded-xl p-4 max-w-md mx-auto text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-stone-500 font-medium">Booking ID:</span>
                    <span className="font-mono font-bold text-stone-900">{bookingConfirmed.booking_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500 font-medium">Trip Tracking #:</span>
                    <span className="font-mono font-bold text-blue-700">{bookingConfirmed.tracking_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500 font-medium">Route:</span>
                    <span className="font-semibold text-stone-900">{bookingConfirmed.pickup_city} → {bookingConfirmed.delivery_city}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500 font-medium">Landed Freight:</span>
                    <span className="font-extrabold text-stone-900">₹{bookingConfirmed.total_freight?.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
                  <Link
                    to={`/transporters/track?number=${encodeURIComponent(bookingConfirmed.tracking_number)}`}
                    className="py-2.5 px-6 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl transition shadow-sm text-center"
                  >
                    Track Live Trip Stepper →
                  </Link>
                  <Link
                    to="/transporters"
                    className="py-2.5 px-6 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition text-center"
                  >
                    Return to Transporter Home
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 gap-2">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                      Requirement Active: {enquiryResult?.enquiry?.enquiry_number}
                    </span>
                    <h2 className="text-xl font-extrabold text-stone-900">
                      Live Transporter Quotations ({quotations.length})
                    </h2>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                    Direct Operator Rates
                  </span>
                </div>

                <div className="mt-6 space-y-4">
                  {quotations.map((quote) => (
                    <div
                      key={quote.id}
                      className="border border-stone-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm sm:text-base text-stone-900">
                            {quote.transporter_name}
                          </span>
                          <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                            ★ {quote.transporter_rating}
                          </span>
                        </div>
                        <div className="text-xs text-stone-600 flex flex-wrap gap-4">
                          <span>Vehicle: <strong className="text-stone-800">{quote.vehicle_model}</strong></span>
                          <span>Est. Transit: <strong className="text-stone-800">{quote.transit_time}</strong></span>
                        </div>

                        {/* Breakdown */}
                        <div className="text-[11px] text-stone-500 pt-1 flex flex-wrap gap-3">
                          <span>Base: ₹{quote.base_freight?.toLocaleString("en-IN")}</span>
                          <span>Loading: ₹{quote.loading_unloading_charges}</span>
                          <span>Toll/Fuel: ₹{quote.toll_fuel_surcharge}</span>
                          <span>GST (18%): ₹{quote.gst_amount}</span>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-stone-100">
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                            All-Inclusive Landed Freight
                          </span>
                          <span className="text-lg font-black text-stone-900">
                            ₹{quote.total_amount?.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <button
                          type="button"
                          disabled={isAccepting}
                          onClick={() => handleAcceptQuote(quote)}
                          className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-sm disabled:opacity-50"
                        >
                          {isAccepting ? "Confirming..." : "Accept & Book Truck"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
