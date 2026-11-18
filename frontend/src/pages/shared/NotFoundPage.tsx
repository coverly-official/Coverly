import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  Home,
  ShoppingBag,
  HelpCircle,
  Search,
  Layers,
  Factory,
  Briefcase,
  Truck,
  ArrowRight,
  Package,
} from "lucide-react";

interface NotFoundPageProps {
  resourceLabel?: string;
}

const POPULAR_CATEGORIES = [
  { label: "Raw Materials", href: "/products?category=raw-materials", icon: Layers },
  { label: "Verified Manufacturers", href: "/manufacturers", icon: Factory },
  { label: "Packaging Materials", href: "/products?category=packaging-materials", icon: Package },
  { label: "Business Services", href: "/services", icon: Briefcase },
  { label: "Logistics & Freight", href: "/logistics", icon: Truck },
];

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ resourceLabel }) => {
  const prefersReducedMotion = useReducedMotion();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      navigate(`/products?search=${encodeURIComponent(q)}`);
    } else {
      navigate("/products");
    }
  };

  const floatAnim = prefersReducedMotion
    ? undefined
    : {
        y: [0, -10, 0],
        transition: { duration: 4.2, repeat: Infinity, ease: "easeInOut" as const },
      };

  const floatAlt = prefersReducedMotion
    ? undefined
    : {
        y: [0, 8, 0],
        transition: { duration: 5.0, repeat: Infinity, ease: "easeInOut" as const, delay: 0.6 },
      };

  return (
    <section
      aria-labelledby="coverly-404-heading"
      className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-blue-950 to-slate-900 text-white py-16 sm:py-24 px-4 sm:px-6 font-sans"
    >
      {/* Subtle architectural supply-chain grid backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.28) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: 404 Typography, Copy, Actions & Search */}
          <div className="lg:col-span-7 text-center lg:text-left">
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/35 text-amber-300 text-[11px] font-bold uppercase tracking-widest mb-5"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              COVERLY Supply-Chain Routing • Error 404
            </motion.div>

            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="text-7xl sm:text-8xl font-black tracking-tighter leading-none bg-gradient-to-r from-white via-amber-200 to-amber-400 bg-clip-text text-transparent select-none"
            >
              404
            </motion.div>

            <h1
              id="coverly-404-heading"
              className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight text-white"
            >
              Looks like this route is out of stock!
            </h1>

            <p className="mt-3 text-sm text-slate-300 leading-relaxed max-w-xl mx-auto lg:mx-0">
              {resourceLabel
                ? `The ${resourceLabel} you're looking for doesn't exist, may have moved, or is temporarily unavailable.`
                : "The page you're looking for doesn't exist, may have moved, or is temporarily unavailable."}
            </p>

            {/* Primary CTA Buttons */}
            <div className="mt-7 flex flex-wrap items-center justify-center lg:justify-start gap-3">
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-amber-300"
              >
                <Home className="w-4 h-4" />
                Back to Home
              </Link>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-white/40"
              >
                <ShoppingBag className="w-4 h-4 text-amber-300" />
                Explore Marketplace
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/15 hover:bg-white/10 text-slate-200 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                <HelpCircle className="w-4 h-4" />
                Contact Support
              </Link>
            </div>

            {/* Inline Quick Product Search */}
            <form
              onSubmit={handleSearch}
              className="mt-6 flex items-center max-w-md mx-auto lg:mx-0 bg-white/10 border border-white/20 rounded-xl p-1 backdrop-blur-sm focus-within:border-amber-400/70"
            >
              <Search className="w-4 h-4 text-slate-300 ml-3 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search wholesale products on COVERLY"
                placeholder="Search products, steel, packaging, suppliers..."
                className="flex-1 bg-transparent px-3 py-2 text-xs text-white placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shrink-0"
              >
                Search Products
              </button>
            </form>
          </div>

          {/* Right Column: Subtle 3D-Inspired Industrial Supply-Chain Illustration */}
          <div className="lg:col-span-5 flex items-center justify-center">
            <div className="relative w-full max-w-sm aspect-square flex items-center justify-center">
              {/* Soft glow halo */}
              <div
                aria-hidden="true"
                className="absolute inset-8 rounded-full bg-amber-400/15 blur-3xl"
              />

              <svg
                viewBox="0 0 400 360"
                className="w-full h-auto relative z-10 drop-shadow-2xl"
                role="img"
                aria-label="COVERLY animated supply-chain warehouse route illustration"
              >
                <defs>
                  <linearGradient id="crateTop" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FCD34D" />
                    <stop offset="100%" stopColor="#F59E0B" />
                  </linearGradient>
                  <linearGradient id="crateLeft" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1E3A8A" />
                    <stop offset="100%" stopColor="#0F172A" />
                  </linearGradient>
                  <linearGradient id="crateRight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" />
                    <stop offset="100%" stopColor="#1E3A8A" />
                  </linearGradient>
                  <linearGradient id="routeLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#38BDF8" />
                    <stop offset="50%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#10B981" />
                  </linearGradient>
                </defs>

                {/* Base isometric warehouse platform */}
                <polygon
                  points="200,295 360,225 200,155 40,225"
                  fill="rgba(255,255,255,0.06)"
                  stroke="rgba(148,163,184,0.3)"
                  strokeWidth="1.5"
                />

                {/* Animated supply-chain conveyor route */}
                <motion.path
                  d="M 65 225 L 145 190 L 220 222 L 330 175"
                  fill="none"
                  stroke="url(#routeLine)"
                  strokeWidth="3.5"
                  strokeDasharray="8 8"
                  strokeLinecap="round"
                  animate={
                    prefersReducedMotion
                      ? undefined
                      : { strokeDashoffset: [0, -32] }
                  }
                  transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
                />

                {/* Route Nodes */}
                <circle cx="65" cy="225" r="7" fill="#38BDF8" />
                <circle cx="145" cy="190" r="7" fill="#F59E0B" />
                <circle cx="220" cy="222" r="7" fill="#F59E0B" />
                <circle cx="330" cy="175" r="7" fill="#10B981" />

                {/* Floating Isometric Freight Crate #1 (Center Main) */}
                <motion.g animate={floatAnim}>
                  <polygon points="200,82 262,114 200,146 138,114" fill="url(#crateTop)" />
                  <polygon points="138,114 200,146 200,210 138,178" fill="url(#crateLeft)" />
                  <polygon points="262,114 200,146 200,210 262,178" fill="url(#crateRight)" />
                  <line x1="169" y1="98" x2="231" y2="130" stroke="#0F172A" strokeOpacity="0.35" strokeWidth="2.5" />
                  <text
                    x="156"
                    y="168"
                    fill="#FCD34D"
                    fontSize="16"
                    fontWeight="800"
                    fontFamily="monospace"
                  >
                    404
                  </text>
                </motion.g>

                {/* Floating Secondary Logistics Crate #2 (Left) */}
                <motion.g animate={floatAlt}>
                  <polygon points="92,126 126,143 92,160 58,143" fill="#38BDF8" fillOpacity="0.85" />
                  <polygon points="58,143 92,160 92,194 58,177" fill="#0F172A" stroke="#38BDF8" strokeOpacity="0.4" />
                  <polygon points="126,143 92,160 92,194 126,177" fill="#1E3A8A" stroke="#38BDF8" strokeOpacity="0.4" />
                </motion.g>

                {/* Floating Secondary Logistics Crate #3 (Right) */}
                <motion.g animate={floatAlt}>
                  <polygon points="308,92 340,108 308,124 276,108" fill="#10B981" fillOpacity="0.9" />
                  <polygon points="276,108 308,124 308,156 276,140" fill="#064E3B" />
                  <polygon points="340,108 308,124 308,156 340,140" fill="#047857" />
                </motion.g>
              </svg>
            </div>
          </div>
        </div>

        {/* Popular Categories Strip */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3 text-center lg:text-left">
            Popular B2B Sourcing Destinations
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {POPULAR_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.href}
                  to={cat.href}
                  className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 hover:text-white transition"
                >
                  <span className="flex items-center gap-2 truncate">
                    <Icon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">{cat.label}</span>
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
