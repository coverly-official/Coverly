import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { PORTALS_REGISTRY, PortalItem } from "@/lib/portals-registry";
import {
  Eye,
  ShieldAlert,
  ArrowLeft,
  ExternalLink,
  LogIn,
  Lock,
  CheckCircle,
  Building2,
  Store,
  Factory,
  Truck,
  Globe,
  Briefcase,
  UserCheck,
  Package,
  Layers,
  ShoppingBag,
  Info,
  Clock,
  AlertTriangle,
} from "lucide-react";

export const AdminPortalPreviewPage: React.FC = () => {
  const { portalId } = useParams<{ portalId: string }>();
  const navigate = useNavigate();

  const currentPortal =
    PORTALS_REGISTRY.find((p) => p.id === portalId) || PORTALS_REGISTRY[0];

  const [activeTab, setActiveTab] = useState<string>("dashboard");

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-sans antialiased text-stone-900">
      {/* 1. Universal Enterprise PREVIEW MODE Watermark & Control Header */}
      <header className="sticky top-0 z-50 bg-amber-500 text-stone-950 px-4 sm:px-6 py-2.5 shadow-md flex flex-wrap items-center justify-between gap-3 border-b-2 border-amber-600">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-stone-950 text-amber-400 font-extrabold text-[11px] tracking-wider uppercase shadow-xs">
            <Eye className="w-3.5 h-3.5" />
            ADMIN PREVIEW MODE
          </div>
          <div className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-stone-950">
            <span>Currently Simulating:</span>
            <span className="font-extrabold underline decoration-stone-950/40">{currentPortal.name}</span>
            <span className="text-[10px] bg-stone-950/15 px-2 py-0.5 rounded-full font-mono">
              READ-ONLY SANDBOX
            </span>
          </div>
        </div>

        {/* Quick Portal Switcher inside Preview */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-stone-950 hidden sm:inline">Switch Portal:</label>
          <select
            value={currentPortal.id}
            onChange={(e) => navigate(`/admin/portals/${e.target.value}/preview`)}
            className="text-xs font-bold bg-white text-stone-900 border border-amber-600 rounded-lg px-2.5 py-1 focus:outline-none shadow-2xs cursor-pointer"
          >
            {PORTALS_REGISTRY.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.category.split(" ")[0]})
              </option>
            ))}
          </select>

          <Link
            to={currentPortal.openRoute}
            className="inline-flex items-center gap-1 text-xs font-bold bg-stone-950 text-white hover:bg-stone-800 px-3 py-1 rounded-lg shadow-xs transition"
            title="Open the actual live workspace (requires authorized role)"
          >
            <ExternalLink className="w-3 h-3" />
            Live Portal
          </Link>

          <button
            type="button"
            onClick={() => navigate("/admin/portals")}
            className="inline-flex items-center gap-1 text-xs font-bold bg-white text-stone-900 hover:bg-stone-50 px-3 py-1 rounded-lg border border-amber-600 shadow-2xs transition"
          >
            <ArrowLeft className="w-3 h-3" />
            Exit Preview
          </button>
        </div>
      </header>

      {/* 2. Security Disclaimer Banner */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-6 py-2 flex items-center justify-between text-[11px] text-amber-900">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <span>
            <strong>Simulated Security Sandbox:</strong> Real customer records are shielded. No write operations, payments, or RFQ dispatching will execute in Preview Mode.
          </span>
        </div>
        <div className="hidden lg:flex items-center gap-3">
          <span>Login URL: <code className="font-mono">{currentPortal.loginUrl}</code></span>
          <span>•</span>
          <a
            href={currentPortal.loginUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline hover:text-amber-950 inline-flex items-center gap-1"
          >
            <LogIn className="w-3 h-3" /> Test Authenticated Login &rarr;
          </a>
        </div>
      </div>

      {/* 3. Simulated Workspace Canvas */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Workspace Brand & Profile Header */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-stone-900 text-white flex items-center justify-center shrink-0 shadow-md">
              <Building2 className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-stone-900">{currentPortal.name}</h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {currentPortal.status}
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1 max-w-xl">
                {currentPortal.description}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <a
              href={currentPortal.registerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 transition"
            >
              Test Onboarding Form
            </a>
            <Link
              to={currentPortal.openRoute}
              className="px-3.5 py-2 text-xs font-bold rounded-lg bg-stone-900 hover:bg-stone-800 text-white shadow-xs transition flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Live Route
            </Link>
          </div>
        </div>

        {/* Simulated Module Tabs */}
        <div className="flex border-b border-stone-200 space-x-6 text-xs font-semibold text-stone-600 overflow-x-auto">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`pb-3 border-b-2 transition ${
              activeTab === "dashboard"
                ? "border-stone-900 text-stone-900 font-bold"
                : "border-transparent hover:text-stone-900"
            }`}
          >
            Dashboard & KPI Overview
          </button>
          <button
            onClick={() => setActiveTab("modules")}
            className={`pb-3 border-b-2 transition ${
              activeTab === "modules"
                ? "border-stone-900 text-stone-900 font-bold"
                : "border-transparent hover:text-stone-900"
            }`}
          >
            Capabilities & User Workflows
          </button>
          <button
            onClick={() => setActiveTab("auth-info")}
            className={`pb-3 border-b-2 transition ${
              activeTab === "auth-info"
                ? "border-stone-900 text-stone-900 font-bold"
                : "border-transparent hover:text-stone-900"
            }`}
          >
            Authentication & Role Specifications
          </button>
        </div>

        {/* Tab 1: Dashboard Simulation */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* KPI Cards Simulation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs">
                <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                  Active Requirements / RFQs
                </span>
                <p className="text-2xl font-extrabold text-stone-900 mt-1">12</p>
                <span className="text-[11px] text-emerald-700 font-medium mt-1 block">
                  ↑ 3 new inquiries this week
                </span>
              </div>
              <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs">
                <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                  Quotations & Proposals
                </span>
                <p className="text-2xl font-extrabold text-stone-900 mt-1">28</p>
                <span className="text-[11px] text-blue-700 font-medium mt-1 block">
                  85% on-time quote submission
                </span>
              </div>
              <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs">
                <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                  In-Progress Transactions
                </span>
                <p className="text-2xl font-extrabold text-stone-900 mt-1">8</p>
                <span className="text-[11px] text-amber-700 font-medium mt-1 block">
                  2 awaiting dispatch clearance
                </span>
              </div>
              <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs">
                <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                  Fulfillment & Satisfaction
                </span>
                <p className="text-2xl font-extrabold text-stone-900 mt-1">99.4%</p>
                <span className="text-[11px] text-emerald-700 font-medium mt-1 block">
                  Verified customer rating: 4.9/5.0
                </span>
              </div>
            </div>

            {/* Workflow Pipeline Stepper Mock */}
            <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-2xs space-y-4">
              <h2 className="text-sm font-bold text-stone-900">
                End-to-End {currentPortal.name} Progression Stepper
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200">
                  <span className="font-bold text-emerald-900 block mb-1">1. Discovery & Match</span>
                  <p className="text-emerald-800 text-[11px]">
                    Identifies verified counterparties with verified GSTIN, capacity, and ratings.
                  </p>
                </div>
                <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200">
                  <span className="font-bold text-blue-900 block mb-1">2. Price Tender & Quotation</span>
                  <p className="text-blue-800 text-[11px]">
                    Multi-tier unit pricing, MOQ tiers, lead times, and freight calculations.
                  </p>
                </div>
                <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200">
                  <span className="font-bold text-amber-900 block mb-1">3. Production & Dispatch</span>
                  <p className="text-amber-800 text-[11px]">
                    Milestone advancement, QC inspection certificates, e-way bills & waypoints.
                  </p>
                </div>
                <div className="p-3.5 rounded-lg bg-purple-50 border border-purple-200">
                  <span className="font-bold text-purple-900 block mb-1">4. Delivery & 3-Way Match</span>
                  <p className="text-purple-800 text-[11px]">
                    Electronic Proof of Delivery (e-POD), invoice matching, and final settlement.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Modules & Capabilities */}
        {activeTab === "modules" && (
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-2xs space-y-6">
            <h2 className="text-sm font-bold text-stone-900">
              Integrated Capabilities in this Workspace
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentPortal.features.map((feat, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl border border-stone-200 bg-stone-50/60 flex items-start gap-3"
                >
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-bold text-stone-900">{feat}</h3>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Fully configured in production for verified enterprise users holding the `{currentPortal.role}` role.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Auth & Security Info */}
        {activeTab === "auth-info" && (
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-2xs space-y-5 text-xs">
            <h2 className="text-sm font-bold text-stone-900">
              Security & Identity Specifications
            </h2>
            <div className="space-y-3 font-mono text-[11px]">
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 flex justify-between">
                <span className="font-bold text-stone-700">Internal Role Key:</span>
                <span className="text-blue-900 font-bold">{currentPortal.role}</span>
              </div>
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 flex justify-between">
                <span className="font-bold text-stone-700">Live Workspace URL:</span>
                <span className="text-stone-900">{currentPortal.openRoute}</span>
              </div>
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 flex justify-between">
                <span className="font-bold text-stone-700">Login Authentication Route:</span>
                <span className="text-stone-900">{currentPortal.loginUrl}</span>
              </div>
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 flex justify-between">
                <span className="font-bold text-stone-700">Onboarding & Registration:</span>
                <span className="text-stone-900">{currentPortal.registerUrl}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Role-Based Access Enforcement:</p>
                <p className="mt-1 text-[11px] text-blue-800 leading-relaxed">
                  Platform Administrators (`admin`, `super_admin`) hold global oversight to audit this workspace directly. Standard non-admin users must hold `{currentPortal.role}` or an authorized business delegation in `public.business_members`.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
