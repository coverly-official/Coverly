import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { CoverlyLogo } from "@/components/brand/CoverlyLogo";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// TODO: wholesalers, manufacturers and about sections do not exist yet.
const navLinks = [
  { label: "Home", href: "#" },
  { label: "Products", href: "#products" },
  { label: "Wholesalers", href: "#wholesalers" },
  { label: "Manufacturers", href: "#manufacturers" },
  { label: "About", href: "#about" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-surface/90 backdrop-blur-md border-b border-[rgba(34,37,42,0.06)] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <a
          href="/"
          className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral rounded-md py-1"
          aria-label="Coverly Home"
        >
          <CoverlyLogo variant="horizontal" size="md" />
        </a>

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
          <a href="#contact">
            <Button variant="coral" size="sm">
              Login
            </Button>
          </a>
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
            className="md:hidden border-b border-[rgba(34,37,42,0.06)] bg-surface px-4 py-6 space-y-4 shadow-card"
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
            <div className="pt-4 border-t border-[rgba(34,37,42,0.06)] flex flex-col gap-3">
              <a
                href="#contact"
                onClick={() => setMobileOpen(false)}
                className="w-full"
              >
                <Button variant="coral" size="md">
                  Login
                </Button>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
