"use client";

import { useEffect } from "react";
import Link from "next/link";
import { X, MessageCircle } from "lucide-react";
import { WHATSAPP_NUMBER, WHATSAPP_MESSAGE, CONTACT_EMAIL } from "@/data/contact";
import { useAuth } from "@/lib/session";

interface AccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export function AccountDialog({
  isOpen,
  onClose,
  title,
  description,
}: AccountDialogProps) {
  const { status, user } = useAuth();
  const signedIn = status === "signed-in" && Boolean(user);

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

  const whatsappNumber: string = WHATSAPP_NUMBER;
  const contactEmail: string = CONTACT_EMAIL;
  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`
    : contactEmail
    ? `mailto:${contactEmail}?subject=${encodeURIComponent(WHATSAPP_MESSAGE)}`
    : `https://wa.me/?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  const heading =
    title ?? (signedIn ? "Coming soon" : "Create an account to continue");
  const body =
    description ??
    (signedIn
      ? "This feature is still in development. For anything urgent, contact the Coverly team directly."
      : "This feature is still in development and will need an account. You can create one now or log in if you already have one.");

  const primaryClass =
    "inline-flex flex-1 items-center justify-center rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#424769] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral";
  const secondaryClass =
    "inline-flex flex-1 items-center justify-center rounded-full border border-[rgba(45,50,80,0.25)] px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-dialog-title"
      onClick={onClose}
    >
      <div
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
          {heading}
        </h3>

        <p className="text-sm text-ink-secondary leading-relaxed mb-6">{body}</p>

        <div className="flex flex-col gap-3">
          {!signedIn && (
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/signup" className={primaryClass}>
                Sign up
              </Link>
              <Link href="/login" className={secondaryClass}>
                Log in
              </Link>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className={secondaryClass}
            >
              <MessageCircle size={16} className="mr-2" aria-hidden="true" />
              Contact on WhatsApp
            </a>
            <button type="button" onClick={onClose} className={secondaryClass}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}