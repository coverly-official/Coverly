import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/auth/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Mandatory COVERLY Application-Level Verification Enforcement:
  // If user account is unverified and not already on the verification page,
  // securely route them to complete 6-digit email OTP verification.
  if (user.email_verified === false && location.pathname !== "/auth/verify-email") {
    return (
      <Navigate
        to={`/auth/verify-email?email=${encodeURIComponent(user.email)}&redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  return <>{children}</>;
};
