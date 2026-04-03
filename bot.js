// ─────────────────────────────────────────────────────────────────────────────
//  bot.js — Per-user VALENHART bot instance
//  Based directly on the original index.js connection logic
// ─────────────────────────────────────────────────────────────────────────────

const fs      = require('fs')
const path    = require('path')
const chalk   = require('chalk')
const PhoneNumber = require('awesome-phonenumber')
const NodeCache   = require('node-cache')
const pino        = require('pino')

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    jidDecode,
    jidNormalizedUser,
    makeCacheableSignalKeyStore,
    delay
} = require('@whiskeysockets/baileys')

const settings = require('./settings')

// Per-user command imports (same as original main.js)
const { handleMessages, handleGroupParticipantUpdate } = require('./main')

// Track active sockets for stop/restart
const activeSocks = new Map()

// ─── Start bot for a single user ─────────────────────────────────────────────
async function startBotForUser(phone, sessionDir, onStatusChange) {

    // Per-user lightweight store (isolated — not shared between users)
    const userStore = {
        messages: {}, contacts: {}, chats: {},
        readFromFile() {},
        writeToFile() {},
        bind(ev) {
            ev.on('messages.upsert', ({ messages }) => {
                messages.forEach(msg => {
                    if (!msg.key?.remoteJid) return
                    const jid = msg.key.remoteJid
                    this.messages[jid] = this.messages[jid] || []
                    this.messages[jid].push(msg)
                    if (this.messages[jid].length > 20)
                        this.messages[jid] = this.messages[jid].slice(-20)
                })
            })
            ev.on('contacts.update', contacts => {
                contacts.forEach(c => {
                    if (c.id) this.contacts[c.id] = { id: c.id, name: c.notify || '' }
                })
            })
        },
        async loadMessage(jid, id) {
            return this.messages[jid]?.find(m => m.key.id === id) || null
        }
    }

    try {
        const { version } = await fetchLatestBaileysVersion()
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir)
        const msgRetryCounterCache = new NodeCache()

        // ── Exact same socket config as original index.js ──────────────────
        const sock = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false,
            browser: ['Ubuntu', 'Chrome', '20.0.04'],
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(
                    state.keys,
                    pino({ level: 'fatal' }).child({ level: 'fatal' })
                ),
            },
            markOnlineOnConnect: true,
            generateHighQualityLinkPreview: true,
            syncFullHistory: false,
            getMessage: async (key) => {
                const jid = jidNormalizedUser(key.remoteJid)
                const msg = await userStore.loadMessage(jid, key.id)
                return msg?.message || undefined
            },
            msgRetryCounterCache,
            defaultQueryTimeoutMs: 60000,
            connectTimeoutMs:      60000,
            keepAliveIntervalMs:   10000,
        })

        // Store reference for stop/restart
        activeSocks.set(phone, { sock, messageCount: 0 })

        sock.ev.on('creds.update', saveCreds)
        userStore.bind(sock.ev)

        // ── Decode JID (same as original) ───────────────────────────────────
        sock.decodeJid = (jid) => {
            if (!jid) return jid
            if (/:\d+@/gi.test(jid)) {
                const decode = jidDecode(jid) || {}
                return decode.user && decode.server
                    ? decode.user + '@' + decode.server
                    : jid
            }
            return jid
        }

        // ── getName (same as original) ──────────────────────────────────────
        sock.getName = (jid, withoutContact = false) => {
            const id = sock.decodeJid(jid)
            const woc = sock.withoutContact || withoutContact
            let v
            if (id.endsWith('@g.us')) {
                return new Promise(async (resolve) => {
                    v = userStore.contacts[id] || {}
                    if (!(v.name || v.subject)) {
                        try { v = await sock.groupMetadata(id) } catch { v = {} }
                    }
                    resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'))
                })
            } else {
                v = id === '0@s.whatsapp.net'
                    ? { id, name: 'WhatsApp' }
                    : id === sock.decodeJid(sock.user?.id)
                        ? sock.user
                        : (userStore.contacts[id] || {})
            }
            return (woc ? '' : v.name) || v.subject || v.verifiedName
                || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
        }

        sock.public = true
        sock.serializeM = (m) => {
            const { smsg } = require('./lib/myfunc')
            return smsg(sock, m, userStore)
        }

        sock._phone = phone

        // ── Contacts update ─────────────────────────────────────────────────
        sock.ev.on('contacts.update', (update) => {
            for (const contact of update) {
                const id = sock.decodeJid(contact.id)
                userStore.contacts[id] = { id, name: contact.notify }
            }
        })

        // ── Messages ────────────────────────────────────────────────────────
        sock.ev.on('messages.upsert', async (chatUpdate) => {
            try {
                const mek = chatUpdate.messages[0]
                if (!mek?.message) return

                // Unwrap ephemeral (same as original)
                mek.message = Object.keys(mek.message)[0] === 'ephemeralMessage'
                    ? mek.message.ephemeralMessage.message
                    : mek.message

                if (mek.key?.remoteJid === 'status@broadcast') return

                if (!sock.public && !mek.key.fromMe && chatUpdate.type === 'notify') {
                    if (!mek.key?.remoteJid?.endsWith('@g.us')) return
                }

                if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return

                if (sock?.msgRetryCounterCache) {
                    try { sock.msgRetryCounterCache.flushAll() } catch {}
                }

                // Track message count
                const entry = activeSocks.get(phone)
                if (entry) entry.messageCount = (entry.messageCount || 0) + 1

                try {
                    await handleMessages(sock, chatUpdate, true)
                } catch (err) {
                    console.error(`❌ [${phone}] handleMessages:`, err.message)
                }
            } catch (err) {
                console.error(`❌ [${phone}] messages.upsert:`, err.message)
            }
        })

        // ── Group participants ───────────────────────────────────────────────
        sock.ev.on('group-participants.update', async (update) => {
            try {
                await handleGroupParticipantUpdate(sock, update)
            } catch (err) {
                console.error(`❌ [${phone}] group-participants:`, err.message)
            }
        })

        // ── Anticall (same as original) ─────────────────────────────────────
        const antiCallNotified = new Set()
        sock.ev.on('call', async (calls) => {
            try {
                for (const call of calls) {
                    const callerJid = call.from || call.peerJid || call.chatId
                    if (!callerJid) continue
                    try {
                        if (typeof sock.rejectCall === 'function' && call.id) {
                            await sock.rejectCall(call.id, callerJid).catch(() => {})
                        }
                        if (!antiCallNotified.has(callerJid)) {
                            antiCallNotified.add(callerJid)
                            setTimeout(() => antiCallNotified.delete(callerJid), 60000)
                            await sock.sendMessage(callerJid, {
                                text: '🎩 Les appels ne sont pas acceptés, Monsieur. Alfred a décliné votre appel.'
                            })
                        }
                    } catch {}
                    setTimeout(async () => {
                        try { await sock.updateBlockStatus(callerJid, 'block') } catch {}
                    }, 800)
                }
            } catch {}
        })

        // ── RAM watchdog ────────────────────────────────────────────────────
        const ramCheck = setInterval(() => {
            const used = process.memoryUsage().rss / 1024 / 1024
            if (used > 450) {
                console.log(chalk.red(`⚠️ [${phone}] RAM > 450MB — stopping instance`))
                clearInterval(ramCheck)
                try { sock.end(undefined) } catch {}
            }
        }, 30_000)

        // ── Connection (same logic as original) ─────────────────────────────
        sock.ev.on('connection.update', async (s) => {
            const { connection, lastDisconnect } = s

            if (connection === 'open') {
                console.log(chalk.green(`✅ [${phone}] Connected`))
                onStatusChange && onStatusChange('connected')

                // Update connectedAt in activeSocks
                const entry = activeSocks.get(phone)
                if (entry) entry.connectedAt = Date.now()

                // Send welcome message to self (same as original)
                try {
                    const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net'
                    await sock.sendMessage(botNumber, {
                        text:
`┏━━━━━━━━━━━━━━━━━━━━━━━┓
┃  🎩  *VALENHART MINI*
┗━━━━━━━━━━━━━━━━━━━━━━━┛

╭────〔 ✅ CONNECTÉ 〕────
│ 🟢 *Alfred est en service*
│ ⏰ ${new Date().toLocaleString('fr-FR')}
╰──────────────────────────

> _"Tapez .help pour voir les commandes."_ 🎩`
                    })
                } catch {}

                // Set profile picture
                try {
                    const ppPath = path.join(__dirname, 'assets', 'valenhart_banner.png')
                    if (fs.existsSync(ppPath)) {
                        const ppBuffer = fs.readFileSync(ppPath)
                        await sock.updateProfilePicture(sock.user.id, ppBuffer)
                    }
                } catch {}
            }

            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode
                console.log(chalk.red(`❌ [${phone}] Disconnected — code: ${statusCode}`))
                clearInterval(ramCheck)

                if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
                    console.log(chalk.yellow(`🗑️ [${phone}] Logged out`))
                    onStatusChange && onStatusChange('logged_out')
                    activeSocks.delete(phone)
                    return
                }

                // Reconnect (same as original)
                console.log(chalk.yellow(`♻️ [${phone}] Reconnecting in 5s...`))
                onStatusChange && onStatusChange('reconnecting')
                await delay(5000)
                startBotForUser(phone, sessionDir, onStatusChange)
            }
        })

        return sock

    } catch (err) {
        console.error(`❌ [${phone}] startBotForUser error:`, err.message)
        await delay(5000)
        return startBotForUser(phone, sessionDir, onStatusChange)
    }
}

// ─── Stop bot for a user ──────────────────────────────────────────────────────
async function stopBotForUser(phone) {
    const entry = activeSocks.get(phone)
    if (entry?.sock) {
        try { entry.sock.end(undefined) } catch {}
    }
    activeSocks.delete(phone)
}

// ─── Get message count for a user ────────────────────────────────────────────
function getMessageCount(phone) {
    return activeSocks.get(phone)?.messageCount || 0
}

module.exports = { startBotForUser, stopBotForUser, getMessageCount }
