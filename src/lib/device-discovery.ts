export interface DeviceConfig {
  device_id: string;
  device_name: string;
  ws_url: string;
  http_url: string;
  mac_address: string;
  ip_address: string;
  hotspot_ssid: string;
  firmware_version: string;
  model: string;
}

export interface ConnectedDevice {
  device_id: string;
  name: string;
  ip_address: string;
  mac_address: string;
  signal_strength?: number;
  connected_since?: number;
  device_type?: string;
}

export interface DeviceList {
  devices: ConnectedDevice[];
  total_count: number;
  last_updated: number;
}

const COMMON_HOTSPOT_HOSTS = [
  'http://iot.local:8000',
  'http://192.168.1.1:8000',
  'http://10.0.0.1:8000',
  'http://192.168.4.1:8000',
];

export async function discoverDevice(customUrl?: string, timeoutMs = 5000): Promise<DeviceConfig | null> {
  if (customUrl?.trim()) {
    const config = await fetchDeviceConfig(customUrl, timeoutMs);
    return config;
  }

  for (const baseUrl of COMMON_HOTSPOT_HOSTS) {
    try {
      const config = await fetchDeviceConfig(baseUrl, timeoutMs);
      if (config) return config;
    } catch {
      continue;
    }
  }
  return null;
}

export async function fetchDeviceConfig(baseUrl: string, timeoutMs = 5000): Promise<DeviceConfig | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `${baseUrl.replace(/\/$/, '')}/api/config`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) return null;
    const data = await response.json();
    return validateDeviceConfig(data);
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}

function validateDeviceConfig(data: unknown): DeviceConfig | null {
  if (!data || typeof data !== 'object') return null;
  const config = data as Record<string, unknown>;
  if (typeof config.device_id === 'string' && typeof config.device_name === 'string' && typeof config.ws_url === 'string') {
    return {
      device_id: config.device_id,
      device_name: config.device_name,
      ws_url: config.ws_url,
      http_url: (config.http_url as string) || '',
      mac_address: (config.mac_address as string) || '',
      ip_address: (config.ip_address as string) || '',
      hotspot_ssid: (config.hotspot_ssid as string) || '',
      firmware_version: (config.firmware_version as string) || '',
      model: (config.model as string) || '',
    };
  }
  return null;
}

export async function fetchConnectedDevices(deviceConfig: DeviceConfig, timeoutMs = 5000): Promise<DeviceList | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `${deviceConfig.http_url.replace(/\/$/, '')}/api/devices`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) return null;
    const data = await response.json();
    return validateDeviceList(data);
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}

function validateDeviceList(data: unknown): DeviceList | null {
  if (!data || typeof data !== 'object') return null;
  const list = data as Record<string, unknown>;
  if (Array.isArray(list.devices)) {
    return {
      devices: list.devices.map((d: Record<string, unknown>) => ({
        device_id: String(d.device_id || ''),
        name: String(d.name || 'Unknown Device'),
        ip_address: String(d.ip_address || ''),
        mac_address: String(d.mac_address || ''),
        signal_strength: typeof d.signal_strength === 'number' ? d.signal_strength : undefined,
        connected_since: typeof d.connected_since === 'number' ? d.connected_since : undefined,
        device_type: String(d.device_type || ''),
      })),
      total_count: typeof list.total_count === 'number' ? list.total_count : (list.devices as unknown[]).length,
      last_updated: typeof list.last_updated === 'number' ? list.last_updated : Date.now(),
    };
  }
  return null;
}

export function getHttpUrlFromWsUrl(wsUrl: string): string {
  try {
    const url = new URL(wsUrl);
    const protocol = url.protocol === 'wss:' ? 'https:' : 'http:';
    return `${protocol}//${url.host}`;
  } catch {
    return wsUrl.replace(/^wss?:/, 'http:').replace(/\/ws.*$/, '');
  }
}
