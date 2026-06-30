import type { ReactNode } from 'react';

interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyFn: (row: T) => string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({ columns, data, keyFn, onRowClick }: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] ${col.className ?? ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={keyFn(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`border-b border-[var(--color-border)] last:border-0 transition-colors ${onRowClick ? 'cursor-pointer hover:bg-[var(--color-surface-hover)]' : 'hover:bg-[var(--color-surface-hover)]'}`}
            >
              {columns.map((col) => (
                <td key={col.key} className={`px-5 py-3.5 ${col.className ?? ''}`}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
