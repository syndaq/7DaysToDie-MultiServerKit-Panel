import type { GameServerRecord } from '@msk-panel/shared';
import { Select } from './ui/Input';

interface ServerSelectorProps {
  servers: GameServerRecord[];
  value: string;
  onChange: (serverId: string) => void;
  allowEmpty?: boolean;
  emptyLabel?: string;
}

export function ServerSelector({
  servers,
  value,
  onChange,
  allowEmpty = false,
  emptyLabel = 'Select a server…',
}: ServerSelectorProps) {
  return (
    <Select
      label="Game server"
      value={value}
      onChange={onChange}
      allowEmpty={allowEmpty}
      emptyLabel={emptyLabel}
    >
      {servers.map((server) => (
        <option key={server.id} value={server.id}>
          {server.name} ({server.serverId})
        </option>
      ))}
    </Select>
  );
}
