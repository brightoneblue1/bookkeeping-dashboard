// Offline storage with auto-sync to online database

interface QueuedOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: string;
  data: any;
  timestamp: number;
}

class OfflineStorage {
  private dbName = 'bookkeeping_offline_db';
  private syncQueueKey = 'sync_queue';
  private isOnline = navigator.onLine;
  private syncInProgress = false;

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      console.log('Connection restored - syncing data...');
      this.isOnline = true;
      this.syncToServer();
    });

    window.addEventListener('offline', () => {
      console.log('Connection lost - switching to offline mode');
      this.isOnline = false;
    });

    // Try to sync on page load
    if (this.isOnline) {
      this.syncToServer();
    }
  }

  // Save data locally
  saveLocal(key: string, data: any): void {
    try {
      localStorage.setItem(`${this.dbName}:${key}`, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to local storage:', error);
    }
  }

  // Get data from local storage
  getLocal(key: string): any | null {
    try {
      const data = localStorage.getItem(`${this.dbName}:${key}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error reading from local storage:', error);
      return null;
    }
  }

  // Get all keys with a prefix
  getAllLocal(prefix: string): any[] {
    const results: any[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`${this.dbName}:${prefix}`)) {
          const data = localStorage.getItem(key);
          if (data) {
            results.push(JSON.parse(data));
          }
        }
      }
    } catch (error) {
      console.error('Error reading from local storage:', error);
    }
    return results;
  }

  // Queue an operation for sync
  queueOperation(operation: Omit<QueuedOperation, 'id' | 'timestamp'>): void {
    const queue = this.getSyncQueue();
    const newOperation: QueuedOperation = {
      ...operation,
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };
    queue.push(newOperation);
    localStorage.setItem(this.syncQueueKey, JSON.stringify(queue));

    // Try to sync immediately if online
    if (this.isOnline) {
      this.syncToServer();
    }
  }

  // Get sync queue
  private getSyncQueue(): QueuedOperation[] {
    try {
      const queue = localStorage.getItem(this.syncQueueKey);
      return queue ? JSON.parse(queue) : [];
    } catch (error) {
      console.error('Error reading sync queue:', error);
      return [];
    }
  }

  // Sync queued operations to server
  async syncToServer(): Promise<void> {
    if (this.syncInProgress || !this.isOnline) {
      return;
    }

    this.syncInProgress = true;
    const queue = this.getSyncQueue();

    if (queue.length === 0) {
      this.syncInProgress = false;
      return;
    }

    console.log(`Syncing ${queue.length} operations to server...`);

    const successfulOps: string[] = [];

    for (const operation of queue) {
      try {
        await this.executeOperation(operation);
        successfulOps.push(operation.id);
      } catch (error) {
        console.error(`Failed to sync operation ${operation.id}:`, error);
        // If we get a network error, stop trying
        if (error instanceof TypeError && error.message.includes('fetch')) {
          this.isOnline = false;
          break;
        }
      }
    }

    // Remove successful operations from queue
    if (successfulOps.length > 0) {
      const remainingQueue = queue.filter(op => !successfulOps.includes(op.id));
      localStorage.setItem(this.syncQueueKey, JSON.stringify(remainingQueue));
      console.log(`Synced ${successfulOps.length} operations successfully`);
    }

    this.syncInProgress = false;
  }

  // Execute a queued operation
  private async executeOperation(operation: QueuedOperation): Promise<void> {
    const { type, entity, data } = operation;
    
    try {
      // Import API functions dynamically
      const api = await import('./api');

      switch (entity) {
        case 'product':
          if (type === 'create') await api.createProduct(data);
          else if (type === 'update') await api.updateProduct(data.sku, data);
          else if (type === 'delete') await api.deleteProduct(data.sku);
          break;
        
        case 'sale':
          if (type === 'create') await api.createSale(data);
          break;
        
        case 'expense':
          if (type === 'create') await api.createExpense(data);
          break;
        
        case 'customer':
          if (type === 'create') await api.createCustomer(data);
          else if (type === 'update') await api.updateCustomer(data.id, data);
          break;
        
        case 'supplier':
          if (type === 'create') await api.createSupplier(data);
          else if (type === 'update') await api.updateSupplier(data.id, data);
          break;
        
        case 'transaction':
          if (type === 'create') await api.createTransaction(data);
          break;
        
        case 'settings':
          if (type === 'update') await api.updateSettings(data);
          break;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error executing operation ${operation.id}:`, errorMessage);
      throw new Error(errorMessage);
    }
  }

  // Check if online
  isOnlineMode(): boolean {
    return this.isOnline;
  }

  // Get pending sync count
  getPendingSyncCount(): number {
    return this.getSyncQueue().length;
  }

  // Clear all local data (use with caution)
  clearAll(): void {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.dbName)) {
        keys.push(key);
      }
    }
    keys.forEach(key => localStorage.removeItem(key));
    localStorage.removeItem(this.syncQueueKey);
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorage();

// Helper functions for common operations
export function saveOffline(key: string, data: any): void {
  offlineStorage.saveLocal(key, data);
}

export function getOffline(key: string): any | null {
  return offlineStorage.getLocal(key);
}

export function getAllOffline(prefix: string): any[] {
  return offlineStorage.getAllLocal(prefix);
}

export function queueForSync(entity: string, type: 'create' | 'update' | 'delete', data: any): void {
  offlineStorage.queueOperation({ type, entity, data });
}

export function getPendingSync(): number {
  return offlineStorage.getPendingSyncCount();
}

export function isOnline(): boolean {
  return offlineStorage.isOnlineMode();
}