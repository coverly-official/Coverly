"use client";

import { useState, useId, FormEvent } from "react";
import { FadeUp } from "@/components/ui/FadeUp";
import { Button } from "@/components/ui/Button";
import { categories } from "@/data/categories";
import { PLACEHOLDERS } from "@/data/placeholders";
import {
  MessageCircle,
  Clock,
  Send,
  CheckCircle2,
  ShieldCheck,
  Building,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

export function Footer() {
  const formId = useId();

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    business: "",
    phone: "",
    category: categories[0].id as string,
    requirement: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = "Full name is required";
    if (!formData.business.trim()) errs.business = "Business name is required";
    if (!formData.phone.trim()) {
      errs.phone = "Phone or WhatsApp number is required";
    } else if (!/^[0-9+\s-]{10,14}$/.test(formData.phone.trim())) {
      errs.phone = "Enter a valid 10-digit mobile number";
    }
    if (!formData.requirement.trim()) {
      errs.requirement = "Please describe what you want to source";
    }
    return errs;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    // TODO: Connect this form submission to real API endpoint (e.g., /api/concierge-lead)
    console.log("Coverly Concierge Sourcing Lead Submitted:", formData);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 600);
  };

  return (
    <footer id="contact" className="pt-20 md:pt-28 pb-12 bg-surface border-t border-[rgba(34,37,42,0.06)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Concierge Sourcing Lead Card */}
        <div className="bg-surface-muted rounded-card-lg p-6 sm:p-10 md:p-12 border border-[rgba(34,37,42,0.06)] shadow-card mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left Column: Value Prop & WhatsApp Direct */}
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-pink text-coral text-xs font-heading font-semibold uppercase tracking-wider">
                <Clock size={13} /> 48-Hour Concierge Pilot
              </div>

              <h2 className="text-3xl font-heading font-bold text-ink tracking-tight">
                Book a Sourcing Concierge
              </h2>

              <p className="text-sm text-ink-secondary leading-relaxed">
                Need raw materials or bulk orders right away? Tell us your target
                item, quantity, and destination. Our pilot concierge team contacts
                verified producers across the state to collect landed quotes for
                you within 48 hours.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-sm text-ink">
                  <div className="w-8 h-8 rounded-xl bg-surface flex items-center justify-center text-verified shadow-sm">
                    <CheckCircle2 size={16} />
                  </div>
                  <span>Free manual quote compilation during pilot phase</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-ink">
                  <div className="w-8 h-8 rounded-xl bg-surface flex items-center justify-center text-coral shadow-sm">
                    <ShieldCheck size={16} />
                  </div>
                  <span>Direct phone verification of suppliers</span>
                </div>
              </div>

              {/* Instant WhatsApp Action */}
              <div className="pt-4 border-t border-[rgba(34,37,42,0.06)]">
                <div className="text-xs font-semibold text-ink-secondary mb-3">
                  Prefer direct messaging?
                </div>
                <a
                  href="https://wa.me/919999999999?text=Hi%20Coverly%20team,%20I%20need%20a%20wholesale%20quote"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block w-full sm:w-auto"
                >
                  <Button variant="whatsapp" size="md" className="w-full sm:w-auto">
                    <MessageCircle size={16} />
                    Chat on WhatsApp Directly
                  </Button>
                </a>
              </div>
            </div>

            {/* Right Column: Lead Form */}
            <div className="lg:col-span-7 bg-surface rounded-card p-6 sm:p-8 border border-[rgba(34,37,42,0.06)] shadow-soft">
              {isSubmitted ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-verified/10 text-verified mx-auto flex items-center justify-center">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-xl font-heading font-bold text-ink">
                    Request Received!
                  </h3>
                  <p className="text-sm text-ink-secondary max-w-md mx-auto leading-relaxed">
                    Thank you, {formData.name}. Our sourcing concierge has logged
                    your requirement for {formData.business}. We will reach out on
                    WhatsApp within {PLACEHOLDERS.responseTime} with matched supplier
                    options.
                  </p>
                  <div className="pt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsSubmitted(false);
                        setFormData({
                          name: "",
                          business: "",
                          phone: "",
                          category: categories[0].id,
                          requirement: "",
                        });
                      }}
                    >
                      Submit Another Requirement
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor={`${formId}-name`}
                        className="block text-xs font-heading font-semibold text-ink"
                      >
                        Your Name *
                      </label>
                      <input
                        id={`${formId}-name`}
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="e.g. Ramesh Patel"
                        className={`w-full h-11 px-3.5 rounded-xl bg-surface-muted border text-sm text-ink transition-colors focus:ring-1 ${
                          errors.name
                            ? "border-coral focus:border-coral focus:ring-coral"
                            : "border-[rgba(34,37,42,0.1)] focus:border-navy focus:ring-navy"
                        }`}
                      />
                      {errors.name && (
                        <p className="text-[11px] text-coral font-medium">
                          {errors.name}
                        </p>
                      )}
                    </div>

                    {/* Business Name */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor={`${formId}-business`}
                        className="block text-xs font-heading font-semibold text-ink"
                      >
                        Business / Store Name *
                      </label>
                      <input
                        id={`${formId}-business`}
                        type="text"
                        value={formData.business}
                        onChange={(e) =>
                          setFormData({ ...formData, business: e.target.value })
                        }
                        placeholder="e.g. Patel Garment Mart"
                        className={`w-full h-11 px-3.5 rounded-xl bg-surface-muted border text-sm text-ink transition-colors focus:ring-1 ${
                          errors.business
                            ? "border-coral focus:border-coral focus:ring-coral"
                            : "border-[rgba(34,37,42,0.1)] focus:border-navy focus:ring-navy"
                        }`}
                      />
                      {errors.business && (
                        <p className="text-[11px] text-coral font-medium">
                          {errors.business}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Phone / WhatsApp */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor={`${formId}-phone`}
                        className="block text-xs font-heading font-semibold text-ink"
                      >
                        WhatsApp / Mobile Number *
                      </label>
                      <input
                        id={`${formId}-phone`}
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        placeholder="e.g. 98260 12345"
                        className={`w-full h-11 px-3.5 rounded-xl bg-surface-muted border text-sm text-ink font-mono transition-colors focus:ring-1 ${
                          errors.phone
                            ? "border-coral focus:border-coral focus:ring-coral"
                            : "border-[rgba(34,37,42,0.1)] focus:border-navy focus:ring-navy"
                        }`}
                      />
                      {errors.phone && (
                        <p className="text-[11px] text-coral font-medium">
                          {errors.phone}
                        </p>
                      )}
                    </div>

                    {/* Category Selection */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor={`${formId}-category`}
                        className="block text-xs font-heading font-semibold text-ink"
                      >
                        Primary Category *
                      </label>
                      <select
                        id={`${formId}-category`}
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({ ...formData, category: e.target.value })
                        }
                        className="w-full h-11 px-3.5 rounded-xl bg-surface-muted border border-[rgba(34,37,42,0.1)] text-sm text-ink focus:border-navy focus:ring-1 focus:ring-navy transition-colors"
                      >
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Sourcing Requirement */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor={`${formId}-req`}
                      className="block text-xs font-heading font-semibold text-ink"
                    >
                      Brief Sourcing Requirement & Estimated Quantity *
                    </label>
                    <textarea
                      id={`${formId}-req`}
                      rows={3}
                      value={formData.requirement}
                      onChange={(e) =>
                        setFormData({ ...formData, requirement: e.target.value })
                      }
                      placeholder="e.g. Need 1,000 units of 180 GSM cotton tees delivered to Raipur by next week."
                      className={`w-full p-3 rounded-xl bg-surface-muted border text-sm text-ink transition-colors focus:ring-1 ${
                        errors.requirement
                          ? "border-coral focus:border-coral focus:ring-coral"
                          : "border-[rgba(34,37,42,0.1)] focus:border-navy focus:ring-navy"
                      }`}
                    />
                    {errors.requirement && (
                      <p className="text-[11px] text-coral font-medium">
                        {errors.requirement}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      disabled={isSubmitting}
                      className="w-full"
                    >
                      {isSubmitting ? "Submitting..." : "Submit for 48h Concierge Match"}
                      <Send size={15} />
                    </Button>
                    <p className="text-[11px] text-ink-secondary text-center mt-2.5">
                      No spam. We contact you only with verified quote options.
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Global Footer Navigation & Legal Row */}
        <div className="pt-8 border-t border-[rgba(34,37,42,0.06)] flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand & Mission */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-coral flex items-center justify-center text-white">
              <span className="font-bold text-xs">C</span>
            </div>
            <span className="font-heading font-bold text-ink">Coverly</span>
            <span className="text-xs text-ink-secondary">
              Modern Wholesale Marketplace for Indian MSMEs
            </span>
          </div>

          {/* Nav Links */}
          <div className="flex flex-wrap items-center gap-6 text-xs text-ink-secondary">
            <a href="#how-it-works" className="hover:text-ink transition-colors">
              How it works
            </a>
            <a href="#ai-parser" className="hover:text-ink transition-colors">
              AI Parser
            </a>
            <a href="#live-demo" className="hover:text-ink transition-colors">
              Live Demo
            </a>
            <a href="#trust" className="hover:text-ink transition-colors">
              Trust
            </a>
            <a href="#contact" className="hover:text-ink transition-colors">
              Concierge
            </a>
          </div>

          {/* Legal / Copyright */}
          <div className="text-xs text-ink-secondary">
            (c) 2026 Coverly Technologies. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
