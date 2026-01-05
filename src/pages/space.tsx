import { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { AppSelector } from '@/components/app-selector';
import { useSpaces } from '@/hooks/use-spaces';
import { useTracking, formatDuration } from '@/hooks/use-tracking';
import type { TrackingSpace } from '@/lib/types';

interface SpacePageProps {
  spaceId: string;
  onNavigate: (page: string) => void;
}

export function SpacePage({ spaceId, onNavigate }: SpacePageProps) {
  const { spaces, update, remove, toggle } = useSpaces();
  const { entries } = useTracking(spaceId);
  const [space, setSpace] = useState<TrackingSpace | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [newApp, setNewApp] = useState('');
  const [showAppSelector, setShowAppSelector] = useState(false);

  useEffect(() => {
    const found = spaces.find((s) => s.id === spaceId);
    if (found) {
      setSpace(found);
      setEditName(found.name);
    }
  }, [spaces, spaceId]);

  if (!space) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const handleSaveName = async () => {
    if (!editName.trim()) return;
    await update({ ...space, name: editName.trim() });
    setIsEditing(false);
  };

  const handleAddApp = async (appName: string) => {
    if (!appName.trim() || space.apps.includes(appName.trim())) return;
    await update({ ...space, apps: [...space.apps, appName.trim()] });
    setNewApp('');
  };

  const handleRemoveApp = async (appName: string) => {
    await update({ ...space, apps: space.apps.filter((a) => a !== appName) });
  };

  const handleDelete = async () => {
    await remove(spaceId);
    onNavigate('home');
  };

  const todayEntries = entries.filter(
    (e) => e.date === new Date().toISOString().split('T')[0]
  );
  const todayTotal = todayEntries.reduce((acc, e) => acc + e.duration, 0);

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
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              autoFocus
              className="text-xl font-semibold"
            />
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="text-xl font-semibold hover:text-muted-foreground transition-colors text-left"
            >
              {space.name}
            </button>
          )}
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Space</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete "{space.name}" and all its tracking
                data. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="flex items-center justify-between bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: space.color }}
          />
          <div>
            <p className="font-medium">Tracking</p>
            <p className="text-sm text-muted-foreground">
              {space.isActive ? 'Active' : 'Paused'}
            </p>
          </div>
        </div>
        <Switch
          checked={space.isActive}
          onCheckedChange={() => toggle(space.id)}
        />
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <p className="text-sm text-muted-foreground mb-1">Today</p>
        <p className="text-3xl font-mono font-medium">{formatDuration(todayTotal)}</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Tracked Apps ({space.apps.length})
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAppSelector(!showAppSelector)}
            className="gap-2"
          >
            <Plus className="h-3 w-3" />
            Add App
          </Button>
        </div>

        {showAppSelector && (
          <div className="space-y-3 bg-muted/30 rounded-lg p-4">
            <AppSelector
              selectedApps={space.apps}
              onSelect={handleAddApp}
            />
            <div className="flex gap-2">
              <Input
                placeholder="Or type app name manually..."
                value={newApp}
                onChange={(e) => setNewApp(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddApp(newApp);
                  }
                }}
              />
              <Button onClick={() => handleAddApp(newApp)} size="sm">
                Add
              </Button>
            </div>
          </div>
        )}

        {space.apps.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">
            <p>No apps being tracked</p>
            <p className="text-sm mt-1">Add apps to start tracking time</p>
          </div>
        ) : (
          <div className="space-y-2">
            {space.apps.map((app) => {
              const appTime = todayEntries
                .filter((e) => e.appName === app)
                .reduce((acc, e) => acc + e.duration, 0);
              return (
                <div
                  key={app}
                  className="flex items-center justify-between bg-muted/30 rounded-lg px-4 py-3"
                >
                  <span className="font-medium">{app}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground font-mono">
                      {formatDuration(appTime)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveApp(app)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

