"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { AccountDialog } from "@/components/ui/AccountDialog";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";


const navLinks = [
  { label: "Home", href: "/" },
  { label: "Products", href: "/#products" },
  { label: "Wholesalers", href: "/wholesalers" },
  { label: "Manufacturers", href: "/manufacturers" },
  { label: "About", href: "/about" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-surface/90 backdrop-blur-md border-b border-[rgba(45,50,80,0.12)] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral rounded-md py-1"
          aria-label="Coverly Home"
        >
          <div className="w-8 h-8 rounded-xl bg-coral flex items-center justify-center shadow-soft transition-transform group-hover:scale-105">
            {/* Simple flame/stack mark */}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-5 h-5 text-white"
              aria-hidden="true"
            >
              <path
                d="M12 2C12 2 15 5.5 15 8.5C15 10.2 13.7 11.5 12 11.5C10.3 11.5 9 10.2 9 8.5C9 6.5 10.2 4.5 12 2Z"
                fill="currentColor"
                fillOpacity="0.9"
              />
              <path
                d="M12 8C14.5 8 18 11.5 18 16C18 19.3 15.3 22 12 22C8.7 22 6 19.3 6 16C6 11.5 9.5 8 12 8Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <span className="font-heading font-bold text-xl tracking-tight text-ink">
            Coverly
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav
          className="hidden md:flex items-center gap-8 text-sm font-medium text-ink-secondary"
          aria-label="Primary Navigation"
        >
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral rounded-sm px-1 py-0.5"
            >
              {link.label}
            </a>
  
          ))}
        </nav>

        {/* Right Actions */}
        <div className="hidden md:flex items-center gap-4">
          <Button variant="coral" size="sm" onClick={() => setAccountOpen(true)}>
            Login
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg text-ink hover:bg-surface-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral"
          aria-expanded={mobileOpen}
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-b border-[rgba(45,50,80,0.12)] bg-surface px-4 py-6 space-y-4 shadow-card"
          >
            <nav className="flex flex-col space-y-3" aria-label="Mobile Navigation">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-base font-medium text-ink hover:text-coral transition-colors py-1"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="pt-4 border-t border-[rgba(45,50,80,0.12)] flex flex-col gap-3">
              <Button
                variant="coral"
                size="md"
                onClick={() => {
                  setMobileOpen(false);
                  setAccountOpen(true);
                }}
                className="w-full"
              >
                Login
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AccountDialog isOpen={accountOpen} onClose={() => setAccountOpen(false)} />
    </header>
  );
}
