"use client";

import { useState, useEffect, useId, FormEvent } from "react";
import { X, Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SampleProduct } from "@/data/products";
import { WHATSAPP_NUMBER, CONTACT_EMAIL } from "@/data/contact";

interface RequestQuoteModalProps {
  product: SampleProduct | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RequestQuoteModal({
  product,
  isOpen,
  onClose,
}: RequestQuoteModalProps) {
  const formId = useId();

  const [quantity, setQuantity] = useState<number>(product?.moq || 100);
  const [deliveryCity, setDeliveryCity] = useState("Raipur");
  const [deliveryState, setDeliveryState] = useState("Chhattisgarh");
  const [requiredBy, setRequiredBy] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (product) {
      setQuantity(product.moq);
    }
  }, [product]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!quantity || quantity <= 0) {
      errs.quantity = `Enter a valid quantity (MOQ is ${product.moq} ${product.unit})`;
    }
    if (!deliveryCity.trim()) errs.deliveryCity = "Delivery city is required";
    if (!deliveryState.trim()) errs.deliveryState = "Delivery state is required";
    if (!requiredBy.trim()) errs.requiredBy = "Required-by date is required";
    if (!buyerName.trim()) errs.buyerName = "Your name is required";
    if (!contactInfo.trim()) {
      errs.contactInfo = "Phone number or email is required";
    }
    return errs;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});

    const messageLines = [
      "Hello Coverly team,",
      "",
      "Sample Quotation Request:",
      `Product: ${product.name} (ID: ${product.id})`,
      `Supplier: ${product.supplierName}`,
      `Quantity: ${quantity} ${product.unit}s (MOQ: ${product.moq})`,
      `Estimated Price: ${product.priceRange}`,
      `Delivery Destination: ${deliveryCity}, ${deliveryState}`,
      `Required By Date: ${requiredBy}`,
      `Buyer Name: ${buyerName}`,
      `Contact Info: ${contactInfo}`,
    ];

    if (notes.trim()) {
      messageLines.push(`Notes: ${notes.trim()}`);
    }

    const fullMessage = messageLines.join("\n");

    if (WHATSAPP_NUMBER) {
      window.open(
        `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(fullMessage)}`,
        "_blank"
      );
    } else if (CONTACT_EMAIL) {
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
        `Quotation Request - ${product.name}`
      )}&body=${encodeURIComponent(fullMessage)}`;
    } else {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(fullMessage)}`,
        "_blank"
      );
    }

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/50 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quote-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-surface p-6 sm:p-8 shadow-card border border-[rgba(45,50,80,0.1)] relative my-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-ink-secondary hover:text-ink hover:bg-surface-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral"
          aria-label="Close quote modal"
        >
          <X size={18} />
        </button>

        <div className="mb-5 pr-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-coral/10 text-coral text-xs font-semibold mb-2">
            Sample RFQ
          </div>
          <h2
            id="quote-modal-title"
            className="text-xl sm:text-2xl font-heading font-bold text-ink"
          >
            Request Quotation
          </h2>
          <p className="text-xs text-ink-secondary mt-1">
            Prefills a WhatsApp inquiry message with your specifications.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Prefilled Product & Supplier Info */}
          <div className="p-3.5 rounded-xl bg-surface-muted border border-[rgba(45,50,80,0.06)] space-y-1">
            <div className="text-xs font-heading font-semibold text-ink">
              {product.name}
            </div>
            <div className="text-[11px] text-ink-secondary">
              Supplier: {product.supplierName} ({product.city}, {product.state})
            </div>
            <div className="text-[11px] font-mono text-ink-secondary">
              Listed at {product.priceRange} · Minimum Order: {product.moq} {product.unit}
            </div>
          </div>

          {/* Quantity & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label
                htmlFor={`${formId}-qty`}
                className="block text-xs font-heading font-semibold text-ink"
              >
                Order Quantity *
              </label>
              <input
                id={`${formId}-qty`}
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                className={`w-full h-10 px-3 rounded-lg bg-surface-muted border text-sm text-ink font-mono focus:outline-none focus:ring-1 ${
                  errors.quantity
                    ? "border-coral focus:border-coral focus:ring-coral"
                    : "border-[rgba(45,50,80,0.1)] focus:border-navy focus:ring-navy"
                }`}
              />
              {errors.quantity && (
                <p className="text-[11px] text-coral font-medium">
                  {errors.quantity}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label
                htmlFor={`${formId}-unit`}
                className="block text-xs font-heading font-semibold text-ink"
              >
                Unit
              </label>
              <input
                id={`${formId}-unit`}
                type="text"
                readOnly
                value={product.unit}
                className="w-full h-10 px-3 rounded-lg bg-surface-muted/60 border border-[rgba(45,50,80,0.1)] text-sm text-ink-secondary cursor-not-allowed"
              />
            </div>
          </div>

          {/* Delivery Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label
                htmlFor={`${formId}-city`}
                className="block text-xs font-heading font-semibold text-ink"
              >
                Delivery City *
              </label>
              <input
                id={`${formId}-city`}
                type="text"
                value={deliveryCity}
                onChange={(e) => setDeliveryCity(e.target.value)}
                placeholder="e.g. Raipur"
                className={`w-full h-10 px-3 rounded-lg bg-surface-muted border text-sm text-ink focus:outline-none focus:ring-1 ${
                  errors.deliveryCity
                    ? "border-coral focus:border-coral focus:ring-coral"
                    : "border-[rgba(45,50,80,0.1)] focus:border-navy focus:ring-navy"
                }`}
              />
              {errors.deliveryCity && (
                <p className="text-[11px] text-coral font-medium">
                  {errors.deliveryCity}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label
                htmlFor={`${formId}-state`}
                className="block text-xs font-heading font-semibold text-ink"
              >
                Delivery State *
              </label>
              <input
                id={`${formId}-state`}
                type="text"
                value={deliveryState}
                onChange={(e) => setDeliveryState(e.target.value)}
                placeholder="e.g. Chhattisgarh"
                className={`w-full h-10 px-3 rounded-lg bg-surface-muted border text-sm text-ink focus:outline-none focus:ring-1 ${
                  errors.deliveryState
                    ? "border-coral focus:border-coral focus:ring-coral"
                    : "border-[rgba(45,50,80,0.1)] focus:border-navy focus:ring-navy"
                }`}
              />
              {errors.deliveryState && (
                <p className="text-[11px] text-coral font-medium">
                  {errors.deliveryState}
                </p>
              )}
            </div>
          </div>

          {/* Required-by Date */}
          <div className="space-y-1">
            <label
              htmlFor={`${formId}-date`}
              className="block text-xs font-heading font-semibold text-ink"
            >
              Required By Date *
            </label>
            <input
              id={`${formId}-date`}
              type="date"
              value={requiredBy}
              onChange={(e) => setRequiredBy(e.target.value)}
              className={`w-full h-10 px-3 rounded-lg bg-surface-muted border text-sm text-ink focus:outline-none focus:ring-1 ${
                errors.requiredBy
                  ? "border-coral focus:border-coral focus:ring-coral"
                  : "border-[rgba(45,50,80,0.1)] focus:border-navy focus:ring-navy"
              }`}
            />
            {errors.requiredBy && (
              <p className="text-[11px] text-coral font-medium">
                {errors.requiredBy}
              </p>
            )}
          </div>

          {/* Buyer Name & Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label
                htmlFor={`${formId}-name`}
                className="block text-xs font-heading font-semibold text-ink"
              >
                Your Name *
              </label>
              <input
                id={`${formId}-name`}
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="e.g. Ramesh Patel"
                className={`w-full h-10 px-3 rounded-lg bg-surface-muted border text-sm text-ink focus:outline-none focus:ring-1 ${
                  errors.buyerName
                    ? "border-coral focus:border-coral focus:ring-coral"
                    : "border-[rgba(45,50,80,0.1)] focus:border-navy focus:ring-navy"
                }`}
              />
              {errors.buyerName && (
                <p className="text-[11px] text-coral font-medium">
                  {errors.buyerName}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label
                htmlFor={`${formId}-contact`}
                className="block text-xs font-heading font-semibold text-ink"
              >
                Phone or Email *
              </label>
              <input
                id={`${formId}-contact`}
                type="text"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="e.g. 98260 12345"
                className={`w-full h-10 px-3 rounded-lg bg-surface-muted border text-sm text-ink focus:outline-none focus:ring-1 ${
                  errors.contactInfo
                    ? "border-coral focus:border-coral focus:ring-coral"
                    : "border-[rgba(45,50,80,0.1)] focus:border-navy focus:ring-navy"
                }`}
              />
              {errors.contactInfo && (
                <p className="text-[11px] text-coral font-medium">
                  {errors.contactInfo}
                </p>
              )}
            </div>
          </div>

          {/* Additional Notes */}
          <div className="space-y-1">
            <label
              htmlFor={`${formId}-notes`}
              className="block text-xs font-heading font-semibold text-ink"
            >
              Additional Notes (Optional)
            </label>
            <textarea
              id={`${formId}-notes`}
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Need GST invoice, specific grade or custom dimensions."
              className="w-full p-2.5 rounded-lg bg-surface-muted border border-[rgba(45,50,80,0.1)] text-sm text-ink focus:outline-none focus:ring-1 focus:ring-navy"
            />
          </div>

          {/* Submit */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Button type="submit" variant="whatsapp" size="md" className="flex-1">
              <MessageCircle size={16} />
              Open WhatsApp Prefilled
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={onClose}
              className="sm:w-auto"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
