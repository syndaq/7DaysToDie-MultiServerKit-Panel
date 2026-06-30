import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ModCommandListEntry, ModTaskSchedule } from '@msk-panel/shared';
import { ServerSelector } from '../components/ServerSelector';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { DataTable } from '../components/ui/DataTable';
import { Input, Textarea } from '../components/ui/Input';
import { Toggle } from '../components/ui/Toggle';
import { ErrorBanner, LoadingState } from '../components/ui/PageHeader';
import { PageShell, Tabs } from '../components/ui/PageShell';
import { useModSettings } from '../hooks/useModSettings';
import { api } from '../lib/api';
import {
  defaultTaskScheduleSettings,
  normalizeTaskScheduleSettings,
} from '../lib/mod-settings';
import { ModSettingsActions } from '../components/server/ModSettingsActions';

type TabId = 'settings' | 'schedules';

function TaskScheduleSettingsTab({ serverId }: { serverId: string }) {
  const hook = useModSettings(
    serverId,
    'TaskSchedule',
    defaultTaskScheduleSettings,
    normalizeTaskScheduleSettings,
  );
  if (hook.isLoading) return <LoadingState label="Loading task schedule settings…" />;
  if (hook.error) return <ErrorBanner message={(hook.error as Error).message} />;

  return (
    <Card>
      <CardHeader
        title="Task schedule settings"
        description="Enable or disable the scheduled task system on this server."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={hook.form.isEnabled ? 'success' : 'neutral'}>
              {hook.form.isEnabled ? 'Enabled' : 'Disabled'}
            </Badge>
            <Toggle
              checked={hook.form.isEnabled}
              onChange={(value) => hook.setForm((prev) => ({ ...prev, isEnabled: value }))}
            />
            <ModSettingsActions
              onSave={() => hook.saveMutation.mutate()}
              onReset={() => hook.resetMutation.mutate()}
              saving={hook.saveMutation.isPending}
              resetting={hook.resetMutation.isPending}
            />
          </div>
        }
      />
    </Card>
  );
}

function TaskSchedulesTab({ serverId }: { serverId: string }) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [bindingTaskId, setBindingTaskId] = useState<number | null>(null);
  const [selectedCommandIds, setSelectedCommandIds] = useState<Set<number>>(new Set());
  const [name, setName] = useState('');
  const [cronExpression, setCronExpression] = useState('0 0 * * *');
  const [description, setDescription] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);

  const schedulesQuery = useQuery({
    queryKey: ['task-schedules', serverId],
    queryFn: () => api.getTaskSchedules(serverId),
  });

  const commandsQuery = useQuery({
    queryKey: ['command-list-all', serverId],
    queryFn: () => api.getCommandList(serverId, { pageNumber: 1, pageSize: 500 }),
    enabled: bindingTaskId != null,
  });

  const boundQuery = useQuery({
    queryKey: ['task-schedule-commands', serverId, bindingTaskId],
    queryFn: () => api.getTaskScheduleCommands(serverId, bindingTaskId!),
    enabled: bindingTaskId != null,
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = { name, cronExpression, isEnabled, description: description || undefined };
      return editingId
        ? api.updateTaskSchedule(serverId, editingId, payload)
        : api.createTaskSchedule(serverId, payload);
    },
    onSuccess: () => {
      setEditingId(null);
      setName('');
      setCronExpression('0 0 * * *');
      setDescription('');
      setIsEnabled(true);
      queryClient.invalidateQueries({ queryKey: ['task-schedules', serverId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteTaskSchedule(serverId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['task-schedules', serverId] }),
  });

  const bindMutation = useMutation({
    mutationFn: () => api.setTaskScheduleCommands(serverId, bindingTaskId!, [...selectedCommandIds]),
    onSuccess: () => {
      setBindingTaskId(null);
      setSelectedCommandIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['task-schedule-commands', serverId] });
    },
  });

  const startEdit = (row: ModTaskSchedule) => {
    setEditingId(row.id);
    setName(row.name);
    setCronExpression(row.cronExpression);
    setDescription(row.description ?? '');
    setIsEnabled(row.isEnabled);
  };

  const openBind = (taskId: number) => {
    setBindingTaskId(taskId);
    setSelectedCommandIds(new Set());
  };

  if (schedulesQuery.isLoading) return <LoadingState label="Loading schedules…" />;
  if (schedulesQuery.error) return <ErrorBanner message={(schedulesQuery.error as Error).message} />;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title={editingId ? 'Edit schedule' : 'New schedule'} description="Cron expression uses standard 5-field syntax." />
        <div className="grid gap-3 md:grid-cols-2">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Cron expression" value={cronExpression} onChange={(e) => setCronExpression(e.target.value)} />
          <div className="md:col-span-2">
            <Textarea label="Description" rows={2} value={description} onChange={setDescription} />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-[var(--color-border)] px-4 py-3 md:col-span-2">
            <span className="text-sm font-medium">Enabled</span>
            <Toggle checked={isEnabled} onChange={setIsEnabled} />
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <Button onClick={() => saveMutation.mutate()} disabled={!name || !cronExpression || saveMutation.isPending}>
            {editingId ? 'Update schedule' : 'Create schedule'}
          </Button>
          {editingId && (
            <Button variant="secondary" onClick={() => setEditingId(null)}>
              Cancel
            </Button>
          )}
        </div>
      </Card>

      <Card padding={false} className="overflow-hidden">
        <DataTable<ModTaskSchedule>
          keyFn={(row) => String(row.id)}
          data={schedulesQuery.data ?? []}
          columns={[
            { key: 'name', header: 'Name', render: (row) => row.name },
            { key: 'cron', header: 'Cron', render: (row) => <span className="font-mono text-xs">{row.cronExpression}</span> },
            {
              key: 'desc',
              header: 'Schedule',
              render: (row) => row.expressionDescription ?? '—',
            },
            {
              key: 'enabled',
              header: 'Status',
              render: (row) => (
                <Badge variant={row.isEnabled ? 'success' : 'neutral'}>
                  {row.isEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              ),
            },
            {
              key: 'actions',
              header: '',
              render: (row) => (
                <div className="flex flex-wrap gap-2">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(row)}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openBind(row.id)}>
                    Commands
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="!text-[var(--color-danger)]"
                    onClick={() => deleteMutation.mutate(row.id)}
                  >
                    Delete
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </Card>

      {bindingTaskId != null && (
        <Card>
          <CardHeader
            title={`Bind commands to schedule #${bindingTaskId}`}
            description="Select command list entries to run when this schedule fires."
          />
          {commandsQuery.isLoading || boundQuery.isLoading ? (
            <LoadingState label="Loading commands…" />
          ) : (
            <div className="space-y-2">
              {(commandsQuery.data?.items ?? []).map((cmd: ModCommandListEntry) => (
                <label key={cmd.id} className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] px-4 py-2">
                  <input
                    type="checkbox"
                    checked={selectedCommandIds.has(cmd.id)}
                    onChange={(e) => {
                      setSelectedCommandIds((prev) => {
                        const next = new Set(prev);
                        if (e.target.checked) next.add(cmd.id);
                        else next.delete(cmd.id);
                        return next;
                      });
                    }}
                  />
                  <span className="font-mono text-xs">{cmd.command}</span>
                  <span className="text-sm text-[var(--color-muted)]">{cmd.description}</span>
                </label>
              ))}
              {boundQuery.data && boundQuery.data.length > 0 && selectedCommandIds.size === 0 && (
                <p className="text-sm text-[var(--color-muted)]">
                  Currently bound: {boundQuery.data.map((c) => c.command).join(', ')}
                </p>
              )}
            </div>
          )}
          <div className="mt-4 flex gap-3">
            <Button onClick={() => bindMutation.mutate()} disabled={bindMutation.isPending}>
              Save bindings
            </Button>
            <Button variant="secondary" onClick={() => setBindingTaskId(null)}>
              Close
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

export function TaskSchedulePage() {
  const [serverId, setServerId] = useState('');
  const [tab, setTab] = useState<TabId>('settings');
  const { data: servers } = useQuery({ queryKey: ['servers'], queryFn: api.getServers });

  return (
    <PageShell
      title="Task schedule"
      description="Cron-style scheduled console commands for maintenance and events."
      toolbar={
        <div className="flex flex-wrap items-end gap-4">
          <ServerSelector
            servers={servers ?? []}
            value={serverId}
            onChange={setServerId}
            emptyLabel="Select a game server…"
          />
          {serverId && (
            <Tabs
              tabs={[
                { id: 'settings', label: 'Settings' },
                { id: 'schedules', label: 'Schedules' },
              ]}
              active={tab}
              onChange={(next) => setTab(next as TabId)}
            />
          )}
        </div>
      }
    >
      {!serverId ? (
        <Card>
          <p className="py-16 text-center text-[var(--color-muted)]">
            Select a game server to manage scheduled tasks.
          </p>
        </Card>
      ) : tab === 'settings' ? (
        <TaskScheduleSettingsTab serverId={serverId} />
      ) : (
        <TaskSchedulesTab serverId={serverId} />
      )}
    </PageShell>
  );
}
