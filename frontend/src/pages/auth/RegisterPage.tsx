import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  ShoppingBag,
  Factory,
  Warehouse,
  Truck,
  Briefcase,
  Layers,
  Check,
  Lock,
  Mail,
  Phone,
  User as UserIcon,
} from "lucide-react";

interface RoleOption {
  id: string;
  title: string;
  desc: string;
  icon: React.ElementType;
}

const roleOptions: RoleOption[] = [
  { id: "buyer", title: "Buyer", desc: "Source products & submit RFQs", icon: ShoppingBag },
  { id: "manufacturer", title: "Manufacturer", desc: "Factory & production line", icon: Factory },
  { id: "wholesaler", title: "Wholesaler", desc: "Bulk stock lots & trading", icon: Warehouse },
  { id: "distributor", title: "Distributor", desc: "Regional brand distribution", icon: Truck },
  { id: "service_provider", title: "Service Provider", desc: "Offer corporate & business services", icon: Briefcase },
  { id: "buyer_supplier", title: "Dual Role", desc: "Procure and supply on 1 account", icon: Layers },
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
    full_name: "",
    phone: "",
    role: initialRole,
  });
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
    setIsSubmitting(true);
    setErrorMsg("");

    const res = await register(formData);
    if (!res.success) {
      setErrorMsg(res.error || "Registration failed.");
      setIsSubmitting(false);
      return;
    }

    // Direct to onboarding for business setup
    if (formData.role === "service_provider") {
      navigate("/provider/onboarding");
    } else {
      navigate(`/auth/onboarding?role=${formData.role}`);
    }
  };

  return (
    <div>
      {/* Step Indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-[11px] font-semibold tracking-wider text-stone-500 uppercase mb-2">
          <span className={step === 1 ? "text-stone-900 font-bold" : "text-stone-400"}>
            1. Select Role
          </span>
          <span className="text-stone-300">/</span>
          <span className={step === 2 ? "text-stone-900 font-bold" : "text-stone-400"}>
            2. Account Details
          </span>
        </div>
        <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-stone-900 h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: step === 1 ? "50%" : "100%" }}
          />
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
          {errorMsg}
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
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold text-stone-900 tracking-tight">Create your COVERLY Account</h2>
                <p className="text-xs text-stone-500 mt-1">Select your primary role to configure your workspace</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-2">
                  Select Primary Business Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {roleOptions.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = formData.role === opt.id;
                    return (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() => setFormData({ ...formData, role: opt.id })}
                        className={`p-3 rounded-lg border text-left transition-all relative flex flex-col justify-between ${
                          isSelected
                            ? "border-stone-900 bg-stone-900 text-white shadow-sm ring-1 ring-stone-900"
                            : "border-stone-200 bg-stone-50 text-stone-800 hover:border-stone-400 hover:bg-stone-100/70"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <Icon className={`w-4 h-4 ${isSelected ? "text-white" : "text-stone-600"}`} />
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
              </div>

              <button
                type="button"
                onClick={handleNextStep}
                className="w-full py-2.5 px-4 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 transition flex items-center justify-center gap-2 mt-4 cursor-pointer"
              >
                <span>Continue with {selectedRoleObj.title}</span>
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
              {/* Back Option Navigation Bar & Role Badge */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 transition group cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                  <span>Back to Role Selection</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] font-medium transition cursor-pointer"
                  title="Click to change role"
                >
                  <SelectedIcon className="w-3 h-3 text-stone-700" />
                  <span className="font-bold">{selectedRoleObj.title}</span>
                  <span className="text-[10px] text-stone-500 underline ml-0.5">Change</span>
                </button>
              </div>

              <div className="mb-4">
                <h2 className="text-xl font-bold text-stone-900 tracking-tight">Enter Account Details</h2>
                <p className="text-xs text-stone-500 mt-1">
                  Complete your profile to access your {selectedRoleObj.title.toLowerCase()} workspace
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
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

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="rajesh@enterprises.com"
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

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      minLength={8}
                      placeholder="Minimum 8 characters"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-800"
                    />
                    <Lock className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                  </div>
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
                    {isSubmitting ? "Creating Account..." : "Continue to Business Setup"}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-6 pt-4 border-t border-stone-100 text-center text-xs text-stone-500">
        Already registered?{" "}
        <Link to="/auth/login" className="font-semibold text-stone-900 hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
};
