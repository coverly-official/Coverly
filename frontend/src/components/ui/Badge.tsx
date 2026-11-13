import { cn } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";

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
      <ShieldCheck size={iconSize} strokeWidth={2} />
      Verified
    </span>
  );
}
