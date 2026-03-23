export const config = {
  websocket: {
    get url() {
      return 'ws://localhost:8080/ws';
    },
    defaultUrl: 'ws://localhost:8080/ws',
    reconnectMaxAttempts: 5,
    reconnectDelay: 3000,
    pingInterval: 30000,
    timeout: 10000,
  },
  sensors: {
    captureInterval: 1000,
    noiseThresholds: { quiet: 30, normal: 60, loud: 85 },
    detectionConfidence: 0.5,
    maxHistoryLength: 100,
  },
  encryption: {
    algorithm: 'AES-256',
    key: 'iot-sensor-key-2024-secure-transmission',
  },
  ui: {
    theme: 'dark',
    enableAnimations: true,
    chartRefreshRate: 1000,
  },
  debug: import.meta.env.DEV,
};

export default config;
