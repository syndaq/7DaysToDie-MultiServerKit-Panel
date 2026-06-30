import { useTheme } from './theme';
import { IconMoon, IconSun } from './icons';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-solid)] text-[var(--color-muted)] transition-all hover:border-[var(--color-border-strong)] hover:text-[var(--color-foreground)]"
    >
      {theme === 'dark' ? <IconSun width={18} height={18} /> : <IconMoon width={18} height={18} />}
    </button>
  );
}
