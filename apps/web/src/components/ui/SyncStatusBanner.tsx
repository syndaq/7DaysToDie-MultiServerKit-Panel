import type { ClusterSyncResult } from '@msk-panel/shared';

export function SyncStatusBanner({ sync }: { sync?: ClusterSyncResult[] }) {
  if (!sync || sync.length === 0) {
    return (
      <p className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm text-[var(--color-muted)]">
        Saved to the cluster database. No game servers are registered yet, so nothing was pushed to mods.
      </p>
    );
  }

  const failed = sync.filter((entry) => !entry.success);
  const succeeded = sync.filter((entry) => entry.success);

  return (
    <div className="mt-4 space-y-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm">
      <p className="font-medium text-[var(--color-foreground)]">
        Synced to {succeeded.length}/{sync.length} server{sync.length === 1 ? '' : 's'}
      </p>
      {failed.length > 0 && (
        <ul className="space-y-1 text-[var(--color-danger)]">
          {failed.map((entry) => (
            <li key={entry.serverId}>
              {entry.serverName}: {entry.error ?? 'Sync failed'}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
