import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-2)] text-white shadow-lg shadow-[var(--color-accent-glow)] hover:brightness-110',
  secondary:
    'glass-solid text-[var(--color-foreground)] hover:bg-[var(--color-surface-hover)]',
  ghost: 'text-[var(--color-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-foreground)]',
  danger: 'bg-[var(--color-danger-soft)] text-[var(--color-danger)] hover:brightness-95',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-sm gap-2',
};

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
