/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  🛍️  MARCHÉ DE LUXE — MAISON VALENHART                  ║
 * ╠══════════════════════════════════════════════════════════╣
 * ║  .marche              → voir les catégories             ║
 * ║  .marche <categorie>  → voir les articles               ║
 * ║  .acheter <id>        → acheter un article              ║
 * ║  .inventaire          → voir ses achats                 ║
 * ║  .revendre <id>       → revendre (50% du prix)          ║
 * ╚══════════════════════════════════════════════════════════╝
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const { getUser, setUser, fmt } = require('./economy');

const INV_PATH = path.join(__dirname, '../data/inventaire.json');
const COIN = '🪙';

// ─── Inventaire persistant ─────────────────────────────────────────────────────
function loadInv() {
    try { return JSON.parse(fs.readFileSync(INV_PATH, 'utf8')); }
    catch { return {}; }
}
function saveInv(data) {
    fs.writeFileSync(INV_PATH, JSON.stringify(data, null, 2));
}
function getInvUser(jid) {
    const d = loadInv();
    if (!d[jid]) d[jid] = [];
    return d[jid];
}
function setInvUser(jid, items) {
    const d = loadInv();
    d[jid] = items;
    saveInv(d);
}

function norm(jid) {
    if (!jid || typeof jid !== 'string') return jid;
    return jid.includes(':') ? jid.split(':')[0] + '@s.whatsapp.net' : jid;
}

// ─── CATALOGUE COMPLET ─────────────────────────────────────────────────────────
const CATALOGUE = {
    voitures: {
        emoji: '🚗',
        label: 'VOITURES DE LUXE',
        items: [
            { id: 'v01', nom: 'Toyota Corolla 2020',      emoji: '🚗',  prix: 50_000,          description: 'Fiable et élégante' },
            { id: 'v02', nom: 'Honda Civic Type R',        emoji: '🚗',  prix: 120_000,         description: 'Sport et maniable' },
            { id: 'v03', nom: 'BMW Série 3',               emoji: '🏎️',  prix: 280_000,         description: 'Le plaisir de conduire' },
            { id: 'v04', nom: 'Mercedes Classe C AMG',     emoji: '🏎️',  prix: 450_000,         description: 'Puissance et raffinement' },
            { id: 'v05', nom: 'Audi RS7',                  emoji: '🏎️',  prix: 750_000,         description: 'Technologie allemande de pointe' },
            { id: 'v06', nom: 'Porsche 911 Carrera S',     emoji: '🏎️',  prix: 1_200_000,       description: 'Icône du sport automobile' },
            { id: 'v07', nom: 'Ferrari SF90 Stradale',     emoji: '🔴',  prix: 3_500_000,       description: 'La magie italienne' },
            { id: 'v08', nom: 'Lamborghini Huracán',       emoji: '🟡',  prix: 5_000_000,       description: 'Le taureau déchaîné' },
            { id: 'v09', nom: 'Bugatti Chiron Super Sport',emoji: '🔵',  prix: 18_000_000,      description: '1600 chevaux de pur génie' },
            { id: 'v10', nom: 'Rolls-Royce Phantom',       emoji: '⚫',  prix: 25_000_000,      description: 'L\'ultime expression du luxe' },
        ]
    },
    montres: {
        emoji: '⌚',
        label: 'MONTRES DE PRESTIGE',
        items: [
            { id: 'm01', nom: 'Casio G-Shock Premium',     emoji: '⌚',  prix: 50_000,          description: 'Robuste et sportive' },
            { id: 'm02', nom: 'Seiko Presage',              emoji: '⌚',  prix: 150_000,         description: 'Artisanat japonais' },
            { id: 'm03', nom: 'TAG Heuer Carrera',          emoji: '⌚',  prix: 500_000,         description: 'L\'esprit de la course' },
            { id: 'm04', nom: 'IWC Portugieser',            emoji: '⌚',  prix: 900_000,         description: 'Précision suisse légendaire' },
            { id: 'm05', nom: 'Rolex Submariner',           emoji: '💎',  prix: 1_800_000,       description: 'La montre des légendes' },
            { id: 'm06', nom: 'Audemars Piguet Royal Oak',  emoji: '💎',  prix: 4_500_000,       description: 'Chef-d\'œuvre horloger' },
            { id: 'm07', nom: 'Patek Philippe Nautilus',    emoji: '👑',  prix: 12_000_000,      description: 'Le summum de l\'horlogerie' },
        ]
    },
    maisons: {
        emoji: '🏠',
        label: 'PROPRIÉTÉS & RÉSIDENCES',
        items: [
            { id: 'h01', nom: 'Studio Douala Centre',       emoji: '🏠',  prix: 200_000,         description: 'Petit mais bien situé' },
            { id: 'h02', nom: 'Appartement F3 Yaoundé',     emoji: '🏠',  prix: 800_000,         description: 'Confort moderne en ville' },
            { id: 'h03', nom: 'Villa avec jardin',          emoji: '🏡',  prix: 2_500_000,       description: 'Verdure et espace' },
            { id: 'h04', nom: 'Penthouse Vue Panoramique',  emoji: '🏙️',  prix: 7_000_000,       description: 'Sommet de la ville' },
            { id: 'h05', nom: 'Manoir Classique',           emoji: '🏰',  prix: 20_000_000,      description: 'Prestige et histoire' },
            { id: 'h06', nom: 'Villa Privée Monaco',        emoji: '🌊',  prix: 80_000_000,      description: 'Vue mer, piscine à débordement' },
            { id: 'h07', nom: 'Château en France',          emoji: '🏯',  prix: 200_000_000,     description: 'Patrimoine historique classé' },
            { id: 'h08', nom: 'Île Privée Caraïbes',        emoji: '🏝️',  prix: 1_000_000_000,   description: 'Votre propre paradis' },
        ]
    },
    bijoux: {
        emoji: '💍',
        label: 'BIJOUX & JOAILLERIE',
        items: [
            { id: 'j01', nom: 'Bracelet Argent',            emoji: '💍',  prix: 50_000,          description: 'Élégance simple' },
            { id: 'j02', nom: 'Collier Or 18 carats',       emoji: '📿',  prix: 200_000,         description: 'L\'or véritable' },
            { id: 'j03', nom: 'Bague Saphir Royal',         emoji: '💎',  prix: 600_000,         description: 'Pierre royale de prestige' },
            { id: 'j04', nom: 'Bracelet Cartier Love',      emoji: '💛',  prix: 1_500_000,       description: 'Symbole d\'amour éternel' },
            { id: 'j05', nom: 'Collier Van Cleef & Arpels', emoji: '✨',  prix: 4_000_000,       description: 'Haute joaillerie parisienne' },
            { id: 'j06', nom: 'Diamant Hope 45 carats',     emoji: '💙',  prix: 50_000_000,      description: 'Le diamant le plus célèbre' },
        ]
    },
    jets: {
        emoji: '✈️',
        label: 'JETS & YACHTS',
        items: [
            { id: 'a01', nom: 'Bateau de plaisance',        emoji: '⛵',  prix: 1_000_000,       description: 'Liberté sur l\'eau' },
            { id: 'a02', nom: 'Yacht 30m',                  emoji: '🛥️',  prix: 8_000_000,       description: 'Croisiéres privées' },
            { id: 'a03', nom: 'Jet Privé Citation X',       emoji: '✈️',  prix: 30_000_000,      description: 'Voyager en maître' },
            { id: 'a04', nom: 'Superyacht 80m',             emoji: '🚢',  prix: 150_000_000,     description: 'Piscine, hélipad, sous-marin' },
            { id: 'a05', nom: 'Boeing 747 Privé',           emoji: '🛩️',  prix: 400_000_000,     description: 'Le palais du ciel' },
        ]
    },
    tech: {
        emoji: '📱',
        label: 'TECH & HIGH-TECH',
        items: [
            { id: 't01', nom: 'iPhone 16 Pro Max',          emoji: '📱',  prix: 50_000,          description: 'Le meilleur smartphone' },
            { id: 't02', nom: 'MacBook Pro M4',             emoji: '💻',  prix: 120_000,         description: 'Puissance créative' },
            { id: 't03', nom: 'Tesla Model S Plaid',        emoji: '⚡',  prix: 700_000,         description: 'Électrique et fulgurant' },
            { id: 't04', nom: 'Home Cinéma 8K Privé',       emoji: '🎬',  prix: 1_500_000,       description: 'Hollywood chez vous' },
            { id: 't05', nom: 'Submarine Privé',            emoji: '🤿',  prix: 20_000_000,      description: 'Explorer les fonds marins' },
            { id: 't06', nom: 'Fusée SpaceX Crew Dragon',   emoji: '🚀',  prix: 500_000_000,     description: 'Voyage dans l\'espace' },
        ]
    },
    mode: {
        emoji: '👔',
        label: 'MODE & HAUTE COUTURE',
        items: [
            { id: 'f01', nom: 'Costume Zara Premium',       emoji: '👔',  prix: 50_000,          description: 'Élégance accessible' },
            { id: 'f02', nom: 'Sac Louis Vuitton Neverfull',emoji: '👜',  prix: 300_000,         description: 'Icône du luxe français' },
            { id: 'f03', nom: 'Chaussures Gucci Horsebit',  emoji: '👞',  prix: 500_000,         description: 'Style italien légendaire' },
            { id: 'f04', nom: 'Manteau Hermès',             emoji: '🧥',  prix: 1_200_000,       description: 'La maison du luxe absolu' },
            { id: 'f05', nom: 'Costume Brioni Sur-Mesure',  emoji: '🎩',  prix: 3_000_000,       description: 'Le tailleur des présidents' },
            { id: 'f06', nom: 'Robe Chanel Haute Couture',  emoji: '👗',  prix: 8_000_000,       description: 'Chef-d\'œuvre de couture' },
        ]
    },
    prestige: {
        emoji: '👑',
        label: 'PRESTIGE & EXCLUSIF',
        items: [
            { id: 'p01', nom: 'Titre : Gentleman',          emoji: '🎩',  prix: 500_000,         description: 'Porte ce titre avec fierté' },
            { id: 'p02', nom: 'Titre : Lord VALENHART',     emoji: '🏅',  prix: 2_000_000,       description: 'Noblesse de la Maison' },
            { id: 'p03', nom: 'Tableau Picasso Original',   emoji: '🎨',  prix: 15_000_000,      description: 'Art de collection' },
            { id: 'p04', nom: 'Vignoble Bordeaux Grand Cru',emoji: '🍷',  prix: 50_000_000,      description: 'Les plus grands vins du monde' },
            { id: 'p05', nom: 'Équipe de Football',         emoji: '⚽',  prix: 300_000_000,     description: 'Devenez président de club' },
            { id: 'p06', nom: 'Couronne de la Maison',      emoji: '👑',  prix: 999_999_999_999, description: 'L\'article ultime — unique au monde' },
        ]
    }
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
const CADRE_TOP = '┏━━━━━━━━━━━━━━━━━━━━━━━┓';
const CADRE_BOT = '┗━━━━━━━━━━━━━━━━━━━━━━━┛';

function findItem(id) {
    for (const cat of Object.values(CATALOGUE)) {
        const item = cat.items.find(i => i.id === id.toLowerCase());
        if (item) return item;
    }
    return null;
}

function fmtPrix(n) {
    if (n >= 1_000_000_000) return fmt(Math.floor(n / 1_000_000_000)) + ' Mrd';
    if (n >= 1_000_000)     return fmt(Math.floor(n / 1_000_000))     + ' M';
    return fmt(n);
}

// ═══════════════════════════════════════════════════════════════════════════════
// .marche  /  .marche <categorie>
// ═══════════════════════════════════════════════════════════════════════════════
async function marcheCommand(sock, chatId, message, senderId, args) {
    const cat = args[0]?.toLowerCase();

    // ── Sans argument : liste des catégories ──
    if (!cat || !CATALOGUE[cat]) {
        const lignes = Object.entries(CATALOGUE)
            .map(([key, c]) => `│ ${c.emoji} *.marche ${key}*  — ${c.label}`)
            .join('\n');

        return sock.sendMessage(chatId, {
            text:
`${CADRE_TOP}
┃  🛍️  *MARCHÉ DE LUXE — VALENHART*
${CADRE_BOT}

_Bienvenue au Marché de la Maison, Monsieur._
_Dépensez vos pièces avec classe._

╭────〔 📦 CATÉGORIES 〕────
${lignes}
╰──────────────────────────

╭────〔 ⚡ COMMANDES 〕────
│ ➤ .marche <catégorie>   → voir les articles
│ ➤ .acheter <id>          → acheter un article
│ ➤ .inventaire            → votre collection
│ ➤ .revendre <id>         → revendre (50%)
╰──────────────────────────

> _"La fortune n'a de valeur que si elle s'exprime."_
> — *Alfred* 🎩`
        }, { quoted: message });
    }

    // ── Avec argument : liste des articles de la catégorie ──
    const section = CATALOGUE[cat];
    const lignes = section.items.map(item =>
        `│ ${item.emoji} *[${item.id}]* ${item.nom}\n│      💰 ${fmtPrix(item.prix)} ${COIN}  — _${item.description}_`
    ).join('\n│\n');

    return sock.sendMessage(chatId, {
        text:
`${CADRE_TOP}
┃  ${section.emoji}  *${section.label}*
${CADRE_BOT}

╭────〔 🏷️ ARTICLES 〕────
${lignes}
╰──────────────────────────

➤ Pour acheter : *.acheter <id>*
Ex: \`.acheter ${section.items[0].id}\`

> _"Seul le meilleur mérite votre attention."_
> — *Alfred* 🎩`
    }, { quoted: message });
}

// ═══════════════════════════════════════════════════════════════════════════════
// .acheter <id>
// ═══════════════════════════════════════════════════════════════════════════════
async function acheterCommand(sock, chatId, message, senderId, args) {
    const sid  = norm(senderId);
    const id   = args[0]?.toLowerCase();

    if (!id) return sock.sendMessage(chatId, {
        text: `❌ Usage : *.acheter <id>*\nEx: \`.acheter v01\`\n\nVoir le catalogue : *.marche*`
    }, { quoted: message });

    const item = findItem(id);
    if (!item) return sock.sendMessage(chatId, {
        text: `❌ Article *${id}* introuvable. Consultez *.marche* pour voir les IDs disponibles.`
    }, { quoted: message });

    const u = getUser(sid);
    const totalCoins = u.coins + u.bank;

    if (totalCoins < item.prix) {
        const manque = item.prix - totalCoins;
        return sock.sendMessage(chatId, {
            text:
`❌ *Fonds insuffisants, Monsieur.*

│ 🛒 Article : *${item.emoji} ${item.nom}*
│ 💰 Prix : *${fmtPrix(item.prix)} ${COIN}*
│ 👝 Votre fortune : *${fmtPrix(totalCoins)} ${COIN}*
│ 📉 Il vous manque : *${fmtPrix(manque)} ${COIN}*

> _"La patience est la mère de toutes les richesses."_ — *Alfred* 🎩`
        }, { quoted: message });
    }

    // Déduire du portefeuille d'abord, puis de la banque
    let reste = item.prix;
    if (u.coins >= reste) {
        u.coins -= reste;
    } else {
        reste -= u.coins;
        u.coins = 0;
        u.bank -= reste;
    }
    setUser(sid, u);

    // Ajouter à l'inventaire
    const inv = getInvUser(sid);
    const achat = {
        id: item.id,
        nom: item.nom,
        emoji: item.emoji,
        prix: item.prix,
        date: new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Douala' })
    };
    inv.push(achat);
    setInvUser(sid, inv);

    await sock.sendMessage(chatId, {
        text:
`${CADRE_TOP}
┃  🛍️  *ACHAT CONFIRMÉ — VALENHART*
${CADRE_BOT}

✅ *@${sid.split('@')[0]}* vient d'acquérir :

│ ${item.emoji} *${item.nom}*
│ _"${item.description}"_
│
│ 💰 *Prix payé :* ${fmtPrix(item.prix)} ${COIN}
│ 👝 *Portefeuille restant :* ${fmt(u.coins)} ${COIN}
│ 🏦 *Banque restante :* ${fmt(u.bank)} ${COIN}

> _"Un excellent choix, Monsieur. Félicitations."_
> — *Alfred* 🎩`,
        mentions: [sid]
    }, { quoted: message });
}

// ═══════════════════════════════════════════════════════════════════════════════
// .inventaire  /  .inventaire @personne
// ═══════════════════════════════════════════════════════════════════════════════
async function inventaireCommand(sock, chatId, message, senderId, mentionedJid) {
    const cible = mentionedJid?.[0] ? norm(mentionedJid[0]) : norm(senderId);
    const tag = `@${cible.split('@')[0]}`;

    const inv = getInvUser(cible);

    if (inv.length === 0) {
        return sock.sendMessage(chatId, {
            text: `👜 *${tag}* n'a encore rien acheté au marché.\n\nDémarrez avec *.marche* pour découvrir le catalogue !`,
            mentions: [cible]
        }, { quoted: message });
    }

    // Regrouper par catégorie/type
    const lignes = inv.map((item, i) =>
        `│ ${item.emoji} *${item.nom}*\n│      🏷️ ${fmtPrix(item.prix)} ${COIN}  • _${item.date}_`
    ).join('\n│\n');

    const valeurTotale = inv.reduce((acc, i) => acc + i.prix, 0);

    await sock.sendMessage(chatId, {
        text:
`${CADRE_TOP}
┃  👜  *COLLECTION DE ${tag.toUpperCase()}*
${CADRE_BOT}

╭────〔 🏷️ ARTICLES (${inv.length}) 〕────
${lignes}
╰──────────────────────────

│ 💎 *Valeur totale de la collection :*
│    *${fmtPrix(valeurTotale)} ${COIN}*

> _"Une belle collection, Monsieur."_ — *Alfred* 🎩`,
        mentions: [cible]
    }, { quoted: message });
}

// ═══════════════════════════════════════════════════════════════════════════════
// .revendre <id_article>  — revendre le dernier article de ce type (50% remboursé)
// ═══════════════════════════════════════════════════════════════════════════════
async function revendreCommand(sock, chatId, message, senderId, args) {
    const sid = norm(senderId);
    const id  = args[0]?.toLowerCase();

    if (!id) return sock.sendMessage(chatId, {
        text: `❌ Usage : *.revendre <id>*\nEx: \`.revendre v01\`\n\nVoir votre collection : *.inventaire*`
    }, { quoted: message });

    const inv = getInvUser(sid);
    const idx = inv.map(i => i.id).lastIndexOf(id);

    if (idx === -1) return sock.sendMessage(chatId, {
        text: `❌ Vous ne possédez pas l'article *${id}*. Vérifiez avec *.inventaire*`
    }, { quoted: message });

    const item = inv[idx];
    const remboursement = Math.floor(item.prix / 2);

    inv.splice(idx, 1);
    setInvUser(sid, inv);

    const u = getUser(sid);
    u.coins += remboursement;
    setUser(sid, u);

    await sock.sendMessage(chatId, {
        text:
`${CADRE_TOP}
┃  🔄  *REVENTE — MARCHÉ VALENHART*
${CADRE_BOT}

✅ *@${sid.split('@')[0]}* a revendu :

│ ${item.emoji} *${item.nom}*
│
│ 💸 *Prix de revente (50%) :* ${fmtPrix(remboursement)} ${COIN}
│ 👝 *Nouveau portefeuille :* ${fmt(u.coins)} ${COIN}

> _"Une sage décision, Monsieur."_ — *Alfred* 🎩`,
        mentions: [sid]
    }, { quoted: message });
}

module.exports = {
    marcheCommand,
    acheterCommand,
    inventaireCommand,
    revendreCommand,
};
