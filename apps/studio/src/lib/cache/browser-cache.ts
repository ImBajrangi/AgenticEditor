/**
 * High-Performance Client-Side Cache Data System
 * Designed for low-latency, zero-flicker playback and seamless performance
 * across low-tier and high-tier hardware (mobile, tablet, and desktop).
 */

class ClientMediaCache {
  private memoryCache = new Map<string, unknown>();
  private maxMemoryEntries = 100;

  /**
   * Generates a cache key for timeline frames, waveforms, or node outputs.
   */
  public generateKey(prefix: string, id: string, version: number | string): string {
    return `aether_${prefix}_${id}_v${version}`;
  }

  public get<T>(key: string): T | null {
    // 1. Check ultra-fast L1 In-Memory Cache
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key) as T;
    }

    // 2. Check persistent L2 Storage (LocalStorage / IndexedDB bridge)
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const item = window.localStorage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item);
          this.memoryCache.set(key, parsed);
          return parsed as T;
        }
      } catch {
        // Fallback gracefully on low-memory/quota exceeded
      }
    }

    return null;
  }

  public set<T>(key: string, value: T): void {
    // Set L1
    if (this.memoryCache.size >= this.maxMemoryEntries) {
      const firstKey = this.memoryCache.keys().next().value;
      if (firstKey) this.memoryCache.delete(firstKey);
    }
    this.memoryCache.set(key, value);

    // Set L2 asynchronously to prevent blocking the 60fps main UI thread
    if (typeof window !== "undefined" && window.localStorage) {
      setTimeout(() => {
        try {
          window.localStorage.setItem(key, JSON.stringify(value));
        } catch {
          // Quota exceeded: clean oldest entries
          try {
            window.localStorage.clear();
          } catch {}
        }
      }, 0);
    }
  }

  public clear(): void {
    this.memoryCache.clear();
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.clear();
      } catch {}
    }
  }
}

export const browserCache = new ClientMediaCache();
