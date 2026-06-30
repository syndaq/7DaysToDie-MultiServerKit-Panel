import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ModBackupFile } from '@msk-panel/shared';
import { Button } from '../ui/Button';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ErrorBanner, LoadingState } from '../ui/PageHeader';
import { api } from '../../lib/api';
import { formatBytes } from '../../lib/mod-settings';
import { IconRefresh } from '../ui/icons';

function formatBackupDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export function BackupFilesTab({ serverId }: { serverId: string }) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string[]>([]);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['backup-files', serverId],
    queryFn: () => api.getBackupFiles(serverId),
    enabled: !!serverId,
  });

  const files = useMemo(() => data ?? [], [data]);
  const allSelected = files.length > 0 && selected.length === files.length;

  const backupMutation = useMutation({
    mutationFn: () => api.triggerManualBackup(serverId),
    onSuccess: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['backup-files', serverId] });
      }, 1500);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (fileNames: string[]) => api.deleteBackupFiles(serverId, fileNames),
    onSuccess: () => {
      setSelected([]);
      queryClient.invalidateQueries({ queryKey: ['backup-files', serverId] });
    },
  });

  const toggleAll = () => {
    if (allSelected) {
      setSelected([]);
      return;
    }
    setSelected(files.map((file) => file.name));
  };

  const toggleOne = (name: string) => {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name],
    );
  };

  if (isLoading) return <LoadingState label="Loading backup archives…" />;
  if (error) return <ErrorBanner message={(error as Error).message} />;

  return (
    <Card padding={false}>
      <div className="border-b border-[var(--color-border)] p-5">
        <CardHeader
          title="Backup archives"
          description="Manual backups and scheduled archive files stored on the game server."
          action={
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="ghost" size="sm" icon={<IconRefresh />} onClick={() => refetch()}>
                {isFetching ? 'Refreshing…' : 'Refresh'}
              </Button>
              <Button
                onClick={() => backupMutation.mutate()}
                disabled={backupMutation.isPending}
              >
                {backupMutation.isPending ? 'Starting backup…' : 'Run manual backup'}
              </Button>
              <Button
                variant="danger"
                disabled={selected.length === 0 || deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(selected)}
              >
                {deleteMutation.isPending ? 'Deleting…' : `Delete selected (${selected.length})`}
              </Button>
            </div>
          }
        />

        {(backupMutation.error || deleteMutation.error) && (
          <ErrorBanner
            message={((backupMutation.error ?? deleteMutation.error) as Error).message}
          />
        )}
        {backupMutation.isSuccess && (
          <p className="mt-3 text-sm text-[var(--color-success)]">
            Manual backup started. Refresh the list in a few seconds to see the new archive.
          </p>
        )}
      </div>

      {files.length === 0 ? (
        <p className="px-5 py-16 text-center text-sm text-[var(--color-muted)]">
          No backup archives found in the configured folder.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface-solid)] text-[var(--color-muted)]">
              <tr>
                <th className="px-5 py-3 font-medium">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Select all backups"
                  />
                </th>
                <th className="px-5 py-3 font-medium">File</th>
                <th className="px-5 py-3 font-medium">Created</th>
                <th className="px-5 py-3 font-medium">Size</th>
                <th className="px-5 py-3 font-medium">Version</th>
                <th className="px-5 py-3 font-medium">World</th>
                <th className="px-5 py-3 font-medium">Save</th>
                <th className="px-5 py-3 font-medium">Progress</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file: ModBackupFile) => (
                <tr
                  key={file.name}
                  className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-surface-hover)]"
                >
                  <td className="px-5 py-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(file.name)}
                      onChange={() => toggleOne(file.name)}
                      aria-label={`Select ${file.name}`}
                    />
                  </td>
                  <td className="px-5 py-3 font-medium">{file.name}</td>
                  <td className="px-5 py-3 text-[var(--color-muted)]">
                    {formatBackupDate(file.createdAt)}
                  </td>
                  <td className="px-5 py-3">{formatBytes(file.size)}</td>
                  <td className="px-5 py-3">
                    <Badge variant="neutral">{file.serverVersion}</Badge>
                  </td>
                  <td className="px-5 py-3">{file.gameWorld}</td>
                  <td className="px-5 py-3">{file.gameName}</td>
                  <td className="px-5 py-3 text-[var(--color-muted)]">
                    Day {file.days}, {file.hours}h
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
