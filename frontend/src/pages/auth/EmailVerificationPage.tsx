import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ShieldCheck, ShieldAlert } from "lucide-react";

export const EmailVerificationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const hasToken = Boolean(token);

  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold text-stone-900 tracking-tight">Email verification</h2>
        <p className="text-xs text-stone-500 mt-1">Checking your account verification status.</p>
      </div>

      {hasToken ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
          <div className="flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 mt-0.5" />
            <div>
              <div className="font-semibold mb-1">Verification endpoint pending backend wiring</div>
              <p className="leading-relaxed">
                The current backend does not expose <span className="font-semibold">/api/auth/verify-email</span> yet,
                so your verification link cannot be processed automatically until that route is implemented.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-700">
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 mt-0.5" />
            <div>
              <div className="font-semibold mb-1">No verification token detected</div>
              <p className="leading-relaxed">
                Please open the verification link from your email or request a fresh verification email from support.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-stone-100 text-center text-xs text-stone-500">
        <Link to="/auth/login" className="font-semibold text-stone-900 hover:underline">
          Back to sign in
        </Link>
      </div>
    </div>
  );
};
