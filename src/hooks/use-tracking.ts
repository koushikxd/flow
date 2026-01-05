import { useState, useEffect, useCallback } from 'react';
import { listen } from '@tauri-apps/api/event';
import type { TimeEntry, AppStats } from '@/lib/types';
import * as api from '@/lib/tauri';

export function useTracking(spaceId?: string) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [todayStats, setTodayStats] = useState<AppStats>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [entriesData, statsData] = await Promise.all([
        api.getTimeEntries(spaceId),
        api.getTodayStats(),
      ]);
      setEntries(entriesData);
      setTodayStats(statsData);
    } catch (error) {
      console.error('Failed to load tracking data:', error);
    } finally {
      setLoading(false);
    }
  }, [spaceId]);

  useEffect(() => {
    refresh();
    
    const interval = setInterval(refresh, 5000);
    const unlisten = listen('tracking-changed', refresh);

    return () => {
      clearInterval(interval);
      unlisten.then((fn) => fn());
    };
  }, [refresh]);

  return {
    entries,
    todayStats,
    loading,
    refresh,
  };
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function getTotalDuration(entries: TimeEntry[]): number {
  return entries.reduce((acc, entry) => acc + entry.duration, 0);
}

