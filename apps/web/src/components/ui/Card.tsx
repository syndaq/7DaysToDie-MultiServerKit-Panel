import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: boolean;
  glow?: boolean;
}

export function Card({ children, className = '', padding = true, glow = false }: CardProps) {
  return (
    <div
      className={`glass rounded-2xl ${glow ? 'gradient-border' : ''} ${padding ? 'p-5' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-[var(--color-muted)]">{description}</p>}
      </div>
      {action}
    </div>
  );
}
