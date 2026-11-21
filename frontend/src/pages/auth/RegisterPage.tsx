import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  ShoppingBag,
  Store,
  Factory,
  Warehouse,
  Truck,
  Package,
  Boxes,
  Globe,
  Navigation,
  Briefcase,
  Handshake,
  Layers,
  Check,
  Lock,
  Mail,
  Phone,
  User as UserIcon,
  MapPin,
  Building2,
} from "lucide-react";

interface RoleOption {
  id: string;
  title: string;
  desc: string;
  icon: React.ElementType;
  requiresBusinessType?: boolean;
}

const roleOptions: RoleOption[] = [
  { id: "buyer", title: "Buyer", desc: "Source products & submit RFQs", icon: ShoppingBag },
  { id: "retailer", title: "Retailer", desc: "Wholesale stock & store replenishment", icon: Store, requiresBusinessType: true },
  { id: "manufacturer", title: "Manufacturer", desc: "Factory & production supply", icon: Factory, requiresBusinessType: true },
  { id: "wholesaler", title: "Wholesaler", desc: "Bulk stock lots & trading", icon: Warehouse, requiresBusinessType: true },
  { id: "distributor", title: "Distributor", desc: "Regional brand distribution", icon: Truck, requiresBusinessType: true },
  { id: "raw_material_supplier", title: "Raw Material Supplier", desc: "Industrial inputs & commodities", icon: Boxes, requiresBusinessType: true },
  { id: "packaging_supplier", title: "Packaging Supplier", desc: "Boxes, pouches & custom packaging", icon: Package, requiresBusinessType: true },
  { id: "importer_exporter", title: "Importer / Exporter", desc: "Cross-border trade & IEC sourcing", icon: Globe, requiresBusinessType: true },
  { id: "logistics_partner", title: "Logistics Partner", desc: "3PL, freight & warehousing", icon: Navigation, requiresBusinessType: true },
  { id: "transporter", title: "Transporter", desc: "Fleet & commercial dispatch", icon: Truck, requiresBusinessType: true },
  { id: "service_provider", title: "Service Provider", desc: "Corporate & business services", icon: Briefcase, requiresBusinessType: true },
  { id: "sales_agent", title: "Sales Agent", desc: "Verified B2B sourcing representative", icon: Handshake },
  { id: "buyer_supplier", title: "Dual Role", desc: "Procure and supply on 1 account", icon: Layers, requiresBusinessType: true },
];

const BUSINESS_TYPES = [
  { value: "individual", label: "Individual / Unregistered Proprietorship" },
  { value: "proprietorship", label: "Sole Proprietorship" },
  { value: "partnership", label: "Partnership Firm" },
  { value: "llp", label: "Limited Liability Partnership (LLP)" },
  { value: "private_limited", label: "Private Limited Company" },
  { value: "public_limited", label: "Public Limited Company" },
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 30 : -30,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.22, ease: "easeOut" },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -30 : 30,
    opacity: 0,
    transition: { duration: 0.18, ease: "easeIn" },
  }),
};

export const RegisterPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get("role") || "buyer";

  const [step, setStep] = useState<1 | 2>(1);
  const [direction, setDirection] = useState<1 | -1>(1);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirm_password: "",
    full_name: "",
    phone: "",
    role: roleOptions.some((r) => r.id === initialRole) ? initialRole : "buyer",
    business_type: "proprietorship",
    country: "India",
    state: "",
    city: "",
    website_url_hp: "",
  });

  // Two separate required legal checkboxes
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  // Separate optional promotional consent (strictly defaults to false, never preselected)
  const [marketingConsent, setMarketingConsent] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const selectedRoleObj = roleOptions.find((r) => r.id === formData.role) || roleOptions[0];
  const SelectedIcon = selectedRoleObj.icon;

  const handleNextStep = () => {
    setErrorMsg("");
    setDirection(1);
    setStep(2);
  };

  const handlePrevStep = () => {
    setErrorMsg("");
    setDirection(-1);
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }
    if (formData.password !== formData.confirm_password) {
      setErrorMsg("Password and Confirm Password do not match.");
      return;
    }
    if (!termsAccepted) {
      setErrorMsg("Please agree to the Terms & Conditions to continue.");
      return;
    }
    if (!privacyAccepted) {
      setErrorMsg("Please confirm you have read the Privacy Policy to continue.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    const res = await register({
      email: formData.email,
      password: formData.password,
      confirm_password: formData.confirm_password,
      full_name: formData.full_name,
      phone: formData.phone,
      role: formData.role,
      account_type: formData.role,
      business_type: selectedRoleObj.requiresBusinessType ? formData.business_type : "individual",
      country: formData.country,
      state: formData.state,
      city: formData.city,
      terms_accepted: true,
      privacy_accepted: true,
      terms_version: "2026-11-18-v1",
      privacy_version: "2026-11-18-v1",
      marketing_consent: marketingConsent,
      website_url_hp: formData.website_url_hp,
    });

    if (!res.success) {
      setErrorMsg(res.error || "Registration failed.");
      setIsSubmitting(false);
      return;
    }

    let targetPath = `/auth/onboarding?role=${formData.role}`;
    if (formData.role === "service_provider") {
      targetPath = "/provider/onboarding";
    } else if (["buyer", "sales_agent"].includes(formData.role)) {
      targetPath = "/account/verification";
    }

    // Mandatory COVERLY verification requirement:
    // Every newly registered account must complete 6-digit email OTP verification before accessing workspaces.
    if (res.requiresOtp || res.user?.email_verified === false) {
      navigate(
        `/auth/verify-email?email=${encodeURIComponent(formData.email)}&role=${encodeURIComponent(
          formData.role
        )}&purpose=email_verification&redirect=${encodeURIComponent(targetPath)}`,
        { replace: true }
      );
      return;
    }

    navigate(targetPath, { replace: true });
  };

  return (
    <div>
      {/* Step Indicator */}
      <div className="mb-5">
        <div className="flex items-center justify-between text-[11px] font-semibold tracking-wider text-stone-500 uppercase mb-2">
          <span className={step === 1 ? "text-stone-900 font-bold" : "text-stone-400"}>
            1. Select Account Role
          </span>
          <span className="text-stone-300">/</span>
          <span className={step === 2 ? "text-stone-900 font-bold" : "text-stone-400"}>
            2. Account &amp; Legal Consent
          </span>
        </div>
        <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-emerald-700 h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: step === 1 ? "50%" : "100%" }}
          />
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
          <div>{errorMsg}</div>
          {errorMsg.toLowerCase().includes("already exists") && (
            <div className="mt-2 pt-2 border-t border-red-200/80 flex items-center gap-3">
              <Link
                to={`/auth/login?email=${encodeURIComponent(formData.email)}`}
                className="font-bold underline text-red-800 hover:text-red-950"
              >
                Sign In to Account &rarr;
              </Link>
              <Link
                to={`/auth/forgot-password?email=${encodeURIComponent(formData.email)}`}
                className="underline text-red-700 hover:text-red-900"
              >
                Forgot Password?
              </Link>
            </div>
          )}
        </div>
      )}

      <div className="overflow-hidden relative">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          {step === 1 ? (
            <motion.div
              key="step1"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="space-y-4"
            >
              <div className="text-center mb-3">
                <h2 className="text-xl font-bold text-stone-900 tracking-tight">Create your COVERLY Account</h2>
                <p className="text-xs text-stone-500 mt-1">
                  Select your role to configure workspace tools and KYC verification requirements
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                {roleOptions.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = formData.role === opt.id;
                  return (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => setFormData({ ...formData, role: opt.id })}
                      className={`p-2.5 rounded-lg border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? "border-stone-900 bg-stone-900 text-white shadow-sm ring-1 ring-stone-900"
                          : "border-stone-200 bg-stone-50 text-stone-800 hover:border-stone-400 hover:bg-stone-100/70"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <Icon className={`w-4 h-4 ${isSelected ? "text-emerald-300" : "text-stone-600"}`} />
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-white text-stone-900 flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold leading-tight">{opt.title}</div>
                        <div
                          className={`text-[10px] mt-0.5 leading-snug line-clamp-2 ${
                            isSelected ? "text-stone-300" : "text-stone-500"
                          }`}
                        >
                          {opt.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleNextStep}
                className="w-full py-2.5 px-4 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 transition flex items-center justify-center gap-2 mt-3 cursor-pointer"
              >
                <span>Continue as {selectedRoleObj.title}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 transition group cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] font-medium transition cursor-pointer"
                >
                  <SelectedIcon className="w-3 h-3 text-emerald-700" />
                  <span className="font-bold">{selectedRoleObj.title}</span>
                  <span className="text-[10px] text-stone-500 underline ml-0.5">Change</span>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Hidden Anti-Bot Honeypot */}
                <input
                  type="text"
                  name="website_url_hp"
                  value={formData.website_url_hp}
                  onChange={(e) => setFormData({ ...formData, website_url_hp: e.target.value })}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="hidden"
                />

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Full Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Rajesh Kumar"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-800"
                    />
                    <UserIcon className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Email Address</label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        placeholder="name@company.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-800"
                      />
                      <Mail className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Mobile Number</label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        placeholder="9876543210"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-800"
                      />
                      <Phone className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                    </div>
                  </div>
                </div>

                {selectedRoleObj.requiresBusinessType && (
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Business Type</label>
                    <div className="relative">
                      <select
                        value={formData.business_type}
                        onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                        className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-stone-200 bg-white focus:outline-none focus:ring-1 focus:ring-stone-800"
                      >
                        {BUSINESS_TYPES.map((bt) => (
                          <option key={bt.value} value={bt.value}>
                            {bt.label}
                          </option>
                        ))}
                      </select>
                      <Building2 className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">Country</label>
                    <input
                      type="text"
                      required
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full text-xs px-2.5 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">State</label>
                    <input
                      type="text"
                      placeholder="Maharashtra"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full text-xs px-2.5 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">City</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Mumbai"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full text-xs pl-7 pr-2 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-800"
                      />
                      <MapPin className="w-3 h-3 text-stone-400 absolute left-2.5 top-2.5" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Password</label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        minLength={8}
                        placeholder="Min 8 characters"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-800"
                      />
                      <Lock className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Confirm Password</label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        minLength={8}
                        placeholder="Re-enter password"
                        value={formData.confirm_password}
                        onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                        className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-800"
                      />
                      <Lock className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                    </div>
                  </div>
                </div>

                {/* Separate Required Legal Checkboxes + Separate Unchecked Optional Promotional Consent */}
                <div className="space-y-2 pt-1.5 border-t border-stone-100">
                  <label className="flex items-start gap-2 text-[11px] text-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-0.5 h-3.5 w-3.5 rounded border-stone-300 text-emerald-700 focus:ring-emerald-600"
                    />
                    <span className="leading-snug">
                      I agree to the{" "}
                      <Link
                        to="/terms-and-conditions"
                        target="_blank"
                        className="font-semibold text-emerald-800 underline"
                      >
                        Terms &amp; Conditions
                      </Link>
                      . <span className="text-red-600">*</span>
                    </span>
                  </label>

                  <label className="flex items-start gap-2 text-[11px] text-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={privacyAccepted}
                      onChange={(e) => setPrivacyAccepted(e.target.checked)}
                      className="mt-0.5 h-3.5 w-3.5 rounded border-stone-300 text-emerald-700 focus:ring-emerald-600"
                    />
                    <span className="leading-snug">
                      I have read the{" "}
                      <Link
                        to="/privacy-policy"
                        target="_blank"
                        className="font-semibold text-emerald-800 underline"
                      >
                        Privacy Policy
                      </Link>{" "}
                      and{" "}
                      <Link
                        to="/kyc-privacy-notice"
                        target="_blank"
                        className="font-semibold text-emerald-800 underline"
                      >
                        KYC Privacy Notice
                      </Link>
                      . <span className="text-red-600">*</span>
                    </span>
                  </label>

                  <label className="flex items-start gap-2 text-[11px] text-stone-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={marketingConsent}
                      onChange={(e) => setMarketingConsent(e.target.checked)}
                      className="mt-0.5 h-3.5 w-3.5 rounded border-stone-300 text-emerald-700 focus:ring-emerald-600"
                    />
                    <span className="leading-snug">
                      (Optional) Send me promotional B2B sourcing updates and platform announcements. You may withdraw consent anytime.
                    </span>
                  </label>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="py-2.5 px-3 border border-stone-200 hover:border-stone-300 text-stone-700 rounded-lg text-xs font-semibold hover:bg-stone-50 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 px-4 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? "Creating Account..." : "Create Account & Continue"}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-5 pt-4 border-t border-stone-100 text-center text-xs text-stone-500">
        Already registered?{" "}
        <Link to="/auth/login" className="font-semibold text-stone-900 hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
};
