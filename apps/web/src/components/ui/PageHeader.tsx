import type { ReactNode } from 'react';

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="animate-fade-up">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-[15px] leading-relaxed text-[var(--color-muted)]">
            {description}
          </p>
        )}
      </div>
      {action && <div className="animate-fade-up stagger-1">{action}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-[var(--color-muted)]">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 px-6 py-12 text-sm text-[var(--color-muted)]">
      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)]" />
      {label}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-danger)]/20 bg-[var(--color-danger-soft)] px-4 py-3 text-sm text-[var(--color-danger)]">
      {message}
    </div>
  );
}
