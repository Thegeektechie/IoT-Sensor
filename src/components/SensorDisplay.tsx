import { Card } from '@/components/ui/card';
import { Activity, Users, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SensorDisplayProps {
  noiseLevel: number;
  peopleCount: number;
  detectedObjects: Record<string, number>;
  isConnected: boolean;
  isCapturing: boolean;
  dataHistory: Array<{ timestamp: number; noise: number; people: number }>;
}

export function SensorDisplay({
  noiseLevel,
  peopleCount,
  detectedObjects,
  isConnected,
  isCapturing,
  dataHistory,
}: SensorDisplayProps) {
  const objectList = Object.entries(detectedObjects).slice(0, 5);

  return (
    <div className="w-full space-y-4">
      <div className="flex gap-2 items-center">
        <div className="flex items-center gap-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-primary' : 'bg-destructive'}`} />
          <span className="text-muted-foreground">{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
        {isCapturing && (
          <div className="flex items-center gap-2 text-sm">
            <Activity className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-muted-foreground">Capturing</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-card terminal-border p-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Noise Level</span>
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <div className="text-4xl font-bold text-primary">{Math.round(noiseLevel)}</div>
            <div className="text-xs text-muted-foreground">dB</div>
            <div className="w-full bg-muted h-2">
              <div className="bg-primary h-2 transition-all" style={{ width: `${Math.min(noiseLevel / 120, 1) * 100}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">
              {noiseLevel < 30 ? 'Quiet' : noiseLevel < 60 ? 'Normal' : noiseLevel < 85 ? 'Loud' : 'Very Loud'}
            </p>
          </div>
        </Card>

        <Card className="bg-card terminal-border p-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">People Detected</span>
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div className="text-4xl font-bold text-primary">{peopleCount}</div>
            <div className="text-xs text-muted-foreground">individuals</div>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(peopleCount, 5) }).map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-primary" />
              ))}
            </div>
          </div>
        </Card>
      </div>

      {dataHistory.length > 0 && (
        <Card className="bg-card terminal-border p-4">
          <h3 className="text-sm font-medium text-foreground mb-4">Noise Level History</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dataHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(120, 100%, 50%, 0.1)" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(t) => new Date(t).toLocaleTimeString()}
                stroke="hsl(0, 0%, 40%)"
                fontSize={10}
              />
              <YAxis domain={[0, 120]} stroke="hsl(0, 0%, 40%)" fontSize={10} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0a0e0a', border: '1px solid #00ff00', color: '#00ff00', fontSize: 12 }}
                labelFormatter={(t) => new Date(t).toLocaleTimeString()}
              />
              <Line type="monotone" dataKey="noise" stroke="#00ff00" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="people" stroke="#00ccff" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {objectList.length > 0 && (
        <Card className="bg-card terminal-border p-4">
          <h3 className="text-sm font-medium text-foreground mb-3">Detected Objects</h3>
          <div className="grid grid-cols-2 gap-2">
            {objectList.map(([name, count]) => (
              <div key={name} className="flex items-center justify-between p-2 bg-muted">
                <span className="text-sm text-foreground capitalize">{name}</span>
                <span className="text-sm font-bold glow-text-cyan">{count}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
