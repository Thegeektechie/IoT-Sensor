import { useEffect, useRef, useState } from 'react';
import { QRScanner } from '@/components/QRScanner';
import { SensorDisplay } from '@/components/SensorDisplay';
import { IOTDeviceTerminal } from '@/components/IOTDeviceTerminal';
import { DeviceDiscovery } from '@/components/DeviceDiscovery';
import { ConnectedDevicesList } from '@/components/ConnectedDevicesList';
import { NetworkStatus } from '@/components/NetworkStatus';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, LogOut, Wifi } from 'lucide-react';
import { SensorPipeline } from '@/lib/sensors';
import { sendSensorData } from '@/lib/api';
import type { DeviceConfig } from '@/lib/device-discovery';

interface SensorReading {
  timestamp: number;
  noise: number;
  people: number;
}

const Index = () => {
  const [deviceConfig, setDeviceConfig] = useState<DeviceConfig | null>(null);
  const [deviceId, setDeviceId] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [noiseLevel, setNoiseLevel] = useState(0);
  const [peopleCount, setPeopleCount] = useState(0);
  const [detectedObjects, setDetectedObjects] = useState<Record<string, number>>({});
  const [dataHistory, setDataHistory] = useState<SensorReading[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const sensorPipelineRef = useRef<SensorPipeline | null>(null);

  useEffect(() => {
    return () => { sensorPipelineRef.current?.stop(); };
  }, []);

  const handleDeviceDiscovered = async (config: DeviceConfig) => {
    setDeviceConfig(config);
    setServerUrl(config.http_url);
    setDeviceId(config.device_id);
    await connectToDevice(config.device_id, config.http_url);
  };

  const handleQRDetected = async (qrData: string) => {
    let deviceIdFromQR = 'device-' + Math.random().toString(36).substr(2, 9);
    let urlFromQR = '';

    if (qrData.startsWith('http')) {
      try {
        const url = new URL(qrData);
        urlFromQR = url.origin;
        deviceIdFromQR = url.searchParams.get('device_id') || deviceIdFromQR;
      } catch {
        deviceIdFromQR = qrData.trim();
      }
    } else {
      deviceIdFromQR = qrData.trim();
    }

    setDeviceId(deviceIdFromQR);
    if (urlFromQR) {
      setServerUrl(urlFromQR);
      await connectToDevice(deviceIdFromQR, urlFromQR);
    } else {
      setError('Server URL required - please enter it manually');
    }
  };

  const connectToDevice = async (id: string, url?: string) => {
    if (!id.trim()) { setError('Device ID cannot be empty'); return; }
    const finalUrl = (url || serverUrl).trim();

    setIsConnecting(true);
    setError(null);
    setStatusMessage('Connecting...');

    try {
      setDeviceId(id);
      setServerUrl(finalUrl);
      setIsConnected(true);
      setStatusMessage('Connected (HTTP mode)');

      // Initialize sensor pipeline
      const pipeline = new SensorPipeline();
      await pipeline.initialize(videoRef.current || undefined);
      sensorPipelineRef.current = pipeline;
      startCapture();
      setIsConnecting(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
      setIsConnecting(false);
      setStatusMessage(null);
    }
  };

  const startCapture = () => {
    if (!sensorPipelineRef.current) return;

    setIsCapturing(true);
    setStatusMessage('Capturing sensor data');

    sensorPipelineRef.current.start(1000, (reading) => {
      setNoiseLevel(reading.noise_level);
      setPeopleCount(reading.people_count);

      const objectSummary: Record<string, number> = {};
      reading.detected_objects.forEach((obj) => {
        if (obj.score > 0.5) {
          objectSummary[obj.class] = (objectSummary[obj.class] || 0) + 1;
        }
      });
      setDetectedObjects(objectSummary);

      setDataHistory((prev) => {
        const newHistory = [...prev, {
          timestamp: reading.timestamp,
          noise: reading.noise_level,
          people: reading.people_count,
        }];
        return newHistory.slice(-30);
      });

      if (serverUrl) {
        sendSensorData(serverUrl, deviceId, {
          noise_level: reading.noise_level,
          people_count: reading.people_count,
          objects: objectSummary,
        });
      }
    });
  };

  const stopCapture = () => {
    sensorPipelineRef.current?.stop();
    setIsCapturing(false);
    setStatusMessage(null);
  };

  const disconnect = () => {
    stopCapture();
    setIsConnected(false);
    setDeviceConfig(null);
    setDeviceId('');
    setServerUrl('');
    setDataHistory([]);
    setNoiseLevel(0);
    setPeopleCount(0);
    setDetectedObjects({});
    setStatusMessage(null);
  };

  return (
    <main className="min-h-screen bg-background text-foreground scanline">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">IoT Sensor Monitor</h1>
            <p className="text-muted-foreground">Real-time device monitoring with encrypted data transmission</p>
          </div>
          <NetworkStatus />
        </div>

        {error && (
          <div className="mb-6 flex gap-2 p-4 bg-destructive/10 border border-destructive">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-destructive">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-4">
            {!isConnected ? (
              <>
                <DeviceDiscovery onDeviceDiscovered={handleDeviceDiscovered} onError={setError} />
                <QRScanner onQRDetected={handleQRDetected} isScanning={isConnecting} />
              </>
            ) : (
              <>
                <Card className="bg-card terminal-border p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Wifi className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">Connected</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Device ID</p>
                      <p className="text-xs font-mono text-primary break-all">{deviceId}</p>
                    </div>
                    {statusMessage && (
                      <div className="text-xs text-muted-foreground italic">{statusMessage}</div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        onClick={isCapturing ? stopCapture : startCapture}
                        variant="outline"
                        className="flex-1 text-xs terminal-button"
                      >
                        {isCapturing ? 'STOP CAPTURE' : 'START CAPTURE'}
                      </Button>
                      <Button onClick={disconnect} variant="outline" className="text-xs terminal-button">
                        <LogOut className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </Card>

                <Card className="bg-card terminal-border p-2">
                  <div className="aspect-video overflow-hidden bg-muted flex items-center justify-center">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover hidden" />
                    <div className="text-xs text-muted-foreground text-center p-4">
                      <p className="glow-text-cyan text-sm mb-1">SENSOR FEED</p>
                      <p>Simulated data active</p>
                    </div>
                  </div>
                </Card>

                <ConnectedDevicesList deviceConfig={deviceConfig} />
              </>
            )}
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-4">
            {isConnected ? (
              <>
                <SensorDisplay
                  noiseLevel={noiseLevel}
                  peopleCount={peopleCount}
                  detectedObjects={detectedObjects}
                  isConnected={isConnected}
                  isCapturing={isCapturing}
                  dataHistory={dataHistory}
                />
                <IOTDeviceTerminal
                  deviceId={deviceId}
                  isConnected={isConnected}
                  noiseLevel={noiseLevel}
                  peopleCount={peopleCount}
                  detectedObjects={detectedObjects}
                  isCapturing={isCapturing}
                  dataHistory={dataHistory.map(d => ({ timestamp: d.timestamp, noiseLevel: d.noise }))}
                />
              </>
            ) : (
              <Card className="bg-card terminal-border p-8">
                <div className="text-center space-y-4">
                  <div className="text-6xl mb-4 glow-text-green">⬡</div>
                  <h2 className="text-2xl font-bold text-foreground">No Device Connected</h2>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Connect to an IoT device using the discovery panel, QR code scanner, or enter the WebSocket URL manually.
                  </p>
                  <div className="font-mono text-xs text-muted-foreground border border-border terminal-border p-4 max-w-sm mx-auto text-left space-y-1">
                    <p className="glow-text-cyan">$ SYSTEM_STATUS</p>
                    <p>{'>'} NETWORK: <span className="text-primary">ONLINE</span></p>
                    <p>{'>'} DEVICE: <span className="text-destructive">NOT_FOUND</span></p>
                    <p>{'>'} ENCRYPTION: <span className="text-primary">AES-256_READY</span></p>
                    <p>{'>'} SENSORS: <span className="text-terminal-yellow">STANDBY</span></p>
                    <p className="animate-blink">_</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default Index;
