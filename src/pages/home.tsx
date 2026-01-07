import { useState } from 'react';
import { Plus, Timer, BarChart3, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { SpaceCard } from '@/components/space-card';
import { useSpaces } from '@/hooks/use-spaces';
import { useTracking, formatDuration, getTotalDuration } from '@/hooks/use-tracking';
import { useLiveTimer, formatLiveDuration } from '@/hooks/use-live-timer';
import { SPACE_COLORS } from '@/lib/types';

interface HomePageProps {
  onNavigate: (page: string, spaceId?: string) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const { spaces, loading, create, toggle } = useSpaces();
  const { entries } = useTracking();
  const sessionInfo = useLiveTimer();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>(SPACE_COLORS[0]);

  const handleCreateSpace = async () => {
    if (!newSpaceName.trim()) return;
    await create(newSpaceName.trim(), selectedColor);
    setNewSpaceName('');
    setSelectedColor(SPACE_COLORS[0]);
    setIsDialogOpen(false);
  };

  const activeSpace = spaces.find((s) => s.isActive);
  const todayTotal = getTotalDuration(
    entries.filter((e) => e.date === new Date().toISOString().split('T')[0])
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Flow</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track your productivity across apps
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              New Space
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Tracking Space</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="e.g., Work, Personal, Study..."
                value={newSpaceName}
                onChange={(e) => setNewSpaceName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateSpace()}
                autoFocus
              />
              <div className="flex gap-2 flex-wrap">
                {SPACE_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className="w-8 h-8 rounded-full transition-transform hover:scale-110"
                    style={{
                      backgroundColor: color,
                      outline: selectedColor === color ? '2px solid white' : 'none',
                      outlineOffset: '2px',
                    }}
                  />
                ))}
              </div>
              <Button onClick={handleCreateSpace} className="w-full">
                Create Space
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Timer className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wider">Today</span>
          </div>
          <p className="text-2xl font-mono font-medium">
            {formatDuration(todayTotal)}
          </p>
        </div>
        <button
          onClick={() => onNavigate('analytics')}
          className="bg-card border border-border rounded-lg p-4 text-left hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <BarChart3 className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wider">Analytics</span>
          </div>
          <p className="text-sm text-muted-foreground">View detailed stats →</p>
        </button>
      </div>

      {activeSpace && (
        <div className="bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full animate-pulse"
                style={{ backgroundColor: activeSpace.color }}
              />
              <div>
                <p className="text-sm font-medium">Currently Tracking</p>
                <p className="text-xs text-muted-foreground">{activeSpace.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Play className="h-3 w-3 text-primary" />
              <span className="text-xl font-mono font-medium tabular-nums">
                {formatLiveDuration(sessionInfo.sessionDuration)}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Spaces
        </h2>
        {spaces.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No tracking spaces yet.</p>
            <p className="text-sm mt-1">Create one to get started.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {spaces.map((space) => (
              <SpaceCard
                key={space.id}
                space={space}
                onToggle={() => toggle(space.id)}
                onClick={() => onNavigate('space', space.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

