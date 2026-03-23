import { useEffect, useState } from 'react';
import { Loader2, Wifi, AlertCircle, RefreshCw, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ConnectedDevice, DeviceList, DeviceConfig } from '@/lib/device-discovery';
import { fetchConnectedDevices } from '@/lib/device-discovery';
import { getDemoDeviceList, shouldUseDemoMode } from '@/lib/demo-data';

interface ConnectedDevicesListProps {
  deviceConfig: DeviceConfig | null;
  pollingInterval?: number;
}

interface DeviceDisplayItem extends ConnectedDevice {
  isNew?: boolean;
}

export function ConnectedDevicesList({ deviceConfig, pollingInterval = 5000 }: ConnectedDevicesListProps) {
  const [devices, setDevices] = useState<DeviceDisplayItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const [previousDevices, setPreviousDevices] = useState<Set<string>>(new Set());

  const fetchDevices = async () => {
    if (!deviceConfig) { setIsLoading(false); return; }

    try {
      setIsLoading(true);
      setError(null);

      let deviceList: DeviceList | null = null;
      if (shouldUseDemoMode()) {
        deviceList = getDemoDeviceList();
      } else {
        deviceList = await fetchConnectedDevices(deviceConfig);
      }

      if (deviceList && deviceList.devices.length > 0) {
        const newDevices = deviceList.devices.map((device) => ({
          ...device,
          isNew: !previousDevices.has(device.device_id),
        }));
        setDevices(newDevices);
        setPreviousDevices(new Set(deviceList.devices.map(d => d.device_id)));
        setLastUpdate(Date.now());
      } else if (deviceList?.total_count === 0) {
        setDevices([]);
        setLastUpdate(Date.now());
      } else {
        setError('Failed to load device list');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch devices');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (deviceConfig) fetchDevices();
  }, [deviceConfig?.device_id]);

  useEffect(() => {
    if (!deviceConfig) return;
    const interval = setInterval(fetchDevices, pollingInterval);
    return () => clearInterval(interval);
  }, [deviceConfig, pollingInterval]);

  const getSignalIcon = (strength?: number) => {
    if (!strength) return '?';
    if (strength >= 80) return '●●●●';
    if (strength >= 60) return '●●●○';
    if (strength >= 40) return '●●○○';
    return '●○○○';
  };

  const getDeviceTypeDisplay = (type?: string) => {
    const typeMap: Record<string, string> = {
      temperature_sensor: 'Thermometer', humidity_sensor: 'Humidity', camera: 'Camera',
      motion_sensor: 'Motion', light_control: 'Light',
    };
    return typeMap[type || ''] || (type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Device');
  };

  const getConnectedTime = (timestamp?: number) => {
    if (!timestamp) return 'Unknown';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  if (!deviceConfig) {
    return (
      <Card className="terminal-border">
        <CardHeader><CardTitle>Connected Devices</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground">Discover a device to see connected devices</p></CardContent>
      </Card>
    );
  }

  return (
    <Card className="terminal-border">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle>Connected Devices</CardTitle>
          <CardDescription>
            {devices.length} device{devices.length !== 1 ? 's' : ''} on{' '}
            <span className="font-mono text-xs">{deviceConfig.hotspot_ssid || deviceConfig.device_name}</span>
          </CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchDevices} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <div className="flex gap-2 p-3 bg-destructive/10 border border-destructive/20">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {isLoading && devices.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        )}

        {devices.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <Wifi className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">No devices connected to hotspot</p>
          </div>
        )}

        <div className="space-y-2">
          {devices.map((device) => (
            <div key={device.device_id} className="p-3 border border-border terminal-border bg-card hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm truncate">{device.name}</h4>
                    {device.isNew && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5">
                        <Plus className="w-3 h-3 inline mr-1" />New
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-mono mb-2">{device.device_id}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-muted-foreground">IP: </span><span className="font-mono">{device.ip_address}</span></div>
                    <div><span className="text-muted-foreground">Type: </span><span>{getDeviceTypeDisplay(device.device_type)}</span></div>
                    {device.signal_strength !== undefined && (
                      <div><span className="text-muted-foreground">Signal: </span><span className="font-mono">{getSignalIcon(device.signal_strength)} {device.signal_strength}%</span></div>
                    )}
                    {device.connected_since && (
                      <div><span className="text-muted-foreground">Connected: </span><span>{getConnectedTime(device.connected_since)}</span></div>
                    )}
                  </div>
                  {device.mac_address && <p className="text-xs text-muted-foreground font-mono mt-2">MAC: {device.mac_address}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {lastUpdate > 0 && (
          <p className="text-xs text-muted-foreground text-center mt-4">Last updated {new Date(lastUpdate).toLocaleTimeString()}</p>
        )}
      </CardContent>
    </Card>
  );
}
