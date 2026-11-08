interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "coral" | "whatsapp";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
  className?: string;
  ...props: any;
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
        "inline-flex items-center justify-center gap-2 rounded-full font-heading font-semibold transition-colors active:scale-[0.98] active:translate-y-[1px]",
        /* Primary: navy bg, white text */
        variant === "primary" &&
          "bg-navy text-white hover:bg-[#424769] shadow-soft hover:shadow-card",
        /* Ghost: transparent, navy border */
        variant === "ghost" &&
          "border border-[rgba(45,50,80,0.2)] text-ink hover:bg-surface-muted",
        /* Coral pill (nav CTA) */
        variant === "coral" &&
          "bg-coral text-white hover:bg-[#e8a06a] shadow-soft hover:shadow-card",
        /* WhatsApp */
        variant === "whatsapp" &&
          "bg-whatsapp text-white hover:bg-[#424769] shadow-soft hover:shadow-card",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
