import React from "react";
import { Link, Outlet } from "react-router-dom";
import { BrandLogo } from "@/components/ui/BrandLogo";

export const AuthLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#FAF9F5] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mb-2 flex justify-center">
          <BrandLogo linkTo="/" size="lg" />
        </div>
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
