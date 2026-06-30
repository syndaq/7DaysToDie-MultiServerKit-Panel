import { PANEL_LINKS, PANEL_VERSION } from '../config/panel-meta';

const footerLinks = [
  { label: 'Help', href: PANEL_LINKS.help },
  { label: 'Docs', href: PANEL_LINKS.docs },
  { label: 'Repo', href: PANEL_LINKS.repo },
] as const;

export function SidebarFooter() {
  return (
    <div className="shrink-0 space-y-3 border-t border-[var(--color-border)] p-4">
      <div className="rounded-xl bg-[var(--color-surface-2)] px-3 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">Panel</p>
        <p className="mt-1 text-sm font-medium">v{PANEL_VERSION}</p>
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs">
          {footerLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-[var(--color-accent)] hover:underline"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
      <p className="px-1 text-center text-[11px] leading-relaxed text-[var(--color-muted-2)]">
        © {new Date().getFullYear()}{' '}
        <a href={PANEL_LINKS.syndaq} target="_blank" rel="noreferrer" className="hover:text-[var(--color-accent)] hover:underline">
          Syndaq
        </a>
      </p>
    </div>
  );
}
