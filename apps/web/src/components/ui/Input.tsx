import type { InputHTMLAttributes, ReactNode } from 'react';

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  icon?: ReactNode;
}

export function Input({ label, hint, icon, className = '', id, ...props }: FieldProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');
  return (
    <label htmlFor={inputId} className="block text-sm">
      <span className="mb-1.5 block font-medium text-[var(--color-muted)]">{label}</span>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-2)]">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          className={`w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-solid)] px-3.5 py-2.5 text-sm text-[var(--color-foreground)] outline-none transition-all placeholder:text-[var(--color-muted-2)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)] ${icon ? 'pl-10' : ''} ${className}`}
          {...props}
        />
      </div>
      {hint && <span className="mt-1 block text-xs text-[var(--color-muted-2)]">{hint}</span>}
    </label>
  );
}

interface SelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  allowEmpty?: boolean;
  emptyLabel?: string;
}

export function Select({
  label,
  value,
  onChange,
  children,
  allowEmpty,
  emptyLabel = 'Select…',
}: SelectProps) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-[var(--color-muted)]">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full max-w-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-solid)] px-3.5 py-2.5 text-sm outline-none transition-all focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
      >
        {allowEmpty && <option value="">{emptyLabel}</option>}
        {children}
      </select>
    </label>
  );
}

interface TextareaProps {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}

export function Textarea({ label, hint, value, onChange, rows = 4 }: TextareaProps) {
  const inputId = label.toLowerCase().replace(/\s+/g, '-');
  return (
    <label htmlFor={inputId} className="block text-sm">
      <span className="mb-1.5 block font-medium text-[var(--color-muted)]">{label}</span>
      <textarea
        id={inputId}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-solid)] px-3.5 py-2.5 text-sm text-[var(--color-foreground)] outline-none transition-all placeholder:text-[var(--color-muted-2)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
      />
      {hint && <span className="mt-1 block text-xs text-[var(--color-muted-2)]">{hint}</span>}
    </label>
  );
}
