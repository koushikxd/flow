import { useState, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TimeChart } from '@/components/time-chart';
import { useSpaces } from '@/hooks/use-spaces';
import { useTracking, formatDuration } from '@/hooks/use-tracking';
import type { TimeRange, TimeEntry } from '@/lib/types';

interface AnalyticsPageProps {
  onNavigate: (page: string) => void;
}

function getDateRange(range: TimeRange): { from: string; to: string } {
  const today = new Date();
  const to = today.toISOString().split('T')[0];
  let from: Date;

  switch (range) {
    case 'day':
      from = today;
      break;
    case 'week':
      from = new Date(today);
      from.setDate(from.getDate() - 6);
      break;
    case 'month':
      from = new Date(today);
      from.setDate(from.getDate() - 29);
      break;
  }

  return { from: from.toISOString().split('T')[0], to };
}

function groupEntriesByApp(entries: TimeEntry[]): { name: string; duration: number }[] {
  const grouped: Record<string, number> = {};
  entries.forEach((e) => {
    grouped[e.appName] = (grouped[e.appName] || 0) + e.duration;
  });
  return Object.entries(grouped)
    .map(([name, duration]) => ({ name, duration }))
    .sort((a, b) => b.duration - a.duration);
}

function groupEntriesByDate(entries: TimeEntry[], range: TimeRange): { date: string; duration: number }[] {
  const { from, to } = getDateRange(range);
  const grouped: Record<string, number> = {};
  
  const start = new Date(from);
  const end = new Date(to);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    grouped[dateStr] = 0;
  }
  
  entries.forEach((e) => {
    if (e.date >= from && e.date <= to) {
      grouped[e.date] = (grouped[e.date] || 0) + e.duration;
    }
  });
  
  return Object.entries(grouped)
    .map(([date, duration]) => ({ date, duration }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function AnalyticsPage({ onNavigate }: AnalyticsPageProps) {
  const [range, setRange] = useState<TimeRange>('week');
  const [selectedSpace, setSelectedSpace] = useState<string | null>(null);
  const { spaces } = useSpaces();
  const { entries } = useTracking(selectedSpace ?? undefined);

  const { from, to } = getDateRange(range);
  
  const filteredEntries = useMemo(() => {
    return entries.filter((e) => e.date >= from && e.date <= to);
  }, [entries, from, to]);

  const appData = useMemo(() => groupEntriesByApp(filteredEntries), [filteredEntries]);
  const dateData = useMemo(() => groupEntriesByDate(filteredEntries, range), [filteredEntries, range]);
  
  const totalTime = filteredEntries.reduce((acc, e) => acc + e.duration, 0);

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
        <h1 className="text-xl font-semibold">Analytics</h1>
      </div>

      <div className="flex flex-wrap gap-4 items-center justify-between">
        <Tabs value={range} onValueChange={(v) => setRange(v as TimeRange)}>
          <TabsList>
            <TabsTrigger value="day">Today</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-2">
          <Button
            variant={selectedSpace === null ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setSelectedSpace(null)}
          >
            All
          </Button>
          {spaces.map((space) => (
            <Button
              key={space.id}
              variant={selectedSpace === space.id ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setSelectedSpace(space.id)}
              className="gap-2"
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: space.color }}
              />
              {space.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Time</p>
          <p className="text-2xl font-mono font-medium mt-1">
            {formatDuration(totalTime)}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Apps Tracked</p>
          <p className="text-2xl font-mono font-medium mt-1">{appData.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Daily Avg</p>
          <p className="text-2xl font-mono font-medium mt-1">
            {formatDuration(Math.round(totalTime / Math.max(dateData.length, 1)))}
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <h2 className="text-sm font-medium text-muted-foreground mb-4">
          Time by Day
        </h2>
        <TimeChart data={dateData} dataKey="duration" xAxisKey="date" />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Apps by Time
        </h2>
        {appData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">
            No tracking data for this period
          </div>
        ) : (
          <div className="space-y-2">
            {appData.map((app, i) => (
              <div
                key={app.name}
                className="flex items-center gap-4 bg-muted/30 rounded-lg px-4 py-3"
              >
                <span className="text-muted-foreground w-6">{i + 1}</span>
                <span className="flex-1 font-medium">{app.name}</span>
                <span className="font-mono text-muted-foreground">
                  {formatDuration(app.duration)}
                </span>
                <div className="w-24 bg-muted rounded-full h-2">
                  <div
                    className="bg-primary rounded-full h-2 transition-all"
                    style={{
                      width: `${(app.duration / appData[0].duration) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

