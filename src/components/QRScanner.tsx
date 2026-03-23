import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, Camera, Check, Loader2 } from 'lucide-react';

interface QRScannerProps {
  onQRDetected: (deviceId: string) => void;
  isScanning?: boolean;
}

export function QRScanner({ onQRDetected, isScanning = false }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannedId, setScannedId] = useState<string | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        setScanning(true);
        performQRScan();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to access camera');
    }
  };

  const performQRScan = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx || !videoRef.current.videoWidth) {
      animationRef.current = requestAnimationFrame(performQRScan);
      return;
    }

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
      setScannedId(code.data);
      setScanning(false);
      onQRDetected(code.data);
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
        setCameraActive(false);
      }
    } else {
      animationRef.current = requestAnimationFrame(performQRScan);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
    setCameraActive(false);
    setScanning(false);
    setScannedId(null);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };

  return (
    <Card className="w-full bg-card terminal-border p-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Scan Device QR Code</h2>

        <div className="relative w-full aspect-square overflow-hidden bg-muted border-2 border-dashed border-border">
          <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-cover ${cameraActive ? '' : 'hidden'}`} />
          <canvas ref={canvasRef} className="hidden" />
          {!cameraActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50 backdrop-blur-sm">
              {scannedId ? (
                <div className="flex flex-col items-center gap-2">
                  <Check className="w-12 h-12 text-primary" />
                  <p className="text-sm font-medium text-foreground">Device Scanned</p>
                </div>
              ) : (
                <Camera className="w-12 h-12 text-muted-foreground" />
              )}
            </div>
          )}
          {scanning && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-32 h-32 border-2 border-primary animate-pulse" />
            </div>
          )}
        </div>

        {error && (
          <div className="flex gap-2 bg-destructive/10 border border-destructive p-3 text-sm text-destructive">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {scannedId && (
          <div className="bg-primary/10 border border-primary p-3">
            <p className="text-xs text-muted-foreground">Scanned Device ID</p>
            <p className="text-sm font-mono text-primary break-all">{scannedId}</p>
          </div>
        )}

        <div className="flex gap-2">
          {!cameraActive ? (
            <Button onClick={startCamera} className="flex-1 terminal-button bg-primary text-primary-foreground" disabled={isScanning}>
              {isScanning ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Connecting...</> : <><Camera className="w-4 h-4 mr-2" />Start Scan</>}
            </Button>
          ) : (
            <Button onClick={stopCamera} variant="outline" className="flex-1 terminal-button">Stop Camera</Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          {cameraActive ? 'Point camera at IoT device QR code' : 'Click "Start Scan" and allow camera access'}
        </p>
      </div>
    </Card>
  );
}
