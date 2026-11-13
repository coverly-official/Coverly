import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface StatCardProps {
  value: ReactNode;
  label: string;
  className?: string;
}

export function StatCard({ value, label, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-surface p-4 shadow-soft border border-[rgba(34,37,42,0.06)]",
        className
      )}
    >
      <div className="text-lg font-heading font-semibold text-ink">
        {value}
      </div>
      <div className="text-xs font-body text-ink-secondary mt-0.5">
        {label}
      </div>
    </div>
  );
}
