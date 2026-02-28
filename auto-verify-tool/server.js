const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const EventEmitter = require('events');
const { verifySheerID } = require('./verifier');
const { proxyManager } = require('./proxy-manager');

const app = express();
const PORT = process.env.PORT || 3000;

// Global log emitter for SSE
const logEmitter = new EventEmitter();
logEmitter.setMaxListeners(100);

// Base emitLog function with session support
const emitLogWithSession = (message, type = 'info', sessionId = null) => {
    const logData = { time: new Date().toISOString(), message, type, sessionId };
    console.log(`[${sessionId || 'GLOBAL'}] [${type.toUpperCase()}] ${message}`);
    logEmitter.emit('log', logData);
};

// Default global emitLog (without session)
global.emitLog = (message, type = 'info') => {
    emitLogWithSession(message, type, null);
};

app.use(cors());
app.use(bodyParser.json());

// Health check (before static to ensure API works)
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'SheerID Verification API is running' });
});

// ============== PROXY MANAGEMENT API ==============

// Load proxies from a list
app.post('/api/proxies', (req, res) => {
    const { proxies } = req.body;
    if (!proxies || typeof proxies !== 'string') {
        return res.status(400).json({ success: false, error: 'Provide "proxies" as a newline-separated string' });
    }
    const count = proxyManager.loadFromString(proxies);
    console.log(`[PROXY] Loaded ${count} proxies`);
    res.json({ success: true, loaded: count, available: proxyManager.availableCount });
});

// Get proxy status
app.get('/api/proxies', (req, res) => {
    res.json({
        total: proxyManager.count,
        available: proxyManager.availableCount,
        failed: proxyManager.count - proxyManager.availableCount
    });
});

// Test a random proxy
app.get('/api/proxies/test', async (req, res) => {
    if (proxyManager.count === 0) {
        return res.json({ success: false, error: 'No proxies loaded' });
    }
    const proxy = proxyManager.getRandom();
    const result = await proxyManager.testProxy(proxy);
    if (result.working) {
        proxyManager.markSuccess(proxy);
    } else {
        proxyManager.markFailed(proxy);
    }
    res.json(result);
});

// Clear all proxies
app.delete('/api/proxies', (req, res) => {
    proxyManager.loadFromArray([]);
    res.json({ success: true, message: 'All proxies cleared' });
});

// Serve frontend
app.use(express.static(path.join(__dirname, '..')));

// SSE endpoint with session filtering
app.get('/api/logs', (req, res) => {
    const sessionId = req.query.sessionId;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const sendLog = (data) => {
        // STRICT: Only send logs that match this session
        if (sessionId && data.sessionId === sessionId) {
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        }
    };

    logEmitter.on('log', sendLog);

    req.on('close', () => {
        logEmitter.off('log', sendLog);
    });
});

// Verify endpoint with isolated session logging
app.post('/api/verify', async (req, res) => {
    const { url, type, sessionId, proxy } = req.body;

    // If a single proxy was sent with the request, load it temporarily
    if (proxy && typeof proxy === 'string' && proxy.trim()) {
        const loaded = proxyManager.loadFromString(proxy);
        console.log(`[PROXY] Loaded ${loaded} proxy(ies) from verify request`);
    }

    if (!url) {
        return res.status(400).json({ success: false, error: 'URL is required' });
    }

    const sid = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create session-specific logger
    const sessionEmitLog = (message, logType = 'info') => {
        emitLogWithSession(message, logType, sid);
    };

    // Set global emitLog to this session's logger for this request
    // Use AsyncLocalStorage pattern to avoid race conditions
    const previousEmitLog = global.emitLog;
    global.emitLog = sessionEmitLog;

    sessionEmitLog(`🚀 Received verification request [Type: ${type || 'spotify'}]`, 'info');

    try {
        const result = await verifySheerID(url, type);
        res.json({ ...result, sessionId: sid });
    } catch (error) {
        sessionEmitLog(`❌ Error: ${error.message}`, 'error');
        res.json({ success: false, error: error.message, sessionId: sid });
    } finally {
        // Note: In high-concurrency scenarios, this can still have race conditions
        // For production, use AsyncLocalStorage
        global.emitLog = previousEmitLog;
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
