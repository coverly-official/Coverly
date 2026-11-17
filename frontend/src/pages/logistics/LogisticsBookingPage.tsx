import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import {
  Truck,
  ShieldCheck,
  MapPin,
  CheckCircle,
  Calendar,
  Weight,
  Package,
  Layers,
  Send,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Star,
  Building2,
  FileCheck,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const LogisticsBookingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Wizard Step: 1 = Form, 2 = Provider Matching & Compare, 3 = Confirmation
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    pickup_address: "",
    pickup_city: searchParams.get("pickup") || "",
    pickup_state: "India",
    pickup_pincode: "",
    pickup_contact_name: "",
    pickup_contact_phone: "",
    delivery_address: "",
    delivery_city: searchParams.get("delivery") || "",
    delivery_state: "India",
    delivery_pincode: "",
    delivery_contact_name: "",
    delivery_contact_phone: "",
    goods_category: searchParams.get("category") || "Industrial Machinery",
    goods_description: "",
    weight_kg: searchParams.get("weight") || "250",
    dimensions_length: "100",
    dimensions_width: "80",
    dimensions_height: "80",
    packages_count: "1",
    package_type: "Box",
    is_fragile: false,
    is_hazardous: false,
    is_temperature_controlled: false,
    declared_value_inr: "50000",
    preferred_pickup_date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    service_type_preference: searchParams.get("service") || "ftl",
    special_instructions: "",
  });

  const [matchingCarriers, setMatchingCarriers] = useState<any[]>([]);
  const [selectedCarrierIds, setSelectedCarrierIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdRequest, setCreatedRequest] = useState<any | null>(null);

  // Fetch candidate carriers on step 2
  useEffect(() => {
    if (step === 2) {
      fetch(`${API_BASE}/logistics/companies?city=${encodeURIComponent(formData.pickup_city || "")}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data?.companies) {
            setMatchingCarriers(data.data.companies);
            // Default select up to 3 carriers
            setSelectedCarrierIds(data.data.companies.slice(0, 3).map((c: any) => c.id));
          }
        })
        .catch(() => {});
    }
  }, [step, formData.pickup_city]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Basic prohibited goods validation
    const descLower = formData.goods_description.toLowerCase();
    if (descLower.includes("explosive") || descLower.includes("firearms") || descLower.includes("narcotic")) {
      setErrorMessage("Prohibited items cannot be shipped per national transit safety regulations.");
      return;
    }

    if (!formData.customer_name || !formData.customer_phone || !formData.pickup_address || !formData.delivery_address) {
      setErrorMessage("Please fill all required pickup, delivery and contact details.");
      return;
    }

    setStep(2);
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        ...formData,
        dimensions_cm: {
          length: Number(formData.dimensions_length) || 0,
          width: Number(formData.dimensions_width) || 0,
          height: Number(formData.dimensions_height) || 0,
        },
        selected_company_ids: selectedCarrierIds,
      };

      const res = await fetch(`${API_BASE}/logistics/enquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setCreatedRequest(data.data);
        setStep(3);
      } else {
        setErrorMessage(data.error || "Failed to submit request.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit enquiry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCarrierSelection = (id: string) => {
    setSelectedCarrierIds((prev) =>
      prev.includes(id) ? prev.filter((cId) => cId !== id) : [...prev, id]
    );
  };

  return (
    <div className="bg-stone-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Wizard Stepper Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-md mx-auto relative">
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-stone-200 -z-0" />
            <div className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? "bg-blue-900 text-white" : "bg-stone-200 text-stone-600"}`}>
              1
            </div>
            <div className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? "bg-blue-900 text-white" : "bg-stone-200 text-stone-600"}`}>
              2
            </div>
            <div className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${step === 3 ? "bg-emerald-600 text-white" : "bg-stone-200 text-stone-600"}`}>
              3
            </div>
          </div>
          <div className="flex justify-between max-w-md mx-auto text-[11px] font-semibold text-stone-600 uppercase tracking-wider mt-2">
            <span className={step === 1 ? "text-blue-900" : ""}>Shipment Specs</span>
            <span className={step === 2 ? "text-blue-900" : ""}>Compare Carriers</span>
            <span className={step === 3 ? "text-emerald-700" : ""}>Confirmation</span>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: Shipment Details Form */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-10 shadow-xs">
            <div className="border-b border-stone-100 pb-4 mb-6">
              <h2 className="text-xl font-bold text-stone-900">Shipment & Consignment Specifications</h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Enter pickup and delivery locations to receive competitive landed freight quotations.
              </p>
            </div>

            {/* Customer Contact */}
            <div className="mb-8">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-700 mb-3">
                Your Contact Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    name="customer_name"
                    placeholder="e.g. Ramesh Patel"
                    value={formData.customer_name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-blue-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">Mobile Phone *</label>
                  <input
                    type="tel"
                    required
                    name="customer_phone"
                    placeholder="e.g. +91 98765 43210"
                    value={formData.customer_phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-blue-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">Email Address</label>
                  <input
                    type="email"
                    name="customer_email"
                    placeholder="e.g. ramesh@company.com"
                    value={formData.customer_email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-blue-900"
                  />
                </div>
              </div>
            </div>

            {/* Pickup & Delivery Addresses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Pickup */}
              <div className="bg-stone-50/70 border border-stone-200 rounded-2xl p-5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-950 uppercase tracking-wider mb-3">
                  <MapPin className="w-4 h-4 text-blue-900" /> Origin / Pickup Depot
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-medium text-stone-600 mb-1">Full Pickup Address *</label>
                    <textarea
                      required
                      name="pickup_address"
                      rows={2}
                      placeholder="Factory / Warehouse / Unit No, Road, Industrial Area"
                      value={formData.pickup_address}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-blue-900 bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-stone-600 mb-1">City *</label>
                      <input
                        type="text"
                        required
                        name="pickup_city"
                        placeholder="e.g. Surat"
                        value={formData.pickup_city}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-blue-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-stone-600 mb-1">Pincode</label>
                      <input
                        type="text"
                        name="pickup_pincode"
                        placeholder="e.g. 395001"
                        value={formData.pickup_pincode}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-blue-900 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery */}
              <div className="bg-stone-50/70 border border-stone-200 rounded-2xl p-5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-950 uppercase tracking-wider mb-3">
                  <MapPin className="w-4 h-4 text-emerald-700" /> Destination / Delivery Site
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-medium text-stone-600 mb-1">Delivery Address *</label>
                    <textarea
                      required
                      name="delivery_address"
                      rows={2}
                      placeholder="Delivery site, receiving gate, buyer depot"
                      value={formData.delivery_address}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-blue-900 bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-stone-600 mb-1">City *</label>
                      <input
                        type="text"
                        required
                        name="delivery_city"
                        placeholder="e.g. Delhi NCR"
                        value={formData.delivery_city}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-blue-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-stone-600 mb-1">Pincode</label>
                      <input
                        type="text"
                        name="delivery_pincode"
                        placeholder="e.g. 110001"
                        value={formData.delivery_pincode}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-blue-900 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cargo Specifications */}
            <div className="mb-8">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-700 mb-3">
                Cargo Specifications & Dimensions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-[11px] font-medium text-stone-600 mb-1">Goods Category *</label>
                  <select
                    name="goods_category"
                    value={formData.goods_category}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-blue-900"
                  >
                    <option value="Industrial Machinery">Industrial Machinery & Parts</option>
                    <option value="Electrical Equipment">Electrical Equipment & Switchgears</option>
                    <option value="Textiles & Garments">Textiles & Garments</option>
                    <option value="Chemicals & Polymers">Chemicals & Polymers</option>
                    <option value="Steel & Construction">Steel, Rebar & Construction</option>
                    <option value="FMCG & Packaging">FMCG & Packaging Materials</option>
                    <option value="Pharmaceuticals">Pharmaceuticals & Healthcare</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-stone-600 mb-1">Total Weight (kg) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    name="weight_kg"
                    value={formData.weight_kg}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-blue-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-stone-600 mb-1">Package Count</label>
                  <input
                    type="number"
                    min="1"
                    name="packages_count"
                    value={formData.packages_count}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-blue-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-stone-600 mb-1">Goods Description *</label>
                <textarea
                  required
                  name="goods_description"
                  rows={2}
                  placeholder="Describe goods, packaging (e.g. 5 wooden crates containing forged steel gate valves Class 800)"
                  value={formData.goods_description}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-blue-900"
                />
              </div>

              {/* Special Flags */}
              <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-stone-100 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_fragile"
                    checked={formData.is_fragile}
                    onChange={handleChange}
                    className="rounded text-blue-900 focus:ring-0"
                  />
                  <span>Fragile Cargo</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_hazardous"
                    checked={formData.is_hazardous}
                    onChange={handleChange}
                    className="rounded text-blue-900 focus:ring-0"
                  />
                  <span>Hazardous / Hazmat Material</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_temperature_controlled"
                    checked={formData.is_temperature_controlled}
                    onChange={handleChange}
                    className="rounded text-blue-900 focus:ring-0"
                  />
                  <span>Temperature Controlled Reefer</span>
                </label>
              </div>
            </div>

            {/* Preferred Pickup Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div>
                <label className="block text-[11px] font-medium text-stone-600 mb-1">Preferred Pickup Date *</label>
                <input
                  type="date"
                  required
                  name="preferred_pickup_date"
                  value={formData.preferred_pickup_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-blue-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-stone-600 mb-1">Declared Value for Transit Insurance (₹)</label>
                <input
                  type="number"
                  name="declared_value_inr"
                  value={formData.declared_value_inr}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-blue-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="submit"
                className="px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2"
              >
                <span>Continue to Compare Carriers</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Compare Matching Carriers & Multi-Provider Broadcast */}
        {step === 2 && (
          <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-10 shadow-xs">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-stone-100 flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-bold text-stone-900">Compare Eligible Logistics Carriers</h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Route: <strong className="text-stone-900">{formData.pickup_city} &rarr; {formData.delivery_city}</strong> • Cargo: {formData.weight_kg}kg ({formData.goods_category})
                </p>
              </div>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-semibold text-stone-600 hover:text-stone-900 flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Edit Specs
              </button>
            </div>

            <div className="mb-6">
              <p className="text-xs text-stone-600 mb-3">
                Select one or more verified carriers to broadcast your quotation request. Each provider will formulate an independent landed-cost quote.
              </p>

              <div className="space-y-4">
                {matchingCarriers.map((carrier) => {
                  const p = carrier.logistics_profile;
                  const isSelected = selectedCarrierIds.includes(carrier.id);
                  return (
                    <div
                      key={carrier.id}
                      onClick={() => toggleCarrierSelection(carrier.id)}
                      className={`border rounded-2xl p-5 cursor-pointer transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isSelected
                          ? "border-blue-900 bg-blue-50/40 ring-1 ring-blue-900"
                          : "border-stone-200 hover:border-stone-400 bg-white"
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="mt-1 rounded text-blue-900 focus:ring-0"
                        />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-sm text-stone-900">{carrier.name}</span>
                            {carrier.verification_level !== "unverified" && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" /> VERIFIED
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-stone-500 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-stone-400" />
                            {carrier.city}, {carrier.state} • Fleet: {p?.fleet_size || 25}+ Trucks
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2 text-[11px] text-stone-600">
                            {(p?.operating_routes || [`${formData.pickup_city} Corridor`]).slice(0, 2).map((r: string, idx: number) => (
                              <span key={idx} className="px-2 py-0.5 bg-stone-100 rounded text-stone-700">
                                {r}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-stone-100 text-right">
                        <div className="text-xs text-stone-500">Est. Transit</div>
                        <div className="text-sm font-bold text-stone-900">2 - 3 Days</div>
                        <span className="text-[11px] text-blue-900 font-semibold mt-1">Landed Quote on Request</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-6 border-t border-stone-100 flex items-center justify-between">
              <span className="text-xs text-stone-500">
                {selectedCarrierIds.length} carrier(s) selected
              </span>

              <button
                type="button"
                disabled={selectedCarrierIds.length === 0 || isSubmitting}
                onClick={handleFinalSubmit}
                className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 disabled:opacity-50"
              >
                <span>{isSubmitting ? "Submitting Request..." : "Request Competing Quotations"}</span>
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Confirmation Dossier */}
        {step === 3 && createdRequest && (
          <div className="bg-white border border-stone-200 rounded-3xl p-8 sm:p-12 text-center shadow-xs">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-200">
              <CheckCircle className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-bold text-stone-900 mb-1">
              Shipment Request Registered Successfully!
            </h2>
            <p className="text-xs text-stone-500 max-w-md mx-auto mb-6">
              Your requirement has been dispatched to {createdRequest.matched_providers_count || selectedCarrierIds.length} verified logistics carriers. You will receive itemized landed quotations shortly.
            </p>

            <div className="max-w-md mx-auto bg-stone-50 border border-stone-200 rounded-2xl p-5 text-left mb-8 space-y-2 text-xs">
              <div className="flex justify-between border-b border-stone-200/80 pb-2">
                <span className="text-stone-500">Booking Reference:</span>
                <span className="font-mono font-bold text-blue-900">{createdRequest.request_number}</span>
              </div>
              <div className="flex justify-between border-b border-stone-200/80 pb-2">
                <span className="text-stone-500">Route:</span>
                <span className="font-medium text-stone-900">{createdRequest.pickup_city} &rarr; {createdRequest.delivery_city}</span>
              </div>
              <div className="flex justify-between border-b border-stone-200/80 pb-2">
                <span className="text-stone-500">Cargo Weight:</span>
                <span className="font-medium text-stone-900">{createdRequest.weight_kg} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Pickup Date:</span>
                <span className="font-medium text-stone-900">{createdRequest.preferred_pickup_date}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/logistics"
                className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs rounded-xl transition"
              >
                Back to Logistics Home
              </Link>
              <Link
                to={`/logistics/companies`}
                className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl transition shadow-xs"
              >
                Explore Other Carriers
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
