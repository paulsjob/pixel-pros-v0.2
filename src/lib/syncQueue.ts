import { UserRoster, SportId } from '../types';
import { saveRosterToFirestore, setSquadLockFirestore } from './firestoreService';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

export interface PendingMutation {
  id: string;
  type: 'upsert_roster' | 'toggle_lock' | 'clear_stars';
  payload: any;
  timestamp: number;
  retryCount: number;
  lastAttempt?: number;
}

const OUTBOX_STORAGE_KEY = 'pixel_pros_sync_outbox_v1';
const MAX_RETRIES = 10;
const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30000;

class ResilientSyncQueue {
  private queue: PendingMutation[] = [];
  private isProcessing = false;
  private currentStatus: SyncStatus = 'synced';
  private listeners: Set<(status: SyncStatus, pendingCount: number) => void> = new Set();
  private onlineListener: (() => void) | null = null;
  private offlineListener: (() => void) | null = null;
  private visibilityListener: (() => void) | null = null;

  constructor() {
    this.loadQueueFromStorage();
    this.initNetworkListeners();
    // Attempt to flush on startup
    setTimeout(() => {
      this.processQueue();
    }, 1000);
  }

  private loadQueueFromStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(OUTBOX_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.queue = parsed;
        }
      }
    } catch {
      this.queue = [];
    }
  }

  private saveQueueToStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(this.queue));
    } catch {}
  }

  private setStatus(newStatus: SyncStatus): void {
    this.currentStatus = newStatus;
    const count = this.queue.length;
    this.listeners.forEach((listener) => {
      try {
        listener(newStatus, count);
      } catch {}
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('pixel_pros_sync_status', {
          detail: { status: newStatus, pendingCount: count },
        })
      );
    }
  }

  public getStatus(): { status: SyncStatus; pendingCount: number } {
    return {
      status: this.currentStatus,
      pendingCount: this.queue.length,
    };
  }

  public subscribe(listener: (status: SyncStatus, pendingCount: number) => void): () => void {
    this.listeners.add(listener);
    listener(this.currentStatus, this.queue.length);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private initNetworkListeners(): void {
    if (typeof window === 'undefined') return;

    this.onlineListener = () => {
      console.log('[SyncQueue] 📡 Network back online. Flushing outbox...');
      this.setStatus('syncing');
      this.processQueue();
    };

    this.offlineListener = () => {
      console.warn('[SyncQueue] ⚠️ Network offline. Changes queued in local outbox.');
      this.setStatus('offline');
    };

    this.visibilityListener = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        // When tab is reopened or browser app comes back to foreground
        this.processQueue();
      }
    };

    window.addEventListener('online', this.onlineListener);
    window.addEventListener('offline', this.offlineListener);
    document.addEventListener('visibilitychange', this.visibilityListener);
  }

  /**
   * Enqueue a roster upsert mutation with optimistic persistence
   */
  public async enqueueRosterUpsert(roster: UserRoster): Promise<void> {
    const cleanRoom = (roster.room_code || 'COUCH').trim().toUpperCase();
    const cleanUser = (roster.user_name || 'DAD').trim().toUpperCase();
    const cleanSport = roster.sport || 'nfl';
    const mutationId = `upsert_${cleanRoom}_${cleanUser}_${cleanSport}`;

    // De-duplicate: replace any existing pending mutation for this exact room + user + sport
    this.queue = this.queue.filter((m) => m.id !== mutationId);

    const mutation: PendingMutation = {
      id: mutationId,
      type: 'upsert_roster',
      payload: roster,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.queue.push(mutation);
    this.saveQueueToStorage();
    this.setStatus('syncing');

    // Trigger process
    this.processQueue();
  }

  /**
   * Enqueue squad lock toggle
   */
  public async enqueueLockToggle(
    roomCode: string,
    userName: string,
    sport: SportId,
    isLocked: boolean
  ): Promise<void> {
    const cleanRoom = (roomCode || 'COUCH').trim().toUpperCase();
    const cleanUser = (userName || '').trim().toUpperCase();
    const mutationId = `lock_${cleanRoom}_${cleanUser}_${sport}`;

    this.queue = this.queue.filter((m) => m.id !== mutationId);

    const mutation: PendingMutation = {
      id: mutationId,
      type: 'toggle_lock',
      payload: { roomCode: cleanRoom, userName: cleanUser, sport, isLocked },
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.queue.push(mutation);
    this.saveQueueToStorage();
    this.setStatus('syncing');

    this.processQueue();
  }

  /**
   * Processes the outbox queue in FIFO order with exponential backoff
   */
  public async processQueue(): Promise<void> {
    if (this.isProcessing) return;

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.setStatus('offline');
      return;
    }

    if (this.queue.length === 0) {
      this.setStatus('synced');
      return;
    }

    this.isProcessing = true;
    this.setStatus('syncing');

    try {
      while (this.queue.length > 0) {
        const item = this.queue[0];
        const now = Date.now();

        // Check backoff interval
        if (item.lastAttempt) {
          const backoff = Math.min(
            INITIAL_BACKOFF_MS * Math.pow(2, item.retryCount),
            MAX_BACKOFF_MS
          );
          if (now - item.lastAttempt < backoff) {
            // Wait for backoff window
            break;
          }
        }

        item.lastAttempt = now;
        let success = false;

        try {
          if (item.type === 'upsert_roster') {
            const roster = item.payload as UserRoster;
            // 1. Try Firestore directly
            try {
              await saveRosterToFirestore(roster);
              success = true;
            } catch (err) {
              console.warn('[SyncQueue] Firestore direct push failed, trying API proxy:', err);
            }

            // 2. Try Server API proxy
            try {
              const res = await fetch('/api/rosters', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(roster),
              });
              if (res.ok) success = true;
            } catch {}
          } else if (item.type === 'toggle_lock') {
            const { roomCode, userName, sport, isLocked } = item.payload;
            try {
              await setSquadLockFirestore(roomCode, userName, sport, isLocked);
              success = true;
            } catch {}

            try {
              const res = await fetch('/api/rosters/lock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ room_code: roomCode, user_name: userName, sport, is_locked: isLocked }),
              });
              if (res.ok) success = true;
            } catch {}
          }

          if (success) {
            // Remove succeeded item from queue
            this.queue.shift();
            this.saveQueueToStorage();
          } else {
            item.retryCount++;
            if (item.retryCount >= MAX_RETRIES) {
              console.error(`[SyncQueue] Item ${item.id} exceeded max retries, dropping.`);
              this.queue.shift();
              this.saveQueueToStorage();
            } else {
              // Stop processing until next backoff window
              break;
            }
          }
        } catch (execErr) {
          item.retryCount++;
          break;
        }
      }

      if (this.queue.length === 0) {
        this.setStatus('synced');
      } else {
        this.setStatus(typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'syncing');
      }
    } finally {
      this.isProcessing = false;
    }
  }
}

// Global Singleton Sync Queue
export const syncQueue = new ResilientSyncQueue();
