"use client";

import { useEffect, useRef } from "react";
import { X, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { WHATSAPP_NUMBER, WHATSAPP_MESSAGE, CONTACT_EMAIL } from "@/data/contact";

interface AccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export function AccountDialog({
  isOpen,
  onClose,
  title = "Accounts are coming soon",
  description = "User accounts and authentication are in development. For inquiries or supplier onboarding, contact us directly.",
}: AccountDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

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

  if (!isOpen) return null;

  const whatsappHref = WHATSAPP_NUMBER
    ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`
    : CONTACT_EMAIL
    ? `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(WHATSAPP_MESSAGE)}`
    : `https://wa.me/?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-dialog-title"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md rounded-2xl bg-surface p-6 sm:p-7 shadow-card border border-[rgba(45,50,80,0.1)] relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-ink-secondary hover:text-ink hover:bg-surface-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral"
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        <h3
          id="account-dialog-title"
          className="text-xl font-heading font-bold text-ink mb-2 pr-6"
        >
          {title}
        </h3>

        <p className="text-sm text-ink-secondary leading-relaxed mb-6">
          {description}
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <Button variant="whatsapp" size="md" className="w-full">
              <MessageCircle size={16} />
              Contact on WhatsApp
            </Button>
          </a>
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onClose}
            className="flex-none"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
