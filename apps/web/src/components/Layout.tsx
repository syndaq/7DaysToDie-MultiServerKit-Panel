import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { mainNav } from '../config/navigation';
import { IconX, IconZap } from './ui/icons';
import { SidebarFooter } from './SidebarFooter';
import { TopBar } from './TopBar';

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <div className="flex shrink-0 items-center gap-3 px-5 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-2)] text-white shadow-lg shadow-[var(--color-accent-glow)]">
          <IconZap width={20} height={20} strokeWidth={2} />
        </div>
        <div>
          <p className="text-base font-bold tracking-tight">
            <span className="gradient-text">MultiServer</span>
            <span className="text-[var(--color-foreground)]">Kit</span>
          </p>
          <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-muted-2)]">
            Admin Panel
          </p>
        </div>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        <div className="flex flex-col gap-0.5">
          {mainNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)] shadow-sm'
                    : 'text-[var(--color-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-foreground)]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    width={18}
                    height={18}
                    className={isActive ? 'text-[var(--color-accent)]' : 'opacity-70 group-hover:opacity-100'}
                  />
                  <span className="truncate">{item.label}</span>
                  {isActive && (
                    <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <SidebarFooter />
    </>
  );
}

export function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="app-bg flex min-h-screen">
      <aside className="glass fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r lg:flex">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="glass absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col shadow-2xl">
            <button
              type="button"
              aria-label="Close menu"
              className="absolute right-3 top-5 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-muted)] hover:bg-[var(--color-surface-hover)]"
              onClick={() => setMobileOpen(false)}
            >
              <IconX width={18} height={18} />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-h-screen flex-1 flex-col lg:pl-64">
        <TopBar onOpenMobileMenu={() => setMobileOpen(true)} />

        <main className="flex-1 px-5 py-5 sm:px-6 lg:px-8 lg:py-6 xl:px-10">
          <div key={location.pathname} className="w-full min-w-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
