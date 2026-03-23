import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = 'iot-sensor-key-2024-secure-transmission';

export function encryptSensorData(data: Record<string, unknown>): string {
  const jsonString = JSON.stringify(data);
  return CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY).toString();
}

export function decryptSensorData(ciphertext: string): Record<string, unknown> {
  const decrypted = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);
  return JSON.parse(decrypted);
}

export function encryptValue(value: number | string, key?: string): string {
  const data = { value, key: key || 'sensor', timestamp: Date.now() };
  return CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();
}

export function generateDeviceKey(deviceId: string): string {
  return CryptoJS.SHA256(deviceId + ENCRYPTION_KEY).toString();
}
