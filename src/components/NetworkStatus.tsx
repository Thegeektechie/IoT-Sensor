import { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface NetworkInfo {
  connected: boolean;
  connectionType: string;
}

export function NetworkStatus() {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
    connected: navigator.onLine,
    connectionType: 'unknown',
  });

  useEffect(() => {
    const updateNetworkInfo = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const connection = (navigator as any).connection;

      setNetworkInfo({
        connected: navigator.onLine,
        connectionType: (connection?.type as string) || 'unknown',
      });
    };

    updateNetworkInfo();
    window.addEventListener('online', updateNetworkInfo);
    window.addEventListener('offline', updateNetworkInfo);
    return () => {
      window.removeEventListener('online', updateNetworkInfo);
      window.removeEventListener('offline', updateNetworkInfo);
    };
  }, []);

  return (
    <div className="flex items-center gap-2 text-xs font-mono">
      {networkInfo.connected ? (
        <>
          <Wifi className="w-3 h-3 text-primary" />
          <span className="text-primary">CONNECTED</span>
          <span className="text-muted-foreground">|</span>
          <span className="glow-text-cyan">{networkInfo.connectionType.toUpperCase()}</span>
        </>
      ) : (
        <>
          <WifiOff className="w-3 h-3 text-destructive" />
          <span className="text-destructive">OFFLINE</span>
        </>
      )}
    </div>
  );
}
