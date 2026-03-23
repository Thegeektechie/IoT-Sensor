import type { DeviceConfig, ConnectedDevice, DeviceList } from './device-discovery';

export const DEMO_DEVICE_CONFIG: DeviceConfig = {
  device_id: 'iot-device-001',
  device_name: 'Smart Hotspot Monitor',
  ws_url: 'ws://10.43.168.237:8000/ws',
  http_url: 'http://10.43.168.237:8000',
  mac_address: '48:E7:29:A1:F2:8B',
  ip_address: '10.43.168.237',
  hotspot_ssid: 'SmartDevice-Hotspot',
  firmware_version: '1.2.3',
  model: 'ESP32-S3',
};

export const DEMO_CONNECTED_DEVICES: ConnectedDevice[] = [
  {
    device_id: 'sensor-temp-01',
    name: 'Temperature Sensor',
    ip_address: '10.43.168.150',
    mac_address: '3A:E2:E1:B5:C3:D2',
    signal_strength: 85,
    connected_since: Date.now() - 3600000,
    device_type: 'temperature_sensor',
  },
  {
    device_id: 'sensor-humidity-01',
    name: 'Humidity Sensor',
    ip_address: '10.43.168.151',
    mac_address: '5C:CF:7F:91:D2:E8',
    signal_strength: 72,
    connected_since: Date.now() - 7200000,
    device_type: 'humidity_sensor',
  },
  {
    device_id: 'camera-01',
    name: 'Security Camera',
    ip_address: '10.43.168.152',
    mac_address: '78:11:DC:4F:E5:A9',
    signal_strength: 90,
    connected_since: Date.now() - 1800000,
    device_type: 'camera',
  },
  {
    device_id: 'motion-sensor-01',
    name: 'Motion Detector',
    ip_address: '10.43.168.153',
    mac_address: 'A2:48:7B:2E:D1:C9',
    signal_strength: 65,
    connected_since: Date.now() - 5400000,
    device_type: 'motion_sensor',
  },
  {
    device_id: 'light-control-01',
    name: 'Smart Light Controller',
    ip_address: '10.43.168.154',
    mac_address: 'D8:F4:5A:3E:B7:21',
    signal_strength: 88,
    connected_since: Date.now() - 2700000,
    device_type: 'light_control',
  },
];

export function getDemoDeviceList(): DeviceList {
  return {
    devices: DEMO_CONNECTED_DEVICES,
    total_count: DEMO_CONNECTED_DEVICES.length,
    last_updated: Date.now(),
  };
}

export function generateMockSensorData(deviceId: string) {
  return {
    device_id: deviceId,
    timestamp: Date.now(),
    sensors: {
      noise_level: 50 + Math.floor(Math.random() * 30),
      people_count: Math.floor(Math.random() * 5),
      temperature: 20 + Math.random() * 5,
      humidity: 40 + Math.random() * 30,
    },
  };
}

let demoModeEnabled = false;

export function enableDemoMode() { demoModeEnabled = true; }
export function disableDemoMode() { demoModeEnabled = false; }
export function isDemoModeEnabled(): boolean { return demoModeEnabled; }

export function shouldUseDemoMode(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('demo') === 'true' || demoModeEnabled;
}
