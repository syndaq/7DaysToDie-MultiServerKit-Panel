import { ThemeToggle } from './ui/ThemeToggle';
import { UserMenu } from './UserMenu';
import { IconMenu } from './ui/icons';

interface TopBarProps {
  onOpenMobileMenu?: () => void;
}

export function TopBar({ onOpenMobileMenu }: TopBarProps) {
  return (
    <header className="glass sticky top-0 z-30 flex h-14 shrink-0 items-center justify-end gap-3 border-b border-[var(--color-border)] px-4 sm:px-6 lg:px-8">
      {onOpenMobileMenu && (
        <button
          type="button"
          aria-label="Open menu"
          className="mr-auto flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-border)] text-[var(--color-muted)] lg:hidden"
          onClick={onOpenMobileMenu}
        >
          <IconMenu width={18} height={18} />
        </button>
      )}
      <ThemeToggle />
      <UserMenu />
    </header>
  );
}
