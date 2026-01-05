import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatDuration } from '@/hooks/use-tracking';

interface TimeChartProps {
  data: { date: string; duration: number }[];
  dataKey: string;
  xAxisKey: string;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
      <p className="text-sm font-medium">{formatDate(label)}</p>
      <p className="text-sm text-muted-foreground">
        {formatDuration(payload[0].value)}
      </p>
    </div>
  );
}

export function TimeChart({ data, dataKey, xAxisKey }: TimeChartProps) {
  if (data.length === 0 || data.every(d => d.duration === 0)) {
    return (
      <div className="h-[200px] flex items-center justify-center text-muted-foreground">
        No data for this period
      </div>
    );
  }

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis
            dataKey={xAxisKey}
            tickFormatter={(v) => {
              const d = new Date(v);
              return d.toLocaleDateString('en-US', { weekday: 'short' });
            }}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => {
              const hours = Math.floor(v / 3600);
              if (hours > 0) return `${hours}h`;
              const mins = Math.floor(v / 60);
              return `${mins}m`;
            }}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
          <Bar
            dataKey={dataKey}
            fill="hsl(var(--primary))"
            radius={[4, 4, 0, 0]}
            maxBarSize={50}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

