/**
 * 💰 ECONOMY SYSTEM — MAISON VALENHART
 * Commandes: .solde .daily .roulette .crime .travail .vol .pari .mines .duel .banque .transfert .rich
 */

const fs = require('fs');
const path = require('path');

const walletPath = path.join(__dirname, '..', 'data', 'wallet.json');

// ─── Storage ──────────────────────────────────────────────────────────────────
function loadWallet() {
    if (fs.existsSync(walletPath)) {
        try { return JSON.parse(fs.readFileSync(walletPath)); } catch {}
    }
    return {};
}
function saveWallet(data) {
    fs.writeFileSync(walletPath, JSON.stringify(data, null, 2));
}

function getUser(userId) {
    const data = loadWallet();
    if (!data[userId]) {
        data[userId] = { coins: 500, bank: 0, lastDaily: 0, lastWork: 0, lastCrime: 0, lastRob: 0, lastHack: 0, streak: 0 };
        saveWallet(data);
    }
    return data[userId];
}
function setUser(userId, userData) {
    const data = loadWallet();
    data[userId] = userData;
    saveWallet(data);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const COIN = '🪙';
const now = () => Date.now();
const elapsed = (ts) => now() - ts;
const fmt = (n) => Number(n).toLocaleString('fr-FR');

function header(title) {
    return `┏━━━━━━━━━━━━━━━━━━━━━━━┓\n┃  ${COIN}  *${title}*\n┗━━━━━━━━━━━━━━━━━━━━━━━┛\n`;
}

function cooldownMsg(ms, label) {
    const s = Math.ceil(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `⏳ Attendez encore *${h}h ${m % 60}min*, Monsieur.`;
    if (m > 0) return `⏳ Attendez encore *${m}min ${s % 60}s*, Monsieur.`;
    return `⏳ Attendez encore *${s}s*, Monsieur.`;
}

// ─── .solde ───────────────────────────────────────────────────────────────────
async function soldeCommand(sock, chatId, msg, senderId) {
    const u = getUser(senderId);
    const total = u.coins + u.bank;
    await sock.sendMessage(chatId, {
        text:
            header('COFFRE PERSONNEL') +
            `╭────〔 ✦ FINANCES 〕────\n` +
            `│ 👤 @${senderId.split('@')[0]}\n` +
            `│\n` +
            `│ 👝 *Portefeuille :* ${fmt(u.coins)} ${COIN}\n` +
            `│ 🏦 *Banque :* ${fmt(u.bank)} ${COIN}\n` +
            `│ 💰 *Fortune totale :* ${fmt(total)} ${COIN}\n` +
            `╰──────────────────────────\n\n` +
            `> _"La richesse se construit avec patience,_\n> _Monsieur."_ — *Alfred* 🎩`,
        mentions: [senderId]
    }, { quoted: msg });
}

// ─── .daily ───────────────────────────────────────────────────────────────────
async function dailyCommand(sock, chatId, msg, senderId) {
    const COOLDOWN = 20 * 60 * 60 * 1000; // 20h
    const u = getUser(senderId);
    const diff = elapsed(u.lastDaily);

    if (diff < COOLDOWN) {
        return await sock.sendMessage(chatId, {
            text: `🎩 *Récompense journalière*\n\n${cooldownMsg(COOLDOWN - diff)}\n\n> La Maison VALENHART n'est pas une fontaine, Monsieur.`
        }, { quoted: msg });
    }

    // Streak bonus
    const yesterday = elapsed(u.lastDaily) < 44 * 60 * 60 * 1000;
    u.streak = yesterday ? (u.streak || 0) + 1 : 1;
    const streakBonus = Math.min(u.streak * 50, 500);
    const base = 300 + Math.floor(Math.random() * 200); // 300–500
    const total = base + streakBonus;

    u.coins += total;
    u.lastDaily = now();
    setUser(senderId, u);

    await sock.sendMessage(chatId, {
        text:
            header('RÉCOMPENSE JOURNALIÈRE') +
            `╭────〔 ✦ GAINS 〕────\n` +
            `│ 👤 @${senderId.split('@')[0]}\n` +
            `│\n` +
            `│ 🎁 *Récompense :* +${fmt(base)} ${COIN}\n` +
            `│ 🔥 *Bonus streak (×${u.streak}) :* +${fmt(streakBonus)} ${COIN}\n` +
            `│ ✨ *Total reçu :* +${fmt(total)} ${COIN}\n` +
            `│\n` +
            `│ 👝 *Nouveau solde :* ${fmt(u.coins)} ${COIN}\n` +
            `│ 📅 *Streak :* ${u.streak} jour(s) consécutif(s)\n` +
            `╰──────────────────────────\n\n` +
            `> _"La régularité est la marque des grands,_\n> _Monsieur."_ — *Alfred* 🎩`,
        mentions: [senderId]
    }, { quoted: msg });
}

// ─── .roulette ────────────────────────────────────────────────────────────────
async function rouletteCommand(sock, chatId, msg, senderId, args) {
    const u = getUser(senderId);
    const input = args[0];
    let mise;

    if (input === 'tout' || input === 'all') mise = u.coins;
    else mise = parseInt(input);

    if (!mise || isNaN(mise) || mise <= 0) {
        return await sock.sendMessage(chatId, {
            text: `🎩 Usage: *.roulette <montant|tout>*\nEx: .roulette 200 ou .roulette tout`
        }, { quoted: msg });
    }
    if (mise > u.coins) {
        return await sock.sendMessage(chatId, {
            text: `🎩 Vous n'avez que *${fmt(u.coins)} ${COIN}* en poche, Monsieur.`
        }, { quoted: msg });
    }

    const roll = Math.floor(Math.random() * 37); // 0–36
    const color = roll === 0 ? '⬜' : roll % 2 === 0 ? '🔴' : '⚫';
    const win = Math.random() < 0.47; // légère edge pour la maison
    const gain = win ? mise : -mise;
    u.coins += gain;
    setUser(senderId, u);

    await sock.sendMessage(chatId, {
        text:
            header('🎰 ROULETTE VALENHART') +
            `╭────〔 ✦ RÉSULTAT 〕────\n` +
            `│ 👤 @${senderId.split('@')[0]}\n` +
            `│\n` +
            `│ 🎯 *Numéro sorti :* ${color} ${roll}\n` +
            `│ 💸 *Mise :* ${fmt(mise)} ${COIN}\n` +
            `│ ${win ? '🏆 *Résultat :* GAGNÉ !' : '💔 *Résultat :* PERDU'}\n` +
            `│ ${win ? `✅ *Gain :* +${fmt(mise)}` : `❌ *Perte :* -${fmt(mise)}`} ${COIN}\n` +
            `│\n` +
            `│ 👝 *Solde :* ${fmt(u.coins)} ${COIN}\n` +
            `╰──────────────────────────\n\n` +
            `> _"${win ? 'La fortune sourit aux audacieux.' : 'La Maison reprend toujours ce qu\'elle a donné.'}"_\n> — *Alfred* 🎩`,
        mentions: [senderId]
    }, { quoted: msg });
}

// ─── .travail ─────────────────────────────────────────────────────────────────
const JOBS = [
    { name: 'Butler de la Maison', gain: [100, 250] },
    { name: 'Garde du manoir', gain: [120, 280] },
    { name: 'Cuisinier royal', gain: [90, 220] },
    { name: 'Messager discret', gain: [150, 350] },
    { name: 'Comptable de la Maison', gain: [200, 400] },
    { name: 'Espion du Maître', gain: [300, 600] },
    { name: 'Négociant en armes', gain: [250, 500] },
    { name: 'Artisan du manoir', gain: [80, 200] },
];

async function travailCommand(sock, chatId, msg, senderId) {
    const COOLDOWN = 2 * 60 * 60 * 1000; // 2h
    const u = getUser(senderId);
    const diff = elapsed(u.lastWork);

    if (diff < COOLDOWN) {
        return await sock.sendMessage(chatId, {
            text: `🎩 *Travail*\n\n${cooldownMsg(COOLDOWN - diff)}\n\n> Même les meilleurs serviteurs ont besoin de repos.`
        }, { quoted: msg });
    }

    const job = JOBS[Math.floor(Math.random() * JOBS.length)];
    const gain = Math.floor(Math.random() * (job.gain[1] - job.gain[0] + 1)) + job.gain[0];
    u.coins += gain;
    u.lastWork = now();
    setUser(senderId, u);

    await sock.sendMessage(chatId, {
        text:
            header('💼 TRAVAIL') +
            `╭────〔 ✦ MISSION 〕────\n` +
            `│ 👤 @${senderId.split('@')[0]}\n` +
            `│\n` +
            `│ 🏷️ *Poste :* ${job.name}\n` +
            `│ ✅ *Mission accomplie !*\n` +
            `│ 💵 *Salaire :* +${fmt(gain)} ${COIN}\n` +
            `│\n` +
            `│ 👝 *Solde :* ${fmt(u.coins)} ${COIN}\n` +
            `╰──────────────────────────\n\n` +
            `> _"Un bon serviteur est toujours récompensé,_\n> _Monsieur."_ — *Alfred* 🎩`,
        mentions: [senderId]
    }, { quoted: msg });
}

// ─── .crime ───────────────────────────────────────────────────────────────────
const CRIMES = [
    { name: 'contrefaçon de pièces', win: [400, 900], fine: [200, 500] },
    { name: 'trafic de fourrure', win: [500, 1200], fine: [300, 700] },
    { name: 'cambriolage du voisin', win: [300, 800], fine: [150, 400] },
    { name: 'vente de faux tableaux', win: [600, 1400], fine: [400, 900] },
    { name: 'piratage de la bourse', win: [800, 2000], fine: [500, 1200] },
    { name: 'vol de carrosse', win: [350, 750], fine: [200, 500] },
];

async function crimeCommand(sock, chatId, msg, senderId) {
    const COOLDOWN = 4 * 60 * 60 * 1000; // 4h
    const u = getUser(senderId);
    const diff = elapsed(u.lastCrime);

    if (diff < COOLDOWN) {
        return await sock.sendMessage(chatId, {
            text: `🎩 *Crime*\n\n${cooldownMsg(COOLDOWN - diff)}\n\n> La police vous surveille encore, Monsieur.`
        }, { quoted: msg });
    }

    const crime = CRIMES[Math.floor(Math.random() * CRIMES.length)];
    const success = Math.random() < 0.55;
    let amount, result;

    if (success) {
        amount = Math.floor(Math.random() * (crime.win[1] - crime.win[0] + 1)) + crime.win[0];
        u.coins += amount;
        result = `✅ *Succès !* Vous avez réussi votre ${crime.name}.\n│ 💰 *Butin :* +${fmt(amount)} ${COIN}`;
    } else {
        amount = Math.floor(Math.random() * (crime.fine[1] - crime.fine[0] + 1)) + crime.fine[0];
        amount = Math.min(amount, u.coins);
        u.coins -= amount;
        result = `🚔 *Arrêté !* Votre ${crime.name} a échoué.\n│ 💸 *Amende :* -${fmt(amount)} ${COIN}`;
    }

    u.lastCrime = now();
    setUser(senderId, u);

    await sock.sendMessage(chatId, {
        text:
            header('🦹 ACTIVITÉ CRIMINELLE') +
            `╭────〔 ✦ OPÉRATION 〕────\n` +
            `│ 👤 @${senderId.split('@')[0]}\n` +
            `│\n` +
            `│ 🎭 *Crime tenté :* ${crime.name}\n` +
            `│ ${result}\n` +
            `│\n` +
            `│ 👝 *Solde :* ${fmt(u.coins)} ${COIN}\n` +
            `╰──────────────────────────\n\n` +
            `> _"${success ? 'Alfred détourne pudiquement le regard...' : 'Alfred vous avait prévenu, Monsieur.'}"_ 🎩`,
        mentions: [senderId]
    }, { quoted: msg });
}

// ─── .vol @target ─────────────────────────────────────────────────────────────
async function volCommand(sock, chatId, msg, senderId, mentionedJid) {
    if (!mentionedJid || mentionedJid.length === 0) {
        return await sock.sendMessage(chatId, {
            text: `🎩 Usage: *.vol @personne*\nTagguez votre cible, Monsieur.`
        }, { quoted: msg });
    }

    const targetId = mentionedJid[0];
    if (targetId === senderId) {
        return await sock.sendMessage(chatId, {
            text: `🎩 On ne se vole pas soi-même, Monsieur.`
        }, { quoted: msg });
    }

    const COOLDOWN = 6 * 60 * 60 * 1000;
    const robber = getUser(senderId);
    const diff = elapsed(robber.lastRob);

    if (diff < COOLDOWN) {
        return await sock.sendMessage(chatId, {
            text: `🎩 *Vol*\n\n${cooldownMsg(COOLDOWN - diff)}\n\n> Votre dernière victime est encore sur ses gardes.`
        }, { quoted: msg });
    }

    const target = getUser(targetId);
    if (target.coins < 100) {
        return await sock.sendMessage(chatId, {
            text: `🎩 @${targetId.split('@')[0]} est trop pauvre pour être volé, Monsieur. Cherchez une meilleure cible.`,
            mentions: [targetId]
        }, { quoted: msg });
    }

    const success = Math.random() < 0.45;
    robber.lastRob = now();

    let resultText;
    if (success) {
        const stolen = Math.floor(target.coins * (0.1 + Math.random() * 0.2));
        robber.coins += stolen;
        target.coins -= stolen;
        setUser(targetId, target);
        resultText =
            `│ ✅ *Vol réussi !*\n` +
            `│ 💰 *Volé à @${targetId.split('@')[0]} :* ${fmt(stolen)} ${COIN}\n` +
            `│ 👝 *Votre solde :* ${fmt(robber.coins)} ${COIN}`;
    } else {
        const fine = Math.floor(robber.coins * 0.15);
        robber.coins = Math.max(0, robber.coins - fine);
        resultText =
            `│ 🚔 *Pris en flagrant délit !*\n` +
            `│ 💸 *Amende :* -${fmt(fine)} ${COIN}\n` +
            `│ 👝 *Votre solde :* ${fmt(robber.coins)} ${COIN}`;
    }

    setUser(senderId, robber);

    await sock.sendMessage(chatId, {
        text:
            header('🥷 VOL À LA TIRE') +
            `╭────〔 ✦ CIBLE 〕────\n` +
            `│ 🦹 @${senderId.split('@')[0]}\n` +
            `│ 🎯 @${targetId.split('@')[0]}\n` +
            `│\n` +
            `│ ${resultText}\n` +
            `╰──────────────────────────\n\n` +
            `> _"${success ? 'Alfred est consterné, mais impressionné.' : 'La justice de la Maison est implacable.'}"_ 🎩`,
        mentions: [senderId, targetId]
    }, { quoted: msg });
}

// ─── .pari <montant> <pile|face> ─────────────────────────────────────────────
async function pariCommand(sock, chatId, msg, senderId, args) {
    const u = getUser(senderId);
    const mise = parseInt(args[0]);
    const choix = args[1]?.toLowerCase();

    if (!mise || isNaN(mise) || mise <= 0 || !['pile', 'face'].includes(choix)) {
        return await sock.sendMessage(chatId, {
            text: `🎩 Usage: *.pari <montant> <pile|face>*\nEx: .pari 500 pile`
        }, { quoted: msg });
    }
    if (mise > u.coins) {
        return await sock.sendMessage(chatId, {
            text: `🎩 Vous n'avez que *${fmt(u.coins)} ${COIN}*, Monsieur.`
        }, { quoted: msg });
    }

    const result = Math.random() < 0.5 ? 'pile' : 'face';
    const win = result === choix;
    u.coins += win ? mise : -mise;
    setUser(senderId, u);

    await sock.sendMessage(chatId, {
        text:
            header('🪙 PILE OU FACE') +
            `╭────〔 ✦ RÉSULTAT 〕────\n` +
            `│ 👤 @${senderId.split('@')[0]}\n` +
            `│\n` +
            `│ 🎯 *Votre choix :* ${choix}\n` +
            `│ 🪙 *Résultat :* ${result}\n` +
            `│ 💸 *Mise :* ${fmt(mise)} ${COIN}\n` +
            `│ ${win ? `🏆 *GAGNÉ !* +${fmt(mise)} ${COIN}` : `💔 *PERDU !* -${fmt(mise)} ${COIN}`}\n` +
            `│\n` +
            `│ 👝 *Solde :* ${fmt(u.coins)} ${COIN}\n` +
            `╰──────────────────────────\n\n` +
            `> _"${win ? 'La chance est avec vous ce soir, Monsieur.' : 'Le hasard est cruel, même pour les nobles.'}"_ 🎩`,
        mentions: [senderId]
    }, { quoted: msg });
}

// ─── .mines ───────────────────────────────────────────────────────────────────
async function minesCommand(sock, chatId, msg, senderId, args) {
    const u = getUser(senderId);
    const mise = parseInt(args[0]);

    if (!mise || isNaN(mise) || mise <= 0) {
        return await sock.sendMessage(chatId, {
            text: `🎩 Usage: *.mines <montant>*\nChoisissez une case (1–9) dans la prochaine réponse.`
        }, { quoted: msg });
    }
    if (mise > u.coins) {
        return await sock.sendMessage(chatId, {
            text: `🎩 Vous n'avez que *${fmt(u.coins)} ${COIN}*, Monsieur.`
        }, { quoted: msg });
    }

    // Simple auto-mines: 9 cases, 3 bombes, pick random
    const grid = Array(9).fill('💎');
    const bombs = new Set();
    while (bombs.size < 3) bombs.add(Math.floor(Math.random() * 9));
    bombs.forEach(i => grid[i] = '💣');

    const pick = Math.floor(Math.random() * 9);
    const hit = grid[pick] === '💣';

    const multiplier = hit ? 0 : [1.5, 2, 2.5, 3][Math.floor(Math.random() * 4)];
    const gain = hit ? -mise : Math.floor(mise * multiplier) - mise;
    u.coins += gain;
    setUser(senderId, u);

    // Reveal grid (hide unpicked safe tiles)
    const display = grid.map((v, i) => i === pick ? v : (v === '💣' && hit ? '💣' : '⬛'));

    await sock.sendMessage(chatId, {
        text:
            header('💎 MINES DE VALENHART') +
            `╭────〔 ✦ GRILLE 〕────\n` +
            `│ ${display.slice(0,3).join(' ')}  ${display.slice(3,6).join(' ')}  ${display.slice(6).join(' ')}\n` +
            `│\n` +
            `│ 👤 @${senderId.split('@')[0]}\n` +
            `│ 💸 *Mise :* ${fmt(mise)} ${COIN}\n` +
            `│ ${hit ? `💥 *BOMBE ! Perdu :* -${fmt(mise)} ${COIN}` : `💎 *SAFE ! ×${multiplier} → +${fmt(gain)} ${COIN}`}\n` +
            `│\n` +
            `│ 👝 *Solde :* ${fmt(u.coins)} ${COIN}\n` +
            `╰──────────────────────────\n\n` +
            `> _"${hit ? 'Même les mines les plus sûres réservent des surprises.' : 'Les joyaux de la Maison vous appartiennent, Monsieur.'}"_ 🎩`,
        mentions: [senderId]
    }, { quoted: msg });
}

// ─── .duel @target <montant> ──────────────────────────────────────────────────
async function duelCommand(sock, chatId, msg, senderId, mentionedJid, args) {
    if (!mentionedJid || mentionedJid.length === 0) {
        return await sock.sendMessage(chatId, {
            text: `🎩 Usage: *.duel @personne <montant>*`
        }, { quoted: msg });
    }

    const targetId = mentionedJid[0];
    if (targetId === senderId) {
        return await sock.sendMessage(chatId, {
            text: `🎩 On ne se bat pas contre soi-même, Monsieur.`
        }, { quoted: msg });
    }

    const mise = parseInt(args.find(a => !a.includes('@') && !isNaN(parseInt(a))));
    if (!mise || isNaN(mise) || mise <= 0) {
        return await sock.sendMessage(chatId, {
            text: `🎩 Usage: *.duel @personne <montant>*\nEx: .duel @Ali 500`
        }, { quoted: msg });
    }

    const challenger = getUser(senderId);
    const opponent = getUser(targetId);

    if (mise > challenger.coins) {
        return await sock.sendMessage(chatId, { text: `🎩 Vous n'avez pas assez de pièces, Monsieur.` }, { quoted: msg });
    }
    if (mise > opponent.coins) {
        return await sock.sendMessage(chatId, {
            text: `🎩 @${targetId.split('@')[0]} n'a pas assez de pièces pour ce duel.`,
            mentions: [targetId]
        }, { quoted: msg });
    }

    const challengerWins = Math.random() < 0.5;
    const winner = challengerWins ? senderId : targetId;
    const loser = challengerWins ? targetId : senderId;

    challenger.coins += challengerWins ? mise : -mise;
    opponent.coins += challengerWins ? -mise : mise;
    setUser(senderId, challenger);
    setUser(targetId, opponent);

    const attacks = [
        'une botte secrète foudroyante', 'un coup d\'estoc parfait',
        'une feinte magistrale', 'une attaque surprise au flambeau',
        'un désarmement éclair', 'une prise de judo noble'
    ];
    const atk = attacks[Math.floor(Math.random() * attacks.length)];

    await sock.sendMessage(chatId, {
        text:
            header('⚔️ DUEL D\'HONNEUR') +
            `╭────〔 ✦ COMBAT 〕────\n` +
            `│ ⚔️ @${senderId.split('@')[0]}\n` +
            `│       vs\n` +
            `│ 🛡️ @${targetId.split('@')[0]}\n` +
            `│\n` +
            `│ 💸 *Enjeu :* ${fmt(mise)} ${COIN} chacun\n` +
            `│ 🎯 *Coup décisif :* ${atk}\n` +
            `│\n` +
            `│ 🏆 *Vainqueur :* @${winner.split('@')[0]}\n` +
            `│ 💰 *Gains :* +${fmt(mise)} ${COIN}\n` +
            `╰──────────────────────────\n\n` +
            `> _"L'honneur du vainqueur rejaillit sur toute la Maison."_ 🎩`,
        mentions: [senderId, targetId]
    }, { quoted: msg });
}

// ─── .banque <depot|retrait> <montant> ───────────────────────────────────────
async function banqueCommand(sock, chatId, msg, senderId, args) {
    const action = args[0]?.toLowerCase();
    const montant = parseInt(args[1]);
    const u = getUser(senderId);

    if (!['depot', 'retrait', 'dépôt'].includes(action) || !montant || isNaN(montant) || montant <= 0) {
        return await sock.sendMessage(chatId, {
            text:
                `🎩 Usage:\n` +
                `• *.banque depot <montant>* — déposer\n` +
                `• *.banque retrait <montant>* — retirer`
        }, { quoted: msg });
    }

    if (action === 'depot' || action === 'dépôt') {
        if (montant > u.coins) return await sock.sendMessage(chatId, { text: `🎩 Portefeuille insuffisant. Vous avez *${fmt(u.coins)} ${COIN}*.` }, { quoted: msg });
        u.coins -= montant;
        u.bank += montant;
        setUser(senderId, u);
        await sock.sendMessage(chatId, {
            text:
                header('🏦 BANQUE VALENHART') +
                `╭────〔 ✦ DÉPÔT 〕────\n` +
                `│ 👤 @${senderId.split('@')[0]}\n` +
                `│ ✅ *Déposé :* ${fmt(montant)} ${COIN}\n` +
                `│ 👝 *Portefeuille :* ${fmt(u.coins)} ${COIN}\n` +
                `│ 🏦 *Banque :* ${fmt(u.bank)} ${COIN}\n` +
                `╰──────────────────────────`,
            mentions: [senderId]
        }, { quoted: msg });
    } else {
        if (montant > u.bank) return await sock.sendMessage(chatId, { text: `🎩 Banque insuffisante. Vous avez *${fmt(u.bank)} ${COIN}* en banque.` }, { quoted: msg });
        u.bank -= montant;
        u.coins += montant;
        setUser(senderId, u);
        await sock.sendMessage(chatId, {
            text:
                header('🏦 BANQUE VALENHART') +
                `╭────〔 ✦ RETRAIT 〕────\n` +
                `│ 👤 @${senderId.split('@')[0]}\n` +
                `│ ✅ *Retiré :* ${fmt(montant)} ${COIN}\n` +
                `│ 👝 *Portefeuille :* ${fmt(u.coins)} ${COIN}\n` +
                `│ 🏦 *Banque :* ${fmt(u.bank)} ${COIN}\n` +
                `╰──────────────────────────`,
            mentions: [senderId]
        }, { quoted: msg });
    }
}

// ─── .transfert @target <montant> ────────────────────────────────────────────
async function transfertCommand(sock, chatId, msg, senderId, mentionedJid, args) {
    if (!mentionedJid || mentionedJid.length === 0) {
        return await sock.sendMessage(chatId, { text: `🎩 Usage: *.transfert @personne <montant>*` }, { quoted: msg });
    }
    const targetId = mentionedJid[0];
    if (targetId === senderId) return await sock.sendMessage(chatId, { text: `🎩 On ne se transfère pas à soi-même, Monsieur.` }, { quoted: msg });

    const montant = parseInt(args.find(a => !a.includes('@') && !isNaN(parseInt(a))));
    if (!montant || isNaN(montant) || montant <= 0) {
        return await sock.sendMessage(chatId, { text: `🎩 Usage: *.transfert @personne <montant>*` }, { quoted: msg });
    }

    const sender = getUser(senderId);
    if (montant > sender.coins) {
        return await sock.sendMessage(chatId, { text: `🎩 Portefeuille insuffisant. Vous avez *${fmt(sender.coins)} ${COIN}*.` }, { quoted: msg });
    }

    const target = getUser(targetId);
    sender.coins -= montant;
    target.coins += montant;
    setUser(senderId, sender);
    setUser(targetId, target);

    await sock.sendMessage(chatId, {
        text:
            header('💸 TRANSFERT') +
            `╭────〔 ✦ ENVOI 〕────\n` +
            `│ 📤 @${senderId.split('@')[0]}\n` +
            `│ 📥 @${targetId.split('@')[0]}\n` +
            `│\n` +
            `│ 💰 *Montant :* ${fmt(montant)} ${COIN}\n` +
            `│ 👝 *Votre solde :* ${fmt(sender.coins)} ${COIN}\n` +
            `╰──────────────────────────\n\n` +
            `> _"La générosité est la plus belle des vertus."_ — *Alfred* 🎩`,
        mentions: [senderId, targetId]
    }, { quoted: msg });
}

// ─── .rich (classement richesse) ─────────────────────────────────────────────
async function richCommand(sock, chatId, msg) {
    const data = loadWallet();
    const entries = Object.entries(data)
        .filter(([jid, u]) => typeof u === 'object' && u !== null && (typeof u.coins === 'number' || typeof u.bank === 'number'))
        .map(([jid, u]) => ({ jid, total: (u.coins || 0) + (u.bank || 0) }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

    if (entries.length === 0) {
        return await sock.sendMessage(chatId, {
            text:
                `🎩 *Classement des Fortunés*\n\n` +
                `│ Les coffres de la Maison sont encore vides.\n` +
                `│\n` +
                `│ Utilisez *.daily*, *.travail* ou jouez\n` +
                `│ au casino pour accumuler des 🪙 !\n\n` +
                `> — *Alfred* 🎩`
        }, { quoted: msg });
    }

    const medals = ['🥇', '🥈', '🥉', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];
    const rows = entries.map((e, i) =>
        `│ ${medals[i]} @${e.jid.split('@')[0]} — *${fmt(e.total)} ${COIN}*`
    ).join('\n');

    await sock.sendMessage(chatId, {
        text:
            header('👑 CLASSEMENT DES FORTUNÉS') +
            `╭────〔 ✦ TOP ${entries.length} 〕────\n` +
            rows + '\n' +
            `╰──────────────────────────\n\n` +
            `> _"La fortune distingue les grands de la Maison."_ — *Alfred* 🎩`,
        mentions: entries.map(e => e.jid)
    }, { quoted: msg });
}

// ─── .loto <montant> ──────────────────────────────────────────────────────────
async function lotoCommand(sock, chatId, msg, senderId, args) {
    const u = getUser(senderId);
    const ticket = parseInt(args[0]) || 100;

    if (ticket > u.coins) {
        return await sock.sendMessage(chatId, { text: `🎩 Ticket à *${fmt(ticket)} ${COIN}*. Vous n'avez que *${fmt(u.coins)} ${COIN}*.` }, { quoted: msg });
    }

    const nums = Array.from({ length: 5 }, () => Math.floor(Math.random() * 49) + 1);
    const lucky = Array.from({ length: 5 }, () => Math.floor(Math.random() * 49) + 1);
    const matches = nums.filter(n => lucky.includes(n)).length;

    const prizes = { 0: 0, 1: 0, 2: ticket, 3: ticket * 5, 4: ticket * 20, 5: ticket * 100 };
    const prize = prizes[matches];
    u.coins -= ticket;
    u.coins += prize;
    setUser(senderId, u);

    await sock.sendMessage(chatId, {
        text:
            header('🎟️ LOTERIE VALENHART') +
            `╭────〔 ✦ TIRAGE 〕────\n` +
            `│ 👤 @${senderId.split('@')[0]}\n` +
            `│\n` +
            `│ 🎯 *Vos numéros :* ${nums.join(' - ')}\n` +
            `│ 🍀 *Tirage :* ${lucky.join(' - ')}\n` +
            `│ ✅ *Correspondances :* ${matches}/5\n` +
            `│\n` +
            `│ ${prize > 0 ? `🏆 *GAGNÉ ! +${fmt(prize)} ${COIN}*` : `💔 *Rien cette fois...*`}\n` +
            `│ 👝 *Solde :* ${fmt(u.coins)} ${COIN}\n` +
            `╰──────────────────────────\n\n` +
            `> _"${prize > 0 ? 'La Maison honore ses gagnants, Monsieur.' : 'Retentez votre chance, la Maison reste généreuse.'}"_ 🎩`,
        mentions: [senderId]
    }, { quoted: msg });
}

// ─── .blackjack <montant> ─────────────────────────────────────────────────────
function drawCard() {
    const values = ['2','3','4','5','6','7','8','9','10','V','D','R','As'];
    const suits = ['♠️','♥️','♦️','♣️'];
    return { val: values[Math.floor(Math.random() * values.length)], suit: suits[Math.floor(Math.random() * suits.length)] };
}
function cardValue(card) {
    if (['V','D','R'].includes(card.val)) return 10;
    if (card.val === 'As') return 11;
    return parseInt(card.val);
}
function handTotal(cards) {
    let total = cards.reduce((s, c) => s + cardValue(c), 0);
    let aces = cards.filter(c => c.val === 'As').length;
    while (total > 21 && aces > 0) { total -= 10; aces--; }
    return total;
}
function showHand(cards) { return cards.map(c => `${c.val}${c.suit}`).join(' '); }

async function blackjackCommand(sock, chatId, msg, senderId, args) {
    const u = getUser(senderId);
    const input = args[0];
    let mise = input === 'tout' || input === 'all' ? u.coins : parseInt(input);
    if (!mise || isNaN(mise) || mise <= 0) return await sock.sendMessage(chatId, { text: `🎩 Usage: *.blackjack <montant|tout>*` }, { quoted: msg });
    if (mise > u.coins) return await sock.sendMessage(chatId, { text: `🎩 Fonds insuffisants. Vous avez *${fmt(u.coins)} ${COIN}*.` }, { quoted: msg });

    const player = [drawCard(), drawCard()];
    const dealer = [drawCard(), drawCard()];
    const pTotal = handTotal(player);
    const dTotal = handTotal(dealer);

    let result, gain;
    if (pTotal === 21) {
        gain = Math.floor(mise * 1.5);
        result = `🎉 *BLACKJACK !* +${fmt(gain)} ${COIN}`;
        u.coins += gain;
    } else if (dTotal === 21) {
        gain = mise;
        result = `😱 *Dealer BLACKJACK !* -${fmt(gain)} ${COIN}`;
        u.coins -= gain;
    } else if (pTotal > 21) {
        result = `💥 *Bust ! Dépassé.* -${fmt(mise)} ${COIN}`;
        u.coins -= mise;
    } else if (dTotal > 21 || pTotal > dTotal) {
        result = `🏆 *Victoire !* +${fmt(mise)} ${COIN}`;
        u.coins += mise;
    } else if (pTotal === dTotal) {
        result = `🤝 *Égalité !* Mise remboursée.`;
    } else {
        result = `💔 *Perdu !* -${fmt(mise)} ${COIN}`;
        u.coins -= mise;
    }
    setUser(senderId, u);

    await sock.sendMessage(chatId, {
        text:
            header('🃏 BLACKJACK VALENHART') +
            `╭────〔 ✦ PARTIE 〕────\n` +
            `│ 👤 @${senderId.split('@')[0]}\n│\n` +
            `│ 🧑 *Votre main :* ${showHand(player)} *(${pTotal})*\n` +
            `│ 🎩 *Dealer :* ${showHand(dealer)} *(${dTotal})*\n│\n` +
            `│ 💸 *Mise :* ${fmt(mise)} ${COIN}\n` +
            `│ ${result}\n│\n` +
            `│ 👝 *Solde :* ${fmt(u.coins)} ${COIN}\n` +
            `╰──────────────────────────\n\n` +
            `> _"Alfred supervise la table avec élégance."_ 🎩`,
        mentions: [senderId]
    }, { quoted: msg });
}

// ─── .poker <montant> ─────────────────────────────────────────────────────────
async function pokerCommand(sock, chatId, msg, senderId, args) {
    const u = getUser(senderId);
    const input = args[0];
    let mise = (input === 'tout' || input === 'all') ? u.coins : parseInt(input);
    if (!mise || isNaN(mise) || mise <= 0) return await sock.sendMessage(chatId, { text: `🎩 Usage: *.poker <montant|tout>*` }, { quoted: msg });
    if (mise > u.coins) return await sock.sendMessage(chatId, { text: `🎩 Fonds insuffisants. Vous avez *${fmt(u.coins)} ${COIN}*.` }, { quoted: msg });

    const hand = Array.from({ length: 5 }, drawCard);
    const vals = hand.map(c => cardValue(c));
    const suits = hand.map(c => c.suit);
    const valCounts = vals.reduce((a, v) => { a[v] = (a[v]||0)+1; return a; }, {});
    const counts = Object.values(valCounts).sort((a,b)=>b-a);
    const isFlush = new Set(suits).size === 1;
    // Fix: tri sur les valeurs numériques uniques, suite = 5 valeurs distinctes consécutives
    const uniqueVals = [...new Set(vals)].sort((a,b)=>a-b);
    const isStraight = uniqueVals.length === 5 && uniqueVals[4] - uniqueVals[0] === 4;

    let rank, multi;
    if (isFlush && isStraight)                        { rank = '🌟 Quinte Flush';    multi = 20;  }
    else if (counts[0] === 4)                          { rank = '4️⃣ Carré';           multi = 10;  }
    else if (counts[0] === 3 && counts[1] === 2)       { rank = '🏠 Full House';      multi = 6;   }
    else if (isFlush)                                  { rank = '♠️ Couleur';          multi = 4;   }
    else if (isStraight)                               { rank = '↗️ Suite';            multi = 3;   }
    else if (counts[0] === 3)                          { rank = '3️⃣ Brelan';           multi = 2;   }
    else if (counts[0] === 2 && counts[1] === 2)       { rank = '2️⃣2️⃣ Double Paire'; multi = 1.5; }
    else if (counts[0] === 2)                          { rank = '2️⃣ Paire';            multi = 1.2; }
    else                                               { rank = '❌ Haute Carte';      multi = 0;   }

    const gain = multi > 0 ? Math.floor(mise * multi) - mise : -mise;
    u.coins += gain;
    if (gain > 0) { u.totalGained = (u.totalGained||0) + gain; }
    else          { u.totalLost   = (u.totalLost  ||0) + Math.abs(gain); }
    u.gamesPlayed = (u.gamesPlayed||0) + 1;
    setUser(senderId, u);

    const tableau = [
        '🌟 Quinte Flush ×20 | 4️⃣ Carré ×10',
        '🏠 Full House ×6 | ♠️ Couleur ×4',
        '↗️ Suite ×3 | 3️⃣ Brelan ×2',
        '2️⃣2️⃣ Double Paire ×1.5 | 2️⃣ Paire ×1.2',
    ].join('\n│ ');

    await sock.sendMessage(chatId, {
        text:
            header('🃏 VIDEO POKER') +
            `╭────〔 ✦ MAIN 〕────\n` +
            `│ 👤 @${senderId.split('@')[0]}\n│\n` +
            `│ 🃏 *Cartes :* ${showHand(hand)}\n` +
            `│ 🏆 *Combinaison :* ${rank}\n│\n` +
            `│ 💸 *Mise :* ${fmt(mise)} ${COIN}\n` +
            `│ ${gain >= 0 ? `✅ *+${fmt(gain)} ${COIN}* (×${multi})` : `💔 *-${fmt(Math.abs(gain))} ${COIN}*`}\n│\n` +
            `│ 👝 *Solde :* ${fmt(u.coins)} ${COIN}\n` +
            `╰──────────────────────────\n\n` +
            `╭────〔 📋 Tableau des gains 〕────\n│ ${tableau}\n╰──────────────────────────\n\n` +
            `> _"${gain > mise*3 ? 'Une main digne des plus grands, Monsieur !' : gain > 0 ? 'La Maison honore cette combinaison.' : 'Mauvaise pioche ce soir, Monsieur.'}"_ 🎩`,
        mentions: [senderId]
    }, { quoted: msg });
}

// ─── .bandit <montant> (machine à sous) ──────────────────────────────────────
const SLOT_SYMBOLS = ['🍒','🍋','🔔','⭐','💎','7️⃣','🍀','🎰'];
async function banditCommand(sock, chatId, msg, senderId, args) {
    const u = getUser(senderId);
    const input = args[0];
    let mise = input === 'tout' || input === 'all' ? u.coins : parseInt(input);
    if (!mise || isNaN(mise) || mise <= 0) return await sock.sendMessage(chatId, { text: `🎩 Usage: *.bandit <montant|tout>*` }, { quoted: msg });
    if (mise > u.coins) return await sock.sendMessage(chatId, { text: `🎩 Fonds insuffisants. Vous avez *${fmt(u.coins)} ${COIN}*.` }, { quoted: msg });

    const reels = Array.from({ length: 3 }, () => SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]);
    const [a, b, c] = reels;
    let multi = 0, msg2 = '💔 *Rien...*';

    if (a === b && b === c) {
        multi = a === '💎' ? 15 : a === '7️⃣' ? 10 : a === '⭐' ? 7 : 4;
        msg2 = `🎉 *JACKPOT ! ×${multi}*`;
    } else if (a === b || b === c || a === c) {
        multi = 1.5;
        msg2 = `✅ *Paire ! ×${multi}*`;
    }

    const gain = multi > 0 ? Math.floor(mise * multi) - mise : -mise;
    u.coins += gain;
    setUser(senderId, u);

    await sock.sendMessage(chatId, {
        text:
            header('🎰 MACHINE À SOUS') +
            `╭────〔 ✦ RÉSULTAT 〕────\n` +
            `│ 👤 @${senderId.split('@')[0]}\n│\n` +
            `│ ┌─────────────────┐\n` +
            `│ │  ${a}  ${b}  ${c}  │\n` +
            `│ └─────────────────┘\n│\n` +
            `│ 💸 *Mise :* ${fmt(mise)} ${COIN}\n` +
            `│ ${msg2} ${gain >= 0 ? `+${fmt(gain)}` : fmt(gain)} ${COIN}\n│\n` +
            `│ 👝 *Solde :* ${fmt(u.coins)} ${COIN}\n` +
            `╰──────────────────────────\n\n` +
            `> _"${multi >= 7 ? 'JACKPOT ! Alfred applaudit !' : multi > 0 ? 'Bonne combinaison, Monsieur.' : 'La machine garde ses secrets.'}"_ 🎩`,
        mentions: [senderId]
    }, { quoted: msg });
}

// ─── .investir <montant> ──────────────────────────────────────────────────────
const INVEST_EVENTS = [
    { name: 'Commerce de soie', range: [-0.3, 0.8] },
    { name: 'Spéculation sur l\'or', range: [-0.5, 1.5] },
    { name: 'Armurerie VALENHART', range: [-0.2, 0.6] },
    { name: 'Navigation marchande', range: [-0.4, 1.2] },
    { name: 'Vins du manoir', range: [-0.1, 0.4] },
    { name: 'Mines de diamants', range: [-0.6, 2.0] },
];
async function investirCommand(sock, chatId, msg, senderId, args) {
    const COOLDOWN = 12 * 60 * 60 * 1000;
    const u = getUser(senderId);
    if (!u.lastInvest) u.lastInvest = 0;
    const diff = elapsed(u.lastInvest);
    if (diff < COOLDOWN) return await sock.sendMessage(chatId, { text: `🎩 *Investissement*\n\n${cooldownMsg(COOLDOWN - diff)}\n\n> Les marchés ont besoin de temps.` }, { quoted: msg });

    const montant = parseInt(args[0]);
    if (!montant || isNaN(montant) || montant <= 0) return await sock.sendMessage(chatId, { text: `🎩 Usage: *.investir <montant>*` }, { quoted: msg });
    if (montant > u.bank) return await sock.sendMessage(chatId, { text: `🎩 Investissez depuis la *banque*. Vous avez *${fmt(u.bank)} ${COIN}* en banque.` }, { quoted: msg });

    const event = INVEST_EVENTS[Math.floor(Math.random() * INVEST_EVENTS.length)];
    const [min, max] = event.range;
    const rate = min + Math.random() * (max - min);
    const profit = Math.round(montant * rate);
    u.bank += profit;
    u.lastInvest = now();
    setUser(senderId, u);

    const pct = (rate * 100).toFixed(1);
    await sock.sendMessage(chatId, {
        text:
            header('📈 INVESTISSEMENT') +
            `╭────〔 ✦ MARCHÉ 〕────\n` +
            `│ 👤 @${senderId.split('@')[0]}\n│\n` +
            `│ 🏢 *Secteur :* ${event.name}\n` +
            `│ 💰 *Investi :* ${fmt(montant)} ${COIN}\n` +
            `│ 📊 *Rendement :* ${rate >= 0 ? '+' : ''}${pct}%\n` +
            `│ ${profit >= 0 ? `📈 *Profit :* +${fmt(profit)} ${COIN}` : `📉 *Perte :* ${fmt(profit)} ${COIN}`}\n│\n` +
            `│ 🏦 *Banque :* ${fmt(u.bank)} ${COIN}\n` +
            `╰──────────────────────────\n\n` +
            `> _"${profit >= 0 ? 'Alfred félicite votre flair financier.' : 'Les marchés sont imprévisibles, Monsieur.'}"_ 🎩`,
        mentions: [senderId]
    }, { quoted: msg });
}

// ─── .quizeco (quiz gagner des pièces) ───────────────────────────────────────
const QUIZ_QUESTIONS = [
    { q: 'Combien de cartes dans un jeu standard ?', opts: ['A) 52','B) 48','C) 54','D) 36'], ans: 'A', gain: 150 },
    { q: 'Quelle couleur gagne à la roulette avec 0 ?', opts: ['A) Rouge','B) Noir','C) Ni l\'un ni l\'autre','D) Les deux'], ans: 'C', gain: 200 },
    { q: 'Au blackjack, quelle est la valeur de l\'As ?', opts: ['A) 1 seulement','B) 11 seulement','C) 1 ou 11','D) 10'], ans: 'C', gain: 150 },
    { q: 'Combien de numéros sur une roulette européenne ?', opts: ['A) 36','B) 37','C) 38','D) 40'], ans: 'B', gain: 250 },
    { q: 'Quelle main est la meilleure au poker ?', opts: ['A) Full House','B) Carré','C) Quinte Flush Royale','D) Couleur'], ans: 'C', gain: 200 },
    { q: 'Que vaut un "Roi" au blackjack ?', opts: ['A) 13','B) 11','C) 10','D) 12'], ans: 'C', gain: 100 },
    { q: 'Au poker, combien de cartes reçoit chaque joueur ?', opts: ['A) 3','B) 5','C) 2','D) 7'], ans: 'C', gain: 150 },
    { q: 'Que signifie "all-in" au poker ?', opts: ['A) Abandonner','B) Miser toutes ses jetons','C) Demander une carte','D) Doubler la mise'], ans: 'B', gain: 100 },
];
const activeQuiz = {};

async function quizecoCommand(sock, chatId, msg, senderId) {
    if (activeQuiz[chatId]) return await sock.sendMessage(chatId, { text: `🎩 Un quiz est déjà en cours ! Répondez avec *A, B, C ou D*.` }, { quoted: msg });
    const q = QUIZ_QUESTIONS[Math.floor(Math.random() * QUIZ_QUESTIONS.length)];
    activeQuiz[chatId] = { ...q, senderId, expires: now() + 30000 };
    setTimeout(() => { if (activeQuiz[chatId]) { delete activeQuiz[chatId]; sock.sendMessage(chatId, { text: `⏰ Temps écoulé ! La réponse était *${q.ans}*.` }); } }, 30000);

    await sock.sendMessage(chatId, {
        text:
            header('🧠 QUIZ ÉCONOMIE') +
            `╭────〔 ✦ QUESTION 〕────\n` +
            `│ 👤 @${senderId.split('@')[0]}\n│\n` +
            `│ ❓ *${q.q}*\n│\n` +
            `│ ${q.opts.join('\n│ ')}\n│\n` +
            `│ 💰 *Gain si correct :* ${fmt(q.gain)} ${COIN}\n` +
            `│ ⏳ *30 secondes !*\n` +
            `╰──────────────────────────`,
        mentions: [senderId]
    }, { quoted: msg });
}

async function handleQuizAnswer(sock, chatId, msg, senderId, answer) {
    const quiz = activeQuiz[chatId];
    if (!quiz) return false;
    if (quiz.expires < now()) { delete activeQuiz[chatId]; return false; }

    delete activeQuiz[chatId];
    const correct = answer.toUpperCase() === quiz.ans;
    const u = getUser(senderId);
    if (correct) { u.coins += quiz.gain; setUser(senderId, u); }

    await sock.sendMessage(chatId, {
        text:
            `🧠 *Quiz — Résultat*\n\n` +
            `│ 👤 @${senderId.split('@')[0]}\n` +
            `│ Réponse : *${answer.toUpperCase()}*\n` +
            `│ ${correct ? `✅ *CORRECT ! +${fmt(quiz.gain)} ${COIN}*` : `❌ *Faux ! Réponse : ${quiz.ans}*`}\n` +
            `${correct ? `│ 👝 *Solde :* ${fmt(u.coins)} ${COIN}` : ''}`,
        mentions: [senderId]
    }, { quoted: msg });
    return true;
}

// ─── .grattage <montant> (gratte-ciel) ───────────────────────────────────────
async function grattageCommand(sock, chatId, msg, senderId, args) {
    const u = getUser(senderId);
    const ticket = parseInt(args[0]) || 50;
    if (ticket > u.coins) return await sock.sendMessage(chatId, { text: `🎩 Ticket à *${fmt(ticket)} ${COIN}*. Solde insuffisant.` }, { quoted: msg });

    const symbols = ['⭐','⭐','💰','💰','💎','💎','🎁','🎁','💣','💣','🏆'];
    const grid = Array.from({ length: 6 }, () => symbols[Math.floor(Math.random() * symbols.length)]);
    const counts = grid.reduce((a,v) => { a[v]=(a[v]||0)+1; return a; }, {});
    const best = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];
    const prizes = { '💣': -0.5, '⭐': 0, '💰': 1, '💎': 2, '🎁': 1.5, '🏆': 5 };
    const multi = prizes[best[0]] * (best[1] >= 3 ? best[1] - 1 : 0);
    const gain = Math.round(ticket * multi);
    u.coins = u.coins - ticket + gain;
    setUser(senderId, u);

    await sock.sendMessage(chatId, {
        text:
            header('🎟️ GRATTAGE') +
            `╭────〔 ✦ TICKET 〕────\n` +
            `│ 👤 @${senderId.split('@')[0]}\n│\n` +
            `│ ${grid.slice(0,3).join(' ')}  ${grid.slice(3).join(' ')}\n│\n` +
            `│ 🎫 *Ticket :* -${fmt(ticket)} ${COIN}\n` +
            `│ ${gain > 0 ? `🏆 *Gain : +${fmt(gain)} ${COIN}*` : gain < 0 ? `💔 *Perte : ${fmt(gain)} ${COIN}*` : `😐 *Rien...*`}\n│\n` +
            `│ 👝 *Solde :* ${fmt(u.coins)} ${COIN}\n` +
            `╰──────────────────────────\n\n` +
            `> _"Chaque ticket est une promesse de la Maison."_ 🎩`,
        mentions: [senderId]
    }, { quoted: msg });
}

// ─── .coffre (coffre fort journalier bonus) ───────────────────────────────────
async function coffreCommand(sock, chatId, msg, senderId) {
    const COOLDOWN = 8 * 60 * 60 * 1000;
    const u = getUser(senderId);
    if (!u.lastCoffre) u.lastCoffre = 0;
    const diff = elapsed(u.lastCoffre);
    if (diff < COOLDOWN) return await sock.sendMessage(chatId, { text: `🎩 *Coffre*\n\n${cooldownMsg(COOLDOWN - diff)}\n\n> Le coffre se recharge, Monsieur.` }, { quoted: msg });

    const rolls = [50, 100, 150, 200, 300, 500, 750, 1000, 0, 0]; // 20% chance vide
    const prize = rolls[Math.floor(Math.random() * rolls.length)];
    u.coins += prize;
    u.lastCoffre = now();
    setUser(senderId, u);

    await sock.sendMessage(chatId, {
        text:
            header('🔒 COFFRE SECRET') +
            `╭────〔 ✦ OUVERTURE 〕────\n` +
            `│ 👤 @${senderId.split('@')[0]}\n│\n` +
            `│ 🔑 *Alfred ouvre le coffre...*\n│\n` +
            `│ ${prize > 0 ? `💰 *Trouvé : +${fmt(prize)} ${COIN}*` : `🕸️ *Coffre vide...*`}\n│\n` +
            `│ 👝 *Solde :* ${fmt(u.coins)} ${COIN}\n` +
            `╰──────────────────────────\n\n` +
            `> _"${prize >= 500 ? 'Un beau trésor, Monsieur !' : prize > 0 ? 'Quelques pièces pour la route.' : 'Malheureusement vide ce soir.'}"_ 🎩`,
        mentions: [senderId]
    }, { quoted: msg });
}

// ─── .jackpot (big lottery communautaire) ────────────────────────────────────
const jackpotPool = {};
async function jackpotCommand(sock, chatId, msg, senderId, args) {
    const u = getUser(senderId);
    const mise = parseInt(args[0]) || 100;
    if (mise > u.coins) return await sock.sendMessage(chatId, { text: `🎩 Mise insuffisante. Vous avez *${fmt(u.coins)} ${COIN}*.` }, { quoted: msg });

    if (!jackpotPool[chatId]) jackpotPool[chatId] = { pool: 0, players: [] };
    const jp = jackpotPool[chatId];

    if (jp.players.find(p => p.id === senderId)) return await sock.sendMessage(chatId, { text: `🎩 Vous participez déjà au jackpot en cours !` }, { quoted: msg });

    u.coins -= mise;
    jp.pool += mise;
    jp.players.push({ id: senderId, mise });
    setUser(senderId, u);

    if (jp.players.length >= 3) {
        const winner = jp.players[Math.floor(Math.random() * jp.players.length)];
        const winnerUser = getUser(winner.id);
        winnerUser.coins += jp.pool;
        setUser(winner.id, winnerUser);
        const mentions = jp.players.map(p => p.id);
        const poolAmt = jp.pool;
        jackpotPool[chatId] = null;

        await sock.sendMessage(chatId, {
            text:
                header('💥 JACKPOT COMMUNAUTAIRE') +
                `╭────〔 ✦ RÉSULTAT 〕────\n│\n` +
                `│ 🎰 *${jp.players.length} participants*\n` +
                `│ 💰 *Cagnotte totale :* ${fmt(poolAmt)} ${COIN}\n│\n` +
                `│ 🏆 *GAGNANT :* @${winner.id.split('@')[0]}\n│\n` +
                `│ 💎 *Gain : +${fmt(poolAmt)} ${COIN}*\n` +
                `╰──────────────────────────\n\n` +
                `> _"La Fortune a parlé. Alfred s'incline."_ 🎩`,
            mentions
        }, { quoted: msg });
    } else {
        await sock.sendMessage(chatId, {
            text:
                `🎩 *Jackpot communautaire*\n\n` +
                `│ 👤 @${senderId.split('@')[0]} a rejoint !\n` +
                `│ 💰 *Mise :* ${fmt(mise)} ${COIN}\n` +
                `│ 🏦 *Cagnotte :* ${fmt(jp.pool)} ${COIN}\n` +
                `│ 👥 *Joueurs :* ${jp.players.length}/3\n\n` +
                `> Encore *${3 - jp.players.length}* joueur(s) pour déclencher le tirage !`,
            mentions: [senderId]
        }, { quoted: msg });
    }
}

// ─── .statistiques (stats perso) ─────────────────────────────────────────────
async function statistiquesCommand(sock, chatId, msg, senderId) {
    const u = getUser(senderId);
    const total = u.coins + u.bank;
    const nextDaily = u.lastDaily ? Math.max(0, 20*60*60*1000 - elapsed(u.lastDaily)) : 0;
    const nextWork = u.lastWork ? Math.max(0, 2*60*60*1000 - elapsed(u.lastWork)) : 0;

    function fmtTime(ms) {
        if (ms === 0) return '✅ Disponible';
        const h = Math.floor(ms/3600000), m = Math.floor((ms%3600000)/60000);
        return h > 0 ? `${h}h ${m}min` : `${m}min`;
    }

    await sock.sendMessage(chatId, {
        text:
            header('📊 STATISTIQUES') +
            `╭────〔 ✦ PROFIL 〕────\n` +
            `│ 👤 @${senderId.split('@')[0]}\n│\n` +
            `│ 👝 *Portefeuille :* ${fmt(u.coins)} ${COIN}\n` +
            `│ 🏦 *Banque :* ${fmt(u.bank)} ${COIN}\n` +
            `│ 💎 *Fortune :* ${fmt(total)} ${COIN}\n` +
            `│ 🔥 *Streak daily :* ${u.streak || 0} jour(s)\n│\n` +
            `│ ⏳ *Cooldowns :*\n` +
            `│   🎁 Daily : ${fmtTime(nextDaily)}\n` +
            `│   💼 Travail : ${fmtTime(nextWork)}\n` +
            `╰──────────────────────────\n\n` +
            `> _"Connaître sa fortune, c'est déjà la maîtriser."_ 🎩`,
        mentions: [senderId]
    }, { quoted: msg });
}

module.exports = {
    soldeCommand, dailyCommand, rouletteCommand, travailCommand,
    crimeCommand, volCommand, pariCommand, minesCommand,
    duelCommand, banqueCommand, transfertCommand, richCommand, lotoCommand,
    blackjackCommand, pokerCommand, banditCommand, investirCommand,
    quizecoCommand, handleQuizAnswer, grattageCommand, coffreCommand,
    jackpotCommand, statistiquesCommand,
    getUser, setUser, fmt
};
