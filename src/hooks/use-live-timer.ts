import { useState, useEffect, useCallback } from 'react';
import { listen } from '@tauri-apps/api/event';
import * as api from '@/lib/tauri';
import type { SessionInfo } from '@/lib/tauri';

export function useLiveTimer() {
  const [sessionInfo, setSessionInfo] = useState<SessionInfo>({
    spaceId: null,
    sessionDuration: 0,
    isTracking: false,
  });

  const refresh = useCallback(async () => {
    try {
      const info = await api.getCurrentSessionInfo();
      setSessionInfo(info);
    } catch (error) {
      console.error('Failed to get session info:', error);
    }
  }, []);

  useEffect(() => {
    refresh();
    
    const interval = setInterval(refresh, 1000);
    const unlisten = listen('tracking-changed', refresh);

    return () => {
      clearInterval(interval);
      unlisten.then((fn) => fn());
    };
  }, [refresh]);

  return sessionInfo;
}

export function formatLiveDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
