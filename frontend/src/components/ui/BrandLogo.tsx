import React from "react";
import { Link } from "react-router-dom";

export type BrandLogoVariant = "icon" | "full" | "stacked";
export type BrandLogoTheme = "light" | "dark" | "white" | "auto";
export type BrandLogoSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface BrandLogoProps {
  variant?: BrandLogoVariant;
  theme?: BrandLogoTheme;
  size?: BrandLogoSize;
  iconOnly?: boolean;
  subtitle?: string;
  badge?: string;
  linkTo?: string | false | null;
  className?: string;
  imgClassName?: string;
  onClick?: () => void;
  ariaLabel?: string;
}

const sizeConfig: Record<
  BrandLogoSize,
  {
    iconH: string;
    textClass: string;
    subClass: string;
    gapClass: string;
  }
> = {
  xs: {
    iconH: "h-5 w-auto",
    textClass: "text-xs tracking-tight",
    subClass: "text-[8px] tracking-wider",
    gapClass: "gap-1.5",
  },
  sm: {
    iconH: "h-7 w-auto",
    textClass: "text-sm tracking-tight",
    subClass: "text-[9px] tracking-widest",
    gapClass: "gap-2",
  },
  md: {
    iconH: "h-9 w-auto",
    textClass: "text-lg tracking-tight",
    subClass: "text-[10px] tracking-widest",
    gapClass: "gap-2.5",
  },
  lg: {
    iconH: "h-11 w-auto",
    textClass: "text-2xl tracking-tight",
    subClass: "text-xs tracking-widest",
    gapClass: "gap-3",
  },
  xl: {
    iconH: "h-14 w-auto",
    textClass: "text-3xl tracking-tight",
    subClass: "text-xs tracking-widest",
    gapClass: "gap-3.5",
  },
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = "full",
  theme = "light",
  size = "md",
  iconOnly = false,
  subtitle,
  badge,
  linkTo,
  className = "",
  imgClassName = "",
  onClick,
  ariaLabel = "COVERLY Home",
}) => {
  const isIconOnly = iconOnly || variant === "icon";
  const isStacked = variant === "stacked";
  const { iconH, textClass, subClass, gapClass } = sizeConfig[size] || sizeConfig.md;

  // Choose icon source based on theme
  const iconSrc =
    theme === "white"
      ? "/brand/logo-icon-white.png"
      : "/brand/logo-icon.png";

  const textColorClass =
    theme === "dark" || theme === "white"
      ? "text-white"
      : "text-slate-900";

  const subColorClass =
    theme === "dark" || theme === "white"
      ? "text-blue-400"
      : "text-blue-700";

  const content = (
    <div
      className={`inline-flex items-center select-none ${
        isStacked ? "flex-col text-center gap-2" : `flex-row ${gapClass}`
      } ${className}`}
      onClick={onClick}
    >
      {/* Brand Icon Mark */}
      <img
        src={iconSrc}
        alt="COVERLY Mark"
        className={`${iconH} object-contain shrink-0 transition-transform duration-200 group-hover:scale-105 ${imgClassName}`}
        loading="eager"
        decoding="async"
      />

      {/* Brand Text Lockup */}
      {!isIconOnly && (
        <div className={`flex flex-col min-w-0 ${isStacked ? "items-center" : "items-start"}`}>
          <div className="flex items-center gap-1.5 leading-none">
            <span
              className={`font-black font-sans uppercase ${textClass} ${textColorClass} tracking-tight leading-none`}
              style={{ letterSpacing: "-0.02em" }}
            >
              COVERLY
            </span>
            {badge && (
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <span
              className={`font-bold uppercase ${subClass} ${subColorClass} mt-0.5 truncate leading-none`}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} aria-label={ariaLabel} className="group inline-flex items-center">
        {content}
      </Link>
    );
  }

  return content;
};

export default BrandLogo;
