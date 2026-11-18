import React from "react";

export type CoverlyLogoVariant = "mark" | "stacked" | "horizontal";
export type CoverlyLogoTheme = "light" | "dark";
export type CoverlyLogoSize = "xs" | "sm" | "md" | "lg" | "xl";

interface CoverlyLogoProps {
  variant?: CoverlyLogoVariant;
  theme?: CoverlyLogoTheme;
  size?: CoverlyLogoSize;
  subtitle?: string;
  className?: string;
}

const MARK_HEIGHT: Record<CoverlyLogoSize, string> = {
  xs: "h-5",
  sm: "h-6",
  md: "h-7",
  lg: "h-9",
  xl: "h-12",
};

const STACKED_HEIGHT: Record<CoverlyLogoSize, string> = {
  xs: "h-8",
  sm: "h-10",
  md: "h-12",
  lg: "h-16",
  xl: "h-20",
};

const TEXT_SIZE: Record<CoverlyLogoSize, string> = {
  xs: "text-sm",
  sm: "text-base",
  md: "text-lg",
  lg: "text-xl",
  xl: "text-2xl",
};

export const CoverlyLogo: React.FC<CoverlyLogoProps> = ({
  variant = "horizontal",
  theme = "light",
  size = "md",
  subtitle,
  className = "",
}) => {
  const isDark = theme === "dark";

  if (variant === "mark") {
    return (
      <img
        src={isDark ? "/brand/coverly-mark-light.png" : "/brand/coverly-mark.png"}
        alt="COVERLY"
        decoding="async"
        className={`${MARK_HEIGHT[size]} w-auto object-contain select-none ${className}`}
      />
    );
  }

  if (variant === "stacked") {
    return (
      <img
        src={isDark ? "/brand/coverly-logo-dark.png" : "/brand/coverly-logo-full.png"}
        alt="COVERLY"
        decoding="async"
        className={`${STACKED_HEIGHT[size]} w-auto object-contain select-none ${className}`}
      />
    );
  }

  // Horizontal lockup: crisp official icon mark beside bold COVERLY wordmark
  return (
    <span className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <img
        src={isDark ? "/brand/coverly-mark-light.png" : "/brand/coverly-mark.png"}
        alt=""
        aria-hidden="true"
        decoding="async"
        className={`${MARK_HEIGHT[size]} w-auto object-contain shrink-0`}
      />
      <span className="flex flex-col leading-none">
        <span
          className={`font-black tracking-[0.06em] uppercase ${TEXT_SIZE[size]} ${
            isDark ? "text-white" : "text-slate-950"
          }`}
        >
          COVERLY
        </span>
        {subtitle && (
          <span
            className={`text-[9px] font-bold tracking-widest uppercase mt-0.5 ${
              isDark ? "text-blue-300" : "text-[#1D4ED8]"
            }`}
          >
            {subtitle}
          </span>
        )}
      </span>
    </span>
  );
};
