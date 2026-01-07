export interface TrackingSpace {
  id: string;
  name: string;
  apps: string[];
  isActive: boolean;
  color: string;
}

export interface TimeEntry {
  spaceId: string;
  appName: string;
  date: string;
  duration: number;
}

export interface AppSettings {
  enableDND: boolean;
  mutedApps: string[];
}

export interface RunningApp {
  name: string;
  processId: number;
}

export interface InstalledApp {
  name: string;
  path: string;
}

export interface AppStats {
  [appName: string]: number;
}

export type TimeRange = 'day' | 'week' | 'month';

export const SPACE_COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f97316',
  '#22c55e',
  '#06b6d4',
  '#eab308',
  '#ef4444',
] as const;

