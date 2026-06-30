import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useModSettings<T>(
  serverId: string,
  settingsName: string,
  defaultSettings: T,
  normalize: (data: unknown) => T,
) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<T>(defaultSettings);
  const queryKey = ['mod-settings', settingsName, serverId];

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey,
    queryFn: () => api.getModSettings<unknown>(serverId, settingsName),
    enabled: !!serverId,
  });

  useEffect(() => {
    if (data) setForm(normalize(data));
    // normalize is a stable module import; omit from deps to avoid redundant resets.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () => api.putModSettings(serverId, settingsName, form),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      const defaults = await api.resetModSettings<unknown>(serverId, settingsName);
      const normalized = normalize(defaults);
      await api.putModSettings(serverId, settingsName, normalized);
      return normalized;
    },
    onSuccess: (normalized) => {
      setForm(normalized);
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    form,
    setForm,
    isLoading,
    error,
    refetch,
    isFetching,
    saveMutation,
    resetMutation,
  };
}
