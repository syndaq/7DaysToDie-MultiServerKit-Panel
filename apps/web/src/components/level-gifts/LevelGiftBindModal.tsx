import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { ClusterSyncResult, LevelGiftRecord } from '@msk-panel/shared';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Toggle } from '../ui/Toggle';
import { api } from '../../lib/api';

type BindTab = 'items' | 'commands';

interface LevelGiftBindModalProps {
  gift: LevelGiftRecord;
  onClose: () => void;
  onSaved: (sync: ClusterSyncResult[]) => void;
}

type ItemDraft = { itemName: string; count: number; quality: number; durability: number; description: string };
type CommandDraft = { command: string; inMainThread: boolean; description: string };

export function LevelGiftBindModal({ gift, onClose, onSaved }: LevelGiftBindModalProps) {
  const [tab, setTab] = useState<BindTab>('items');
  const [items, setItems] = useState<ItemDraft[]>([]);
  const [commands, setCommands] = useState<CommandDraft[]>([]);
  const [itemDraft, setItemDraft] = useState<ItemDraft>({ itemName: '', count: 1, quality: 0, durability: 0, description: '' });
  const [commandDraft, setCommandDraft] = useState<CommandDraft>({ command: '', inMainThread: false, description: '' });

  useEffect(() => {
    setItems(gift.items.map((item) => ({
      itemName: item.itemName,
      count: item.count,
      quality: item.quality,
      durability: item.durability,
      description: item.description ?? '',
    })));
    setCommands(gift.commands.map((command) => ({
      command: command.command,
      inMainThread: command.inMainThread,
      description: command.description ?? '',
    })));
  }, [gift]);

  const saveMutation = useMutation({
    mutationFn: () =>
      api.updateLevelGiftBindings(gift.id, {
        items: items.map((item, index) => ({ ...item, sortOrder: index })),
        commands: commands.map((command, index) => ({ ...command, sortOrder: index })),
      }),
    onSuccess: (result) => {
      onSaved(result.sync);
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-label="Close" onClick={onClose} />
      <div className="relative z-10 flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-solid)] shadow-2xl">
        <div className="border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="text-lg font-semibold">Bind rewards — {gift.name}</h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">Level {gift.requiredLevel} · {gift.giftType}</p>
        </div>
        <div className="flex gap-2 border-b border-[var(--color-border)] px-5 py-3">
          {(['items', 'commands'] as BindTab[]).map((nextTab) => (
            <button key={nextTab} type="button" onClick={() => setTab(nextTab)} className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === nextTab ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : 'text-[var(--color-muted)]'}`}>
              {nextTab === 'items' ? `Items (${items.length})` : `Commands (${commands.length})`}
            </button>
          ))}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {tab === 'items' ? (
            <div className="space-y-4">
              <div className="grid gap-3 lg:grid-cols-2">
                <Input label="Item name" value={itemDraft.itemName} onChange={(e) => setItemDraft({ ...itemDraft, itemName: e.target.value })} />
                <Input label="Count" type="number" min={1} value={itemDraft.count} onChange={(e) => setItemDraft({ ...itemDraft, count: Number(e.target.value) })} />
              </div>
              <Button variant="secondary" onClick={() => {
                if (!itemDraft.itemName.trim()) return;
                setItems((prev) => [...prev, itemDraft]);
                setItemDraft({ itemName: '', count: 1, quality: 0, durability: 0, description: '' });
              }}>Add item</Button>
              <ul className="space-y-2">
                {items.map((item, index) => (
                  <li key={`${item.itemName}-${index}`} className="flex items-center justify-between rounded-xl border border-[var(--color-border)] px-4 py-3">
                    <span className="font-medium">{item.itemName} ×{item.count}</span>
                    <Button variant="ghost" size="sm" className="!text-[var(--color-danger)]" onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}>Remove</Button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="space-y-4">
              <Input label="Command" value={commandDraft.command} onChange={(e) => setCommandDraft({ ...commandDraft, command: e.target.value })} />
              <label className="flex items-center gap-3 text-sm">
                <Toggle checked={commandDraft.inMainThread} onChange={(v) => setCommandDraft({ ...commandDraft, inMainThread: v })} />
                Run on main thread
              </label>
              <Button variant="secondary" onClick={() => {
                if (!commandDraft.command.trim()) return;
                setCommands((prev) => [...prev, commandDraft]);
                setCommandDraft({ command: '', inMainThread: false, description: '' });
              }}>Add command</Button>
              <ul className="space-y-2">
                {commands.map((command, index) => (
                  <li key={`${command.command}-${index}`} className="flex items-center justify-between rounded-xl border border-[var(--color-border)] px-4 py-3">
                    <span className="font-mono text-sm">{command.command}</span>
                    <Button variant="ghost" size="sm" className="!text-[var(--color-danger)]" onClick={() => setCommands((prev) => prev.filter((_, i) => i !== index))}>Remove</Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-[var(--color-border)] px-5 py-4">
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving…' : 'Save bindings'}
          </Button>
        </div>
      </div>
    </div>
  );
}
