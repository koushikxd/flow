import { useState, useEffect, useCallback } from 'react';
import { listen } from '@tauri-apps/api/event';
import type { TrackingSpace } from '@/lib/types';
import * as api from '@/lib/tauri';

export function useSpaces() {
  const [spaces, setSpaces] = useState<TrackingSpace[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await api.getSpaces();
      setSpaces(data);
    } catch (error) {
      console.error('Failed to load spaces:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    
    const unlisten = listen('tracking-changed', () => {
      refresh();
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [refresh]);

  const create = useCallback(async (name: string, color: string) => {
    const newSpace = await api.createSpace(name, color);
    setSpaces((prev) => [...prev, newSpace]);
    return newSpace;
  }, []);

  const update = useCallback(async (space: TrackingSpace) => {
    const updated = await api.saveSpace(space);
    setSpaces(updated);
  }, []);

  const remove = useCallback(async (spaceId: string) => {
    const updated = await api.deleteSpace(spaceId);
    setSpaces(updated);
  }, []);

  const toggle = useCallback(async (spaceId: string) => {
    await api.toggleTracking(spaceId);
    await refresh();
  }, [refresh]);

  return {
    spaces,
    loading,
    refresh,
    create,
    update,
    remove,
    toggle,
  };
}

