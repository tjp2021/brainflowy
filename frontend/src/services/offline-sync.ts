interface SyncQueueItem {
  id: string;
  timestamp: number;
  action: 'create' | 'update' | 'delete';
  endpoint: string;
  data: any;
  retryCount: number;
}

export class OfflineSyncService {
  private dbName = 'BrainFlowyOfflineDB';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  private syncQueue: SyncQueueItem[] = [];
  private isSyncing = false;
  private maxRetries = 3;

  async init(): Promise<void> {
    try {
      this.db = await this.openDatabase();
      await this.loadSyncQueue();
      this.startSyncMonitor();
      console.log('Offline sync service initialized');
    } catch (error) {
      console.error('Failed to initialize offline sync:', error);
    }
  }

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create stores for different data types
        if (!db.objectStoreNames.contains('syncQueue')) {
          db.createObjectStore('syncQueue', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('cachedData')) {
          const cachedStore = db.createObjectStore('cachedData', { keyPath: 'id' });
          cachedStore.createIndex('type', 'type', { unique: false });
          cachedStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('mindMaps')) {
          const mindMapStore = db.createObjectStore('mindMaps', { keyPath: 'id' });
          mindMapStore.createIndex('lastModified', 'lastModified', { unique: false });
        }

        if (!db.objectStoreNames.contains('notes')) {
          const notesStore = db.createObjectStore('notes', { keyPath: 'id' });
          notesStore.createIndex('lastModified', 'lastModified', { unique: false });
        }
      };
    });
  }

  async queueAction(action: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    const item: SyncQueueItem = {
      ...action,
      id: this.generateId(),
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.syncQueue.push(item);
    await this.saveSyncQueue();

    // Try to sync immediately if online
    if (navigator.onLine) {
      this.syncNow();
    }
  }

  async syncNow(): Promise<void> {
    if (this.isSyncing || !navigator.onLine) {
      return;
    }

    this.isSyncing = true;

    try {
      const failedItems: SyncQueueItem[] = [];

      for (const item of this.syncQueue) {
        try {
          await this.syncItem(item);
        } catch (error) {
          console.error(`Failed to sync item ${item.id}:`, error);
          item.retryCount++;
          
          if (item.retryCount < this.maxRetries) {
            failedItems.push(item);
          } else {
            console.error(`Max retries reached for item ${item.id}, removing from queue`);
            await this.notifyUserOfSyncFailure(item);
          }
        }
      }

      this.syncQueue = failedItems;
      await this.saveSyncQueue();

      if (this.syncQueue.length === 0) {
        console.log('All items synced successfully');
        await this.notifyUserOfSyncSuccess();
      }
    } finally {
      this.isSyncing = false;
    }
  }

  private async syncItem(item: SyncQueueItem): Promise<void> {
    const method = this.getHttpMethod(item.action);
    
    const response = await fetch(item.endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: item.action !== 'delete' ? JSON.stringify(item.data) : null,
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.status} ${response.statusText}`);
    }

    console.log(`Successfully synced item ${item.id}`);
  }

  private getHttpMethod(action: SyncQueueItem['action']): string {
    switch (action) {
      case 'create': return 'POST';
      case 'update': return 'PUT';
      case 'delete': return 'DELETE';
      default: return 'POST';
    }
  }

  async saveLocalData(type: string, id: string, data: any): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['cachedData'], 'readwrite');
    const store = transaction.objectStore('cachedData');

    await store.put({
      id,
      type,
      data,
      timestamp: Date.now(),
    });
  }

  async getLocalData(_type: string, id: string): Promise<any> {
    if (!this.db) return null;

    const transaction = this.db.transaction(['cachedData'], 'readonly');
    const store = transaction.objectStore('cachedData');
    const request = store.get(id);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result?.data);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllLocalData(type: string): Promise<any[]> {
    if (!this.db) return [];

    const transaction = this.db.transaction(['cachedData'], 'readonly');
    const store = transaction.objectStore('cachedData');
    const index = store.index('type');
    const request = index.getAll(type);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result.map(item => item.data));
      request.onerror = () => reject(request.error);
    });
  }

  private async loadSyncQueue(): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['syncQueue'], 'readonly');
    const store = transaction.objectStore('syncQueue');
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        this.syncQueue = request.result;
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  private async saveSyncQueue(): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');

    // Clear existing queue
    await store.clear();

    // Save current queue
    for (const item of this.syncQueue) {
      await store.add(item);
    }
  }

  private startSyncMonitor(): void {
    // Sync when coming back online
    window.addEventListener('online', () => {
      console.log('Connection restored, starting sync...');
      this.syncNow();
    });

    // Periodic sync attempt (every 30 seconds when online)
    setInterval(() => {
      if (navigator.onLine && this.syncQueue.length > 0) {
        this.syncNow();
      }
    }, 30000);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async notifyUserOfSyncSuccess(): Promise<void> {
    // Use the push notification service if available
    if ('serviceWorker' in navigator && 'Notification' in window) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification('BrainFlowy', {
        body: 'All changes have been synced successfully',
        icon: '/pwa-192x192.png',
        badge: '/pwa-64x64.png',
        tag: 'sync-success',
      });
    }
  }

  private async notifyUserOfSyncFailure(item: SyncQueueItem): Promise<void> {
    // Use the push notification service if available
    if ('serviceWorker' in navigator && 'Notification' in window) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification('BrainFlowy Sync Error', {
        body: `Failed to sync ${item.action} operation. Please check your connection.`,
        icon: '/pwa-192x192.png',
        badge: '/pwa-64x64.png',
        tag: 'sync-error',
      });
    }
  }

  async clearAllData(): Promise<void> {
    if (!this.db) return;

    const storeNames = ['syncQueue', 'cachedData', 'mindMaps', 'notes'];
    const transaction = this.db.transaction(storeNames, 'readwrite');

    for (const storeName of storeNames) {
      await transaction.objectStore(storeName).clear();
    }

    this.syncQueue = [];
    console.log('All offline data cleared');
  }

  getSyncQueueStatus(): { pending: number; total: number } {
    return {
      pending: this.syncQueue.length,
      total: this.syncQueue.length,
    };
  }
}

export const offlineSyncService = new OfflineSyncService();