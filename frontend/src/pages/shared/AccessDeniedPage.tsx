import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

export const AccessDeniedPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 font-sans">
      <div className="w-12 h-12 rounded-full bg-red-100 text-red-800 flex items-center justify-center mb-4">
        <ShieldAlert className="w-6 h-6" />
      </div>
      <h1 className="text-2xl font-bold text-stone-900 mb-2">Access Denied</h1>
      <p className="text-xs text-stone-500 max-w-sm mb-6">
        You do not have the required role permissions to access this workspace. Please switch your role or contact your administrator.
      </p>
      <Link
        to="/"
        className="px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 transition"
      >
        Return to Home
      </Link>
    </div>
  );
};
