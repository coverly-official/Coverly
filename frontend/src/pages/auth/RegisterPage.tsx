import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight, Building, User, Layers, ShoppingBag } from "lucide-react";

export const RegisterPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get("role") || "buyer";

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
    navigate(`/auth/onboarding?role=${formData.role}`);
  };

  const roleOptions = [
    { id: "buyer", title: "Buyer", desc: "Source products & submit RFQs" },
    { id: "manufacturer", title: "Manufacturer", desc: "Factory & production line" },
    { id: "wholesaler", title: "Wholesaler", desc: "Bulk stock lots & trading" },
    { id: "distributor", title: "Distributor", desc: "Regional brand distribution" },
    { id: "buyer_supplier", title: "Dual Role", desc: "Procure and supply on 1 account" },
  ];

  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold text-stone-900 tracking-tight">Create your COVERLY Account</h2>
        <p className="text-xs text-stone-500 mt-1">Select your primary role to configure your workspace</p>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Role Selector Cards */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">Select Primary Business Role</label>
          <div className="grid grid-cols-2 gap-2 mb-2">
            {roleOptions.map((opt) => (
              <button
                type="button"
                key={opt.id}
                onClick={() => setFormData({ ...formData, role: opt.id })}
                className={`p-2.5 rounded-lg border text-left transition ${
                  formData.role === opt.id
                    ? "border-stone-900 bg-stone-900 text-white shadow-xs"
                    : "border-stone-200 bg-stone-50 text-stone-800 hover:border-stone-400"
                }`}
              >
                <div className="text-xs font-bold leading-tight">{opt.title}</div>
                <div className={`text-[10px] mt-0.5 leading-snug line-clamp-1 ${formData.role === opt.id ? "text-stone-300" : "text-stone-500"}`}>
                  {opt.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">Full Name</label>
          <input
            type="text"
            required
            placeholder="Rajesh Kumar"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            className="w-full text-xs px-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-800"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">Email Address</label>
          <input
            type="email"
            required
            placeholder="rajesh@enterprises.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full text-xs px-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-800"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">Mobile Number</label>
          <input
            type="tel"
            required
            placeholder="9876543210"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full text-xs px-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-800"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">Password</label>
          <input
            type="password"
            required
            placeholder="Minimum 8 characters"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full text-xs px-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-800"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 px-4 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 transition disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
        >
          {isSubmitting ? "Creating Account..." : "Continue to Business Setup"}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-stone-100 text-center text-xs text-stone-500">
        Already registered?{" "}
        <Link to="/auth/login" className="font-semibold text-stone-900 hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
};
