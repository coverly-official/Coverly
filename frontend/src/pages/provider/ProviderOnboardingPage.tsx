import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Building2, Briefcase, ArrowRight } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const ProviderOnboardingPage: React.FC = () => {
  const { user, refreshUser, setActiveRole } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    city: "",
    state: "",
    pincode: "",
    gstin: "",
    pan: "",
    headline: "",
    bio: "",
    experience_years: "5",
    website_url: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate(`/auth/login?redirect=/provider/onboarding`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch(`${API_BASE}/business-services/providers/onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          name: formData.name.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: formData.pincode.trim(),
          gstin: formData.gstin.trim() || undefined,
          pan: formData.pan.trim() || undefined,
          headline: formData.headline.trim() || undefined,
          bio: formData.bio.trim() || undefined,
          experience_years: Number.parseInt(formData.experience_years, 10) || 0,
          website_url: formData.website_url.trim() || undefined,
        }),
      });

      const body = await res.json();
      if (!res.ok || !body.success) {
        throw new Error(body.error || "Failed to register provider practice.");
      }

      await refreshUser();
      setActiveRole("service_provider");
      navigate("/provider/dashboard");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to onboard as provider.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Service Provider Registration</h1>
        <p className="text-xs text-stone-500 mt-1">
          Set up your professional firm on COVERLY to connect with corporate buyers & manufacturing plants
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">Firm / Agency Legal Name</label>
          <input
            type="text"
            required
            placeholder="e.g. Apex Corporate Advisors LLP"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full text-xs p-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-800"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">City</label>
            <input
              type="text"
              required
              placeholder="e.g. Mumbai"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full text-xs p-2.5 border border-stone-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">State</label>
            <input
              type="text"
              required
              placeholder="e.g. Maharashtra"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="w-full text-xs p-2.5 border border-stone-200 rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">Pincode</label>
          <input
            type="text"
            required
            placeholder="e.g. 400001"
            value={formData.pincode}
            onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
            className="w-full text-xs p-2.5 border border-stone-200 rounded-lg"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">GSTIN (Optional)</label>
            <input
              type="text"
              placeholder="27AABCU9603R1ZM"
              value={formData.gstin}
              onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
              className="w-full text-xs p-2.5 border border-stone-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Years in Practice</label>
            <input
              type="number"
              min="0"
              value={formData.experience_years}
              onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
              className="w-full text-xs p-2.5 border border-stone-200 rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">Practice Headline</label>
          <input
            type="text"
            placeholder="e.g. Specialist in Corporate Tax Filings & Startup Entity Registration"
            value={formData.headline}
            onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
            className="w-full text-xs p-2.5 border border-stone-200 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">Firm Overview & Specializations</label>
          <textarea
            rows={3}
            placeholder="Brief description of your team's background, key client domains, and certifications..."
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            className="w-full text-xs p-2.5 border border-stone-200 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">Website URL (Optional)</label>
          <input
            type="url"
            placeholder="https://apexadvisors.in"
            value={formData.website_url}
            onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
            className="w-full text-xs p-2.5 border border-stone-200 rounded-lg"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs mt-4"
        >
          {isSubmitting ? "Finalizing Practice..." : "Complete Setup & Enter Provider Dashboard"}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
