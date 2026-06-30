import type { ReactNode } from 'react';

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: Array<{ id: string; label: string }>;
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="inline-flex rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-solid)] p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            active === tab.id
              ? 'bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-2)] text-white shadow-md shadow-[var(--color-accent-glow)]'
              : 'text-[var(--color-muted)] hover:text-[var(--color-foreground)]'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function PageShell({
  title,
  description,
  toolbar,
  children,
}: {
  title: string;
  description?: string;
  toolbar?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          {description && (
            <p className="mt-1.5 text-sm text-[var(--color-muted)] sm:text-[15px]">{description}</p>
          )}
        </div>
        {toolbar}
      </div>
      {children}
    </div>
  );
}
