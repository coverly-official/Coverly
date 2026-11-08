import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "coral" | "whatsapp";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-heading font-medium transition-all duration-200",
        "active:scale-[0.98] active:translate-y-[1px]",
        /* Primary: navy bg, white text */
        variant === "primary" &&
          "bg-navy text-white hover:bg-[#2a3048] shadow-soft hover:shadow-card",
        /* Ghost: transparent, navy border */
        variant === "ghost" &&
          "border border-[rgba(34,37,42,0.15)] text-ink hover:bg-surface-muted",
        /* Coral pill (nav CTA) */
        variant === "coral" &&
          "bg-coral text-white hover:bg-[#e55d4d] shadow-soft hover:shadow-card",
        /* WhatsApp */
        variant === "whatsapp" &&
          "bg-whatsapp text-white hover:bg-[#20bd5a] shadow-soft",
        /* Sizes */
        size === "sm" && "px-4 py-2 text-sm",
        size === "md" && "px-6 py-2.5 text-sm",
        size === "lg" && "px-8 py-3 text-base",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
