# 🎩 VALENHART MINI — Multi-User Server

One server, multiple users. Anyone visits your site, pairs their number, and gets their own **VALENHART MINI** bot running instantly.

---

## How it works

```
User visits your site
→ enters their WhatsApp number
→ gets a pairing code
→ enters code in WhatsApp (Settings → Linked Devices)
→ VALENHART MINI bot starts running for them
→ they can use all commands in their groups
```

On server restart, all existing sessions reconnect automatically.

---

## Deploy on Render (free)

1. Push this folder to GitHub
2. [render.com](https://render.com) → New → Web Service → connect repo
3. Build command: `npm install`
4. Start command: `node server.js`
5. Deploy → share your `.onrender.com` link

## Run locally

```bash
npm install
node server.js
# → http://localhost:3000
```

---

## Configure

Edit `settings.js` to set the bot name, owner number, etc.

---

## Structure

```
VALENHART-MULTI/
├── server.js          ← Express server (pairing + bot launcher)
├── bot.js             ← VALENHART MINI bot instance (one per user)
├── settings.js        ← bot config
├── config.js          ← API keys
├── package.json
├── .node-version      ← pins Node 20 for Render
├── commands/          ← bot commands
├── lib/               ← shared helpers
├── data-template/     ← default JSON data files
├── public/
│   └── index.html     ← pairing web UI
└── sessions/          ← created at runtime, one folder per user
    └── 237600000000/
        └── creds.json
```

---

## Bot commands

| Command | Description | Who |
|---------|-------------|-----|
| `.ping` `.alive` `.help` `.owner` | Info | Everyone |
| `.sticker` | Make sticker | Everyone |
| `.tagall` `.ban` `.unban` `.kick` | Moderation | Admins |
| `.warn` `.warnings` `.promote` `.demote` | Management | Admins |
| `.mute` `.unmute` `.antilink` `.welcome` | Group settings | Admins |
| `.gstatus` `.sudo` | Owner only | Bot owner |
