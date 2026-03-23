import { encryptValue } from './encryption';

export async function sendSensorData(
  endpoint: string,
  deviceId: string,
  sensorData: {
    noise_level?: number;
    people_count?: number;
    objects?: Record<string, number>;
  }
) {
  const payload: Record<string, unknown> = {
    device_id: deviceId,
    timestamp: Date.now(),
    data: {} as Record<string, string>,
  };

  const data = payload.data as Record<string, string>;

  if (typeof sensorData.noise_level === 'number') {
    data.noise_level = encryptValue(sensorData.noise_level.toString(), 'noise_level');
  }
  if (typeof sensorData.people_count === 'number') {
    data.people_count = encryptValue(sensorData.people_count.toString(), 'people_count');
  }
  if (sensorData.objects && Object.keys(sensorData.objects).length > 0) {
    data.objects = encryptValue(JSON.stringify(sensorData.objects), 'objects');
  }

  if (Object.keys(data).length === 0) return;

  try {
    const apiUrl = `${endpoint.replace(/\/$/, '')}/api/sensor`;
    await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('[IoT] Failed to send sensor data:', error);
  }
}
