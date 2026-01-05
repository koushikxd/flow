import { ChevronRight } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import type { TrackingSpace } from '@/lib/types';

interface SpaceCardProps {
  space: TrackingSpace;
  onToggle: () => void;
  onClick: () => void;
}

export function SpaceCard({ space, onToggle, onClick }: SpaceCardProps) {
  return (
    <div
      className="group flex items-center gap-4 bg-card border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div
        className="w-3 h-3 rounded-full shrink-0"
        style={{ backgroundColor: space.color }}
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{space.name}</p>
        <p className="text-sm text-muted-foreground">
          {space.apps.length} {space.apps.length === 1 ? 'app' : 'apps'}
        </p>
      </div>
      <div className="flex items-center gap-3">
        {space.isActive && (
          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
            Active
          </span>
        )}
        <div onClick={(e) => e.stopPropagation()}>
          <Switch checked={space.isActive} onCheckedChange={onToggle} />
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}

