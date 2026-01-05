import { useState, useEffect } from 'react';
import { RefreshCw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RunningApp } from '@/lib/types';
import * as api from '@/lib/tauri';

interface AppSelectorProps {
  selectedApps: string[];
  onSelect: (appName: string) => void;
}

const COMMON_APPS = [
  'Cursor',
  'Visual Studio Code',
  'Terminal',
  'iTerm2',
  'Chrome',
  'Firefox',
  'Safari',
  'Slack',
  'Discord',
  'Notion',
  'Figma',
  'Spotify',
];

export function AppSelector({ selectedApps, onSelect }: AppSelectorProps) {
  const [detectedApps, setDetectedApps] = useState<RunningApp[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshApps = async () => {
    setLoading(true);
    try {
      const apps = await api.getRunningApps();
      setDetectedApps(apps);
    } catch (error) {
      console.error('Failed to get running apps:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshApps();
  }, []);

  const allApps = [
    ...detectedApps.map((a) => a.name),
    ...COMMON_APPS.filter(
      (app) => !detectedApps.some((d) => d.name.toLowerCase().includes(app.toLowerCase()))
    ),
  ];

  const uniqueApps = [...new Set(allApps)].filter(
    (app) => !selectedApps.some((s) => s.toLowerCase() === app.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Click to add an app to track
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={refreshApps}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {detectedApps.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
            Currently Running
          </p>
          <div className="flex flex-wrap gap-2">
            {detectedApps.map((app) => {
              const isSelected = selectedApps.some(
                (s) => s.toLowerCase() === app.name.toLowerCase()
              );
              return (
                <button
                  key={app.processId}
                  onClick={() => !isSelected && onSelect(app.name)}
                  disabled={isSelected}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors ${
                    isSelected
                      ? 'bg-primary/20 text-primary cursor-default'
                      : 'bg-muted hover:bg-muted/80 cursor-pointer'
                  }`}
                >
                  {isSelected && <Check className="h-3 w-3" />}
                  {app.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
          Common Apps
        </p>
        <div className="flex flex-wrap gap-2">
          {uniqueApps.slice(0, 12).map((app) => (
            <button
              key={app}
              onClick={() => onSelect(app)}
              className="px-3 py-1.5 rounded-full text-sm bg-muted hover:bg-muted/80 transition-colors"
            >
              {app}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

