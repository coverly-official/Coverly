import React, { useState } from "react";
import { submitConciergeLead } from "@/lib/api";
import { Mail, Phone, MapPin, Send, CheckCircle2 } from "lucide-react";

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    business: "",
    phone: "",
    category: "cotton-tshirts",
    requirement: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      await submitConciergeLead(formData);
      setSubmitted(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-12 text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">Contact & Sourcing Support</h1>
        <p className="mt-2 text-sm text-stone-600">
          Have a bulk procurement requirement or need platform assistance? Speak directly with our verified sourcing team.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Contact Info */}
        <div className="space-y-6">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
            <h3 className="font-bold text-base text-stone-900 mb-4">Dedicated Sourcing Desk</h3>
            <div className="space-y-4 text-xs sm:text-sm text-stone-600">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-stone-700" />
                <span>+91 80 4719 2200 (Mon–Sat, 9am–7pm IST)</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-stone-700" />
                <span>sourcing@coverly.in</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-stone-700 mt-0.5 shrink-0" />
                <span>Sector 62, Electronic City, Noida, Uttar Pradesh 201309</span>
              </div>
            </div>
          </div>

          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6">
            <h4 className="font-semibold text-xs uppercase tracking-wider text-stone-700 mb-2">
              Sourcing Guarantee
            </h4>
            <p className="text-xs text-stone-500 leading-relaxed">
              Every inquiry is reviewed by an industrial sourcing category specialist. Responses and quotation requests are matched within 4 business hours.
            </p>
          </div>
        </div>

        {/* Lead Form */}
        <div className="bg-white border border-stone-200 rounded-2xl p-8 shadow-xs">
          {submitted ? (
            <div className="text-center py-10">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-stone-900 mb-2">Request Received</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Thank you! Our sourcing concierge has assigned your requirement and will contact you via WhatsApp / phone shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="text-base font-bold text-stone-900 mb-2">Post Sourcing Requirement</h3>

              {errorMsg && (
                <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Kumar"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-xs rounded-lg border border-stone-200 p-2.5 focus:ring-1 focus:ring-stone-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Business Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Retail Private Limited"
                  value={formData.business}
                  onChange={(e) => setFormData({ ...formData, business: e.target.value })}
                  className="w-full text-xs rounded-lg border border-stone-200 p-2.5 focus:ring-1 focus:ring-stone-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Phone Number (10 digits)</label>
                <input
                  type="tel"
                  required
                  placeholder="9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full text-xs rounded-lg border border-stone-200 p-2.5 focus:ring-1 focus:ring-stone-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Target Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full text-xs rounded-lg border border-stone-200 p-2.5 bg-white focus:ring-1 focus:ring-stone-800"
                >
                  <option value="cotton-tshirts">Cotton T-Shirts (Round Neck)</option>
                  <option value="corrugated-boxes">Corrugated Boxes (5-ply)</option>
                  <option value="mild-steel-rods">Mild Steel Rods (12mm TMT)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Requirement Details</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide target volume, destination city, and any custom specifications..."
                  value={formData.requirement}
                  onChange={(e) => setFormData({ ...formData, requirement: e.target.value })}
                  className="w-full text-xs rounded-lg border border-stone-200 p-2.5 focus:ring-1 focus:ring-stone-800"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? "Submitting..." : "Submit to Sourcing Concierge"}
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
