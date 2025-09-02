/**
 * Simple in-memory cache for API responses
 * Helps reduce database load for frequently requested data
 */

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class SimpleCache {
  private cache = new Map<string, CacheEntry>();
  private profileCache = new Map<string, CacheEntry>();
  private maxSize = 1000; // Prevent memory leaks

  set(key: string, data: any, ttlMinutes: number = 5): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000,
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  // Optimized profile caching methods
  setProfile(userId: string, profileData: any, ttlMinutes: number = 10): void {
    this.profileCache.set(userId, {
      data: profileData,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000,
    });
  }

  getProfile(userId: string): any | null {
    const entry = this.profileCache.get(userId);

    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.profileCache.delete(userId);
      return null;
    }

    return entry.data;
  }

  // Batch profile operations for better performance
  setProfiles(profiles: Array<{ id: string; [key: string]: any }>, ttlMinutes: number = 10): void {
    profiles.forEach((profile) => {
      this.setProfile(profile.id, profile, ttlMinutes);
    });
  }

  getProfiles(userIds: string[]): { [key: string]: any } {
    const result: { [key: string]: any } = {};
    const missing: string[] = [];

    userIds.forEach((userId) => {
      const profile = this.getProfile(userId);
      if (profile) {
        result[userId] = profile;
      } else {
        missing.push(userId);
      }
    });

    return { cached: result, missing };
  }

  clear(): void {
    this.cache.clear();
    this.profileCache.clear();
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();

    // Clean main cache
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }

    // Clean profile cache
    for (const [key, entry] of this.profileCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.profileCache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats(): { size: number; profileCacheSize: number; keys: string[] } {
    return {
      size: this.cache.size,
      profileCacheSize: this.profileCache.size,
      keys: Array.from(this.cache.keys()).slice(0, 10), // First 10 keys only
    };
  }
}

export const apiCache = new SimpleCache();

// Clean up expired entries every 10 minutes
if (typeof window === "undefined") {
  // Server-side only
  setInterval(
    () => {
      apiCache.cleanup();
    },
    10 * 60 * 1000
  );
}
