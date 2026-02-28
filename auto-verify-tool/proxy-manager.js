/**
 * Proxy Manager - Handles proxy rotation and configuration
 * Supports HTTP, HTTPS, and SOCKS5 proxies
 * Format: host:port:username:password
 */

const { HttpsProxyAgent } = require('https-proxy-agent');
const { SocksProxyAgent } = require('socks-proxy-agent');

class ProxyManager {
    constructor() {
        this.proxies = [];
        this.currentIndex = 0;
        this.failedProxies = new Set();
        this.proxyStats = new Map(); // track success/fail per proxy
    }

    /**
     * Parse proxy string in format host:port:username:password
     */
    parseProxy(proxyStr) {
        const parts = proxyStr.trim().split(':');
        if (parts.length < 2) return null;

        const host = parts[0];
        const port = parseInt(parts[1]);
        const username = parts.length > 2 ? parts[2] : null;
        const password = parts.length > 3 ? parts.slice(3).join(':') : null; // password may contain colons

        if (!host || isNaN(port)) return null;

        return { host, port, username, password, raw: proxyStr };
    }

    /**
     * Load proxies from a newline-separated string
     */
    loadFromString(proxyListStr) {
        this.proxies = [];
        this.currentIndex = 0;
        this.failedProxies.clear();

        const lines = proxyListStr.split('\n').map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('#'));

        for (const line of lines) {
            const parsed = this.parseProxy(line);
            if (parsed) {
                this.proxies.push(parsed);
            }
        }

        return this.proxies.length;
    }

    /**
     * Load proxies from an array of proxy strings
     */
    loadFromArray(proxyArray) {
        this.proxies = [];
        this.currentIndex = 0;
        this.failedProxies.clear();

        for (const p of proxyArray) {
            const parsed = this.parseProxy(p);
            if (parsed) {
                this.proxies.push(parsed);
            }
        }

        return this.proxies.length;
    }

    /**
     * Get next proxy (round-robin, skipping failed ones)
     */
    getNext() {
        if (this.proxies.length === 0) return null;

        const availableProxies = this.proxies.filter(p => !this.failedProxies.has(p.raw));
        if (availableProxies.length === 0) {
            // Reset failed proxies and try again
            this.failedProxies.clear();
            global.emitLog?.('🔄 All proxies failed, resetting and retrying...', 'warn');
            return this.proxies[0];
        }

        const proxy = availableProxies[this.currentIndex % availableProxies.length];
        this.currentIndex++;
        return proxy;
    }

    /**
     * Get a random proxy
     */
    getRandom() {
        const available = this.proxies.filter(p => !this.failedProxies.has(p.raw));
        if (available.length === 0) {
            this.failedProxies.clear();
            return this.proxies[Math.floor(Math.random() * this.proxies.length)];
        }
        return available[Math.floor(Math.random() * available.length)];
    }

    /**
     * Mark a proxy as failed
     */
    markFailed(proxy) {
        if (proxy) {
            this.failedProxies.add(proxy.raw);
            const stats = this.proxyStats.get(proxy.raw) || { success: 0, fail: 0 };
            stats.fail++;
            this.proxyStats.set(proxy.raw, stats);
        }
    }

    /**
     * Mark a proxy as successful
     */
    markSuccess(proxy) {
        if (proxy) {
            this.failedProxies.delete(proxy.raw); // remove from failed if it was there
            const stats = this.proxyStats.get(proxy.raw) || { success: 0, fail: 0 };
            stats.success++;
            this.proxyStats.set(proxy.raw, stats);
        }
    }

    /**
     * Build proxy URL from parsed proxy object
     */
    buildProxyUrl(proxy, protocol = 'http') {
        if (!proxy) return null;
        const auth = proxy.username ? `${encodeURIComponent(proxy.username)}:${encodeURIComponent(proxy.password)}@` : '';
        return `${protocol}://${auth}${proxy.host}:${proxy.port}`;
    }

    /**
     * Create an HttpsProxyAgent or SocksProxyAgent for the given proxy
     */
    createAgent(proxy) {
        if (!proxy) return null;

        const isSocks = proxy.port === 1080 || proxy.host.includes('socks');
        const proxyUrl = this.buildProxyUrl(proxy, isSocks ? 'socks5' : 'http');

        try {
            if (isSocks) {
                return new SocksProxyAgent(proxyUrl);
            } else {
                return new HttpsProxyAgent(proxyUrl);
            }
        } catch (err) {
            global.emitLog?.(`⚠️ Failed to create agent for ${proxy.host}:${proxy.port}: ${err.message}`, 'warn');
            return null;
        }
    }

    /**
     * Get axios config for a specific proxy
     */
    getAxiosConfig(proxy) {
        if (!proxy) return {};
        const agent = this.createAgent(proxy);
        if (!agent) return {};

        return {
            httpAgent: agent,
            httpsAgent: agent,
            proxy: false // disable axios built-in proxy, use agent instead
        };
    }

    /**
     * Get count of loaded proxies
     */
    get count() {
        return this.proxies.length;
    }

    /**
     * Get count of available (non-failed) proxies
     */
    get availableCount() {
        return this.proxies.filter(p => !this.failedProxies.has(p.raw)).length;
    }

    /**
     * Test a proxy by making a request to a test URL
     */
    async testProxy(proxy, timeout = 10000) {
        const axios = require('axios');
        const config = this.getAxiosConfig(proxy);

        try {
            const response = await axios.get('https://httpbin.org/ip', {
                ...config,
                timeout
            });
            return {
                working: true,
                ip: response.data?.origin || 'unknown',
                proxy: `${proxy.host}:${proxy.port}`
            };
        } catch (err) {
            return {
                working: false,
                error: err.message,
                proxy: `${proxy.host}:${proxy.port}`
            };
        }
    }
}

// Singleton instance
const proxyManager = new ProxyManager();

module.exports = { ProxyManager, proxyManager };
