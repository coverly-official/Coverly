import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { LockKeyhole, ArrowRight, ShieldAlert } from "lucide-react";

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!token) {
      setError("This reset link is incomplete. A valid password reset token is required.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSuccess(true);
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold text-stone-900 tracking-tight">Create a new password</h2>
        <p className="text-xs text-stone-500 mt-1">Use the secure link from your recovery email.</p>
      </div>

      {!token && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          Missing reset token. Please request a new recovery email from the sign-in page.
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {error}
        </div>
      )}

      {success ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
          <div className="flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 mt-0.5" />
            <div>
              <div className="font-semibold mb-1">Password reset flow is pending backend support</div>
              <p className="leading-relaxed">
                The platform does not expose a reset-password API yet, so this screen is intentionally blocked until
                the backend is implemented.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">New Password</label>
            <div className="relative">
              <LockKeyhole className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Confirm Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
              className="w-full text-xs px-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-800"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 transition flex items-center justify-center gap-2"
          >
            Update password
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      )}

      <div className="mt-6 pt-4 border-t border-stone-100 text-center text-xs text-stone-500">
        <Link to="/auth/login" className="font-semibold text-stone-900 hover:underline">
          Return to sign in
        </Link>
      </div>
    </div>
  );
};
