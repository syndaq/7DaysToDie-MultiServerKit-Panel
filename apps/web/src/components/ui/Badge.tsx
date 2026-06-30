type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral';

const styles: Record<BadgeVariant, string> = {
  success: 'bg-[var(--color-success-soft)] text-[var(--color-success)]',
  danger: 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]',
  warning: 'bg-[var(--color-accent-soft)] text-[var(--color-warning)]',
  info: 'bg-[rgba(37,99,235,0.12)] text-[var(--color-info)]',
  neutral: 'bg-[var(--color-surface-2)] text-[var(--color-muted)]',
};

export function Badge({
  children,
  variant = 'neutral',
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[variant]}`}
    >
      {children}
    </span>
  );
}

export function StatusDot({ online, pulse = true }: { online: boolean; pulse?: boolean }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      {online && pulse && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-success)] opacity-40" />
      )}
      <span
        className={`relative inline-flex h-2.5 w-2.5 rounded-full ${online ? 'bg-[var(--color-success)] status-online' : 'bg-[var(--color-danger)]'}`}
      />
    </span>
  );
}
