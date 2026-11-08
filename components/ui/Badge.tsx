interface VerifiedBadgeProps {
  className?: string;
  size?: "sm" | "md";
}

export function VerifiedBadge({ className, size = "sm" }: VerifiedBadgeProps) {
  const iconSize = size === "sm" ? 12 : 14;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-verified/10 text-verified font-body",
        size === "sm" && "px-2 py-0.5 text-[11px] font-medium",
        size === "md" && "px-2.5 py-1 text-xs font-medium",
        className
      )}
      aria-label="Verified supplier"
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-4 h-4"
      >
        <path
          d="M12 2L9.19 8.63L3.5 11.27L8.5 14.5L10.5 21L13.5 14.5L18.5 11.27L12.81 8.63L12 2ZM12 4.95L14.1 9.2L18.05 11.2L13.5 13.3L15.5 18.05L12 14.7L8.5 18.05L10.5 13.3L6 11.2L9.9 9.2L12 4.95Z"
          fill="currentColor"
        />
      </svg>
      <span className="text-[11px]">Verified</span>
    </span>
  );
}
