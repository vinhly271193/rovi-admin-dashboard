// Cache Manager for Firebase Read Optimization
class CacheManager {
    constructor() {
        this.CACHE_DURATION = 3600000; // 1 hour in milliseconds
        this.cache = {};
        this.initCache();
    }

    initCache() {
        // Load cache from localStorage
        const savedCache = localStorage.getItem('roviDashboardCache');
        if (savedCache) {
            try {
                this.cache = JSON.parse(savedCache);
                this.cleanExpiredCache();
            } catch (error) {
                console.error('Error loading cache:', error);
                this.cache = {};
            }
        }
    }

    // Save cache to localStorage
    saveCache() {
        try {
            localStorage.setItem('roviDashboardCache', JSON.stringify(this.cache));
        } catch (error) {
            console.error('Error saving cache:', error);
            // If localStorage is full, clear old data
            if (error.name === 'QuotaExceededError') {
                this.clearOldestCache();
                this.saveCache();
            }
        }
    }

    // Get cached data or fetch new data
    async getCachedData(key, fetchFunction, forceRefresh = false) {
        // Check if we should force refresh
        if (forceRefresh) {
            delete this.cache[key];
        }

        // Check if cache exists and is valid
        if (this.cache[key] && this.isCacheValid(this.cache[key])) {
            console.log(`Using cached data for: ${key}`);
            return this.cache[key].data;
        }

        // Fetch fresh data
        console.log(`Fetching fresh data for: ${key}`);
        try {
            const freshData = await fetchFunction();
            
            // Store in cache
            this.cache[key] = {
                data: freshData,
                timestamp: Date.now()
            };
            
            this.saveCache();
            return freshData;
        } catch (error) {
            console.error(`Error fetching data for ${key}:`, error);
            
            // If fetch fails but we have expired cache, use it
            if (this.cache[key]) {
                console.log(`Using expired cache for ${key} due to fetch error`);
                return this.cache[key].data;
            }
            
            throw error;
        }
    }

    // Check if cache entry is still valid
    isCacheValid(cacheEntry) {
        if (!cacheEntry || !cacheEntry.timestamp) return false;
        return Date.now() - cacheEntry.timestamp < this.CACHE_DURATION;
    }

    // Clean expired cache entries
    cleanExpiredCache() {
        const now = Date.now();
        let hasChanges = false;
        
        Object.keys(this.cache).forEach(key => {
            if (!this.isCacheValid(this.cache[key])) {
                delete this.cache[key];
                hasChanges = true;
            }
        });
        
        if (hasChanges) {
            this.saveCache();
        }
    }

    // Clear oldest cache entries when storage is full
    clearOldestCache() {
        const entries = Object.entries(this.cache);
        if (entries.length === 0) return;
        
        // Sort by timestamp (oldest first)
        entries.sort((a, b) => {
            const timeA = a[1].timestamp || 0;
            const timeB = b[1].timestamp || 0;
            return timeA - timeB;
        });
        
        // Remove oldest 25% of entries
        const removeCount = Math.max(1, Math.floor(entries.length * 0.25));
        for (let i = 0; i < removeCount; i++) {
            delete this.cache[entries[i][0]];
        }
    }

    // Clear all cache
    clearAllCache() {
        this.cache = {};
        localStorage.removeItem('roviDashboardCache');
        console.log('All cache cleared');
    }

    // Get cache statistics
    getCacheStats() {
        const stats = {
            totalEntries: Object.keys(this.cache).length,
            validEntries: 0,
            expiredEntries: 0,
            totalSize: 0
        };
        
        Object.values(this.cache).forEach(entry => {
            if (this.isCacheValid(entry)) {
                stats.validEntries++;
            } else {
                stats.expiredEntries++;
            }
            
            // Estimate size
            stats.totalSize += JSON.stringify(entry).length;
        });
        
        stats.sizeInKB = (stats.totalSize / 1024).toFixed(2);
        
        return stats;
    }

    // Batch cache multiple queries
    async batchCache(requests) {
        const results = {};
        const promises = [];
        
        for (const request of requests) {
            const { key, fetchFunction, forceRefresh } = request;
            promises.push(
                this.getCachedData(key, fetchFunction, forceRefresh)
                    .then(data => {
                        results[key] = data;
                    })
                    .catch(error => {
                        results[key] = { error: error.message };
                    })
            );
        }
        
        await Promise.all(promises);
        return results;
    }
}

// Global cache manager instance
window.cacheManager = new CacheManager();

// Add refresh button functionality
document.addEventListener('DOMContentLoaded', () => {
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            if (confirm('This will clear all cached data and refresh. Continue?')) {
                window.cacheManager.clearAllCache();
                location.reload();
            }
        });
    }
});