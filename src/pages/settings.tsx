import { useState, useEffect } from 'react';
import { ArrowLeft, Bell, BellOff, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { AppSettings } from '@/lib/types';
import * as api from '@/lib/tauri';

interface SettingsPageProps {
  onNavigate: (page: string) => void;
}

export function SettingsPage({ onNavigate }: SettingsPageProps) {
  const [settings, setSettings] = useState<AppSettings>({
    enableDND: false,
    mutedApps: [],
  });
  const [newMutedApp, setNewMutedApp] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSettings().then((s) => {
      setSettings(s);
      setLoading(false);
    });
  }, []);

  const handleToggleDND = async () => {
    const updated = { ...settings, enableDND: !settings.enableDND };
    setSettings(updated);
    await api.saveSettings(updated);
  };

  const handleAddMutedApp = async () => {
    if (!newMutedApp.trim() || settings.mutedApps.includes(newMutedApp.trim())) {
      return;
    }
    const updated = {
      ...settings,
      mutedApps: [...settings.mutedApps, newMutedApp.trim()],
    };
    setSettings(updated);
    await api.saveSettings(updated);
    setNewMutedApp('');
  };

  const handleRemoveMutedApp = async (app: string) => {
    const updated = {
      ...settings,
      mutedApps: settings.mutedApps.filter((a) => a !== app),
    };
    setSettings(updated);
    await api.saveSettings(updated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onNavigate('home')}
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-semibold">Settings</h1>
      </div>

      <div className="space-y-6">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.enableDND ? (
                <BellOff className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Bell className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">Focus Mode</p>
                <p className="text-sm text-muted-foreground">
                  Reminder to enable Do Not Disturb when tracking
                </p>
              </div>
            </div>
            <Switch checked={settings.enableDND} onCheckedChange={handleToggleDND} />
          </div>
          {settings.enableDND && (
            <div className="mt-4 flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
              <Info className="h-4 w-4 mt-0.5 shrink-0" />
              <p>
                When tracking starts, you'll be reminded to enable system Do Not
                Disturb mode. Due to system restrictions, this cannot be automated.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Muted Apps Reference
            </h2>
            <p className="text-sm text-muted-foreground">
              Keep a list of apps you want to mute notifications from during focus
              sessions. This is for your reference only.
            </p>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Add app name..."
              value={newMutedApp}
              onChange={(e) => setNewMutedApp(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddMutedApp()}
            />
            <Button onClick={handleAddMutedApp}>Add</Button>
          </div>

          {settings.mutedApps.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground border border-dashed border-border rounded-lg">
              No muted apps added
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {settings.mutedApps.map((app) => (
                <Badge
                  key={app}
                  variant="secondary"
                  className="gap-2 py-1.5 px-3 cursor-pointer hover:bg-destructive/20"
                  onClick={() => handleRemoveMutedApp(app)}
                >
                  {app}
                  <span className="text-muted-foreground">×</span>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

