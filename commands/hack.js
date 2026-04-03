/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  💻 HACK SYSTEM — MAISON VALENHART                      ║
 * ╠══════════════════════════════════════════════════════════╣
 * ║  .permit @personne   → (owner) accorder licence hack    ║
 * ║  .permit del @pers   → (owner) révoquer licence         ║
 * ║  .permit list        → (owner) liste des hackers        ║
 * ║  .hack @cible        → pirater la banque d'une cible    ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * ⚙️  Seul l'owner peut accorder le .permit
 *     Seul un joueur avec .permit peut utiliser .hack
 *     Cooldown : 8h entre chaque hack
 *     Risque d'échec : traces, contre-hack, amende
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const { getUser, setUser, fmt } = require('./economy');
const isOwnerOrSudo = require('../lib/isOwner');

const PERMIT_PATH = path.join(__dirname, '../data/hack_permits.json');
const COIN = '🪙';
const COOLDOWN_HACK = 8 * 60 * 60 * 1000; // 8 heures

// ─── Persistance permits ───────────────────────────────────────────────────────
function loadPermits() {
    try { return JSON.parse(fs.readFileSync(PERMIT_PATH, 'utf8')); }
    catch { return {}; }
}
function savePermits(data) {
    fs.writeFileSync(PERMIT_PATH, JSON.stringify(data, null, 2));
}

function norm(jid) {
    if (!jid || typeof jid !== 'string') return jid;
    return jid.includes(':') ? jid.split(':')[0] + '@s.whatsapp.net' : jid;
}
function tag(jid)  { return `@${norm(jid).split('@')[0]}`; }
const now   = () => Date.now();
const elapsed = (ts) => now() - (ts || 0);

function cooldownMsg(ms) {
    const s = Math.ceil(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `⏳ *${h}h ${m % 60}min* avant le prochain hack.`;
    if (m > 0) return `⏳ *${m}min ${s % 60}s* avant le prochain hack.`;
    return `⏳ *${s}s* avant le prochain hack.`;
}

const CADRE_TOP = '┏━━━━━━━━━━━━━━━━━━━━━━━┓';
const CADRE_BOT = '┗━━━━━━━━━━━━━━━━━━━━━━━┛';

// ─── Animations hacking (séquences texte) ─────────────────────────────────────
const HACK_SEQUENCES = [
    '> `[▓▓░░░░░░░░]` Connexion au serveur...',
    '> `[▓▓▓▓▓░░░░░]` Bypass firewall...',
    '> `[▓▓▓▓▓▓▓▓░░]` Injection SQL...',
    '> `[▓▓▓▓▓▓▓▓▓▓]` Accès obtenu !'
];

// ═══════════════════════════════════════════════════════════════════════════════
// .permit — Gérer les licences de hack (owner only)
// ═══════════════════════════════════════════════════════════════════════════════
async function permitCommand(sock, chatId, message, senderId, args, mentionedJid) {
    const sid = norm(senderId);
    const isOwner = message.key.fromMe || await isOwnerOrSudo(sid, sock, chatId);

    if (!isOwner) {
        return sock.sendMessage(chatId, {
            text:
`${CADRE_TOP}
┃  🔒  *ACCÈS REFUSÉ*
${CADRE_BOT}

❌ Seul *l'Owner* peut gérer les licences de hack.

> _"Cette commande n'est pas pour tout le monde, Monsieur."_
> — *Alfred* 🎩`
        }, { quoted: message });
    }

    const sub = args[0]?.toLowerCase();
    const permits = loadPermits();

    // ── .permit list ──
    if (sub === 'list' || sub === 'liste') {
        const hackers = Object.entries(permits).filter(([, v]) => v.active);
        if (hackers.length === 0) {
            return sock.sendMessage(chatId, {
                text:
`${CADRE_TOP}
┃  💻  *HACKERS LICENCIÉS*
${CADRE_BOT}

📋 Aucun hacker autorisé pour le moment.

➤ Pour accorder une licence : *.permit @personne*`
            }, { quoted: message });
        }

        const lignes = hackers.map(([jid, info]) =>
            `│ 🟢 ${tag(jid)}\n│    📅 Accordé le : _${info.date}_`
        ).join('\n│\n');

        return sock.sendMessage(chatId, {
            text:
`${CADRE_TOP}
┃  💻  *HACKERS LICENCIÉS (${hackers.length})*
${CADRE_BOT}

╭────〔 🔑 ACCÈS AUTORISÉS 〕────
${lignes}
╰──────────────────────────

> _"Ces agents opèrent sous votre responsabilité."_
> — *Alfred* 🎩`,
            mentions: hackers.map(([jid]) => norm(jid))
        }, { quoted: message });
    }

    // ── .permit del @personne ──
    if (sub === 'del' || sub === 'remove' || sub === 'retirer') {
        const cible = mentionedJid?.[0] ? norm(mentionedJid[0]) : null;
        if (!cible) return sock.sendMessage(chatId, {
            text: '❌ Usage : *.permit del @personne*'
        }, { quoted: message });

        if (!permits[cible]?.active) {
            return sock.sendMessage(chatId, {
                text: `❌ ${tag(cible)} n'a pas de licence active.`,
                mentions: [cible]
            }, { quoted: message });
        }

        permits[cible].active = false;
        permits[cible].revokedAt = new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Douala' });
        savePermits(permits);

        return sock.sendMessage(chatId, {
            text:
`${CADRE_TOP}
┃  🔴  *LICENCE RÉVOQUÉE*
${CADRE_BOT}

🚫 La licence de hack de *${tag(cible)}* a été révoquée.

> _"Accès suspendu. L'agent est retiré du service."_
> — *Alfred* 🎩`,
            mentions: [cible]
        }, { quoted: message });
    }

    // ── .permit @personne — accorder une licence ──
    const cible = mentionedJid?.[0] ? norm(mentionedJid[0]) : null;
    if (!cible) {
        return sock.sendMessage(chatId, {
            text:
`${CADRE_TOP}
┃  💻  *SYSTÈME DE LICENCES HACK*
${CADRE_BOT}

╭────〔 ⚡ COMMANDES 〕────
│ ➤ *.permit @personne*    → accorder une licence
│ ➤ *.permit del @pers*    → révoquer une licence
│ ➤ *.permit list*         → voir les hackers actifs
╰──────────────────────────

> _"Choisissez vos agents avec soin, Monsieur."_
> — *Alfred* 🎩`
        }, { quoted: message });
    }

    if (cible === sid) {
        return sock.sendMessage(chatId, {
            text: `❌ Vous ne pouvez pas vous accorder une licence à vous-même, Monsieur.`
        }, { quoted: message });
    }

    permits[cible] = {
        active: true,
        grantedBy: sid,
        date: new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Douala' })
    };
    savePermits(permits);

    await sock.sendMessage(chatId, {
        text:
`${CADRE_TOP}
┃  🟢  *LICENCE ACCORDÉE*
${CADRE_BOT}

✅ *${tag(cible)}* a reçu une *licence de hack* !

│ 🔑 *Accès :* Hack bancaire activé
│ ⚡ *Commande :* \`.hack @cible\`
│ ⏳ *Cooldown :* 8 heures entre chaque hack

> _"L'agent est opérationnel, Monsieur."_
> — *Alfred* 🎩`,
        mentions: [cible]
    }, { quoted: message });
}

// ═══════════════════════════════════════════════════════════════════════════════
// .hack @cible — Pirater la banque d'une cible (nécessite .permit)
// ═══════════════════════════════════════════════════════════════════════════════
async function hackCommand(sock, chatId, message, senderId, mentionedJid) {
    const sid    = norm(senderId);
    const permits = loadPermits();

    // ── Vérifier la licence ──
    if (!permits[sid]?.active) {
        return sock.sendMessage(chatId, {
            text:
`${CADRE_TOP}
┃  🔒  *ACCÈS REFUSÉ — HACK*
${CADRE_BOT}

❌ Vous n'avez pas de *licence de hack* active.

💡 Demandez à l'owner de vous accorder l'accès :
   *.permit @votre_pseudo*

> _"Les outils de la Maison ne sont pas pour tous."_
> — *Alfred* 🎩`
        }, { quoted: message });
    }

    // ── Vérifier la cible ──
    const cibleRaw = mentionedJid?.[0];
    if (!cibleRaw) {
        return sock.sendMessage(chatId, {
            text:
`${CADRE_TOP}
┃  💻  *HACK BANCAIRE*
${CADRE_BOT}

❌ Usage : *.hack @cible*

_Taguez la victime dont vous voulez pirater la banque._

> _"Précision avant tout, Agent."_ — *Alfred* 🎩`
        }, { quoted: message });
    }

    const cible = norm(cibleRaw);

    if (cible === sid) {
        return sock.sendMessage(chatId, {
            text: `💻 On ne se hack pas soi-même, Agent. Choisissez une cible.`
        }, { quoted: message });
    }

    // ── Vérifier le cooldown du hacker ──
    const hackerData = getUser(sid);
    const lastHack = hackerData.lastHack || 0;
    const diff = elapsed(lastHack);

    if (diff < COOLDOWN_HACK) {
        return sock.sendMessage(chatId, {
            text:
`${CADRE_TOP}
┃  ⏳  *HACK EN COOLDOWN*
${CADRE_BOT}

🛡️ Vos outils sont en recharge.

${cooldownMsg(COOLDOWN_HACK - diff)}

> _"Patience, Agent. Un bon hacker ne se précipite pas."_
> — *Alfred* 🎩`
        }, { quoted: message });
    }

    // ── Vérifier que la cible a de l'argent en banque ──
    const targetData = getUser(cible);
    if (targetData.bank < 500) {
        return sock.sendMessage(chatId, {
            text:
`${CADRE_TOP}
┃  💻  *CIBLE PAUVRE*
${CADRE_BOT}

❌ *${tag(cible)}* n'a que *${fmt(targetData.bank)} ${COIN}* en banque.

_Cible sans intérêt. Cherchez une meilleure proie._

> _"Ne perdez pas votre temps sur les gueux."_ — *Alfred* 🎩`,
            mentions: [cible]
        }, { quoted: message });
    }

    // ── Lancer le hack — animation ──
    await sock.sendMessage(chatId, {
        text:
`${CADRE_TOP}
┃  💻  *HACK EN COURS...*
${CADRE_BOT}

🎯 Cible : *${tag(cible)}*
🔓 Banque : *${fmt(targetData.bank)} ${COIN}*

${HACK_SEQUENCES[0]}
${HACK_SEQUENCES[1]}`,
        mentions: [cible]
    }, { quoted: message });

    // ── Résultat aléatoire ──
    // 55% succès, 25% échec avec amende, 20% contre-hack (cible vole le hacker)
    const roll = Math.random();

    hackerData.lastHack = now();

    if (roll < 0.55) {
        // ✅ SUCCÈS — vol de 10% à 35% de la banque
        const pct = 0.10 + Math.random() * 0.25;
        const vol = Math.floor(targetData.bank * pct);

        targetData.bank = Math.max(0, targetData.bank - vol);
        hackerData.coins += vol;

        setUser(cible, targetData);
        setUser(sid, hackerData);

        await sock.sendMessage(chatId, {
            text:
`${CADRE_TOP}
┃  💻  *HACK RÉUSSI !*
${CADRE_BOT}

${HACK_SEQUENCES[2]}
${HACK_SEQUENCES[3]}

✅ *Intrusion réussie, Agent !*

│ 🎯 *Victime :* ${tag(cible)}
│ 💰 *Fonds siphonnés :* +${fmt(vol)} ${COIN}
│ 🏦 *Banque restante de la cible :* ${fmt(targetData.bank)} ${COIN}
│ 👝 *Votre nouveau solde :* ${fmt(hackerData.coins)} ${COIN}

⏳ Prochain hack disponible dans *8 heures*.

> _"Exécution parfaite. La Maison est fière de vous."_
> — *Alfred* 🎩`,
            mentions: [sid, cible]
        }, { quoted: message });

    } else if (roll < 0.80) {
        // ❌ ÉCHEC — amende 15% du portefeuille du hacker
        const amende = Math.floor((hackerData.coins || 0) * 0.15);
        hackerData.coins = Math.max(0, (hackerData.coins || 0) - amende);

        setUser(sid, hackerData);

        await sock.sendMessage(chatId, {
            text:
`${CADRE_TOP}
┃  💻  *HACK ÉCHOUÉ*
${CADRE_BOT}

> \`[▓▓▓░░░░░░░]\` Firewall détecté...
> \`[▓▓░░░░░░░░]\` Contre-mesures activées...
> \`[✗ CONNEXION COUPÉE]\`

🚔 *Vous avez été tracé et sanctionné !*

│ 🎯 *Cible :* ${tag(cible)}
│ 💸 *Amende :* -${fmt(amende)} ${COIN}
│ 👝 *Votre solde restant :* ${fmt(hackerData.coins)} ${COIN}

⏳ Prochain hack disponible dans *8 heures*.

> _"Un bon hacker sait aussi échouer avec dignité."_
> — *Alfred* 🎩`,
            mentions: [sid, cible]
        }, { quoted: message });

    } else {
        // 🔄 CONTRE-HACK — la cible vole 20% du portefeuille du hacker
        const contre = Math.floor((hackerData.coins || 0) * 0.20);
        hackerData.coins = Math.max(0, (hackerData.coins || 0) - contre);
        targetData.coins = (targetData.coins || 0) + contre;

        setUser(sid, hackerData);
        setUser(cible, targetData);

        await sock.sendMessage(chatId, {
            text:
`${CADRE_TOP}
┃  💻  *CONTRE-HACK !*
${CADRE_BOT}

> \`[▓▓▓▓░░░░░░]\` Intrusion détectée...
> \`[⚠️  ALERTE ROUGE]\` Agent localisé !
> \`[✗ SYSTÈME RETOURNÉ]\`

💀 *${tag(cible)} a contre-hacké votre intrusion !*

│ 🔄 *${tag(cible)}* vous a volé : +${fmt(contre)} ${COIN}
│ 👝 *Votre solde :* ${fmt(hackerData.coins)} ${COIN}

⏳ Prochain hack disponible dans *8 heures*.

> _"Vous vous êtes attaqué au mauvais homme, Monsieur."_
> — *Alfred* 🎩`,
            mentions: [sid, cible]
        }, { quoted: message });
    }
}

module.exports = {
    permitCommand,
    hackCommand,
};
