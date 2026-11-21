import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Mail,
  ArrowRight,
  ShieldCheck,
  Lock,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const ForgotPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [recoveryToken, setRecoveryToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Resend cooldown timer
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  // Focus first OTP input when entering step 2
  useEffect(() => {
    if (step === 2 && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [step]);

  // STEP 1: Request Password Recovery Code
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMsg("Please enter your registered email address.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const body = await res.json();
      setIsLoading(false);

      if (!res.ok || !body.success) {
        setErrorMsg(body.error || "Unable to process recovery request.");
        return;
      }

      setMaskedEmail(body.data?.maskedEmail || cleanEmail);
      setCooldownSeconds(body.data?.resendCooldownSeconds ?? 30);
      setSuccessMsg("If an account exists, a 6-digit recovery code has been dispatched.");
      setStep(2);
    } catch {
      setIsLoading(false);
      setErrorMsg("Connection error. Please try again.");
    }
  };

  // STEP 2: Verify Recovery OTP & Obtain Single-Use Token
  const handleDigitChange = (index: number, value: string) => {
    setErrorMsg("");

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
          executeVerifyOtp(sanitized);
        }
        return;
      }
    }

    const char = value.slice(-1).replace(/\D/g, "");
    const nextDigits = [...otpDigits];
    nextDigits[index] = char;
    setOtpDigits(nextDigits);

    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    const fullCode = nextDigits.join("");
    if (fullCode.length === 6) {
      executeVerifyOtp(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const executeVerifyOtp = async (codeToVerify?: string) => {
    const code = codeToVerify || otpDigits.join("");
    if (code.length !== 6) {
      setErrorMsg("Please enter the complete 6-digit recovery code.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch(`${API_BASE}/auth/verify-recovery-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: code }),
      });

      const body = await res.json();
      setIsLoading(false);

      if (!res.ok || !body.success) {
        setErrorMsg(body.error || "Invalid or expired recovery code.");
        return;
      }

      setRecoveryToken(body.data?.recoveryToken || body.data?.recovery_token || "");
      setSuccessMsg("Code verified! You may now set a new password.");
      setStep(3);
    } catch {
      setIsLoading(false);
      setErrorMsg("Failed to verify recovery code.");
    }
  };

  const handleResendRecoveryOtp = async () => {
    if (cooldownSeconds > 0 || isLoading) return;
    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const body = await res.json();
      setIsLoading(false);

      if (res.ok && body.success) {
        setCooldownSeconds(body.data?.resendCooldownSeconds ?? 30);
        setSuccessMsg("A fresh 6-digit recovery code has been sent.");
        setOtpDigits(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        setErrorMsg(body.error || "Failed to resend recovery code.");
      }
    } catch {
      setIsLoading(false);
      setErrorMsg("Connection error while resending code.");
    }
  };

  // STEP 3: Submit New Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setErrorMsg("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          recoveryToken,
          recovery_token: recoveryToken,
          newPassword,
          new_password: newPassword,
          confirmPassword,
          confirm_password: confirmPassword,
        }),
      });

      const body = await res.json();
      setIsLoading(false);

      if (!res.ok || !body.success) {
        setErrorMsg(body.error || "Password reset failed. Please restart recovery.");
        return;
      }

      setSuccessMsg("Password successfully reset! Redirecting to sign in...");
      setTimeout(() => {
        navigate("/auth/login?reset=success", { replace: true });
      }, 1500);
    } catch {
      setIsLoading(false);
      setErrorMsg("Connection error while updating password.");
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-stone-100 border border-stone-200 text-stone-900 mb-3 shadow-xs">
          {step === 1 && <Mail className="w-6 h-6" />}
          {step === 2 && <ShieldCheck className="w-6 h-6 text-blue-700" />}
          {step === 3 && <KeyRound className="w-6 h-6 text-emerald-700" />}
        </div>
        <h2 className="text-xl font-bold text-stone-900 tracking-tight">
          {step === 1 && "Recover Account Password"}
          {step === 2 && "Enter Recovery Code"}
          {step === 3 && "Set New Password"}
        </h2>
        <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
          {step === 1 && "Enter your registered business email to receive a secure recovery code."}
          {step === 2 && `Enter the 6-digit recovery code sent to ${maskedEmail || email}.`}
          {step === 3 && "Create a secure new password for your COVERLY account."}
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-6 flex items-center justify-center gap-2">
        <div className={`h-1.5 w-10 rounded-full transition-all ${step >= 1 ? "bg-stone-900" : "bg-stone-200"}`} />
        <div className={`h-1.5 w-10 rounded-full transition-all ${step >= 2 ? "bg-stone-900" : "bg-stone-200"}`} />
        <div className={`h-1.5 w-10 rounded-full transition-all ${step >= 3 ? "bg-stone-900" : "bg-stone-200"}`} />
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

      {/* STEP 1: EMAIL INPUT */}
      {step === 1 && (
        <form onSubmit={handleRequestOtp} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Registered Business Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-800"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Sending Code...</span>
              </>
            ) : (
              <>
                <span>Send Recovery Code</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>
      )}

      {/* STEP 2: 6-DIGIT RECOVERY OTP */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-stone-700 text-center mb-3">
              Enter 6-Digit Recovery Code
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
            <div className="mt-2 text-center text-[11px] text-stone-500">
              Valid for 5 minutes • Single-use
            </div>
          </div>

          <button
            type="button"
            onClick={() => executeVerifyOtp()}
            disabled={isLoading || otpDigits.join("").length !== 6}
            className="w-full py-2.5 px-4 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <span>Verify Code</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>

          <div className="flex items-center justify-between text-xs text-stone-500">
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setOtpDigits(["", "", "", "", "", ""]);
              }}
              className="text-stone-600 hover:underline"
            >
              ← Change Email
            </button>

            {cooldownSeconds > 0 ? (
              <span>Resend in {cooldownSeconds}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResendRecoveryOtp}
                className="text-blue-700 font-semibold hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Resend Code
              </button>
            )}
          </div>
        </div>
      )}

      {/* STEP 3: SET NEW PASSWORD */}
      {step === 3 && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">New Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full text-xs pl-9 pr-9 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-800"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {newPassword && (
              <div className="mt-1 flex items-center gap-1 text-[11px] text-stone-500">
                <span
                  className={`font-semibold ${
                    newPassword.length >= 8 && /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword)
                      ? "text-emerald-600"
                      : newPassword.length >= 8
                      ? "text-amber-600"
                      : "text-red-500"
                  }`}
                >
                  {newPassword.length >= 8 && /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword)
                    ? "Strong password"
                    : newPassword.length >= 8
                    ? "Moderate password"
                    : "Must be at least 8 characters"}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Confirm New Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your new password"
                className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-800"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || newPassword.length < 8 || newPassword !== confirmPassword}
            className="w-full py-2.5 px-4 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Updating Password...</span>
              </>
            ) : (
              <>
                <span>Save New Password</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>
      )}

      {/* Footer Navigation */}
      <div className="mt-6 pt-4 border-t border-stone-100 text-center text-xs text-stone-500">
        <Link to="/auth/login" className="font-semibold text-stone-900 hover:underline">
          Back to sign in
        </Link>
      </div>
    </div>
  );
};
