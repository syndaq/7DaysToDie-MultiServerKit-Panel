import { Button } from '../ui/Button';

type Action = {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  onClick: () => void;
  disabled?: boolean;
  highlight?: boolean;
};

export function PlayerToolbar({
  groups,
  disabled,
}: {
  groups: Action[][];
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-3 border-b border-[var(--color-border)] px-5 py-4">
      {groups.map((group, groupIndex) => (
        <div
          key={groupIndex}
          className="flex flex-wrap gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-2"
        >
          {group.map((action) => (
            <Button
              key={action.label}
              size="sm"
              variant={action.highlight ? 'primary' : action.variant ?? 'secondary'}
              disabled={disabled || action.disabled}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
        </div>
      ))}
    </div>
  );
}

export function SearchBar({
  value,
  onChange,
  onSearch,
  onReset,
}: {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3 border-b border-[var(--color-border)] px-5 py-4">
      <label className="min-w-[240px] flex-1 text-sm">
        <span className="mb-1.5 block font-medium text-[var(--color-muted)]">Keyword</span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          placeholder="Search by player name or ID…"
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-solid)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
        />
      </label>
      <Button onClick={onSearch}>Search</Button>
      <Button variant="secondary" onClick={onReset}>
        Reset
      </Button>
    </div>
  );
}
