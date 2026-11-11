"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Products", href: "/#products" },
  { label: "Wholesalers", href: "/wholesalers" },
  { label: "Manufacturers", href: "/manufacturers" },
  { label: "About", href: "/about" },
];

const loginClass =
  "inline-flex items-center justify-center rounded-full border border-[rgba(45,50,80,0.25)] px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral";
const signupClass =
  "inline-flex items-center justify-center rounded-full bg-coral px-4 py-2 text-sm font-semibold text-navy transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  function isActive(href: string, label: string): boolean {
    if (label === "Products") {
      return pathname.startsWith("/browse") || pathname.startsWith("/products");
    }
    return href === pathname;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[rgba(45,50,80,0.12)] bg-surface/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="group flex items-center gap-2.5 rounded-md py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral"
          aria-label="Coverly Home"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-coral shadow-soft transition-transform group-hover:scale-105">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5 text-navy"
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
          <span className="font-heading text-xl font-bold tracking-tight text-ink">
            Coverly
          </span>
        </Link>

        <nav
          className="hidden items-center gap-7 text-sm font-medium md:flex"
          aria-label="Primary Navigation"
        >
          {navLinks.map((link) => {
            const active = isActive(link.href, link.label);
            return (
              <Link
                key={link.label}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-sm px-1 py-0.5 transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral ${
                  active ? "text-ink underline decoration-coral decoration-2 underline-offset-8" : "text-ink-secondary"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login" className={loginClass}>
            Log in
          </Link>
          <Link href="/signup" className={signupClass}>
            Sign up
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 text-ink transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral md:hidden"
          aria-expanded={mobileOpen}
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4 overflow-hidden border-b border-[rgba(45,50,80,0.12)] bg-surface px-4 py-6 shadow-card md:hidden"
          >
            <nav className="flex flex-col space-y-3" aria-label="Mobile Navigation">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="py-1 text-base font-medium text-ink transition-colors hover:text-ink-secondary"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="flex flex-col gap-3 border-t border-[rgba(45,50,80,0.12)] pt-4">
              <Link
                href="/signup"
                onClick={() => setMobileOpen(false)}
                className={signupClass}
              >
                Sign up
              </Link>
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className={loginClass}
              >
                Log in
              </Link>
              <Link
                href="/browse"
                onClick={() => setMobileOpen(false)}
                className="py-2 text-center text-sm font-semibold text-ink underline underline-offset-4"
              >
                Browse as guest
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}