import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export function StatCard({ label, value, sub, icon, className = '' }: StatCardProps) {
  return (
    <div
      className={`glass group relative overflow-hidden rounded-2xl p-5 transition-transform duration-300 hover:-translate-y-0.5 ${className}`}
    >
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-[var(--color-accent-soft)] opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[var(--color-muted)]">{label}</p>
          <p className="mt-2 truncate text-3xl font-bold tracking-tight">{value}</p>
          {sub && <p className="mt-1 text-xs text-[var(--color-muted-2)]">{sub}</p>}
        </div>
        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
