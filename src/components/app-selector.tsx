import { useState, useEffect, useMemo } from 'react';
import { Search, Check, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { InstalledApp } from '@/lib/types';
import * as api from '@/lib/tauri';

interface AppSelectorProps {
  selectedApps: string[];
  onSelect: (appName: string) => void;
}

export function AppSelector({ selectedApps, onSelect }: AppSelectorProps) {
  const [installedApps, setInstalledApps] = useState<InstalledApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadApps = async () => {
      try {
        const apps = await api.getInstalledApps();
        setInstalledApps(apps);
      } catch (error) {
        console.error('Failed to get installed apps:', error);
      } finally {
        setLoading(false);
      }
    };
    loadApps();
  }, []);

  const filteredApps = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return installedApps.filter((app) =>
      app.name.toLowerCase().includes(query)
    );
  }, [installedApps, searchQuery]);

  const availableApps = filteredApps.filter(
    (app) => !selectedApps.some((s) => s.toLowerCase() === app.name.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search installed apps..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="max-h-64 overflow-auto space-y-1">
        {availableApps.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {searchQuery ? 'No apps found' : 'All apps selected'}
          </p>
        ) : (
          availableApps.map((app) => (
            <AppItem
              key={app.path}
              name={app.name}
              isSelected={false}
              onClick={() => onSelect(app.name)}
            />
          ))
        )}
      </div>

      {selectedApps.length > 0 && (
        <div className="pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
            Selected ({selectedApps.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedApps.map((app) => (
              <span
                key={app}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-primary/20 text-primary"
              >
                <Check className="h-3 w-3" />
                {app}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface AppItemProps {
  name: string;
  isSelected: boolean;
  onClick: () => void;
}

function AppItem({ name, isSelected, onClick }: AppItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={isSelected}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
        isSelected
          ? 'bg-primary/10 text-primary cursor-default'
          : 'hover:bg-muted cursor-pointer'
      }`}
    >
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-xs font-medium">
        {name.charAt(0).toUpperCase()}
      </div>
      <span className="text-sm truncate">{name}</span>
      {isSelected && <Check className="h-4 w-4 ml-auto shrink-0" />}
    </button>
  );
}
