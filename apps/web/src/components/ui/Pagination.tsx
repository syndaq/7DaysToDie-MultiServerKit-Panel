import { Button } from './Button';
import { IconChevronLeft, IconChevronRight } from './icons';

export function PaginationBar({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--color-border)] px-5 py-4 text-sm">
      <p className="text-[var(--color-muted)]">
        Showing <span className="font-medium text-[var(--color-foreground)]">{start}</span>
        {' – '}
        <span className="font-medium text-[var(--color-foreground)]">{end}</span> of{' '}
        <span className="font-medium text-[var(--color-foreground)]">{total}</span>
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-[var(--color-muted)]">
          Rows
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-solid)] px-2 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
          >
            {[10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-1">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            icon={<IconChevronLeft width={14} height={14} />}
          >
            Prev
          </Button>
          <span className="min-w-[4rem] text-center text-[var(--color-muted)]">
            {page} / {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            icon={<IconChevronRight width={14} height={14} />}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

export type RowDensity = 'compact' | 'comfortable' | 'spacious';

export function DensityToggle({
  value,
  onChange,
}: {
  value: RowDensity;
  onChange: (value: RowDensity) => void;
}) {
  const options: Array<{ id: RowDensity; label: string }> = [
    { id: 'compact', label: 'Small' },
    { id: 'comfortable', label: 'Medium' },
    { id: 'spacious', label: 'Large' },
  ];

  return (
    <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
      <span>Row height</span>
      <div className="inline-flex rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-solid)] p-0.5">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              value === option.id
                ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                : 'hover:text-[var(--color-foreground)]'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
