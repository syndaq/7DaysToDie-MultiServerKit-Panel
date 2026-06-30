import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export function ServersPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    serverId: '',
    name: '',
    apiUrl: 'http://127.0.0.1:8888',
    apiKey: '',
  });

  const { data: servers, isLoading } = useQuery({
    queryKey: ['servers'],
    queryFn: api.getServers,
  });

  const createMutation = useMutation({
    mutationFn: api.createServer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      queryClient.invalidateQueries({ queryKey: ['health'] });
      setShowForm(false);
      setForm({ serverId: '', name: '', apiUrl: 'http://127.0.0.1:8888', apiKey: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteServer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      queryClient.invalidateQueries({ queryKey: ['health'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Game servers</h1>
          <p className="mt-1 text-sm text-[--color-muted]">
            Register mod API endpoints for each 7DTD dedicated server
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-[--color-accent] px-4 py-2 text-sm font-medium text-white hover:bg-[--color-accent-hover]"
        >
          {showForm ? 'Cancel' : 'Add server'}
        </button>
      </div>

      {showForm && (
        <form
          className="space-y-4 rounded-xl border border-[--color-border] bg-[--color-surface] p-5"
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate(form);
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-[--color-muted]">Server ID</span>
              <input
                required
                className="mt-1 w-full rounded-lg border border-[--color-border] bg-[--color-surface-2] px-3 py-2"
                value={form.serverId}
                onChange={(e) => setForm({ ...form, serverId: e.target.value })}
                placeholder="us-pve-01"
              />
            </label>
            <label className="block text-sm">
              <span className="text-[--color-muted]">Display name</span>
              <input
                required
                className="mt-1 w-full rounded-lg border border-[--color-border] bg-[--color-surface-2] px-3 py-2"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="US PvE #1"
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="text-[--color-muted]">Mod API URL</span>
              <input
                required
                type="url"
                className="mt-1 w-full rounded-lg border border-[--color-border] bg-[--color-surface-2] px-3 py-2"
                value={form.apiUrl}
                onChange={(e) => setForm({ ...form, apiUrl: e.target.value })}
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="text-[--color-muted]">Panel API key (must match mod PanelApiKey)</span>
              <input
                required
                type="password"
                className="mt-1 w-full rounded-lg border border-[--color-border] bg-[--color-surface-2] px-3 py-2"
                value={form.apiKey}
                onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
              />
            </label>
          </div>
          {createMutation.isError && (
            <p className="text-sm text-[--color-danger]">
              {(createMutation.error as Error).message}
            </p>
          )}
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="rounded-lg bg-[--color-accent] px-4 py-2 text-sm font-medium text-white hover:bg-[--color-accent-hover] disabled:opacity-50"
          >
            {createMutation.isPending ? 'Saving…' : 'Save server'}
          </button>
        </form>
      )}

      <section className="rounded-xl border border-[--color-border] bg-[--color-surface]">
        {isLoading ? (
          <p className="px-5 py-8 text-sm text-[--color-muted]">Loading…</p>
        ) : servers?.length === 0 ? (
          <p className="px-5 py-8 text-sm text-[--color-muted]">No servers registered.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[--color-border] text-[--color-muted]">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Server ID</th>
                <th className="px-5 py-3 font-medium">API URL</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[--color-border]">
              {servers?.map((server) => (
                <tr key={server.id}>
                  <td className="px-5 py-3 font-medium">{server.name}</td>
                  <td className="px-5 py-3 text-[--color-muted]">{server.serverId}</td>
                  <td className="px-5 py-3 text-[--color-muted]">{server.apiUrl}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Remove ${server.name}?`)) {
                          deleteMutation.mutate(server.id);
                        }
                      }}
                      className="text-[--color-danger] hover:underline"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
