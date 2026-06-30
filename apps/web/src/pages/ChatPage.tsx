import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ModChatRecord } from '@msk-panel/shared';
import { ServerSelector } from '../components/ServerSelector';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { DataTable } from '../components/ui/DataTable';
import { Input } from '../components/ui/Input';
import { PaginationBar } from '../components/ui/Pagination';
import { ErrorBanner, LoadingState } from '../components/ui/PageHeader';
import { PageShell } from '../components/ui/PageShell';
import { api } from '../lib/api';
import { fromDateTimeLocalValue } from '../lib/points-utils';

export function ChatPage() {
  const queryClient = useQueryClient();
  const [serverId, setServerId] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [chatType, setChatType] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [globalMessage, setGlobalMessage] = useState('');
  const [senderName, setSenderName] = useState('');

  const { data: servers } = useQuery({ queryKey: ['servers'], queryFn: api.getServers });

  const recordsQuery = useQuery({
    queryKey: ['chat-records', serverId, page, pageSize, appliedKeyword, chatType, start, end],
    queryFn: () =>
      api.getChatRecords(serverId, {
        pageNumber: page,
        pageSize,
        keyword: appliedKeyword || undefined,
        chatType: chatType || undefined,
        startDateTime: start ? fromDateTimeLocalValue(start) : undefined,
        endDateTime: end ? fromDateTimeLocalValue(end) : undefined,
      }),
    enabled: !!serverId,
  });

  const sendMutation = useMutation({
    mutationFn: () => api.sendGlobalMessage(serverId, globalMessage, senderName || undefined),
    onSuccess: () => {
      setGlobalMessage('');
      queryClient.invalidateQueries({ queryKey: ['chat-records', serverId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (ids: number[]) => api.deleteChatRecords(serverId, ids),
    onSuccess: () => {
      setSelected(new Set());
      queryClient.invalidateQueries({ queryKey: ['chat-records', serverId] });
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: () => api.deleteChatRecords(serverId, [], true),
    onSuccess: () => {
      setSelected(new Set());
      queryClient.invalidateQueries({ queryKey: ['chat-records', serverId] });
    },
  });

  const rows = recordsQuery.data?.items ?? [];
  const total = recordsQuery.data?.total ?? 0;

  return (
    <PageShell
      title="Game chat"
      description="Search chat history and send global messages to a selected server."
      toolbar={
        <ServerSelector
          servers={servers ?? []}
          value={serverId}
          onChange={(id) => {
            setServerId(id);
            setPage(1);
            setSelected(new Set());
          }}
          emptyLabel="Select a game server…"
        />
      }
    >
      {!serverId ? (
        <Card>
          <p className="py-16 text-center text-[var(--color-muted)]">
            Select a game server to view chat records.
          </p>
        </Card>
      ) : (
        <div className="space-y-5">
          <Card>
            <CardHeader title="Send global message" description="Broadcast a message to all players." />
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Sender name (optional)"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
              />
              <Input
                label="Message"
                className="md:col-span-2"
                value={globalMessage}
                onChange={(e) => setGlobalMessage(e.target.value)}
              />
            </div>
            <div className="mt-4 flex gap-3">
              <Button
                onClick={() => sendMutation.mutate()}
                disabled={!globalMessage.trim() || sendMutation.isPending}
              >
                {sendMutation.isPending ? 'Sending…' : 'Send message'}
              </Button>
            </div>
            {sendMutation.error && (
              <div className="mt-4">
                <ErrorBanner message={(sendMutation.error as Error).message} />
              </div>
            )}
          </Card>

          <Card padding={false} className="overflow-hidden">
            <div className="border-b border-[var(--color-border)] px-5 py-4">
              <h2 className="font-semibold">Chat records</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <Input
                  label="Keyword"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
                <Input
                  label="Chat type"
                  value={chatType}
                  onChange={(e) => setChatType(e.target.value)}
                  hint="Global, Whisper, etc."
                />
                <Input
                  label="Start"
                  type="datetime-local"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
                <Input
                  label="End"
                  type="datetime-local"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  onClick={() => {
                    setAppliedKeyword(keyword);
                    setPage(1);
                  }}
                >
                  Search
                </Button>
                <Button
                  variant="secondary"
                  disabled={selected.size === 0 || deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate([...selected])}
                >
                  Delete selected
                </Button>
                <Button
                  variant="danger"
                  disabled={deleteAllMutation.isPending}
                  onClick={() => {
                    if (window.confirm('Delete all chat records on this server?')) {
                      deleteAllMutation.mutate();
                    }
                  }}
                >
                  Delete all
                </Button>
              </div>
            </div>

            {recordsQuery.isLoading ? (
              <LoadingState label="Loading chat records…" />
            ) : recordsQuery.error ? (
              <div className="p-4">
                <ErrorBanner message={(recordsQuery.error as Error).message} />
              </div>
            ) : (
              <>
                <DataTable<ModChatRecord>
                  keyFn={(row) => String(row.id)}
                  data={rows}
                  columns={[
                    {
                      key: 'select',
                      header: '',
                      render: (row) => (
                        <input
                          type="checkbox"
                          checked={selected.has(row.id)}
                          onChange={(e) => {
                            setSelected((prev) => {
                              const next = new Set(prev);
                              if (e.target.checked) next.add(row.id);
                              else next.delete(row.id);
                              return next;
                            });
                          }}
                        />
                      ),
                    },
                    {
                      key: 'time',
                      header: 'Time',
                      render: (row) => (
                        <span className="text-xs text-[var(--color-muted)]">
                          {row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}
                        </span>
                      ),
                    },
                    { key: 'sender', header: 'Sender', render: (row) => row.senderName },
                    { key: 'type', header: 'Type', render: (row) => row.chatType },
                    { key: 'message', header: 'Message', render: (row) => row.message },
                  ]}
                />
                <PaginationBar
                  page={page}
                  pageSize={pageSize}
                  total={total}
                  onPageChange={setPage}
                  onPageSizeChange={(size) => {
                    setPageSize(size);
                    setPage(1);
                  }}
                />
              </>
            )}
          </Card>
        </div>
      )}
    </PageShell>
  );
}
