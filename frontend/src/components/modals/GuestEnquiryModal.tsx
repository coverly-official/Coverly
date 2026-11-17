import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { X, Send, CheckCircle2, ShieldCheck, Building2, Package, AlertCircle } from "lucide-react";

interface GuestEnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: {
    id?: string;
    title: string;
    indicative_price?: number;
    unit?: string;
    moq?: number;
    business_name?: string;
    category?: string;
  } | null;
  supplier?: {
    id?: string;
    name: string;
    city?: string;
  } | null;
  defaultCategory?: string;
}

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const GuestEnquiryModal: React.FC<GuestEnquiryModalProps> = ({
  isOpen,
  onClose,
  product,
  supplier,
  defaultCategory,
}) => {
  const { user } = useAuth();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [requirement, setRequirement] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Pre-fill fields when modal opens or user/product changes
  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      setErrorMessage("");

      if (user) {
        setFullName(user.full_name || "");
        setEmail(user.email || "");
        setPhone(user.phone || "");
      }

      if (product) {
        setQuantity(product.moq ? String(product.moq) : "100");
        setRequirement(
          `Hello, I am interested in sourcing "${product.title}" in bulk. Please share your best commercial quotation including freight and delivery timeline.`
        );
      } else if (supplier) {
        setRequirement(
          `Hello, I would like to enquire about your wholesale manufacturing capabilities and catalog from ${supplier.name}.`
        );
      } else {
        setRequirement("");
      }
    }
  }, [isOpen, user, product, supplier]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!fullName.trim() || !phone.trim() || !requirement.trim()) {
      setErrorMessage("Please enter your name, mobile number, and requirement details.");
      return;
    }

    const cleanPhone = phone.replace(/[^0-9+]/g, "");
    if (cleanPhone.length < 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: fullName.trim(),
        business: companyName.trim() || "Wholesale Trader / Independent Buyer",
        phone: cleanPhone,
        email: email.trim() || undefined,
        category: product?.category || defaultCategory || "Wholesale Sourcing",
        requirement: requirement.trim(),
        product_title: product?.title,
        product_id: product?.id,
        supplier_business_id: supplier?.id,
        quantity: quantity || undefined,
        unit: product?.unit || "units",
        target_price: targetPrice || undefined,
        city: deliveryCity.trim() || undefined,
      };

      const res = await fetch(`${API_BASE}/concierge-leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsSuccess(true);
      } else {
        setErrorMessage(data.error || "Failed to submit enquiry. Please try again.");
      }
    } catch {
      setErrorMessage("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-stone-900">Enquiry Dispatched Successfully!</h3>
              <p className="text-xs text-stone-600 mt-2 max-w-sm mx-auto leading-relaxed">
                Your requirement has been transmitted to{" "}
                <span className="font-semibold text-stone-900">
                  {product?.business_name || supplier?.name || "verified suppliers"}
                </span>
                . A representative will contact you via Phone/WhatsApp with quotation details.
              </p>
            </div>
            <div className="pt-4">
              <button
                onClick={onClose}
                className="w-full py-2.5 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 text-[11px] font-semibold mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                Direct Supplier Sourcing Enquiry
              </div>
              <h2 className="text-xl font-bold text-stone-900 tracking-tight">
                {product ? "Send Product Sourcing Enquiry" : "Post Procurement Requirement"}
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Receive competitive factory-gate quotations directly from verified Indian manufacturers.
              </p>
            </div>

            {/* Product / Supplier Summary Pill */}
            {(product || supplier) && (
              <div className="mb-5 p-3 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-stone-200 text-stone-700 flex items-center justify-center shrink-0">
                  {product ? <Package className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
                </div>
                <div className="truncate flex-1">
                  <div className="text-xs font-bold text-stone-900 truncate">
                    {product?.title || supplier?.name}
                  </div>
                  <div className="text-[11px] text-stone-500 flex items-center gap-2 mt-0.5">
                    {product?.indicative_price && (
                      <span className="font-semibold text-emerald-700">
                        ₹{product.indicative_price.toLocaleString("en-IN")} / {product.unit || "unit"}
                      </span>
                    )}
                    {product?.business_name && <span>• By {product.business_name}</span>}
                    {supplier?.city && <span>• {supplier.city}</span>}
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                    Your Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Patel"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                    Mobile Number (WhatsApp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="name@business.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                    Company / Firm Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Patel Trading Co"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                    Quantity Needed
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 500"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                    Target Price (₹)
                  </label>
                  <input
                    type="text"
                    placeholder="Optional"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                    Delivery City
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Surat, Pune"
                    value={deliveryCity}
                    onChange={(e) => setDeliveryCity(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Requirement Details & Specifications <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe your requirement, grade, customization, or delivery schedule..."
                  value={requirement}
                  onChange={(e) => setRequirement(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-blue-900 hover:bg-blue-800 disabled:opacity-60 text-white rounded-xl text-xs font-semibold shadow-md flex items-center justify-center gap-2 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSubmitting ? "Transmitting Enquiry..." : "Send Sourcing Enquiry Now"}
                </button>
                <div className="text-center text-[10px] text-stone-500 mt-2 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Free Service • Your contact information is shared only with the relevant supplier
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
