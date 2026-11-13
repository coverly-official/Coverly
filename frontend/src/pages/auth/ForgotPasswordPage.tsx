import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowRight, ShieldAlert } from "lucide-react";

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email.trim()) {
      return;
    }

    setIsSubmitted(true);
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold text-stone-900 tracking-tight">Reset your password</h2>
        <p className="text-xs text-stone-500 mt-1">
          Enter the email address linked to your COVERLY account.
        </p>
      </div>

      {!isSubmitted ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Email Address</label>
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
            className="w-full py-2.5 px-4 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 transition flex items-center justify-center gap-2"
          >
            Send reset instructions
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      ) : (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
          <div className="flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 mt-0.5" />
            <div>
              <div className="font-semibold mb-1">Password reset is not connected to the current backend</div>
              <p className="leading-relaxed">
                No <span className="font-semibold">/api/auth/forgot-password</span> endpoint is available yet.
                Please contact support or your platform admin to complete password recovery for this account.
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
