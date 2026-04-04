// ─────────────────────────────────────────────────────────────────────────────
//  VALENHART MINI — Multi-user Server
// ─────────────────────────────────────────────────────────────────────────────

const express = require('express');
const fs = require('fs');
const path = require('path');
const NodeCache = require('node-cache');
const pino = require('pino');

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    Browsers,
    delay
} = require('@whiskeysockets/baileys');

const { startBotForUser, stopBotForUser } = require('./bot');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'), { index: 'index.html' }));

const PORT = process.env.PORT || 3000;

// ─── Debug: log startup paths ─────────────────────────────────────────────────
console.log('📁 __dirname:', __dirname);
console.log('📁 public path:', path.join(__dirname, 'public', 'index.html'));
console.log('📁 exists:', require('fs').existsSync(path.join(__dirname, 'public', 'index.html')));
const SESSIONS_DIR = path.join(__dirname, 'sessions');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'valenhart2024';
const MAX_BOTS = parseInt(process.env.MAX_BOTS || '50');

fs.mkdirSync(SESSIONS_DIR, { recursive: true });

// ─── Init data/ folder ────────────────────────────────────────────────────────
const DATA_DIR = path.join(__dirname, 'data');
const DATA_TEMPLATE = path.join(__dirname, 'data-template');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    if (fs.existsSync(DATA_TEMPLATE)) {
        for (const file of fs.readdirSync(DATA_TEMPLATE)) {
            const src = path.join(DATA_TEMPLATE, file);
            const dst = path.join(DATA_DIR, file);
            if (!fs.existsSync(dst)) fs.copyFileSync(src, dst);
        }
    }
}

// phone → { status, code, connectedAt, messageCount, sock }
const sessions = new Map();
const startTime = Date.now();

function sessionDir(phone) { return path.join(SESSIONS_DIR, phone); }

function getStats() {
    const connected = [...sessions.values()].filter(s => s.status === 'connected').length;
    const pending   = [...sessions.values()].filter(s => s.status === 'pending' || s.status === 'code_ready').length;
    const uptimeMs  = Date.now() - startTime;
    const hours     = Math.floor(uptimeMs / 3600000);
    const mins      = Math.floor((uptimeMs % 3600000) / 60000);
    return { connected, pending, total: sessions.size, uptime: `${hours}h ${mins}m`, maxBots: MAX_BOTS };
}

// ─── Admin auth middleware ────────────────────────────────────────────────────
function adminAuth(req, res, next) {
    const token = req.headers['x-admin-token'] || req.query.token;
    if (token !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
    next();
}

// ─── Reconnect existing sessions ─────────────────────────────────────────────
async function reconnectExisting() {
    if (!fs.existsSync(SESSIONS_DIR)) return;
    const folders = fs.readdirSync(SESSIONS_DIR);
    for (const phone of folders) {
        const credsPath = path.join(SESSIONS_DIR, phone, 'creds.json');
        if (!fs.existsSync(credsPath)) continue;
        console.log(`♻️  Reconnecting: ${phone}`);
        sessions.set(phone, { status: 'connected', code: null, connectedAt: Date.now(), messageCount: 0 });
        startBotForUser(phone, sessionDir(phone), (status, data) => {
            const s = sessions.get(phone);
            if (!s) return;
            s.status = status;
            if (data?.messageCount) s.messageCount = data.messageCount;
        });
    }
}

// ─── POST /api/pair ───────────────────────────────────────────────────────────
app.post('/api/pair', async (req, res) => {
    let { phone } = req.body;
    phone = (phone || '').replace(/[^0-9]/g, '').trim();

    if (!phone || phone.length < 7 || phone.length > 15)
        return res.status(400).json({ error: 'Invalid number. Format: 237600000000' });

    const connected = [...sessions.values()].filter(s => s.status === 'connected').length;
    if (connected >= MAX_BOTS)
        return res.status(503).json({ error: `Server full. Max ${MAX_BOTS} bots allowed.` });

    if (sessions.has(phone)) {
        const s = sessions.get(phone);
        if (s.status === 'connected')  return res.json({ connected: true, phone });
        if (s.status === 'code_ready') return res.json({ code: s.code, phone });
        if (s.status === 'pending')    return res.json({ pending: true, phone });
        if (s.status === 'error')      sessions.delete(phone);
    }

    sessions.set(phone, { status: 'pending', code: null, connectedAt: null, messageCount: 0 });
    res.json({ pending: true, phone });
    runPairing(phone);
});

// ─── GET /api/status/:phone ───────────────────────────────────────────────────
app.get('/api/status/:phone', (req, res) => {
    const phone = (req.params.phone || '').replace(/[^0-9]/g, '');
    const s = sessions.get(phone);
    if (!s) return res.json({ status: 'not_found' });
    res.json({ status: s.status, code: s.code || null, phone });
});

// ─── GET /api/stats — public stats ───────────────────────────────────────────
app.get('/api/stats', (req, res) => res.json(getStats()));

// ─── ADMIN ROUTES ─────────────────────────────────────────────────────────────

// GET /api/admin/bots
app.get('/api/admin/bots', adminAuth, (req, res) => {
    const list = [];
    for (const [phone, s] of sessions.entries()) {
        list.push({
            phone,
            status: s.status,
            connectedAt: s.connectedAt,
            messageCount: s.messageCount || 0,
            uptime: s.connectedAt ? Math.floor((Date.now() - s.connectedAt) / 60000) + 'm' : null
        });
    }
    res.json({ bots: list, stats: getStats() });
});

// POST /api/admin/disconnect/:phone
app.post('/api/admin/disconnect/:phone', adminAuth, async (req, res) => {
    const phone = (req.params.phone || '').replace(/[^0-9]/g, '');
    if (!sessions.has(phone)) return res.status(404).json({ error: 'Session not found' });

    try {
        await stopBotForUser(phone);
        sessions.delete(phone);
        // Remove session files
        const dir = sessionDir(phone);
        if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
        res.json({ success: true, message: `Bot ${phone} disconnected and removed.` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admin/restart/:phone
app.post('/api/admin/restart/:phone', adminAuth, async (req, res) => {
    const phone = (req.params.phone || '').replace(/[^0-9]/g, '');
    if (!sessions.has(phone)) return res.status(404).json({ error: 'Session not found' });

    try {
        await stopBotForUser(phone);
        sessions.set(phone, { status: 'connected', code: null, connectedAt: Date.now(), messageCount: 0 });
        startBotForUser(phone, sessionDir(phone), (status) => {
            const s = sessions.get(phone);
            if (s) s.status = status;
        });
        res.json({ success: true, message: `Bot ${phone} restarting.` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admin/broadcast
app.post('/api/admin/broadcast', adminAuth, async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });

    let sent = 0;
    // This would send a message to all bot owners — placeholder for now
    res.json({ success: true, sent, message: 'Broadcast queued.' });
});

// POST /api/admin/login — returns token
app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Wrong password' });
    res.json({ token: ADMIN_PASSWORD });
});

// ─── Pairing flow ─────────────────────────────────────────────────────────────
async function runPairing(phone) {
    const dir = sessionDir(phone);
    let botLaunched = false;

    try {
        fs.mkdirSync(dir, { recursive: true });
        const { version } = await fetchLatestBaileysVersion();
        const { state, saveCreds } = await useMultiFileAuthState(dir);
        const msgRetryCounterCache = new NodeCache();

        const sock = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false,
            browser: Browsers.macOS('Chrome'), // required for pairing code to work
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }).child({ level: 'fatal' })),
            },
            markOnlineOnConnect: false,
            syncFullHistory: false,
            msgRetryCounterCache,
            defaultQueryTimeoutMs: 60000,
            connectTimeoutMs: 60000,
        });

        sock.ev.on('creds.update', saveCreds);
        let codeRequested = false;

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            // Request pairing code once on first connection attempt
            // Using setTimeout like original index.js — more reliable than qr event
            if (!codeRequested && !sock.authState.creds.registered && (connection === 'connecting' || !!qr)) {
                codeRequested = true;
                setTimeout(async () => {
                    try {
                        let code = await sock.requestPairingCode(phone);
                        code = code?.match(/.{1,4}/g)?.join('-') || code;
                        console.log(`🔑 [${phone}] Code: ${code}`);
                        const s = sessions.get(phone);
                        if (s) { s.code = code; s.status = 'code_ready'; }
                    } catch (err) {
                        console.error(`❌ [${phone}] Code error:`, err.message);
                        codeRequested = false; // allow retry
                        const s = sessions.get(phone);
                        if (s) s.status = 'error';
                    }
                }, 3000);
            }

            if (connection === 'open' && !botLaunched) {
                botLaunched = true;
                const s = sessions.get(phone);
                if (s) { s.status = 'connected'; s.connectedAt = Date.now(); }
                console.log(`✅ [${phone}] Paired — launching bot`);

                await delay(2000);
                try { sock.end(undefined); } catch {}

                startBotForUser(phone, dir, (status, data) => {
                    const entry = sessions.get(phone);
                    if (entry) {
                        entry.status = status;
                        if (data?.messageCount) entry.messageCount = data.messageCount;
                    }
                });
            }

            if (connection === 'close' && !botLaunched) {
                const code = lastDisconnect?.error?.output?.statusCode;
                if (code === DisconnectReason.restartRequired) return;
                const s = sessions.get(phone);
                if (s) s.status = 'error';
            }
        });

    } catch (err) {
        console.error(`❌ [${phone}] runPairing:`, err.message);
        const s = sessions.get(phone);
        if (s) s.status = 'error';
    }
}

// ─── Fallback → SPA ──────────────────────────────────────────────────────────
app.get('*', (req, res) => {
    const indexPath = path.join(__dirname, 'public', 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('index.html not found at: ' + indexPath);
    }
});

app.listen(PORT, async () => {
    console.log(`🎩 VALENHART MINI — port ${PORT} | Admin password: ${ADMIN_PASSWORD}`);
    await reconnectExisting();
});

process.on('uncaughtException',  err => console.error('❌ Uncaught:', err.message));
process.on('unhandledRejection', err => console.error('❌ Unhandled:', err?.message || err));
