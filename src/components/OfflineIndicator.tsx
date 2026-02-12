import { useState, useEffect } from 'react';
import { WifiOff, Wifi, CloudUpload, AlertCircle } from 'lucide-react';
import { isOnline, getPendingSync } from '../utils/offlineStorage';

export function OfflineIndicator() {
  const [online, setOnline] = useState(isOnline());
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const checkStatus = () => {
      setOnline(isOnline());
      setPendingCount(getPendingSync());
    };

    // Check status every 5 seconds
    const interval = setInterval(checkStatus, 5000);

    // Listen for online/offline events
    window.addEventListener('online', checkStatus);
    window.addEventListener('offline', checkStatus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', checkStatus);
      window.removeEventListener('offline', checkStatus);
    };
  }, []);

  if (online && pendingCount === 0) {
    return null; // Don't show indicator when everything is normal
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!online ? (
        <div className="bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
          <WifiOff className="w-5 h-5" />
          <div>
            <p className="font-semibold">Offline Mode</p>
            <p className="text-xs">Changes will sync when reconnected</p>
          </div>
        </div>
      ) : pendingCount > 0 ? (
        <div className="bg-blue-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
          <CloudUpload className="w-5 h-5 animate-pulse" />
          <div>
            <p className="font-semibold">Syncing...</p>
            <p className="text-xs">{pendingCount} change{pendingCount > 1 ? 's' : ''} pending</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
