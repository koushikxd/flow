import { invoke } from '@tauri-apps/api/core';
import type { TrackingSpace, TimeEntry, AppSettings, RunningApp, AppStats } from './types';

export async function getRunningApps(): Promise<RunningApp[]> {
  return invoke('get_running_apps');
}

export async function getActiveWindowInfo(): Promise<RunningApp | null> {
  return invoke('get_active_window_info');
}

export async function getSpaces(): Promise<TrackingSpace[]> {
  return invoke('get_spaces');
}

export async function saveSpace(space: TrackingSpace): Promise<TrackingSpace[]> {
  return invoke('save_space', { space });
}

export async function createSpace(name: string, color: string): Promise<TrackingSpace> {
  return invoke('create_space', { name, color });
}

export async function deleteSpace(spaceId: string): Promise<TrackingSpace[]> {
  return invoke('delete_space', { spaceId });
}

export async function toggleTracking(spaceId: string): Promise<boolean> {
  return invoke('toggle_tracking', { spaceId });
}

export async function stopAllTracking(): Promise<void> {
  return invoke('stop_all_tracking');
}

export async function getTimeEntries(
  spaceId?: string,
  dateFrom?: string,
  dateTo?: string
): Promise<TimeEntry[]> {
  return invoke('get_time_entries', { spaceId, dateFrom, dateTo });
}

export async function getSettings(): Promise<AppSettings> {
  return invoke('get_settings');
}

export async function saveSettings(settings: AppSettings): Promise<AppSettings> {
  return invoke('save_settings', { settings });
}

export async function getTodayStats(): Promise<AppStats> {
  return invoke('get_today_stats');
}

