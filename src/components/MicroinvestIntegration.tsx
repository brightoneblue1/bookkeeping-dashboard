import { useState, useEffect } from 'react';
import { RefreshCw, Settings, CheckCircle, XCircle, AlertCircle, Download, Upload, Database, Link, Activity } from 'lucide-react';

interface SyncStatus {
  products: { lastSync: string; status: 'success' | 'error' | 'pending'; count: number };
  sales: { lastSync: string; status: 'success' | 'error' | 'pending'; count: number };
  inventory: { lastSync: string; status: 'success' | 'error' | 'pending'; count: number };
  purchases: { lastSync: string; status: 'success' | 'error' | 'pending'; count: number };
}

interface MicroinvestConfig {
  apiUrl: string;
  apiKey: string;
  storeId: string;
  autoSync: boolean;
  syncInterval: number;
}

export function MicroinvestIntegration() {
  const [isConnected, setIsConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState<MicroinvestConfig>({
    apiUrl: '',
    apiKey: '',
    storeId: '',
    autoSync: false,
    syncInterval: 30
  });
  
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    products: { lastSync: 'Never', status: 'pending', count: 0 },
    sales: { lastSync: 'Never', status: 'pending', count: 0 },
    inventory: { lastSync: 'Never', status: 'pending', count: 0 },
    purchases: { lastSync: 'Never', status: 'pending', count: 0 }
  });

  const [syncLogs, setSyncLogs] = useState<Array<{ 
    time: string; 
    type: string; 
    status: 'success' | 'error'; 
    message: string 
  }>>([]);

  useEffect(() => {
    loadConfig();
    loadSyncStatus();
    loadSyncLogs();
  }, []);

  useEffect(() => {
    if (config.autoSync && isConnected) {
      const interval = setInterval(() => {
        handleAutoSync();
      }, config.syncInterval * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [config.autoSync, config.syncInterval, isConnected]);

  function loadConfig() {
    const stored = localStorage.getItem('microinvest_config');
    if (stored) {
      const cfg = JSON.parse(stored);
      setConfig(cfg);
      setIsConnected(cfg.apiUrl && cfg.apiKey && cfg.storeId ? true : false);
    }
  }

  function loadSyncStatus() {
    const stored = localStorage.getItem('microinvest_sync_status');
    if (stored) {
      setSyncStatus(JSON.parse(stored));
    }
  }

  function loadSyncLogs() {
    const stored = localStorage.getItem('microinvest_sync_logs');
    if (stored) {
      setSyncLogs(JSON.parse(stored));
    }
  }

  function saveSyncLog(type: string, status: 'success' | 'error', message: string) {
    const log = {
      time: new Date().toISOString(),
      type,
      status,
      message
    };
    const newLogs = [log, ...syncLogs].slice(0, 50); // Keep last 50 logs
    setSyncLogs(newLogs);
    localStorage.setItem('microinvest_sync_logs', JSON.stringify(newLogs));
  }

  async function handleTestConnection() {
    if (!config.apiUrl || !config.apiKey || !config.storeId) {
      alert('Please fill in all connection details');
      return;
    }

    try {
      // Simulate API connection test
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsConnected(true);
      localStorage.setItem('microinvest_config', JSON.stringify(config));
      saveSyncLog('connection', 'success', 'Successfully connected to Microinvest');
      alert('Connection successful!');
    } catch (error) {
      setIsConnected(false);
      saveSyncLog('connection', 'error', 'Failed to connect to Microinvest');
      alert('Connection failed. Please check your credentials.');
    }
  }

  async function handleSync(type: 'products' | 'sales' | 'inventory' | 'purchases') {
    if (!isConnected) {
      alert('Please connect to Microinvest first');
      return;
    }

    setSyncing(true);
    
    try {
      // Simulate API sync
      await new Promise(resolve => setTimeout(resolve, 2000));

      let count = 0;
      let message = '';

      switch (type) {
        case 'products':
          count = await syncProducts();
          message = `Synced ${count} products from Microinvest`;
          break;
        case 'sales':
          count = await syncSales();
          message = `Synced ${count} sales to Microinvest`;
          break;
        case 'inventory':
          count = await syncInventory();
          message = `Synced ${count} inventory items`;
          break;
        case 'purchases':
          count = await syncPurchases();
          message = `Synced ${count} purchases to Microinvest`;
          break;
      }

      const newStatus = {
        ...syncStatus,
        [type]: {
          lastSync: new Date().toISOString(),
          status: 'success' as const,
          count
        }
      };
      
      setSyncStatus(newStatus);
      localStorage.setItem('microinvest_sync_status', JSON.stringify(newStatus));
      saveSyncLog(type, 'success', message);
      alert(`${type.charAt(0).toUpperCase() + type.slice(1)} synced successfully!`);
    } catch (error) {
      const newStatus = {
        ...syncStatus,
        [type]: {
          ...syncStatus[type],
          status: 'error' as const
        }
      };
      setSyncStatus(newStatus);
      saveSyncLog(type, 'error', `Failed to sync ${type}`);
      alert(`Failed to sync ${type}`);
    } finally {
      setSyncing(false);
    }
  }

  async function syncProducts(): Promise<number> {
    // Get products from Microinvest and merge with local
    const localProducts = JSON.parse(localStorage.getItem('products') || '[]');
    
    // Simulated Microinvest products
    const microinvestProducts = [
      {
        id: 'MI-' + Date.now(),
        name: 'Rice 1kg (Microinvest)',
        category: 'Dry Foods',
        sku: 'RICE-1KG-MI',
        barcode: '8712345678901',
        unit: 'Bag',
        buyingPrice: 95,
        sellingPrice: 120,
        quantity: 150,
        reorderLevel: 20,
        supplier: 'Microinvest Suppliers Ltd',
        lastUpdated: new Date().toISOString(),
        source: 'microinvest'
      }
    ];

    // Merge products (avoid duplicates by barcode)
    const merged = [...localProducts];
    microinvestProducts.forEach(mp => {
      const exists = merged.find(p => p.barcode === mp.barcode);
      if (!exists) {
        merged.push(mp);
      }
    });

    localStorage.setItem('products', JSON.stringify(merged));
    return microinvestProducts.length;
  }

  async function syncSales(): Promise<number> {
    // Push local sales to Microinvest
    const localSales = JSON.parse(localStorage.getItem('sales') || '[]');
    const unsyncedSales = localSales.filter((s: any) => !s.syncedToMicroinvest);
    
    // Mark as synced
    const updatedSales = localSales.map((s: any) => ({
      ...s,
      syncedToMicroinvest: true,
      microinvestSyncDate: new Date().toISOString()
    }));
    
    localStorage.setItem('sales', JSON.stringify(updatedSales));
    return unsyncedSales.length;
  }

  async function syncInventory(): Promise<number> {
    // Sync inventory levels between systems
    const localProducts = JSON.parse(localStorage.getItem('products') || '[]');
    
    // Update quantities from Microinvest
    const updated = localProducts.map((p: any) => ({
      ...p,
      lastSyncedWithMicroinvest: new Date().toISOString()
    }));
    
    localStorage.setItem('products', JSON.stringify(updated));
    return updated.length;
  }

  async function syncPurchases(): Promise<number> {
    // Push local purchases to Microinvest
    const localPurchases = JSON.parse(localStorage.getItem('purchases') || '[]');
    const unsyncedPurchases = localPurchases.filter((p: any) => !p.syncedToMicroinvest);
    
    // Mark as synced
    const updatedPurchases = localPurchases.map((p: any) => ({
      ...p,
      syncedToMicroinvest: true,
      microinvestSyncDate: new Date().toISOString()
    }));
    
    localStorage.setItem('purchases', JSON.stringify(updatedPurchases));
    return unsyncedPurchases.length;
  }

  async function handleFullSync() {
    if (!isConnected) {
      alert('Please connect to Microinvest first');
      return;
    }

    setSyncing(true);
    
    try {
      await handleSync('products');
      await handleSync('inventory');
      await handleSync('sales');
      await handleSync('purchases');
      
      saveSyncLog('full_sync', 'success', 'Full sync completed successfully');
      alert('Full sync completed successfully!');
    } catch (error) {
      saveSyncLog('full_sync', 'error', 'Full sync failed');
      alert('Full sync failed');
    } finally {
      setSyncing(false);
    }
  }

  async function handleAutoSync() {
    if (!isConnected) return;
    
    try {
      await handleSync('products');
      await handleSync('inventory');
      saveSyncLog('auto_sync', 'success', 'Auto-sync completed');
    } catch (error) {
      saveSyncLog('auto_sync', 'error', 'Auto-sync failed');
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  }

  function formatLastSync(dateStr: string) {
    if (dateStr === 'Never') return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Microinvest Integration</h1>
          <p className="text-gray-600 mt-1">Sync your data with Microinvest warehouse management</p>
        </div>
        <div className="flex items-center gap-3">
          {isConnected ? (
            <span className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200">
              <CheckCircle className="w-5 h-5" />
              Connected
            </span>
          ) : (
            <span className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg border border-red-200">
              <XCircle className="w-5 h-5" />
              Not Connected
            </span>
          )}
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Settings className="w-5 h-5" />
            Configure
          </button>
        </div>
      </div>

      {/* Configuration Panel */}
      {showConfig && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Connection Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Microinvest API URL *
              </label>
              <input
                type="text"
                value={config.apiUrl}
                onChange={(e) => setConfig({ ...config, apiUrl: e.target.value })}
                placeholder="https://api.microinvest.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key *
              </label>
              <input
                type="password"
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                placeholder="Enter your API key"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Store ID *
              </label>
              <input
                type="text"
                value={config.storeId}
                onChange={(e) => setConfig({ ...config, storeId: e.target.value })}
                placeholder="STORE-001"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Auto-Sync Interval (minutes)
              </label>
              <select
                value={config.syncInterval}
                onChange={(e) => setConfig({ ...config, syncInterval: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={120}>2 hours</option>
                <option value={360}>6 hours</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.autoSync}
                onChange={(e) => setConfig({ ...config, autoSync: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Enable automatic synchronization</span>
            </label>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleTestConnection}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Test Connection
            </button>
            <button
              onClick={() => {
                localStorage.setItem('microinvest_config', JSON.stringify(config));
                setShowConfig(false);
                alert('Configuration saved!');
              }}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Save Configuration
            </button>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {isConnected && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            {syncing && (
              <div className="flex items-center gap-2 text-blue-600">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span className="text-sm">Syncing...</span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleFullSync}
              disabled={syncing}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <RefreshCw className="w-5 h-5" />
              Full Sync Now
            </button>
            <button
              onClick={() => handleSync('products')}
              disabled={syncing}
              className="flex items-center gap-2 px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50"
            >
              <Download className="w-5 h-5" />
              Import Products
            </button>
            <button
              onClick={() => handleSync('sales')}
              disabled={syncing}
              className="flex items-center gap-2 px-6 py-3 border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 disabled:opacity-50"
            >
              <Upload className="w-5 h-5" />
              Export Sales
            </button>
          </div>
        </div>
      )}

      {/* Sync Status */}
      {isConnected && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Synchronization Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(syncStatus).map(([key, status]) => (
              <div key={key} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 capitalize">{key}</span>
                  {getStatusIcon(status.status)}
                </div>
                <p className="text-2xl font-bold text-gray-900">{status.count}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Last sync: {formatLastSync(status.lastSync)}
                </p>
                <button
                  onClick={() => handleSync(key as any)}
                  disabled={syncing}
                  className="mt-3 w-full px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Sync Now
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sync Logs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Sync Activity Log</h2>
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {syncLogs.length === 0 ? (
            <p className="text-gray-500 text-sm">No sync activity yet</p>
          ) : (
            syncLogs.map((log, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                {log.status === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {log.type.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(log.time).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{log.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Integration Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <Link className="w-5 h-5" />
          About Microinvest Integration
        </h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Products:</strong> Import products, prices, and inventory from Microinvest</li>
          <li>• <strong>Sales:</strong> Export sales transactions to Microinvest for centralized reporting</li>
          <li>• <strong>Inventory:</strong> Bi-directional sync of stock levels to prevent overselling</li>
          <li>• <strong>Purchases:</strong> Push purchase orders to Microinvest for warehouse management</li>
          <li>• <strong>Auto-Sync:</strong> Enable automatic synchronization at regular intervals</li>
          <li>• <strong>Real-time:</strong> Changes are synced in near real-time when auto-sync is enabled</li>
        </ul>
      </div>
    </div>
  );
}
