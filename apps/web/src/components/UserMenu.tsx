import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { IconChevronDown, IconSettings, IconUser } from './ui/icons';
import { useAuth } from '../context/AuthContext';

export function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  if (!user) return null;

  const initial = user.username.charAt(0).toUpperCase();

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-solid)] px-2.5 py-1.5 text-sm transition-colors hover:bg-[var(--color-surface-hover)]"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-2)] text-xs font-bold text-white">
          {initial}
        </span>
        <span className="hidden max-w-[8rem] truncate font-medium sm:inline">{user.username}</span>
        <IconChevronDown width={16} height={16} className="text-[var(--color-muted)]" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-solid)] py-1 shadow-xl"
        >
          <div className="border-b border-[var(--color-border)] px-3 py-2.5">
            <p className="truncate text-sm font-semibold">{user.username}</p>
            <p className="text-xs text-[var(--color-muted)]">Administrator</p>
          </div>
          <Link
            to="/settings/account"
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-[var(--color-foreground)] hover:bg-[var(--color-surface-hover)]"
            onClick={() => setOpen(false)}
          >
            <IconSettings width={16} height={16} />
            Settings
          </Link>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-[var(--color-danger)] hover:bg-[var(--color-surface-hover)]"
            onClick={() => {
              setOpen(false);
              void logout();
            }}
          >
            <IconUser width={16} height={16} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
