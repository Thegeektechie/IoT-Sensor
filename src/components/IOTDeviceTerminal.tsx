import { useEffect, useState } from 'react';
import { Zap, Mic, Camera, Radio } from 'lucide-react';

interface IOTDeviceTerminalProps {
  deviceId: string;
  isConnected: boolean;
  noiseLevel: number;
  peopleCount: number;
  detectedObjects: Record<string, number>;
  isCapturing: boolean;
  dataHistory: Array<{ timestamp: number; noiseLevel: number }>;
}

export function IOTDeviceTerminal({
  deviceId,
  isConnected,
  noiseLevel,
  peopleCount,
  detectedObjects,
  isCapturing,
  dataHistory,
}: IOTDeviceTerminalProps) {
  const [displayedNoise, setDisplayedNoise] = useState(0);

  useEffect(() => {
    setDisplayedNoise(noiseLevel);
  }, [noiseLevel]);

  const getNoiseBar = (level: number) => {
    const barLength = Math.floor((level / 120) * 40);
    return '█'.repeat(barLength) + '░'.repeat(40 - barLength);
  };

  const getNoiseColor = (level: number) => {
    if (level < 30) return 'text-primary';
    if (level < 60) return 'text-terminal-yellow';
    if (level < 90) return 'text-terminal-orange';
    return 'text-destructive';
  };

  return (
    <div className="w-full bg-background text-foreground font-mono p-4 overflow-auto border border-border terminal-border flex flex-col gap-4">
      {/* Header */}
      <div className="border border-border terminal-border p-3 text-xs">
        <div className="flex justify-between items-center mb-2">
          <div className="glow-text-cyan">IoT SENSOR DEVICE v1.0</div>
          <div>
            {isConnected ? (
              <span className="text-primary animate-pulse">● ONLINE</span>
            ) : (
              <span className="text-destructive">● OFFLINE</span>
            )}
          </div>
        </div>
        <div className="text-muted-foreground grid grid-cols-2 gap-2 text-xs">
          <div>DEVICE_ID: {deviceId}</div>
          <div>UPTIME: {Math.floor((Date.now() / 1000) % 86400)}s</div>
          <div>MODE: {isCapturing ? 'RECORDING' : 'STANDBY'}</div>
          <div>FPS: {isCapturing ? '30' : '0'}</div>
        </div>
      </div>

      {/* Audio Level */}
      <div className="border border-border terminal-border p-3">
        <div className="text-xs glow-text-cyan mb-2">AUDIO_ANALYZER</div>
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">
            SOUND_LEVEL_DB: <span className={`font-bold ${getNoiseColor(displayedNoise)}`}>{Math.round(displayedNoise)}dB</span>
          </div>
          <div className={`text-xs font-mono tracking-widest ${getNoiseColor(displayedNoise)}`}>
            {getNoiseBar(displayedNoise)}
          </div>
          <div className="text-[0.65rem] text-muted-foreground mt-1">
            RANGE: 0dB ━━━ 120dB | SAMPLING: 44.1kHz
          </div>
        </div>
      </div>

      {/* Object Detection */}
      <div className="border border-border terminal-border p-3">
        <div className="text-xs glow-text-cyan mb-2">OBJECT_DETECTOR (COCO-SSD)</div>
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">
            PERSONS_DETECTED: <span className="glow-text-magenta font-bold text-sm">{peopleCount}</span>
          </div>
          {Object.keys(detectedObjects).length > 0 ? (
            <div className="text-xs space-y-0.5 mt-2">
              {Object.entries(detectedObjects).map(([obj, count]) => (
                <div key={obj} className="text-muted-foreground">
                  {obj.toUpperCase()}: <span className="text-terminal-yellow">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground text-xs">NO_OBJECTS_DETECTED</div>
          )}
        </div>
      </div>

      {/* Sensor Status */}
      <div className="border border-border terminal-border p-3">
        <div className="text-xs glow-text-cyan mb-2">SENSOR_STATUS</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Mic className="w-3 h-3 text-primary" />
            <span className="text-muted-foreground">MICROPHONE:</span>
            <span className={isCapturing ? 'text-primary' : 'text-muted-foreground'}>
              {isCapturing ? 'ACTIVE' : 'STANDBY'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Camera className="w-3 h-3 text-primary" />
            <span className="text-muted-foreground">CAMERA:</span>
            <span className={isCapturing ? 'text-primary' : 'text-muted-foreground'}>
              {isCapturing ? 'ACTIVE' : 'STANDBY'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Radio className="w-3 h-3 text-primary" />
            <span className="text-muted-foreground">WEBSOCKET:</span>
            <span className={isConnected ? 'text-primary' : 'text-destructive'}>
              {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-3 h-3 text-primary" />
            <span className="text-muted-foreground">DATA_STREAM:</span>
            <span className={isConnected ? 'text-primary animate-pulse' : 'text-destructive'}>
              {isConnected ? 'TRANSMITTING' : 'IDLE'}
            </span>
          </div>
        </div>
      </div>

      {/* Data Stream Log */}
      <div className="border border-border terminal-border p-3 flex-1 overflow-y-auto">
        <div className="text-xs glow-text-cyan mb-2">DATA_STREAM_LOG</div>
        <div className="space-y-1 text-[0.7rem] font-mono text-muted-foreground">
          {dataHistory.slice(-10).map((data, idx) => (
            <div key={idx} className="hover:text-foreground transition-colors">
              [{new Date(data.timestamp).toLocaleTimeString()}] NOISE={Math.round(data.noiseLevel)}dB
            </div>
          ))}
          {dataHistory.length === 0 && (
            <div className="text-muted-foreground italic">WAITING_FOR_DATA_STREAM...</div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border border-border terminal-border p-2 text-[0.65rem] text-muted-foreground">
        ENCRYPTED_TRANSMISSION: AES-256 | PROTOCOL: HTTP | BUFFER: {dataHistory.length} samples
      </div>
    </div>
  );
}
