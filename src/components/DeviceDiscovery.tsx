import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { DeviceConfig } from '@/lib/device-discovery';
import { fetchDeviceConfig, getHttpUrlFromWsUrl } from '@/lib/device-discovery';
import { DEMO_DEVICE_CONFIG } from '@/lib/demo-data';

interface DeviceDiscoveryProps {
  onDeviceDiscovered: (config: DeviceConfig) => void;
  onError: (error: string) => void;
}

export function DeviceDiscovery({ onDeviceDiscovered, onError }: DeviceDiscoveryProps) {
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveredDevice, setDiscoveredDevice] = useState<DeviceConfig | null>(null);
  const [error, setError] = useState<string | null>('Enter your server URL to connect to your IoT device, or use Demo Mode to test');
  const [customUrl, setCustomUrl] = useState('');
  const [manualMode] = useState(true);

  const handleManualEntry = async () => {
    if (!customUrl.trim()) {
      setError('Please enter a WebSocket or HTTP URL');
      return;
    }

    setIsDiscovering(true);
    setError(null);

    try {
      let baseUrl = customUrl.trim();
      if (baseUrl.startsWith('ws://') || baseUrl.startsWith('wss://')) {
        setError('Please use an HTTP URL (e.g. http://192.168.1.1:8000)');
        setIsDiscovering(false);
        return;
      }
      if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
        baseUrl = 'http://' + baseUrl;
      }

      const config = await fetchDeviceConfig(baseUrl);
      if (config) {
        config.http_url = baseUrl;
        setDiscoveredDevice(config);
        onDeviceDiscovered(config);
      } else {
        setError('Could not connect to device at this URL.');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Connection failed';
      setError(errorMsg);
      onError(errorMsg);
    } finally {
      setIsDiscovering(false);
    }
  };

  if (discoveredDevice && !manualMode) {
    return (
      <Card className="terminal-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            Device Found
          </CardTitle>
          <CardDescription>Connected to IoT Hotspot</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Device Name</p>
              <p className="font-mono">{discoveredDevice.device_name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Device ID</p>
              <p className="font-mono text-xs">{discoveredDevice.device_id}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="terminal-border">
      <CardHeader>
        <CardTitle>Connect to IoT Device</CardTitle>
        <CardDescription>Enter device details or use demo mode</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex gap-3 p-3 bg-destructive/10 border border-destructive/20">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">{error}</p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Server URL</label>
            <Input
              placeholder="http://192.168.1.1:8000"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              disabled={isDiscovering}
              className="font-mono text-xs terminal-input"
            />
            <p className="text-xs text-muted-foreground">Example: http://192.168.1.1:8000 or https://xxxxx.trycloudflare.com</p>
          </div>

          <div className="space-y-2">
            <Button
              onClick={handleManualEntry}
              disabled={isDiscovering || !customUrl.trim()}
              className="w-full terminal-button bg-primary text-primary-foreground hover:bg-primary/80"
            >
              {isDiscovering && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              CONNECT
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setDiscoveredDevice(DEMO_DEVICE_CONFIG);
                onDeviceDiscovered(DEMO_DEVICE_CONFIG);
              }}
              className="w-full terminal-button"
            >
              DEMO MODE
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
