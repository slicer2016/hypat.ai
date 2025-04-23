/**
 * Cache Manager Implementation
 * Provides in-memory caching for database entities
 */

import { Cache, CacheManager } from '../interfaces.js';
import { Logger } from '../../utils/logger.js';

/**
 * Implementation of the Cache interface
 */
class MemoryCache implements Cache {
  private cache: Map<string, { value: any; expires?: number }> = new Map();
  private stats = {
    hits: 0,
    misses: 0
  };
  private maxSize: number;
  private defaultTtl?: number;
  private logger: Logger;
  
  constructor(name: string, options?: { ttl?: number; maxSize?: number }) {
    this.maxSize = options?.maxSize || 1000;
    this.defaultTtl = options?.ttl;
    this.logger = new Logger(`MemoryCache:${name}`);
  }
  
  /**
   * Get a value from the cache
   * @param key The cache key
   */
  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    
    if (!item) {
      this.stats.misses++;
      return null;
    }
    
    // Check if the item has expired
    if (item.expires && item.expires < Date.now()) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }
    
    this.stats.hits++;
    return item.value as T;
  }
  
  /**
   * Set a value in the cache
   * @param key The cache key
   * @param value The value to cache
   * @param ttl Time to live in seconds
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    // Check if we need to evict items due to maxSize
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictOldest();
    }
    
    const expires = ttl || this.defaultTtl 
      ? Date.now() + ((ttl || this.defaultTtl) as number) * 1000 
      : undefined;
    
    this.cache.set(key, { value, expires });
  }
  
  /**
   * Delete a value from the cache
   * @param key The cache key
   */
  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }
  
  /**
   * Check if a key exists in the cache
   * @param key The cache key
   */
  async has(key: string): Promise<boolean> {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }
    
    // Check if the item has expired
    if (item.expires && item.expires < Date.now()) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
  
  /**
   * Clear the entire cache
   */
  async clear(): Promise<void> {
    this.cache.clear();
  }
  
  /**
   * Get cache stats
   */
  async getStats(): Promise<{
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
  }> {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;
    
    return {
      size: this.cache.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate
    };
  }
  
  /**
   * Evict the oldest item from the cache
   */
  private evictOldest(): void {
    // Find the oldest item
    let oldestKey: string | null = null;
    let oldestExpires: number | undefined = undefined;
    
    for (const [key, item] of this.cache.entries()) {
      if (oldestKey === null || (item.expires && (!oldestExpires || item.expires < oldestExpires))) {
        oldestKey = key;
        oldestExpires = item.expires;
      }
    }
    
    // Delete the oldest item
    if (oldestKey) {
      this.logger.debug(`Evicting oldest item: ${oldestKey}`);
      this.cache.delete(oldestKey);
    }
  }
}

/**
 * Implementation of the CacheManager interface
 */
export class CacheManagerImpl implements CacheManager {
  private caches: Map<string, Cache> = new Map();
  private defaultOptions: {
    ttl?: number;
    maxSize?: number;
  };
  private logger: Logger;
  
  constructor(defaultOptions?: { ttl?: number; maxSize?: number }) {
    this.defaultOptions = defaultOptions || {};
    this.logger = new Logger('CacheManager');
  }
  
  /**
   * Get a cache instance
   * @param name The cache name
   */
  getCache(name: string): Cache {
    let cache = this.caches.get(name);
    
    if (!cache) {
      cache = this.createCache(name);
    }
    
    return cache;
  }
  
  /**
   * Create a new cache instance
   * @param name The cache name
   * @param options Cache options
   */
  createCache(name: string, options?: {
    ttl?: number;
    maxSize?: number;
  }): Cache {
    this.logger.info(`Creating cache: ${name}`);
    
    // Merge default options with provided options
    const mergedOptions = {
      ttl: options?.ttl || this.defaultOptions.ttl,
      maxSize: options?.maxSize || this.defaultOptions.maxSize
    };
    
    const cache = new MemoryCache(name, mergedOptions);
    this.caches.set(name, cache);
    
    return cache;
  }
  
  /**
   * Delete a cache instance
   * @param name The cache name
   */
  async deleteCache(name: string): Promise<void> {
    this.logger.info(`Deleting cache: ${name}`);
    
    const cache = this.caches.get(name);
    
    if (cache) {
      await cache.clear();
      this.caches.delete(name);
    }
  }
  
  /**
   * Clear all caches
   */
  async clearAll(): Promise<void> {
    this.logger.info('Clearing all caches');
    
    const clearPromises = Array.from(this.caches.values()).map(cache =>
      cache.clear()
    );
    
    await Promise.all(clearPromises);
  }
}