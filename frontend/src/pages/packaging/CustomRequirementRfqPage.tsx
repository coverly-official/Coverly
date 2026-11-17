import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import {
  Package,
  Layers,
  MapPin,
  Calendar,
  Send,
  Printer,
  FileText,
  Upload,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const CustomRequirementRfqPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const targetSupplierId = searchParams.get("supplier_id") || "";

  // Form State
  const [categoryId, setCategoryId] = useState("pkg-cat-flexible");
  const [packagingType, setPackagingType] = useState("Flexible Pouch");
  const [productBeingPacked, setProductBeingPacked] = useState("");
  const [materialPreference, setMaterialPreference] = useState("");
  const [dimensionLength, setDimensionLength] = useState("");
  const [dimensionWidth, setDimensionWidth] = useState("");
  const [dimensionHeight, setDimensionHeight] = useState("");
  const [dimensionGusset, setDimensionGusset] = useState("");
  const [requiredQuantity, setRequiredQuantity] = useState("5000");
  const [unit, setUnit] = useState("piece");
  const [printingRequired, setPrintingRequired] = useState(true);
  const [printingDetails, setPrintingDetails] = useState("");
  const [brandingDetails, setBrandingDetails] = useState("");
  const [customFinishing, setCustomFinishing] = useState("");
  const [foodContactGrade, setFoodContactGrade] = useState(false);
  const [targetBudget, setTargetBudget] = useState("");
  const [targetDeliveryDate, setTargetDeliveryDate] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [deliveryState, setDeliveryState] = useState("");
  const [deliveryPincode, setDeliveryPincode] = useState("");
  const [additionalInstructions, setAdditionalInstructions] = useState("");
  const [isSampleRequested, setIsSampleRequested] = useState(true);

  // Guest Details
  const [guestName, setGuestName] = useState(user?.full_name || "");
  const [guestEmail, setGuestEmail] = useState(user?.email || "");
  const [guestPhone, setGuestPhone] = useState(user?.phone || "");
  const [guestCompany, setGuestCompany] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRfq, setSubmittedRfq] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        category_id: categoryId,
        packaging_type: packagingType,
        product_being_packed: productBeingPacked,
        material_preference: materialPreference,
        required_dimensions: {
          length_mm: dimensionLength ? parseFloat(dimensionLength) : undefined,
          width_mm: dimensionWidth ? parseFloat(dimensionWidth) : undefined,
          height_mm: dimensionHeight ? parseFloat(dimensionHeight) : undefined,
          bottom_gusset_mm: dimensionGusset ? parseFloat(dimensionGusset) : undefined,
        },
        required_quantity: parseInt(requiredQuantity, 10),
        unit,
        printing_required: printingRequired,
        printing_details: printingDetails,
        branding_details: brandingDetails,
        custom_finishing: customFinishing,
        food_contact_grade: foodContactGrade,
        target_budget: targetBudget ? parseFloat(targetBudget) : undefined,
        target_delivery_date: targetDeliveryDate || undefined,
        delivery_city: deliveryCity,
        delivery_state: deliveryState,
        delivery_pincode: deliveryPincode,
        additional_instructions: additionalInstructions,
        is_sample_requested: isSampleRequested,
        target_supplier_id: targetSupplierId || undefined,
        guest_name: user ? user.full_name : guestName,
        guest_email: user ? user.email : guestEmail,
        guest_phone: user ? user.phone : guestPhone,
        guest_company: guestCompany,
      };

      const res = await fetch(`${API_BASE}/packaging/rfqs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(user ? { "x-user-id": user.id } : {}),
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSubmittedRfq(json.data);
      } else {
        setErrorMsg(json.error || "Failed to submit custom requirement.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error submitting requirement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#FAF9F5] min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-stone-500 mb-4">
          <Link to="/" className="hover:text-stone-900">Home</Link>
          <ChevronRight className="w-3 h-3 text-stone-400" />
          <Link to="/packaging" className="hover:text-stone-900">Packaging Marketplace</Link>
          <ChevronRight className="w-3 h-3 text-stone-400" />
          <span className="font-semibold text-stone-800">Custom Sourcing RFQ</span>
        </div>

        {submittedRfq ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center shadow-xs">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8" />
            </div>

            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full">
              RFQ Dispatched Successfully
            </span>

            <h1 className="text-2xl font-black text-stone-900 mt-3">
              Packaging Requirement Reference: {submittedRfq.rfq_number}
            </h1>

            <p className="text-xs sm:text-sm text-stone-600 mt-2 max-w-lg mx-auto leading-relaxed">
              Your custom packaging specifications have been broadcast to verified converters and manufacturers. You will receive itemized landed-cost quotations with sample lead times.
            </p>

            <div className="mt-6 p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-700 max-w-md mx-auto text-left space-y-1.5">
              <div><strong>Requirement:</strong> {submittedRfq.product_being_packed || submittedRfq.packaging_type}</div>
              <div><strong>Quantity:</strong> {submittedRfq.required_quantity.toLocaleString("en-IN")} {submittedRfq.unit}s</div>
              <div><strong>Delivery Destination:</strong> {submittedRfq.delivery_city}, {submittedRfq.delivery_state}</div>
              <div><strong>Sample Requested:</strong> {submittedRfq.is_sample_requested ? "Yes" : "No"}</div>
            </div>

            <div className="mt-8 flex justify-center gap-3">
              <Link
                to="/packaging"
                className="px-5 py-2.5 bg-blue-900 text-white font-bold text-xs rounded-xl hover:bg-blue-800 transition"
              >
                Return to Packaging Hub
              </Link>
              <button
                onClick={() => {
                  setSubmittedRfq(null);
                  setProductBeingPacked("");
                }}
                className="px-5 py-2.5 border border-stone-300 font-semibold text-xs rounded-xl hover:bg-stone-50 transition"
              >
                Post Another Requirement
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-10 shadow-xs">
            <div className="pb-6 border-b border-stone-200">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-900 text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-700" />
                Custom Manufacturing & Converting Wizard
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
                Submit Custom Packaging Requirement (RFQ)
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 mt-1">
                Provide technical parameters, barrier properties, dimensions and branding details to receive competitive supplier quotations.
              </p>
            </div>

            {errorMsg && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-8">
              {/* 1. Category & Product Type */}
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-900" /> 1. Packaging Domain & Item Type
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Packaging Domain</label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 bg-stone-50 focus:outline-none focus:border-blue-900"
                    >
                      <option value="pkg-cat-flexible">Flexible Packaging (Pouches, Rolls, Films)</option>
                      <option value="pkg-cat-rigid">Rigid Packaging (Containers, Bottles, Jars)</option>
                      <option value="pkg-cat-paper">Paper Packaging (Kraft Bags, Paper Cartons)</option>
                      <option value="pkg-cat-corrugated">Corrugated Packaging (3/5/7-Ply Boxes, Mailers)</option>
                      <option value="pkg-cat-food">Food Packaging (Snack, Spice, Dry Fruit)</option>
                      <option value="pkg-cat-industrial">Industrial Packaging (FIBC Bulk Bags, PP Woven)</option>
                      <option value="pkg-cat-labels">Labels & Printing (Roll Stickers, Barcode, Sleeves)</option>
                      <option value="pkg-cat-protective">Protective Packaging (Bubble, Foam, Dunnage)</option>
                      <option value="pkg-cat-accessories">Packaging Accessories (Caps, Seals, Tapes)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Packaging Format</label>
                    <input
                      type="text"
                      required
                      value={packagingType}
                      onChange={(e) => setPackagingType(e.target.value)}
                      placeholder="e.g. Stand-up Zipper Pouch, 5-Ply Shipping Carton, PET Jar..."
                      className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 bg-stone-50 focus:outline-none focus:border-blue-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Product Being Packed</label>
                    <input
                      type="text"
                      required
                      value={productBeingPacked}
                      onChange={(e) => setProductBeingPacked(e.target.value)}
                      placeholder="e.g. Roasted Coffee Beans, Protein Powder, Spices, Electronics..."
                      className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 bg-stone-50 focus:outline-none focus:border-blue-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Material Substrate Preference</label>
                    <input
                      type="text"
                      value={materialPreference}
                      onChange={(e) => setMaterialPreference(e.target.value)}
                      placeholder="e.g. Kraft / Foil / PE, 100 Micron, Virgin HDPE, 24 BF Kraft..."
                      className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 bg-stone-50 focus:outline-none focus:border-blue-900"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Dimensions & Quantity */}
              <div className="space-y-4 pt-6 border-t border-stone-100">
                <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-900" /> 2. Required Dimensions & Batch Quantity
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-stone-600 mb-1">Length / Width (mm)</label>
                    <input
                      type="number"
                      value={dimensionWidth}
                      onChange={(e) => setDimensionWidth(e.target.value)}
                      placeholder="Width mm"
                      className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 bg-stone-50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-600 mb-1">Height (mm)</label>
                    <input
                      type="number"
                      value={dimensionHeight}
                      onChange={(e) => setDimensionHeight(e.target.value)}
                      placeholder="Height mm"
                      className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 bg-stone-50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-600 mb-1">Gusset / Depth (mm)</label>
                    <input
                      type="number"
                      value={dimensionGusset}
                      onChange={(e) => setDimensionGusset(e.target.value)}
                      placeholder="Bottom / Side mm"
                      className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 bg-stone-50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-600 mb-1">Target Capacity</label>
                    <input
                      type="text"
                      placeholder="e.g. 500g, 1 Litre"
                      className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 bg-stone-50 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Required Quantity</label>
                    <input
                      type="number"
                      required
                      value={requiredQuantity}
                      onChange={(e) => setRequiredQuantity(e.target.value)}
                      placeholder="e.g. 10000"
                      className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 bg-stone-50 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Unit of Measurement</label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 bg-stone-50 focus:outline-none"
                    >
                      <option value="piece">Pieces</option>
                      <option value="box">Boxes</option>
                      <option value="roll">Rolls</option>
                      <option value="packet">Packets</option>
                      <option value="kg">Kilograms (KG)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Target Budget (INR, Optional)</label>
                    <input
                      type="number"
                      value={targetBudget}
                      onChange={(e) => setTargetBudget(e.target.value)}
                      placeholder="e.g. 75000"
                      className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 bg-stone-50 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Printing, Finishing & Food Compliance */}
              <div className="space-y-4 pt-6 border-t border-stone-100">
                <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                  <Printer className="w-4 h-4 text-blue-900" /> 3. Printing, Branding & Quality Standards
                </h2>

                <div className="flex items-center gap-6 text-xs font-semibold text-stone-800">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={printingRequired}
                      onChange={(e) => setPrintingRequired(e.target.checked)}
                      className="w-4 h-4 text-blue-900 rounded focus:ring-0"
                    />
                    <span>Custom Printing Required (Rotogravure / Flexo)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={foodContactGrade}
                      onChange={(e) => setFoodContactGrade(e.target.checked)}
                      className="w-4 h-4 text-blue-900 rounded focus:ring-0"
                    />
                    <span>Food Contact Grade Required (FDA / BRCGS)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSampleRequested}
                      onChange={(e) => setIsSampleRequested(e.target.checked)}
                      className="w-4 h-4 text-blue-900 rounded focus:ring-0"
                    />
                    <span>Request Physical Sample Before Mass Run</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Printing & Colour Specifications</label>
                    <input
                      type="text"
                      value={printingDetails}
                      onChange={(e) => setPrintingDetails(e.target.value)}
                      placeholder="e.g. 4-colour CMYK front, single colour back, Pantone matching..."
                      className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 bg-stone-50 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Finishing & Feature Requirements</label>
                    <input
                      type="text"
                      value={customFinishing}
                      onChange={(e) => setCustomFinishing(e.target.value)}
                      placeholder="e.g. Matte finish, tear notch, aroma degassing valve, zipper..."
                      className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 bg-stone-50 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Delivery Destination & Contact Details */}
              <div className="space-y-4 pt-6 border-t border-stone-100">
                <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-900" /> 4. Delivery Destination & Sourcing Contact
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Delivery City</label>
                    <input
                      type="text"
                      required
                      value={deliveryCity}
                      onChange={(e) => setDeliveryCity(e.target.value)}
                      placeholder="e.g. Bengaluru"
                      className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 bg-stone-50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Delivery State</label>
                    <input
                      type="text"
                      required
                      value={deliveryState}
                      onChange={(e) => setDeliveryState(e.target.value)}
                      placeholder="e.g. Karnataka"
                      className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 bg-stone-50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Pincode</label>
                    <input
                      type="text"
                      value={deliveryPincode}
                      onChange={(e) => setDeliveryPincode(e.target.value)}
                      placeholder="e.g. 560001"
                      className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 bg-stone-50 focus:outline-none"
                    />
                  </div>
                </div>

                {!user && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Your Full Name</label>
                      <input
                        type="text"
                        required
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 bg-stone-50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Work Email</label>
                      <input
                        type="email"
                        required
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        placeholder="procurement@company.com"
                        className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 bg-stone-50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        required
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 bg-stone-50 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Additional Instructions or Die-line Notes</label>
                  <textarea
                    rows={3}
                    value={additionalInstructions}
                    onChange={(e) => setAdditionalInstructions(e.target.value)}
                    placeholder="Provide any critical technical tolerances, artwork links, sealing conditions or storage requirements..."
                    className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 bg-stone-50 focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-900 hover:bg-blue-800 text-white font-bold px-8 py-3 rounded-xl text-xs sm:text-sm shadow-md transition disabled:opacity-50 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? "Dispatching Requirement..." : "Submit Requirement & Invite Quotes"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomRequirementRfqPage;
