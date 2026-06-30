export function normalizePaged<T>(data: unknown): { items: T[]; total: number } {
  if (Array.isArray(data)) {
    return { items: data as T[], total: data.length };
  }
  const record = (data ?? {}) as Record<string, unknown>;
  const items = (record.items ??
    record.data ??
    record.records ??
    record.Items ??
    record.Data ??
    []) as T[];
  const total = Number(
    record.total ?? record.totalCount ?? record.Total ?? record.TotalCount ?? items.length,
  );
  return { items, total };
}

export function toDateTimeLocalValue(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function fromDateTimeLocalValue(value: string): string {
  if (!value) return new Date().toISOString();
  return new Date(value).toISOString();
}
