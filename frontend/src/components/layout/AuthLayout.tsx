import React from "react";
import { Link, Outlet } from "react-router-dom";

export const AuthLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#FAF9F5] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center text-white font-bold text-sm">
            C
          </div>
          <span className="font-semibold text-xl tracking-tight text-stone-900">COVERLY</span>
        </Link>
        <p className="text-xs text-stone-500 font-medium">
          India's B2B Wholesale Discovery & Landed-Cost Procurement Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm border border-stone-200 rounded-xl sm:px-10">
          {children || <Outlet />}
        </div>
      </div>
    </div>
  );
};
