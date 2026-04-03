/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  🏰 BANQUE FAMILIALE — MAISON VALENHART                ║
 * ╠══════════════════════════════════════════════════════════╣
 * ║  .bftresor          → voir le solde de la trésorerie   ║
 * ║  .bfdepot <montant> → déposer dans la banque familiale ║
 * ║  .bfdon @personne <montant> → donner à un membre       ║
 * ║  .bfpayer <motif> <montant> → payer une dépense        ║
 * ║  .bfhistorique      → voir les 10 dernières opérations ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * ⚠️  BigInt utilisé pour supporter des sommes astronomiques.
 *     Le JSON stocke "total" comme STRING pour éviter la perte de précision.
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const { getUser, setUser, fmt } = require('./economy');

const BANQUE_PATH = path.join(__dirname, '../data/banque_familiale.json');
const COIN = '🪙';
const MAX_HISTORY = 50;

const DEFAULT_TOTAL = 9999999999999992555666666666999n;

// ─── Persistance BigInt-safe ───────────────────────────────────────────────────
function loadBanque() {
    try {
        const raw = JSON.parse(fs.readFileSync(BANQUE_PATH, 'utf8'));
        raw.total = BigInt(raw.total || DEFAULT_TOTAL.toString());
        for (const k in raw.contributors) {
            raw.contributors[k] = BigInt(raw.contributors[k] || 0);
        }
        return raw;
    } catch {
        return { total: DEFAULT_TOTAL, contributors: {}, history: [] };
    }
}

function saveBanque(data) {
    const toSave = {
        total: data.total.toString(),
        contributors: {},
        history: data.history
    };
    for (const k in data.contributors) {
        toSave.contributors[k] = data.contributors[k].toString();
    }
    fs.writeFileSync(BANQUE_PATH, JSON.stringify(toSave, null, 2));
}

function norm(jid) {
    if (!jid || typeof jid !== 'string') return jid;
    return jid.includes(':') ? jid.split(':')[0] + '@s.whatsapp.net' : jid;
}
function tag(jid)   { return `@${norm(jid).split('@')[0]}`; }
function phone(jid) { return norm(jid).split('@')[0]; }

function addHistory(data, type, from, to, montant, motif) {
    const entry = {
        type,
        from: norm(from),
        to: to ? norm(to) : null,
        montant: montant.toString(),
        motif: motif || '',
        date: new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Douala' })
    };
    data.history.unshift(entry);
    if (data.history.length > MAX_HISTORY) data.history = data.history.slice(0, MAX_HISTORY);
}

// ─── Formatage BigInt ──────────────────────────────────────────────────────────
function fmtBig(n) {
    const TRILL  = 1_000_000_000_000n;
    const BILL   = 1_000_000_000n;
    const MILL   = 1_000_000n;

    if (n >= TRILL * 1_000_000n)  return fmt(Number(n / (TRILL * 1_000_000n))) + ' Sxt';
    if (n >= TRILL * 1_000n)      return fmt(Number(n / (TRILL * 1_000n)))     + ' Qrd';
    if (n >= TRILL)               return fmt(Number(n / TRILL))                + ' Trd';
    if (n >= BILL)                return fmt(Number(n / BILL))                 + ' Mrd';
    if (n >= MILL)                return fmt(Number(n / MILL))                 + ' M';
    return fmt(Number(n));
}

const CADRE_TOP = '┏━━━━━━━━━━━━━━━━━━━━━━━┓';
const CADRE_BOT = '┗━━━━━━━━━━━━━━━━━━━━━━━┛';

// ═══════════════════════════════════════════════════════════════════════════════
// .bftresor — Voir le solde
// ═══════════════════════════════════════════════════════════════════════════════
async function bfTresorCommand(sock, chatId, message) {
    const data = loadBanque();

    const topContribs = Object.entries(data.contributors || {})
        .sort(([, a], [, b]) => (b > a ? 1 : b < a ? -1 : 0))
        .slice(0, 5);

    const contribLines = topContribs.length > 0
        ? topContribs.map(([jid, montant]) => `│   • ${tag(jid)} — ${fmtBig(montant)} ${COIN}`).join('\n')
        : '│   _Aucun dépôt enregistré_';

    await sock.sendMessage(chatId, {
        text:
`${CADRE_TOP}
┃  🏰  *TRÉSORERIE — MAISON VALENHART*
${CADRE_BOT}

╭────〔 💼 SOLDE ACTUEL 〕────
│ 💰 *${fmtBig(data.total)} ${COIN}*
│ ♾️  Limite : *ILLIMITÉE*
╰──────────────────────────

╭────〔 🏅 TOP DONATEURS 〕────
${contribLines}
╰──────────────────────────

╭────〔 ⚡ COMMANDES 〕────
│ ➤ .bfdepot <montant>
│ ➤ .bfdon @personne <montant>
│ ➤ .bfpayer <motif> <montant>
│ ➤ .bfhistorique
╰──────────────────────────

> _"La fortune de la Maison est sans limite."_
> — *Alfred* 🎩`,
        mentions: topContribs.map(([jid]) => norm(jid))
    }, { quoted: message });
}

// ═══════════════════════════════════════════════════════════════════════════════
// .bfdepot <montant> — Déposer dans la banque familiale
// ═══════════════════════════════════════════════════════════════════════════════
async function bfDepotCommand(sock, chatId, message, senderId, args) {
    const sid  = norm(senderId);
    const montantStr = args[0];
    const u    = getUser(sid);

    let montant;
    try {
        montant = montantStr === 'tout' || montantStr === 'all'
            ? BigInt(u.coins) + BigInt(u.bank)
            : BigInt(parseInt(montantStr));
    } catch { montant = 0n; }

    if (!montant || montant <= 0n)
        return sock.sendMessage(chatId, {
            text: '❌ Usage : *.bfdepot <montant|tout>*\nEx: `.bfdepot 10000`'
        }, { quoted: message });

    const totalPerso = BigInt(u.coins) + BigInt(u.bank);
    if (montant > totalPerso)
        return sock.sendMessage(chatId, {
            text: `❌ Vous n'avez que *${fmt(Number(totalPerso))} ${COIN}* (portefeuille + banque).`
        }, { quoted: message });

    const montantNum = Number(montant);
    if (montantNum <= u.coins) {
        u.coins -= montantNum;
    } else {
        const reste = montantNum - u.coins;
        u.coins = 0;
        u.bank  = Math.max(0, u.bank - reste);
    }
    setUser(sid, u);

    const data = loadBanque();
    data.total += montant;
    data.contributors[sid] = (data.contributors[sid] || 0n) + montant;
    addHistory(data, 'depot', sid, null, montant, 'Dépôt');
    saveBanque(data);

    await sock.sendMessage(chatId, {
        text:
`${CADRE_TOP}
┃  🏰  *DÉPÔT — BANQUE FAMILIALE*
${CADRE_BOT}

✅ *${tag(sid)}* a déposé *${fmt(montantNum)} ${COIN}*
dans la trésorerie de la Maison.

💰 *Nouveau solde familial :* ${fmtBig(data.total)} ${COIN}
👝 *Votre portefeuille :* ${fmt(u.coins)} ${COIN}

> _"La Maison vous remercie, Monsieur."_ — *Alfred* 🎩`,
        mentions: [sid]
    }, { quoted: message });
}

// ═══════════════════════════════════════════════════════════════════════════════
// .bfdon @personne <montant> — Donner depuis la banque à un membre
// ═══════════════════════════════════════════════════════════════════════════════
async function bfDonCommand(sock, chatId, message, senderId, args, mentionedJid) {
    const sid   = norm(senderId);
    const cible = mentionedJid?.[0] ? norm(mentionedJid[0]) : null;

    let montant;
    try { montant = BigInt(parseInt(args[args.length - 1])); } catch { montant = 0n; }

    if (!cible)
        return sock.sendMessage(chatId, {
            text: '❌ Usage : *.bfdon @personne <montant>*\nEx: `.bfdon @Alfred 50000`'
        }, { quoted: message });

    if (!montant || montant <= 0n)
        return sock.sendMessage(chatId, {
            text: '❌ Montant invalide. Ex: `.bfdon @personne 50000`'
        }, { quoted: message });

    const data = loadBanque();
    if (montant > data.total)
        return sock.sendMessage(chatId, {
            text: `❌ La trésorerie ne contient que *${fmtBig(data.total)} ${COIN}*.`
        }, { quoted: message });

    data.total -= montant;
    addHistory(data, 'don', sid, cible, montant, `Don à ${phone(cible)}`);
    saveBanque(data);

    const uCible = getUser(cible);
    uCible.coins += Number(montant);
    setUser(cible, uCible);

    await sock.sendMessage(chatId, {
        text:
`${CADRE_TOP}
┃  🏰  *DON — BANQUE FAMILIALE*
${CADRE_BOT}

🎁 *${tag(sid)}* offre *${fmt(Number(montant))} ${COIN}*
à *${tag(cible)}* depuis la trésorerie !

💰 *Solde familial restant :* ${fmtBig(data.total)} ${COIN}
👝 *Nouveau solde de ${tag(cible)} :* ${fmt(uCible.coins)} ${COIN}

> _"La générosité est la marque des grands."_ — *Alfred* 🎩`,
        mentions: [sid, cible]
    }, { quoted: message });
}

// ═══════════════════════════════════════════════════════════════════════════════
// .bfpayer <motif> <montant> — Payer une dépense depuis la banque
// ═══════════════════════════════════════════════════════════════════════════════
async function bfPayerCommand(sock, chatId, message, senderId, args) {
    const sid = norm(senderId);

    let montant;
    try { montant = BigInt(parseInt(args[args.length - 1])); } catch { montant = 0n; }
    const motif = args.slice(0, -1).join(' ') || 'Dépense';

    if (!montant || montant <= 0n || args.length < 2)
        return sock.sendMessage(chatId, {
            text: '❌ Usage : *.bfpayer <motif> <montant>*\nEx: `.bfpayer achat_serveur 100000`'
        }, { quoted: message });

    const data = loadBanque();
    if (montant > data.total)
        return sock.sendMessage(chatId, {
            text: `❌ La trésorerie ne contient que *${fmtBig(data.total)} ${COIN}*.`
        }, { quoted: message });

    data.total -= montant;
    addHistory(data, 'paiement', sid, null, montant, motif);
    saveBanque(data);

    await sock.sendMessage(chatId, {
        text:
`${CADRE_TOP}
┃  🏰  *PAIEMENT — BANQUE FAMILIALE*
${CADRE_BOT}

💸 *${tag(sid)}* a effectué un paiement :

│ 📋 *Motif :* ${motif}
│ 💰 *Montant :* ${fmt(Number(montant))} ${COIN}
│ 🏰 *Solde restant :* ${fmtBig(data.total)} ${COIN}

> _"La Maison acquitte ses dettes avec honneur."_ — *Alfred* 🎩`,
        mentions: [sid]
    }, { quoted: message });
}

// ═══════════════════════════════════════════════════════════════════════════════
// .bfhistorique — Voir les dernières opérations
// ═══════════════════════════════════════════════════════════════════════════════
async function bfHistoriqueCommand(sock, chatId, message) {
    const data = loadBanque();
    const hist = (data.history || []).slice(0, 10);

    if (hist.length === 0)
        return sock.sendMessage(chatId, {
            text: '📋 Aucune opération dans l\'historique.'
        }, { quoted: message });

    const icons = { depot: '📥', don: '🎁', paiement: '💸' };
    const lines = hist.map((h) => {
        const icon = icons[h.type] || '📌';
        const dest = h.to ? ` → ${tag(h.to)}` : '';
        const montantBig = BigInt(h.montant || 0);
        return `│ ${icon} *${fmtBig(montantBig)} ${COIN}* — ${h.motif || h.type}${dest}\n│    _${h.date}_`;
    }).join('\n│\n');

    const allMentions = hist
        .flatMap(h => [h.from, h.to].filter(Boolean))
        .map(norm);

    await sock.sendMessage(chatId, {
        text:
`${CADRE_TOP}
┃  🏰  *HISTORIQUE — BANQUE FAMILIALE*
${CADRE_BOT}

💰 *Solde actuel :* ${fmtBig(data.total)} ${COIN}

╭────〔 📋 10 DERNIÈRES OPÉRATIONS 〕────
${lines}
╰──────────────────────────

> _"Chaque pièce compte dans la Maison."_ — *Alfred* 🎩`,
        mentions: allMentions
    }, { quoted: message });
}

module.exports = {
    bfTresorCommand,
    bfDepotCommand,
    bfDonCommand,
    bfPayerCommand,
    bfHistoriqueCommand,
};
