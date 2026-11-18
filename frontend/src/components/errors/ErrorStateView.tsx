import React from "react";
import { Link } from "react-router-dom";
import { BrandLogo } from "@/components/ui/BrandLogo";
import {
  Lock,
  ShieldAlert,
  ServerCrash,
  CloudOff,
  WifiOff,
  Inbox,
  RefreshCw,
  Home,
  LogIn,
  HelpCircle,
} from "lucide-react";

export type ErrorVariant = "401" | "403" | "500" | "503" | "network" | "empty" | "loading";

interface ErrorStateViewProps {
  variant: ErrorVariant;
  title?: string;
  description?: string;
  onRetry?: () => void;
  actionLabel?: string;
  actionHref?: string;
}

const DEFAULTS: Record<
  Exclude<ErrorVariant, "loading">,
  {
    code?: string;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    accentBg: string;
    accentText: string;
  }
> = {
  "401": {
    code: "HTTP 401",
    title: "Session Expired or Sign-In Required",
    description:
      "Your session has expired or you need to sign in to access this protected COVERLY workspace.",
    icon: Lock,
    accentBg: "bg-amber-50 border-amber-200",
    accentText: "text-amber-700",
  },
  "403": {
    code: "HTTP 403",
    title: "Access Denied",
    description:
      "You do not have the required permissions to view or modify this resource. Contact your business administrator if you believe this is an error.",
    icon: ShieldAlert,
    accentBg: "bg-red-50 border-red-200",
    accentText: "text-red-700",
  },
  "500": {
    code: "HTTP 500",
    title: "Something Went Wrong",
    description:
      "An unexpected issue interrupted this request. Our team has been notified. Please try refreshing the page or returning to the homepage.",
    icon: ServerCrash,
    accentBg: "bg-rose-50 border-rose-200",
    accentText: "text-rose-700",
  },
  "503": {
    code: "HTTP 503",
    title: "Service Temporarily Unavailable",
    description:
      "COVERLY services are currently undergoing brief maintenance or high load. Please retry in a few moments.",
    icon: CloudOff,
    accentBg: "bg-blue-50 border-blue-200",
    accentText: "text-blue-700",
  },
  network: {
    code: "CONNECTION ISSUE",
    title: "Unable to Reach COVERLY Servers",
    description:
      "Please check your internet connection or corporate firewall and try again.",
    icon: WifiOff,
    accentBg: "bg-stone-100 border-stone-200",
    accentText: "text-stone-700",
  },
  empty: {
    title: "No Records Found",
    description:
      "There are currently no matching listings or records for your selected filters.",
    icon: Inbox,
    accentBg: "bg-stone-100 border-stone-200",
    accentText: "text-stone-600",
  },
};

export const ErrorStateView: React.FC<ErrorStateViewProps> = ({
  variant,
  title,
  description,
  onRetry,
  actionLabel,
  actionHref,
}) => {
  if (variant === "loading") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="min-h-[40vh] flex flex-col items-center justify-center p-8 text-center"
      >
        <div className="w-10 h-10 rounded-full border-2 border-stone-200 border-t-blue-950 animate-spin mb-4" />
        <p className="text-sm font-semibold text-stone-800">{title || "Loading COVERLY..."}</p>
        <p className="text-xs text-stone-500 mt-1">
          {description || "Fetching verified marketplace data."}
        </p>
      </div>
    );
  }

  const cfg = DEFAULTS[variant];
  const Icon = cfg.icon;

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center px-4 py-12 font-sans">
      <div className="mb-4">
        <BrandLogo linkTo="/" size="sm" />
      </div>
      <div className="w-full max-w-lg bg-white border border-stone-200 rounded-2xl p-8 shadow-sm text-center">
        <div
          className={`w-14 h-14 rounded-2xl border mx-auto mb-4 flex items-center justify-center ${cfg.accentBg} ${cfg.accentText}`}
        >
          <Icon className="w-7 h-7" />
        </div>

        {cfg.code && (
          <div className="inline-block px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600 font-mono text-[10px] font-bold tracking-wider uppercase mb-3">
            {cfg.code}
          </div>
        )}

        <h2 className="text-xl font-bold text-stone-900 tracking-tight">
          {title || cfg.title}
        </h2>
        <p className="text-xs text-stone-600 mt-2 leading-relaxed max-w-md mx-auto">
          {description || cfg.description}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          {variant === "401" && (
            <Link
              to="/auth/login"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-950 hover:bg-blue-900 text-white text-xs font-semibold transition"
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In
            </Link>
          )}

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try Again
            </button>
          )}

          {actionHref && actionLabel && (
            <Link
              to={actionHref}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-950 hover:bg-blue-900 text-white text-xs font-semibold transition"
            >
              {actionLabel}
            </Link>
          )}

          {variant !== "empty" && (
            <>
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 text-xs font-semibold transition"
              >
                <Home className="w-3.5 h-3.5" />
                Back to Home
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold transition"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                Contact Support
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
