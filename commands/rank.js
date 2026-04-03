/**
 * ⚔️ RANK SYSTEM — MAISON VALENHART
 * 5 Classes : Chevalier | Archer | Mage | Assassin | Paladin
 * 25 niveaux (avec 30 titres uniques par classe)
 * XP = messages envoyés dans le groupe
 * .rank         — voir sa fiche
 * .classe       — choisir sa classe (une fois)
 * .classement   — top 10 du groupe
 */

const fs = require('fs');
const path = require('path');

const MSG_PATH  = path.join(__dirname, '..', 'data', 'messageCount.json');
const RPG_PATH  = path.join(__dirname, '..', 'data', 'rpgData.json');

// ─── Storage ──────────────────────────────────────────────────────────────────
function loadMsg()  { try { return JSON.parse(fs.readFileSync(MSG_PATH)); } catch { return {}; } }
function loadRpg()  { try { return JSON.parse(fs.readFileSync(RPG_PATH)); } catch { return {}; } }
function saveRpg(d) { fs.writeFileSync(RPG_PATH, JSON.stringify(d, null, 2)); }

// ─── XP seuils — 25 niveaux ───────────────────────────────────────────────────
const LEVELS = [
    0, 30, 80, 150, 250, 380, 550, 760, 1020, 1330,
    1700, 2130, 2620, 3170, 3780, 4450, 5180, 5970, 6820, 7730,
    8700, 9730, 10820, 11970, 13200
];
const MAX_LVL = LEVELS.length; // 25

function getLevel(xp) {
    let lvl = 1;
    for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (xp >= LEVELS[i]) { lvl = i + 1; break; }
    }
    return Math.min(lvl, MAX_LVL);
}

function progressBar(xp) {
    const lvl = getLevel(xp);
    if (lvl >= MAX_LVL) return '██████████ MAX';
    const prev = LEVELS[lvl - 1];
    const next = LEVELS[lvl];
    const pct = Math.round(((xp - prev) / (next - prev)) * 10);
    const filled = Math.max(0, Math.min(10, pct));
    return '█'.repeat(filled) + '░'.repeat(10 - filled);
}

// ─── 5 CLASSES avec 25 titres chacune ────────────────────────────────────────
const CLASSES = {
    chevalier: {
        emoji: '⚔️',
        name: 'Chevalier',
        desc: 'Guerrier noble, maître du combat rapproché',
        titles: [
            '🪨 Écuyer sans armure',
            '🛡️ Apprenti Bouclier',
            '⚔️ Soldat de la Garde',
            '🗡️ Défenseur du Village',
            '🏹 Garde-Corps Royal',
            '⚔️ Chevalier Aspirant',
            '🛡️ Chevalier Confirmé',
            '⚔️ Chevalier Vaillant',
            '🗡️ Chevalier de la Couronne',
            '🏰 Seigneur de la Tour',
            '⚔️ Commandant des Gardes',
            '🛡️ Maître d\'Armes',
            '🗡️ Gardien du Trône',
            '👑 Chevalier Glorieux',
            '⚔️ Baron des Batailles',
            '🛡️ Comte de Fer',
            '🗡️ Duc des Champs de Gloire',
            '🏰 Prince Guerrier',
            '⚔️ Roi des Épées',
            '🛡️ Grand Maréchal du Royaume',
            '🗡️ Protecteur des Royaumes',
            '👑 Invincible du Royaume',
            '⚔️ Légendaire des Batailles',
            '🛡️ Éternel Défenseur',
            '🌟 Héros Immortel de VALENHART'
        ]
    },
    archer: {
        emoji: '🏹',
        name: 'Archer',
        desc: 'Chasseur furtif, précision absolue de loin',
        titles: [
            '🌿 Ramasseur de Flèches',
            '🏹 Novice du Carquois',
            '🌲 Traqueur des Fourrés',
            '🦌 Chasseur de Gibier',
            '🏹 Tireur Habile',
            '🌿 Éclaireur Forestier',
            '🦅 Archer de la Forêt',
            '🏹 Archer Précis',
            '🌲 Sentinelle Sylvestre',
            '🦅 Gardien des Chemins',
            '🏹 Chasseur d\'Élite',
            '🌿 Éclaireur Royal',
            '🦌 Maître de la Traque',
            '🏹 Sniper du Royaume',
            '🦅 Lieutenant des Archers',
            '🌲 Commandant Sylvain',
            '🏹 Général des Archers',
            '🦅 Seigneur de la Chasse',
            '🌿 Comte des Bois Sacrés',
            '🏹 Prince de l\'Arc Long',
            '🦌 Grand Chasseur Royal',
            '🌲 Maître Ultime du Carquois',
            '🏹 Légende de la Flèche',
            '🦅 Éternel Chasseur',
            '🌟 Ombre Immortelle de VALENHART'
        ]
    },
    mage: {
        emoji: '🔮',
        name: 'Mage',
        desc: 'Maître des arcanes, pouvoir de la magie pure',
        titles: [
            '📜 Apprenti des Parchemins',
            '🕯️ Allumeur de Bougies',
            '🔮 Étudiant des Runes',
            '✨ Initiateur des Sorts',
            '📚 Clerc des Arcanes',
            '🔮 Mage Novice',
            '✨ Invocateur Débutant',
            '🌙 Mage de la Lune',
            '🔮 Arcaniste Confirmé',
            '⚡ Foudre-Apprenti',
            '🌙 Mage de Combat',
            '🔮 Sorcier Habile',
            '✨ Arcaniste Avancé',
            '⚡ Maître des Éléments',
            '🌙 Grand Sorcier',
            '🔮 Archimage Aspirant',
            '✨ Archimage Confirmé',
            '⚡ Maître des Arcanes',
            '🌙 Seigneur des Sorts',
            '🔮 Archimage Royal',
            '✨ Grand Archimage du Royaume',
            '⚡ Maître Suprême des Arts',
            '🌙 Légende des Arcanes',
            '🔮 Éternel Tisseur de Sorts',
            '🌟 Dieu des Arcanes de VALENHART'
        ]
    },
    assassin: {
        emoji: '🗡️',
        name: 'Assassin',
        desc: 'Fantôme des ténèbres, frappe dans l\'ombre',
        titles: [
            '🌑 Novice des Ombres',
            '🗡️ Apprenti Lame',
            '🌑 Guetteur Silencieux',
            '🗡️ Coupe-Jarret',
            '🌑 Infiltrateur Furtif',
            '🗡️ Ombre Errante',
            '🌑 Lame Cachée',
            '🗡️ Assassin Confirmé',
            '🌑 Fantôme Urbain',
            '🗡️ Traqueur de Nuit',
            '🌑 Ombre Mortelle',
            '🗡️ Assassin d\'Élite',
            '🌑 Exécuteur Royal',
            '🗡️ Maître du Poignard',
            '🌑 Spectre des Bas-Fonds',
            '🗡️ Seigneur des Ombres',
            '🌑 Fantôme du Royaume',
            '🗡️ Maître des Assassins',
            '🌑 Ombre Invincible',
            '🗡️ Grand Maître Fantôme',
            '🌑 Légendaire des Ténèbres',
            '🗡️ Éternel Ombre',
            '🌑 Seigneur Fantôme Ultime',
            '🗡️ Maître Invisible',
            '🌟 Spectre Immortel de VALENHART'
        ]
    },
    paladin: {
        emoji: '✝️',
        name: 'Paladin',
        desc: 'Guerrier sacré, lumière et foi inébranlable',
        titles: [
            '🕊️ Novice de la Lumière',
            '✝️ Acolyte Béni',
            '🕊️ Porteur de Flamme Sacrée',
            '✝️ Frère de la Foi',
            '🕊️ Gardien de la Chapelle',
            '✝️ Initié Sacré',
            '🕊️ Chevalier de la Foi',
            '✝️ Paladin Confirmé',
            '🕊️ Gardien Béni',
            '✝️ Croisé du Royaume',
            '🕊️ Paladin d\'Honneur',
            '✝️ Guerrier Sacré',
            '🕊️ Champion de la Lumière',
            '✝️ Paladin d\'Élite',
            '🕊️ Protecteur Divin',
            '✝️ Commandant Béni',
            '🕊️ Seigneur de la Foi',
            '✝️ Grand Paladin Royal',
            '🕊️ Archevêque Guerrier',
            '✝️ Légat du Royaume Sacré',
            '🕊️ Grand Maître de la Lumière',
            '✝️ Champion Immortel',
            '🕊️ Saint Guerrier',
            '✝️ Éternel Protecteur',
            '🌟 Lumière Immortelle de VALENHART'
        ]
    }
};

const CLASS_LIST = Object.keys(CLASSES);

function getTitle(className, level) {
    const cls = CLASSES[className];
    if (!cls) return '⚔️ Aventurier Sans Classe';
    return cls.titles[Math.min(level - 1, cls.titles.length - 1)];
}

function getClassEmoji(className) {
    return CLASSES[className]?.emoji || '❓';
}

// ─── JID normalization (strips device suffix e.g. :13) ───────────────────────
function normalizeJid(jid) {
    if (typeof jid !== 'string') return jid;
    if (jid.includes(':') && jid.includes('@s.whatsapp.net')) {
        return jid.split(':')[0] + '@s.whatsapp.net';
    }
    return jid;
}
function isValidMemberJid(jid) {
    return typeof jid === 'string' && jid.includes('@s.whatsapp.net');
}

// ─── Get XP from messageCount.json ───────────────────────────────────────────
function getUserXP(chatId, senderId) {
    const data = loadMsg();
    const normSender = normalizeJid(senderId);

    // Try exact chatId first
    const groupData = data[chatId];
    if (groupData && typeof groupData === 'object') {
        for (const [jid, xp] of Object.entries(groupData)) {
            if (normalizeJid(jid) === normSender && typeof xp === 'number') return xp;
        }
    }
    // Fallback: search all groups
    for (const [key, val] of Object.entries(data)) {
        if (key === 'isPublic' || typeof val !== 'object' || val === null) continue;
        for (const [jid, xp] of Object.entries(val)) {
            if (normalizeJid(jid) === normSender && typeof xp === 'number') return xp;
        }
    }
    return 0;
}

// ─── Leaderboard across group ─────────────────────────────────────────────────
function getLeaderboard(chatId) {
    const data = loadMsg();

    function mergeEntries(obj) {
        const merged = {};
        for (const [jid, count] of Object.entries(obj)) {
            if (isValidMemberJid(jid) && typeof count === 'number') {
                merged[normalizeJid(jid)] = (merged[normalizeJid(jid)] || 0) + count;
            }
        }
        return merged;
    }

    // Try exact chatId match first
    const groupData = data[chatId];
    if (groupData && typeof groupData === 'object') {
        const merged = mergeEntries(groupData);
        if (Object.keys(merged).length > 0) {
            return Object.entries(merged).sort(([, a], [, b]) => b - a);
        }
    }

    // Fallback: merge ALL groups in file
    const merged = {};
    for (const [key, val] of Object.entries(data)) {
        if (key === 'isPublic' || typeof val !== 'object' || val === null) continue;
        for (const [jid, count] of Object.entries(val)) {
            if (isValidMemberJid(jid) && typeof count === 'number') {
                const norm = normalizeJid(jid);
                merged[norm] = (merged[norm] || 0) + count;
            }
        }
    }
    return Object.entries(merged).sort(([, a], [, b]) => b - a);
}

// ─── .rank ────────────────────────────────────────────────────────────────────
async function rankCommand(sock, chatId, message, senderId, isGroup) {
    try {
        if (!isGroup) {
            return await sock.sendMessage(chatId, {
                text: '🎩 Cette commande est réservée aux groupes de la Maison VALENHART, Monsieur.'
            }, { quoted: message });
        }

        const normSender = normalizeJid(senderId);
        const xp    = getUserXP(chatId, normSender);
        const lvl   = getLevel(xp);
        const bar   = progressBar(xp);

        const rpg   = loadRpg();
        const userKey = `${chatId}::${normSender}`;
        const userData = rpg[userKey] || {};
        const className = userData.classe || null;

        const leaderboard = getLeaderboard(chatId);
        const position    = leaderboard.findIndex(([jid]) => jid === normSender) + 1;
        const total       = leaderboard.length;

        const clsInfo = className ? CLASSES[className] : null;
        const title   = className ? getTitle(className, lvl) : '⚔️ Aventurier Sans Classe';
        const classLine = className
            ? `│ ${clsInfo.emoji} *Classe :* ${clsInfo.name}\n│ 🏷️ *Titre :* ${title}\n`
            : `│ ❓ *Classe :* Non choisie — tape *.classe* !\n`;

        const nextXP = lvl < MAX_LVL ? LEVELS[lvl] : null;
        const nextLine = nextXP
            ? `│ 🎯 *Prochain niveau :* ${nextXP - xp} XP restants`
            : `│ 🏆 *NIVEAU MAXIMUM ATTEINT !*`;

        await sock.sendMessage(chatId, {
            text:
`┏━━━━━━━━━━━━━━━━━━━━━━━┓
┃  🎖️  *FICHE DE RANG — VALENHART*
┗━━━━━━━━━━━━━━━━━━━━━━━┛

╭────〔 ✦ IDENTITÉ 〕────
│ 👤 @${normSender.split('@')[0]}
${classLine}│
│ 📊 *Niveau :* ${lvl} / ${MAX_LVL}
│ ⚡ *XP :* ${xp} messages
│ 📈 [${bar}]
${nextLine}
│
│ 🏅 *Classement :* #${position > 0 ? position : '?'} / ${total || 1}
╰──────────────────────────

> _"La gloire appartient à ceux qui persistent,_
> _Monsieur."_ — *Alfred* 🎩`,
            mentions: [normSender]
        }, { quoted: message });

    } catch (err) {
        console.error('rankCommand error:', err);
        await sock.sendMessage(chatId, {
            text: '🎩 Alfred ne parvient pas à consulter les registres de rang, Monsieur.'
        }, { quoted: message }).catch(() => {});
    }
}

// ─── .classe (choisir ou voir sa classe) ─────────────────────────────────────
async function classeCommand(sock, chatId, message, senderId, args) {
    const normSender = normalizeJid(senderId);
    const rpg     = loadRpg();
    const userKey = `${chatId}::${normSender}`;
    const userData = rpg[userKey] || {};

    // If no arg — show class list or current class
    if (!args[0]) {
        if (userData.classe) {
            const cls = CLASSES[userData.classe];
            const xp  = getUserXP(chatId, normSender);
            const lvl = getLevel(xp);
            const title = getTitle(userData.classe, lvl);
            return await sock.sendMessage(chatId, {
                text:
`┏━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ${cls.emoji}  *VOTRE CLASSE*
┗━━━━━━━━━━━━━━━━━━━━━━━┛

╭────〔 ✦ IDENTITÉ 〕────
│ 👤 @${normSender.split('@')[0]}
│ ${cls.emoji} *Classe :* ${cls.name}
│ 🏷️ *Titre actuel :* ${title}
│ 📊 *Niveau :* ${lvl} / ${MAX_LVL}
│
│ 📖 _${cls.desc}_
╰──────────────────────────

> _"Votre classe est gravée dans les registres."_ 🎩`,
                mentions: [normSender]
            }, { quoted: message });
        }

        // Show selection menu
        const list = CLASS_LIST.map(k => {
            const c = CLASSES[k];
            return `│ ${c.emoji} *.classe ${k}* — ${c.name}\n│    _${c.desc}_`;
        }).join('\n│\n');

        return await sock.sendMessage(chatId, {
            text:
`┏━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ⚔️  *CHOIX DE CLASSE*
┗━━━━━━━━━━━━━━━━━━━━━━━┛

╭────〔 ✦ CLASSES DISPONIBLES 〕────
${list}
╰──────────────────────────

> ⚠️ *Ce choix est définitif !*
> Tapez *.classe <nom>* pour vous engager.
> — *Alfred* 🎩`,
            mentions: [normSender]
        }, { quoted: message });
    }

    const choice = args[0].toLowerCase();

    // Already has a class
    if (userData.classe) {
        const cls = CLASSES[userData.classe];
        return await sock.sendMessage(chatId, {
            text: `🎩 Vous êtes déjà ${cls.emoji} *${cls.name}*, Monsieur. La classe ne peut être changée une fois choisie.`
        }, { quoted: message });
    }

    if (!CLASS_LIST.includes(choice)) {
        return await sock.sendMessage(chatId, {
            text: `🎩 Classe inconnue. Choisissez parmi : ${CLASS_LIST.map(k => `*${k}*`).join(', ')}`
        }, { quoted: message });
    }

    // Assign class
    rpg[userKey] = { ...userData, classe: choice, chosenAt: Date.now() };
    saveRpg(rpg);

    const cls = CLASSES[choice];
    const firstTitle = cls.titles[0];

    await sock.sendMessage(chatId, {
        text:
`┏━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ${cls.emoji}  *CLASSE CHOISIE !*
┗━━━━━━━━━━━━━━━━━━━━━━━┛

╭────〔 ✦ ENGAGÉ 〕────
│ 👤 @${normSender.split('@')[0]}
│
│ ${cls.emoji} *Classe :* ${cls.name}
│ 🏷️ *Titre de départ :* ${firstTitle}
│
│ 📖 _${cls.desc}_
│
│ 💬 *Chattez pour gagner de l'XP !*
│ 📊 *25 niveaux vous attendent...*
╰──────────────────────────

> _"Alfred inscrit votre nom dans les Registres Sacrés."_ 🎩`,
        mentions: [normSender]
    }, { quoted: message });
}

// ─── .classement (top 10 du groupe) ──────────────────────────────────────────
async function classementCommand(sock, chatId, message, isGroup) {
    if (!isGroup) {
        return await sock.sendMessage(chatId, {
            text: '🎩 Cette commande est réservée aux groupes, Monsieur.'
        }, { quoted: message });
    }

    const leaderboard = getLeaderboard(chatId);
    if (!leaderboard.length) {
        return await sock.sendMessage(chatId, {
            text: '🎩 Les registres de la Maison sont encore vides, Monsieur. Commencez à chatter !'
        }, { quoted: message });
    }

    const rpg = loadRpg();
    const medals = ['🥇','🥈','🥉','④','⑤','⑥','⑦','⑧','⑨','⑩'];
    const top = leaderboard.slice(0, 10);
    const mentions = top.map(([jid]) => jid);

    const rows = top.map(([jid, xp], i) => {
        const lvl = getLevel(xp);
        const userKey = `${chatId}::${jid}`;
        const cls = rpg[userKey]?.classe;
        const clsEmoji = cls ? CLASSES[cls].emoji : '❓';
        return `│ ${medals[i]} ${clsEmoji} @${jid.split('@')[0]} — Niv.*${lvl}* ⚡${xp}`;
    }).join('\n');

    await sock.sendMessage(chatId, {
        text:
`┏━━━━━━━━━━━━━━━━━━━━━━━┓
┃  🏆  *CLASSEMENT — MAISON VALENHART*
┗━━━━━━━━━━━━━━━━━━━━━━━┛

╭────〔 ✦ TOP ${top.length} 〕────
${rows}
╰──────────────────────────

> _"La gloire se mesure à l'engagement quotidien."_
> — *Alfred* 🎩`,
        mentions
    }, { quoted: message });
}

module.exports = { rankCommand, classeCommand, classementCommand, getLevel, getTitle, CLASSES, CLASS_LIST, getUserXP };
