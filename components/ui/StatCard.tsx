interface StatCardProps {
  value: ReactNode;
  label: string;
  className?: string;
}

export function StatCard({ value, label, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-surface p-4 shadow-soft border border-[rgba(45,50,80,0.06)]",
        className
      )}
    >
      <div className="text-lg font-heading font-semibold text-ink">
        {value}
      </div>
      <div className="text-sm font-body text-ink-secondary">{label}</div>
    </div>
  );
}
