const { addWelcome, delWelcome, isWelcomeOn, getWelcome } = require('../lib/index');
const { addGoodbye, delGoodBye, isGoodByeOn, getGoodbye } = require('../lib/index');
const isAdmin = require('../lib/isAdmin');
const fs = require('fs');
const path = require('path');
const settings = require('../settings');

const ALFRED_WELCOME_IMG = path.join(__dirname, '../assets/alfred_1.jpg');
const ALFRED_GOODBYE_IMG = path.join(__dirname, '../assets/alfred_2.jpg');

// ── Rank based on member number ───────────────────────────────────────────────
function getMemberRank(memberNumber) {
    if (memberNumber === 1)  return { rank: '👑 Fondateur', badge: '👑' };
    if (memberNumber <= 10)  return { rank: '💎 Membre Élite', badge: '💎' };
    if (memberNumber <= 25)  return { rank: '🥇 Membre Or', badge: '🥇' };
    if (memberNumber <= 50)  return { rank: '🥈 Membre Argent', badge: '🥈' };
    if (memberNumber <= 100) return { rank: '🥉 Membre Bronze', badge: '🥉' };
    return { rank: '🎖️ Membre Honorable', badge: '🎖️' };
}

// ── Build full welcome text ───────────────────────────────────────────────────
function getDefaultWelcomeText(user, groupName, memberCount, adminCount, description) {
    const now  = new Date();
    const date = now.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    const time = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const { rank, badge } = getMemberRank(memberCount);

    return (
        `╔══════════════════════════════╗\n` +
        `║  🎩  *MAISON VALENHART*      ║\n` +
        `║  _Bienvenue Officielle_ 🕯️  ║\n` +
        `╚══════════════════════════════╝\n\n` +
        `✨ *@${user}* vient de rejoindre la Maison !\n\n` +
        `┌─────────────────────────────\n` +
        `│ 👤 *Membre :* @${user}\n` +
        `│ ${badge} *Rang :* ${rank}\n` +
        `│ 🔢 *Membre n°* ${memberCount}\n` +
        `│ 👥 *Total membres :* ${memberCount}\n` +
        `│ 🛡️ *Administrateurs :* ${adminCount}\n` +
        `│ 📅 *Date :* ${date}\n` +
        `│ ⏰ *Heure :* ${time}\n` +
        `└─────────────────────────────\n\n` +
        (description
            ? `📜 *À propos de ${groupName} :*\n_${description}_\n\n`
            : '') +
        `*${groupName}* vous ouvre ses portes avec honneur.\n\n` +
        `> _"Bienvenue, Monsieur. La Maison VALENHART est entièrement_\n` +
        `> _à votre disposition. Alfred veille sur vous."_ 🎩\n\n` +
        `— *Alfred* 🎩 | _${settings.botOwner}_\n\n` +
        `📢 *Rejoignez notre canal :*\n` +
        `https://whatsapp.com/channel/0029Vb7fv0ICnA7yZU6SdZ0K`
    );
}

// ── Build full goodbye text ───────────────────────────────────────────────────
function getDefaultGoodbyeText(user, groupName, remainingCount, adminCount, description) {
    const now  = new Date();
    const date = now.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    const time = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    return (
        `╔══════════════════════════════╗\n` +
        `║  🎩  *MAISON VALENHART*      ║\n` +
        `║  _Départ d'un Membre_ 🕯️    ║\n` +
        `╚══════════════════════════════╝\n\n` +
        `🚪 *@${user}* a quitté la Maison.\n\n` +
        `┌─────────────────────────────\n` +
        `│ 👤 *Membre :* @${user}\n` +
        `│ 👥 *Membres restants :* ${remainingCount}\n` +
        `│ 🛡️ *Administrateurs :* ${adminCount}\n` +
        `│ 📅 *Date :* ${date}\n` +
        `│ ⏰ *Heure :* ${time}\n` +
        `└─────────────────────────────\n\n` +
        (description
            ? `📜 *${groupName} :*\n_${description}_\n\n`
            : '') +
        `> _"La Maison VALENHART vous souhaite bonne route, Monsieur._\n` +
        `> _Nos portes vous resteront toujours ouvertes._\n` +
        `> _Que votre chemin soit pavé d'honneur et de prospérité."_\n\n` +
        `— *Alfred* 🎩 | _${settings.botOwner}_\n\n` +
        `📢 *Rejoignez notre canal :*\n` +
        `https://whatsapp.com/channel/0029Vb7fv0ICnA7yZU6SdZ0K`
    );
}

// ── JOIN event ────────────────────────────────────────────────────────────────
async function handleJoinEvent(sock, id, participants) {
    try {
        if (!(await isWelcomeOn(id))) return;

        const groupMetadata = await sock.groupMetadata(id);
        const groupName     = groupMetadata.subject;
        const description   = (groupMetadata.desc || '').trim();
        const memberCount   = groupMetadata.participants.length;
        const adminCount    = groupMetadata.participants.filter(p => p.admin).length;
        const customMessage = await getWelcome(id);

        for (const participant of participants) {
            try {
                const jid  = typeof participant === 'string' ? participant : (participant.id || '');
                const user = jid.split('@')[0];

                const text = customMessage
                    ? customMessage
                        .replace(/{user}/g,    `@${user}`)
                        .replace(/{group}/g,   groupName)
                        .replace(/{count}/g,   memberCount)
                        .replace(/{admins}/g,  adminCount)
                        .replace(/{desc}/g,    description || '')
                    : getDefaultWelcomeText(user, groupName, memberCount, adminCount, description);

                const imgPath = ALFRED_WELCOME_IMG;
                if (fs.existsSync(imgPath)) {
                    await sock.sendMessage(id, {
                        image: fs.readFileSync(imgPath),
                        caption: text,
                        mentions: [jid]
                    });
                } else {
                    await sock.sendMessage(id, { text, mentions: [jid] });
                }

            } catch (e) {
                console.error('Welcome send error:', e.message);
            }
        }
    } catch (err) {
        console.error('handleJoinEvent error:', err.message);
    }
}

// ── LEAVE event ───────────────────────────────────────────────────────────────
async function handleLeaveEvent(sock, id, participants) {
    try {
        if (!(await isGoodByeOn(id))) return;

        const groupMetadata   = await sock.groupMetadata(id);
        const groupName       = groupMetadata.subject;
        const description     = (groupMetadata.desc || '').trim();
        const remainingCount  = groupMetadata.participants.length;
        const adminCount      = groupMetadata.participants.filter(p => p.admin).length;
        const customMessage   = await getGoodbye(id);

        for (const participant of participants) {
            try {
                const jid  = typeof participant === 'string' ? participant : (participant.id || '');
                const user = jid.split('@')[0];

                const text = customMessage
                    ? customMessage
                        .replace(/{user}/g,    `@${user}`)
                        .replace(/{group}/g,   groupName)
                        .replace(/{count}/g,   remainingCount)
                        .replace(/{admins}/g,  adminCount)
                        .replace(/{desc}/g,    description || '')
                    : getDefaultGoodbyeText(user, groupName, remainingCount, adminCount, description);

                const imgPath = ALFRED_GOODBYE_IMG;
                if (fs.existsSync(imgPath)) {
                    await sock.sendMessage(id, {
                        image: fs.readFileSync(imgPath),
                        caption: text,
                        mentions: [jid]
                    });
                } else {
                    await sock.sendMessage(id, { text, mentions: [jid] });
                }

            } catch (e) {
                console.error('Goodbye send error:', e.message);
            }
        }
    } catch (err) {
        console.error('handleLeaveEvent error:', err.message);
    }
}

// ── .welcome command ──────────────────────────────────────────────────────────
async function welcomeCommand(sock, chatId, message, senderId, isSenderAdmin) {
    try {
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { text: '🎩 Cette commande est réservée aux groupes, Monsieur.' }, { quoted: message });
            return;
        }
        if (!isSenderAdmin) {
            await sock.sendMessage(chatId, { text: '🎩 Cette commande est réservée aux administrateurs, Monsieur.' }, { quoted: message });
            return;
        }

        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const args = text.trim().split(' ');
        const sub  = (args[1] || '').toLowerCase();
        const rest = args.slice(2).join(' ').trim();

        if (sub === 'on') {
            await addWelcome(chatId, true, null);
            await sock.sendMessage(chatId, {
                text: `🎩 *Message de bienvenue activé, Monsieur.* ✅\n> _Alfred accueillera chaque nouveau membre avec honneur._ 🎩`
            }, { quoted: message });
        } else if (sub === 'off') {
            await delWelcome(chatId);
            await sock.sendMessage(chatId, {
                text: `🎩 *Message de bienvenue désactivé, Monsieur.* ❌`
            }, { quoted: message });
        } else if (sub === 'set' && rest) {
            await addWelcome(chatId, true, rest);
            await sock.sendMessage(chatId, {
                text: `🎩 *Message de bienvenue personnalisé enregistré, Monsieur.* ✅\n\n_Variables : {user} {group} {count} {admins} {desc}_`
            }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, {
                text:
                    `🎩 *Alfred — Bienvenue*\n\n` +
                    `*.welcome on* — Activer\n` +
                    `*.welcome off* — Désactiver\n` +
                    `*.welcome set <message>* — Personnaliser\n\n` +
                    `_Variables : {user} {group} {count} {admins} {desc}_\n\n` +
                    `> _"Alfred accueille chaque membre avec dignité."_ 🎩`
            }, { quoted: message });
        }
    } catch (err) {
        console.error('welcomeCommand error:', err.message);
    }
}

// ── .goodbye command ──────────────────────────────────────────────────────────
async function goodbyeCommand(sock, chatId, message, senderId, isSenderAdmin) {
    try {
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { text: '🎩 Cette commande est réservée aux groupes, Monsieur.' }, { quoted: message });
            return;
        }
        if (!isSenderAdmin) {
            await sock.sendMessage(chatId, { text: '🎩 Cette commande est réservée aux administrateurs, Monsieur.' }, { quoted: message });
            return;
        }

        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const args = text.trim().split(' ');
        const sub  = (args[1] || '').toLowerCase();
        const rest = args.slice(2).join(' ').trim();

        if (sub === 'on') {
            await addGoodbye(chatId, true, null);
            await sock.sendMessage(chatId, {
                text: `🎩 *Message d'au revoir activé, Monsieur.* ✅\n> _Alfred accompagnera chaque départ avec dignité._ 🎩`
            }, { quoted: message });
        } else if (sub === 'off') {
            await delGoodBye(chatId);
            await sock.sendMessage(chatId, {
                text: `🎩 *Message d'au revoir désactivé, Monsieur.* ❌`
            }, { quoted: message });
        } else if (sub === 'set' && rest) {
            await addGoodbye(chatId, true, rest);
            await sock.sendMessage(chatId, {
                text: `🎩 *Message d'au revoir personnalisé enregistré, Monsieur.* ✅\n\n_Variables : {user} {group} {count} {admins} {desc}_`
            }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, {
                text:
                    `🎩 *Alfred — Au Revoir*\n\n` +
                    `*.goodbye on* — Activer\n` +
                    `*.goodbye off* — Désactiver\n` +
                    `*.goodbye set <message>* — Personnaliser\n\n` +
                    `_Variables : {user} {group} {count} {admins} {desc}_\n\n` +
                    `> _"Alfred accompagne chaque départ avec dignité."_ 🎩`
            }, { quoted: message });
        }
    } catch (err) {
        console.error('goodbyeCommand error:', err.message);
    }
}

module.exports = { welcomeCommand, goodbyeCommand, handleJoinEvent, handleLeaveEvent };
