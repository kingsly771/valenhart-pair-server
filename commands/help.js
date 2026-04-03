/**
 * 🎩 HELP / MENU — MAISON VALENHART
 * Alfred se présente, affiche les stats du joueur + banque familiale,
 * puis envoie le menu complet.
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const { getUser, fmt }                          = require('./economy');
const { getUserXP, getLevel, getTitle, CLASSES } = require('./rank');
const settings = require('../settings');

const COIN        = '🪙';
const BANNER_PATH = path.join(__dirname, '../assets/valenhart_banner.png');
const RPG_PATH    = path.join(__dirname, '../data/rpgData.json');
const BANQUE_PATH = path.join(__dirname, '../data/banque_familiale.json');

function loadRpg()    { try { return JSON.parse(fs.readFileSync(RPG_PATH));    } catch { return {}; } }
function loadBanque() { try { return JSON.parse(fs.readFileSync(BANQUE_PATH)); } catch { return { total: 0 }; } }

function norm(jid) {
    if (!jid || typeof jid !== 'string') return jid;
    return jid.includes(':') ? jid.split(':')[0] + '@s.whatsapp.net' : jid;
}

function fmtBig(n) {
    if (n >= 1_000_000_000_000) return fmt(Math.floor(n/1_000_000_000_000)) + ' Trd 🔱';
    if (n >= 1_000_000_000)     return fmt(Math.floor(n/1_000_000_000))     + ' Mrd 💎';
    if (n >= 1_000_000)         return fmt(Math.floor(n/1_000_000))         + ' M 💰';
    return fmt(n);
}

function xpBar(xp, level) {
    const LEVELS = [0,100,250,500,900,1400,2000,2800,3800,5000,6500,8500,
                    11000,14000,18000,23000,29000,36000,45000,55000,
                    70000,90000,120000,160000,210000];
    if (level >= 25) return '██████████ 🔱 *MAX*';
    const prev = LEVELS[level-1] || 0;
    const next = LEVELS[level]   || LEVELS[LEVELS.length-1];
    const pct  = Math.min(10, Math.round(((xp-prev)/(next-prev))*10));
    return '█'.repeat(Math.max(0,pct)) + '░'.repeat(10-Math.max(0,pct));
}

// ─── Salutations selon l'heure ─────────────────────────────────────────────
function salutation() {
    const h = new Date().getHours();
    if (h < 6)  return 'Bonsoir, Maître';
    if (h < 12) return 'Bonjour, Maître';
    if (h < 18) return 'Bon après-midi, Maître';
    return 'Bonsoir, Maître';
}

// ═══════════════════════════════════════════════════════════════════════════════
// MESSAGE 1 — Alfred se présente + stats joueur (avec la photo)
// ═══════════════════════════════════════════════════════════════════════════════
function buildAlfredCard(senderId, chatId) {
    const sid    = norm(senderId);
    const phone  = sid.split('@')[0];

    // Stats économiques
    const eco    = getUser(sid);
    const wallet = eco.coins || 0;
    const bank   = eco.bank  || 0;
    const total  = wallet + bank;

    // Stats RPG
    const xp     = getUserXP(chatId, sid);
    const level  = getLevel(xp);
    const rpg    = loadRpg();

    // IMPORTANT: rank.js stocke la classe avec la clé "chatId::jid"
    // On cherche d'abord avec la clé complète, sinon on parcourt toutes les clés
    const fullKey = chatId + '::' + sid;
    let userData  = rpg[fullKey] || null;

    // Si pas trouvé avec chatId, chercher dans tous les groupes (l'utilisateur peut avoir choisi sa classe dans un autre groupe)
    if (!userData || !userData.classe) {
        for (const [key, val] of Object.entries(rpg)) {
            if (key.endsWith('::' + sid) && val && val.classe) {
                userData = val;
                break;
            }
        }
    }
    if (!userData) userData = {};

    const className = userData.classe || null;
    const clsInfo   = className ? CLASSES[className] : null;
    const title     = className ? getTitle(className, level) : 'Aventurier';
    const clsEmoji  = clsInfo ? clsInfo.emoji : '⚔️';
    const clsName   = clsInfo ? clsInfo.name  : 'Sans Classe';

    // Banque familiale
    const banque = loadBanque();
    const bTotal = banque.total || 0;

    const M = settings.botOwner || 'SULTAN LUCIEN VALENHART';

    return (
        '🎩 *— Alfred, Majordome de la Maison VALENHART —*\n\n'

      + salutation() + ' ! 🌹\n\n'

      + '_Je suis *Alfred*, votre serviteur dévoué._\n'
      + '_Gardien de la Maison *VALENHART*, à votre service_\n'
      + '_depuis la nuit des temps... ou presque._ 🎭\n\n'

      + '┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n\n'

      + '⚜️ *MAISON VALENHART*\n'
      + '> _Force — Honneur — Héritage_\n'
      + '> Sous la direction de *' + M + '*\n\n'

      + '┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n\n'

      + '🗡️ *VOTRE FICHE, ' + phone + '*\n\n'

      + clsEmoji + ' *Classe :*  ' + clsName + '\n'
      + '🏅 *Titre :*   ' + title + '\n'
      + '⚡ *Niveau :*  ' + level + '  ┃  *XP :* ' + fmt(xp) + '\n'
      + '     [' + xpBar(xp, level) + ']\n\n'

      + '💰 *FORTUNE PERSONNELLE*\n'
      + '  👝 Portefeuille : *' + fmt(wallet) + ' ' + COIN + '*\n'
      + '  🏦 Banque perso : *' + fmt(bank)   + ' ' + COIN + '*\n'
      + '  💎 Total        : *' + fmt(total)   + ' ' + COIN + '*\n\n'

      + '🏰 *TRÉSORERIE — MAISON VALENHART*\n'
      + '  💼 Fonds familiaux : *' + fmtBig(bTotal) + ' ' + COIN + '*\n'
      + '  ♾️  Limite          : *ILLIMITÉE*\n'
      + '  🛡️  Statut          : Ouverte à tous les membres\n\n'

      + '┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n\n'

      + '_Voici le menu des services que je mets_\n'
      + '_à votre disposition, Monsieur._ 👇'
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MESSAGE 2 — Menu complet
// ═══════════════════════════════════════════════════════════════════════════════
function buildMenu() {
    const V = settings.version || '3.0.0';
    return (
        '┏━━━━━━━━━━━━━━━━━━━━━━━┓\n'
      + '┃  🎩  *MENU — ALFRED v' + V + '*\n'
      + '┃  _Maison VALENHART_\n'
      + '┗━━━━━━━━━━━━━━━━━━━━━━━┛\n\n'

      + '╭────〔 🌐 GÉNÉRAL 〕────\n'
      + '│ ➤ .help\n'
      + '│ ➤ .ping\n'
      + '│ ➤ .alive\n'
      + '│ ➤ .owner\n'
      + '│ ➤ .settings\n'
      + '│ ➤ .tts\n'
      + '│ ➤ .translate\n'
      + '│ ➤ .weather\n'
      + '│ ➤ .news\n'
      + '│ ➤ .lyrics\n'
      + '│ ➤ .joke\n'
      + '│ ➤ .quote\n'
      + '│ ➤ .fact\n'
      + '│ ➤ .8ball\n'
      + '│ ➤ .ss\n'
      + '│ ➤ .url\n'
      + '│ ➤ .vv\n'
      + '│ ➤ .groupinfo\n'
      + '╰──────────────────────────\n\n'

      + '╭────〔 👑 ADMIN GROUPE 〕────\n'
      + '│ ➤ .ban\n'
      + '│ ➤ .unban\n'
      + '│ ➤ .kick\n'
      + '│ ➤ .kickall\n'
      + '│ ➤ .promote\n'
      + '│ ➤ .demote\n'
      + '│ ➤ .mute\n'
      + '│ ➤ .unmute\n'
      + '│ ➤ .warn\n'
      + '│ ➤ .warnings\n'
      + '│ ➤ .delete\n'
      + '│ ➤ .clear\n'
      + '│ ➤ .tag\n'
      + '│ ➤ .tagall\n'
      + '│ ➤ .tagnotadmin\n'
      + '│ ➤ .hidetag\n'
      + '│ ➤ .resetlink\n'
      + '│ ➤ .antilink\n'
      + '│ ➤ .antitag\n'
      + '│ ➤ .antibadword\n'
      + '│ ➤ .welcome\n'
      + '│ ➤ .goodbye\n'
      + '│ ➤ .setgname\n'
      + '│ ➤ .setgdesc\n'
      + '│ ➤ .setgpp\n'
      + '╰──────────────────────────\n\n'

      + '╭────〔 🔧 OWNER 〕────\n'
      + '│ ➤ .mode\n'
      + '│ ➤ .clearsession\n'
      + '│ ➤ .cleartmp\n'
      + '│ ➤ .update\n'
      + '│ ➤ .setpp\n'
      + '│ ➤ .sudo\n'
      + '│ ➤ .antidelete\n'
      + '│ ➤ .anticall\n'
      + '│ ➤ .autoread\n'
      + '│ ➤ .autotyping\n'
      + '│ ➤ .autostatus\n'
      + '│ ➤ .gstatus\n'
      + '│ ➤ .newsletter\n'
      + '│ ➤ .pmblocker\n'
      + '│ ➤ .mention\n'
      + '│ ➤ .setmention\n'
      + '╰──────────────────────────\n\n'

      + '╭────〔 🖼️ MÉDIAS & STICKERS 〕────\n'
      + '│ ➤ .sticker\n'
      + '│ ➤ .simage\n'
      + '│ ➤ .crop\n'
      + '│ ➤ .blur\n'
      + '│ ➤ .attp\n'
      + '│ ➤ .removebg\n'
      + '│ ➤ .remini\n'
      + '│ ➤ .emojimix\n'
      + '│ ➤ .tgsticker\n'
      + '│ ➤ .take\n'
      + '│ ➤ .meme\n'
      + '│ ➤ .gif\n'
      + '╰──────────────────────────\n\n'

      + '╭────〔 🤖 ORACLE I.A. 〕────\n'
      + '│ ➤ .gpt\n'
      + '│ ➤ .gemini\n'
      + '│ ➤ .imagine\n'
      + '│ ➤ .sora\n'
      + '│ ➤ .chatbot\n'
      + '╰──────────────────────────\n\n'

      + '╭────〔 🎮 JEUX 〕────\n'
      + '│ ➤ .tictactoe\n'
      + '│ ➤ .hangman\n'
      + '│ ➤ .trivia\n'
      + '│ ➤ .truth\n'
      + '│ ➤ .dare\n'
      + '│ ➤ .8ball\n'
      + '│ ➤ .ship\n'
      + '│ ➤ .simp\n'
      + '│ ➤ .wasted\n'
      + '╰──────────────────────────\n\n'

      + '╭────〔 🐺 LOUP-GAROU 〕────\n'
      + '│ 🎮 *Groupe :*\n'
      + '│ ➤ !loup\n'
      + '│ ➤ !join\n'
      + '│ ➤ !start\n'
      + '│ ➤ !stop\n'
      + '│ ➤ !players\n'
      + '│ ➤ !guide\n'
      + '│\n'
      + '│ 📩 *DM bot :*\n'
      + '│ ➤ vote [numéro tél]\n'
      + '│ ➤ voir [numéro tél]\n'
      + '│ ➤ sauver\n'
      + '│ ➤ tuer [numéro tél]\n'
      + '│ ➤ passer\n'
      + '│ ➤ chasser [numéro tél]\n'
      + '╰──────────────────────────\n\n'

      + '╭────〔 💍 FAMILLE 〕────\n'
      + '│ 💒 *Mariage :*\n'
      + '│ ➤ .mariage @personne\n'
      + '│ ➤ .accepter\n'
      + '│ ➤ .refuser\n'
      + '│ ➤ .divorce\n'
      + '│\n'
      + '│ 👶 *Enfants :*\n'
      + '│ ➤ .adopter @personne\n'
      + '│ ➤ .enfant @personne\n'
      + '│\n'
      + '│ 👦👧 *Fratrie :*\n'
      + '│ ➤ .frere @personne\n'
      + '│ ➤ .soeur @personne\n'
      + '│ ➤ .quitter @personne\n'
      + '│\n'
      + '│ 🌳 *Arbre :*\n'
      + '│ ➤ .famille\n'
      + '│ ➤ .famille @personne\n'
      + '│ ➤ .arbre\n'
      + '│ ➤ .statsfamille\n'
      + '╰──────────────────────────\n\n'

      + '╭────〔 🏰 BANQUE FAMILIALE 〕────\n'
      + '│ ➤ .bftresor\n'
      + '│ ➤ .bfdepot <montant|tout>\n'
      + '│ ➤ .bfdon @personne <montant>\n'
      + '│ ➤ .bfpayer <motif> <montant>\n'
      + '│ ➤ .bfhistorique\n'
      + '╰──────────────────────────\n\n'

      + '╭────〔 💻 HACK SYSTÈME 〕────\n'
      + '│ ➤ .permit @pers    → (owner) accorder licence\n'
      + '│ ➤ .permit del @pers → (owner) révoquer\n'
      + '│ ➤ .permit list     → voir les hackers actifs\n'
      + '│ ➤ .hack @cible     → pirater la banque (55% succès)\n'
      + '╰──────────────────────────\n\n'

      + '╭────〔 🛍️ MARCHÉ DE LUXE 〕────\n'
      + '│ ➤ .marche             → voir les catégories\n'
      + '│ ➤ .marche voitures    → voitures de luxe\n'
      + '│ ➤ .marche montres     → montres prestige\n'
      + '│ ➤ .marche maisons     → propriétés\n'
      + '│ ➤ .marche bijoux      → joaillerie\n'
      + '│ ➤ .marche jets        → jets & yachts\n'
      + '│ ➤ .marche tech        → high-tech\n'
      + '│ ➤ .marche mode        → haute couture\n'
      + '│ ➤ .marche prestige    → articles exclusifs\n'
      + '│ ➤ .acheter <id>       → acheter un article\n'
      + '│ ➤ .inventaire         → votre collection\n'
      + '│ ➤ .revendre <id>      → revendre (50%)\n'
      + '╰──────────────────────────\n\n'

      + '╭────〔 📖 GUIDE COMPLET 〕────\n'
      + '│ ➤ .guide           → menu du guide\n'
      + '│ ➤ .guide gains     → stratégies de gains\n'
      + '│ ➤ .guide casino    → probabilités des jeux\n'
      + '│ ➤ .guide hack      → système de hacking\n'
      + '│ ➤ .guide marche    → marché de luxe\n'
      + '╰──────────────────────────\n\n'

      + '╭────〔 🪙 ÉCONOMIE 〕────\n'
      + '│ 💼 *Gains stables :*\n'
      + '│ ➤ .solde            → voir ses pièces & banque\n'
      + '│ ➤ .daily            → prime journalière (300–500🪙 + streak)\n'
      + '│ ➤ .travail          → emploi (80–500🪙, cooldown 2h)\n'
      + '│ ➤ .coffre           → coffre bonus (50–1000🪙, cooldown 8h)\n'
      + '│ ➤ .investir         → investir depuis banque (cooldown 12h)\n'
      + '│ ➤ .banque           → dépôt / retrait banque perso\n'
      + '│ ➤ .transfert @pers  → envoyer des pièces\n'
      + '│ ➤ .stats            → voir son profil économique\n'
      + '│ ➤ .rich             → classement des plus riches\n'
      + '│\n'
      + '│ 🎰 *Casino (risque) :*\n'
      + '│ ➤ .roulette <mise>  → 47% de chance de doubler\n'
      + '│ ➤ .blackjack <mise> → jeu de cartes contre le bot\n'
      + '│ ➤ .poker <mise>     → poker vs le bot\n'
      + '│ ➤ .bandit <mise>    → machine à sous\n'
      + '│ ➤ .pari <mis> pile|face → 50/50\n'
      + '│ ➤ .mines <mise>     → mine (×1.5 à ×3 ou perdu)\n'
      + '│ ➤ .grattage <mise>  → ticket à gratter\n'
      + '│ ➤ .duel @pers <mis> → duel 50/50 contre un joueur\n'
      + '│\n'
      + '│ 🎟️ *Loterie :*\n'
      + '│ ➤ .loto <mise>      → loterie (×5 à ×100 ou perdu)\n'
      + '│ ➤ .jackpot <mise>   → jackpot communautaire\n'
      + '│ ➤ .quizeco          → quiz (100–200🪙 si bonne réponse)\n'
      + '│\n'
      + '│ 🦹 *Actions risquées :*\n'
      + '│ ➤ .crime            → crime aléatoire (55% succès, cooldown 4h)\n'
      + '│ ➤ .vol @personne    → voler portefeuille (45% succès, cooldown 6h)\n'
      + '│\n'
      + '│ 💻 *Hack (avec .permit) :*\n'
      + '│ ➤ .hack @cible      → pirater la banque (55% succès, cooldown 8h)\n'
      + '│    ✅ Succès : vol 10–35% banque cible\n'
      + '│    ❌ Échec  : amende 15% portefeuille\n'
      + '│    🔄 Contre : cible vole 20% de vous\n'
      + '╰──────────────────────────\n\n'

      + '╭────〔 ⚔️ RPG & RANG 〕────\n'
      + '│ ➤ .rank\n'
      + '│ ➤ .classe\n'
      + '│ ➤ .classement\n'
      + '│ ➤ .topmembers\n'
      + '╰──────────────────────────\n\n'

      + '╭────〔 🎬 RÉACTIONS ANIME 〕────\n'
      + '│ ➤ .hug\n'
      + '│ ➤ .kiss\n'
      + '│ ➤ .pat\n'
      + '│ ➤ .cuddle\n'
      + '│ ➤ .slap\n'
      + '│ ➤ .punch\n'
      + '│ ➤ .bite\n'
      + '│ ➤ .lick\n'
      + '│ ➤ .poke\n'
      + '│ ➤ .wave\n'
      + '│ ➤ .cry\n'
      + '│ ➤ .dance\n'
      + '│ ➤ .blush\n'
      + '│ ➤ .smile\n'
      + '│ ➤ .wink\n'
      + '│ ➤ .yeet\n'
      + '│ ➤ .bully\n'
      + '│ ➤ .run\n'
      + '│ ➤ .highfive\n'
      + '│ ➤ .nod\n'
      + '│ ➤ .sleep\n'
      + '│ ➤ .thumbsup\n'
      + '│ ➤ .lurk\n'
      + '│ ➤ .kill\n'
      + '│ ➤ .shoot\n'
      + '│ ➤ .stab\n'
      + '╰──────────────────────────\n\n'

      + '╭────〔 🔤 TEXTMAKER 〕────\n'
      + '│ ➤ .fire\n'
      + '│ ➤ .neon\n'
      + '│ ➤ .matrix\n'
      + '│ ➤ .ice\n'
      + '│ ➤ .snow\n'
      + '│ ➤ .glitch\n'
      + '│ ➤ .devil\n'
      + '│ ➤ .hacker\n'
      + '│ ➤ .arena\n'
      + '│ ➤ .thunder\n'
      + '╰──────────────────────────\n\n'

      + '╭────〔 📥 MÉDIATHÈQUE 〕────\n'
      + '│ ➤ .play\n'
      + '│ ➤ .song\n'
      + '│ ➤ .video\n'
      + '│ ➤ .spotify\n'
      + '│ ➤ .tiktok\n'
      + '│ ➤ .instagram\n'
      + '│ ➤ .facebook\n'
      + '╰──────────────────────────\n\n'

      + '┏━━━━━━━━━━━━━━━━━━━━━━━┓\n'
      + '┃ _"Je demeure votre_\n'
      + '┃  _serviteur dévoué,_\n'
      + '┃  _en toutes circonstances."_\n'
      + '┃             — *Alfred* 🎩\n'
      + '┗━━━━━━━━━━━━━━━━━━━━━━━┛'
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMMANDE PRINCIPALE
// ═══════════════════════════════════════════════════════════════════════════════
async function helpCommand(sock, chatId, message, senderId) {
    const sid = norm(senderId || message?.key?.participant || message?.key?.remoteJid || '');

    // ── Récupérer la PP du bot (sock.user.id = JID du bot) ──
    let imageBuffer = null;
    try {
        const botJid = sock.user?.id || sock.user?.jid || '';
        const ppUrl  = await sock.profilePictureUrl(norm(botJid), 'image');
        const res    = await fetch(ppUrl);
        if (res.ok) imageBuffer = Buffer.from(await res.arrayBuffer());
    } catch {}

    // Fallback : bannière statique si la PP est inaccessible
    if (!imageBuffer) {
        try { imageBuffer = fs.readFileSync(BANNER_PATH); } catch {}
    }

    // ── Message 1 : PP du bot + Alfred qui se présente + stats ──
    const cardText = buildAlfredCard(sid, chatId);
    if (imageBuffer) {
        await sock.sendMessage(chatId, {
            image:    imageBuffer,
            caption:  cardText,
            mimetype: 'image/jpeg',
        }, { quoted: message });
    } else {
        await sock.sendMessage(chatId, { text: cardText }, { quoted: message });
    }

    // ── Message 2 : Menu complet ──
    await sock.sendMessage(chatId, { text: buildMenu() }, { quoted: message });
}

module.exports = helpCommand;
