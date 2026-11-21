import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getWorkspaceRoute, isAdminRole } from "@/lib/role-routing";
import {
  ShieldCheck,
  Mail,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Lock,
} from "lucide-react";
import type { UserRole } from "@/types";

export const EmailVerificationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, verifyEmailOtp, resendEmailOtp, activeRole } = useAuth();

  const queryEmail = searchParams.get("email") || user?.email || "";
  const queryPurpose = searchParams.get("purpose") || "email_verification";
  const redirectTarget = searchParams.get("redirect") || "";
  const initialRole = searchParams.get("role") || activeRole || "buyer";

  const [email, setEmail] = useState(queryEmail);
  const [isEditingEmail, setIsEditingEmail] = useState(!queryEmail);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [cooldownSeconds, setCooldownSeconds] = useState(30);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown for resend button
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const interval = setInterval(() => {
      setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  // Focus first input on mount
  useEffect(() => {
    if (!isEditingEmail && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [isEditingEmail]);

  const handleDigitChange = (index: number, value: string) => {
    setErrorMsg("");

    // Handle full 6-digit paste
    if (value.length > 1) {
      const sanitized = value.replace(/\D/g, "").slice(0, 6);
      if (sanitized.length > 0) {
        const nextDigits = [...otpDigits];
        for (let i = 0; i < 6; i++) {
          nextDigits[i] = sanitized[i] || "";
        }
        setOtpDigits(nextDigits);

        const nextFocus = Math.min(sanitized.length, 5);
        inputRefs.current[nextFocus]?.focus();

        if (sanitized.length === 6) {
          executeVerification(sanitized);
        }
        return;
      }
    }

    // Single digit input
    const char = value.slice(-1).replace(/\D/g, "");
    const nextDigits = [...otpDigits];
    nextDigits[index] = char;
    setOtpDigits(nextDigits);

    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    const fullCode = nextDigits.join("");
    if (fullCode.length === 6) {
      executeVerification(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const executeVerification = async (codeToVerify?: string) => {
    const code = codeToVerify || otpDigits.join("");
    if (code.length !== 6) {
      setErrorMsg("Please enter the complete 6-digit verification code.");
      return;
    }

    if (!email.trim()) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    setIsVerifying(true);
    setErrorMsg("");

    const res = await verifyEmailOtp(email.trim().toLowerCase(), code, queryPurpose);
    setIsVerifying(false);

    if (!res.success) {
      setErrorMsg(res.error || "Verification failed. Please check your code.");
      return;
    }

    setSuccessMsg("Email successfully verified! Redirecting to your workspace...");

    setTimeout(() => {
      const resolvedRole =
        res.activeRole ||
        (localStorage.getItem("coverly_active_role") as UserRole) ||
        (initialRole as UserRole) ||
        "buyer";
      const userIsAdmin =
        isAdminRole(resolvedRole) ||
        Boolean(res.user?.roles?.some((r) => isAdminRole(r)));

      if (userIsAdmin) {
        const safeTarget =
          redirectTarget && redirectTarget.startsWith("/admin")
            ? redirectTarget
            : "/admin/dashboard";
        navigate(safeTarget, { replace: true });
      } else if (redirectTarget && redirectTarget !== "/access-denied" && !redirectTarget.includes("verify-email")) {
        navigate(redirectTarget, { replace: true });
      } else if (resolvedRole === "service_provider") {
        navigate("/provider/onboarding", { replace: true });
      } else if (["buyer", "sales_agent"].includes(resolvedRole)) {
        navigate("/account/verification", { replace: true });
      } else {
        navigate(getWorkspaceRoute(resolvedRole), { replace: true });
      }
    }, 1200);
  };

  const handleResend = async () => {
    if (cooldownSeconds > 0 || isResending) return;
    if (!email.trim()) {
      setErrorMsg("Please provide your email address to receive a verification code.");
      return;
    }

    setIsResending(true);
    setErrorMsg("");

    const res = await resendEmailOtp(email.trim().toLowerCase(), queryPurpose);
    setIsResending(false);

    if (!res.success) {
      setErrorMsg(res.error || "Failed to resend code.");
      if (res.retryAfterSeconds) {
        setCooldownSeconds(res.retryAfterSeconds);
      }
      return;
    }

    setCooldownSeconds(res.resendCooldownSeconds ?? 30);
    setSuccessMsg("A fresh 6-digit verification code has been dispatched to your email.");
    setOtpDigits(["", "", "", "", "", ""]);
    inputRefs.current[0]?.focus();
  };

  // Mask email for privacy
  const maskedEmail = email.includes("@")
    ? email.replace(/^(.)(.*)(.@.*)$/, (_, first, middle, end) => `${first}${"*".repeat(Math.min(middle.length, 4))}${end}`)
    : email;

  return (
    <div className="w-full">
      <div className="mb-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 mb-3 shadow-xs">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-stone-900 tracking-tight">Verify Your Email</h2>
        <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
          We’ve sent a 6-digit verification code to confirm your COVERLY account ownership.
        </p>
      </div>

      {/* Email Display & Edit */}
      <div className="mb-6 p-3 rounded-lg border border-stone-200 bg-stone-50/70 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 truncate">
          <Mail className="w-4 h-4 text-stone-500 shrink-0" />
          {isEditingEmail ? (
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="bg-white border border-stone-300 rounded px-2 py-1 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-800"
            />
          ) : (
            <span className="font-semibold text-stone-800 truncate">{maskedEmail}</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setIsEditingEmail(!isEditingEmail)}
          className="text-[11px] text-blue-700 hover:text-blue-900 font-semibold underline shrink-0 cursor-pointer ml-2"
        >
          {isEditingEmail ? "Done" : "Change"}
        </button>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 6-Digit Segmented OTP Input */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-stone-700 text-center mb-3">
          Enter 6-Digit Security Code
        </label>
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          {otpDigits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold font-mono text-stone-900 rounded-lg border-2 border-stone-300 focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10 focus:outline-none transition-all shadow-xs"
            />
          ))}
        </div>
        <div className="mt-3 text-center text-[11px] text-stone-500 flex items-center justify-center gap-1.5">
          <Lock className="w-3 h-3 text-stone-400" />
          <span>Code valid for 5 minutes • Max 5 attempts</span>
        </div>
      </div>

      {/* Verification Submit Button */}
      <button
        type="button"
        onClick={() => executeVerification()}
        disabled={isVerifying || otpDigits.join("").length !== 6}
        className="w-full py-2.5 px-4 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
      >
        {isVerifying ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Verifying Code...</span>
          </>
        ) : (
          <>
            <span>Verify & Continue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </>
        )}
      </button>

      {/* Resend OTP Section with 30s Cooldown */}
      <div className="mt-5 text-center">
        {cooldownSeconds > 0 ? (
          <p className="text-xs text-stone-500">
            Resend available in <span className="font-semibold text-stone-800">{cooldownSeconds}s</span>
          </p>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="text-xs font-semibold text-blue-700 hover:text-blue-900 transition flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResending ? "animate-spin" : ""}`} />
            <span>Resend Verification Code</span>
          </button>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
        <Link to="/auth/login" className="hover:text-stone-800 font-medium">
          ← Back to Sign In
        </Link>
        <Link to="/contact" className="hover:text-stone-800 font-medium">
          Need Help?
        </Link>
      </div>
    </div>
  );
};
