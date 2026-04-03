/**
 * ╔═══════════════════════════════════════════════════════════╗
 * ║  💍 SYSTÈME FAMILLE — MAISON VALENHART                   ║
 * ╠═══════════════════════════════════════════════════════════╣
 * ║  .mariage @personne   → demander en mariage              ║
 * ║  .accepter            → accepter la demande              ║
 * ║  .refuser             → refuser la demande               ║
 * ║  .divorce             → se séparer                       ║
 * ║  .adopter @personne   → adopter comme enfant             ║
 * ║  .enfant @personne    → déclarer comme fils/fille        ║
 * ║  .frere @personne     → déclarer comme frère             ║
 * ║  .soeur @personne     → déclarer comme sœur              ║
 * ║  .famille             → voir sa propre famille           ║
 * ║  .famille @personne   → voir la famille de quelqu'un     ║
 * ║  .arbre               → arbre familial complet           ║
 * ║  .quitter             → quitter la relation fraternelle  ║
 * ╚═══════════════════════════════════════════════════════════╝
 *
 * Structure famille.json :
 * {
 *   "jid": {
 *     "conjoint":  "jid" | null,
 *     "enfants":   ["jid", ...],
 *     "parents":   ["jid", ...],   (max 2)
 *     "freres":    ["jid", ...],
 *     "soeurs":    ["jid", ...],
 *     "demande":   { type, from, to, ts } | null
 *   }
 * }
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'famille.json');

// ─── Persistance ──────────────────────────────────────────────────────────────
function load() {
    try { return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8')); } catch { return {}; }
}
function save(data) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

function norm(jid) {
    if (!jid || typeof jid !== 'string') return jid;
    return jid.includes(':') ? jid.split(':')[0] + '@s.whatsapp.net' : jid;
}
function tag(jid)  { return `@${norm(jid).split('@')[0]}`; }
function num(jid)  { return norm(jid).split('@')[0]; }

// Obtenir ou créer le profil d'un joueur
function profil(data, jid) {
    const j = norm(jid);
    if (!data[j]) data[j] = { conjoint: null, enfants: [], parents: [], freres: [], soeurs: [], demande: null };
    return data[j];
}

// Vérifier si une demande en attente est expirée (10 min)
function demandeValide(d) {
    return d && (Date.now() - d.ts) < 10 * 60 * 1000;
}

// ─── Helpers affichage ────────────────────────────────────────────────────────
const CADRE_TOP = '┏━━━━━━━━━━━━━━━━━━━━━━━┓';
const CADRE_BOT = '┗━━━━━━━━━━━━━━━━━━━━━━━┛';

function ligne(emoji, label, jids) {
    if (!jids || jids.length === 0) return null;
    return `│ ${emoji} *${label} :*\n${jids.map(j => `│   • ${tag(j)}`).join('\n')}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MARIAGE
// ═══════════════════════════════════════════════════════════════════════════════

async function mariageCommand(sock, chatId, message, senderId, mentionedJid) {
    const sender = norm(senderId);
    const cible  = mentionedJid?.[0] ? norm(mentionedJid[0]) : null;

    if (!cible || cible === sender)
        return sock.sendMessage(chatId, {
            text: '💍 Mentionnez la personne à qui vous souhaitez demander en mariage.\n*Usage :* .mariage @personne'
        }, { quoted: message });

    const data   = load();
    const pSender = profil(data, sender);
    const pCible  = profil(data, cible);

    if (pSender.conjoint)
        return sock.sendMessage(chatId, {
            text: `💍 Vous êtes déjà marié(e) avec ${tag(pSender.conjoint)}, Monsieur.\nFaites d'abord *.divorce* avant de vous remarier.`
        }, { quoted: message });

    if (pCible.conjoint)
        return sock.sendMessage(chatId, {
            text: `💍 ${tag(cible)} est déjà marié(e). Cette demande est impossible, Monsieur.`
        }, { quoted: message });

    // Vérifier liens de parenté existants
    if (sontParents(data, sender, cible))
        return sock.sendMessage(chatId, {
            text: '❌ Vous ne pouvez pas épouser un membre de votre famille directe.'
        }, { quoted: message });

    // Enregistrer la demande
    pCible.demande = { type: 'mariage', from: sender, ts: Date.now() };
    save(data);

    await sock.sendMessage(chatId, {
        text:
`${CADRE_TOP}
┃  💍  *DEMANDE EN MARIAGE*
${CADRE_BOT}

💐 *${tag(sender)}* demande en mariage *${tag(cible)}* !

${tag(cible)}, acceptez-vous ?
✅ *.accepter* — accepter
❌ *.refuser* — refuser

⏳ _Demande valable 10 minutes._

> _"L'amour est la plus noble des ambitions."_
> — *Alfred* 🎩`,
        mentions: [sender, cible]
    }, { quoted: message });
}

// ─── ACCEPTER ─────────────────────────────────────────────────────────────────
async function accepterCommand(sock, chatId, message, senderId) {
    const sender = norm(senderId);
    const data   = load();
    const p      = profil(data, sender);

    if (!p.demande || !demandeValide(p.demande))
        return sock.sendMessage(chatId, {
            text: '❌ Vous n\'avez aucune demande en attente (ou elle a expiré).'
        }, { quoted: message });

    const { type, from } = p.demande;
    const pFrom = profil(data, from);

    if (type === 'mariage') {
        if (pFrom.conjoint) {
            p.demande = null; save(data);
            return sock.sendMessage(chatId, { text: '❌ Cette personne est déjà en couple.' }, { quoted: message });
        }

        pFrom.conjoint = sender;
        p.conjoint     = from;
        p.demande      = null;

        // Les enfants de chacun deviennent enfants des deux
        for (const e of pFrom.enfants) {
            const pe = profil(data, e);
            if (!pe.parents.includes(sender)) pe.parents.push(sender);
        }
        for (const e of p.enfants) {
            const pe = profil(data, e);
            if (!pe.parents.includes(from)) pe.parents.push(from);
        }
        save(data);

        await sock.sendMessage(chatId, {
            text:
`${CADRE_TOP}
┃  💒  *MARIAGE — MAISON VALENHART*
${CADRE_BOT}

💍 *${tag(from)}* et *${tag(sender)}* sont maintenant mariés !

🎊 _Toute la Maison VALENHART les félicite !_

> _"Que votre union soit éternelle."_ — *Alfred* 🎩`,
            mentions: [from, sender]
        }, { quoted: message });

    } else if (type === 'adoption') {
        // Accepter une adoption
        if (p.parents.length >= 2) {
            p.demande = null; save(data);
            return sock.sendMessage(chatId, { text: '❌ Vous avez déjà 2 parents enregistrés.' }, { quoted: message });
        }
        if (!pFrom.enfants.includes(sender)) pFrom.enfants.push(sender);
        if (!p.parents.includes(from)) p.parents.push(from);
        // Si le parent a un conjoint, l'ajouter aussi
        if (pFrom.conjoint) {
            const pConjoint = profil(data, pFrom.conjoint);
            if (!pConjoint.enfants.includes(sender)) pConjoint.enfants.push(sender);
            if (!p.parents.includes(pFrom.conjoint)) p.parents.push(pFrom.conjoint);
        }
        p.demande = null;
        save(data);

        await sock.sendMessage(chatId, {
            text:
`${CADRE_TOP}
┃  👶  *ADOPTION ACCEPTÉE*
${CADRE_BOT}

🏡 *${tag(sender)}* a accepté d'être adopté(e) par *${tag(from)}* !

> _"La famille, c'est ceux qui choisissent de rester."_
> — *Alfred* 🎩`,
            mentions: [sender, from]
        }, { quoted: message });

    } else if (type === 'fratrie') {
        const rel = p.demande.rel; // 'frere' ou 'soeur'
        const relFrom = p.demande.relFrom;

        // Ajouter la relation dans les deux sens
        _ajouterFratrie(data, from, sender, rel);
        _ajouterFratrie(data, sender, from, relFrom);
        p.demande = null;
        save(data);

        const emoji = rel === 'frere' ? '👦' : '👧';
        await sock.sendMessage(chatId, {
            text:
`${CADRE_TOP}
┃  ${emoji}  *LIEN FRATERNEL ACCEPTÉ*
${CADRE_BOT}

🤝 *${tag(from)}* et *${tag(sender)}* sont désormais ${rel === 'frere' ? 'frères' : 'frère et sœur / sœurs'} !

> _"Le sang ne fait pas la famille — le cœur si."_
> — *Alfred* 🎩`,
            mentions: [from, sender]
        }, { quoted: message });
    }
}

// ─── REFUSER ──────────────────────────────────────────────────────────────────
async function refuserCommand(sock, chatId, message, senderId) {
    const sender = norm(senderId);
    const data   = load();
    const p      = profil(data, sender);

    if (!p.demande || !demandeValide(p.demande))
        return sock.sendMessage(chatId, {
            text: '❌ Vous n\'avez aucune demande en attente.'
        }, { quoted: message });

    const { type, from } = p.demande;
    p.demande = null;
    save(data);

    const labels = { mariage: 'demande en mariage', adoption: 'demande d\'adoption', fratrie: 'demande de lien fraternel' };

    await sock.sendMessage(chatId, {
        text: `💔 *${tag(sender)}* a refusé la ${labels[type] || 'demande'} de *${tag(from)}*.\n\n> _"La Maison respecte votre décision."_ — *Alfred* 🎩`,
        mentions: [sender, from]
    }, { quoted: message });
}

// ─── DIVORCE ──────────────────────────────────────────────────────────────────
async function divorceCommand(sock, chatId, message, senderId) {
    const sender = norm(senderId);
    const data   = load();
    const p      = profil(data, sender);

    if (!p.conjoint)
        return sock.sendMessage(chatId, {
            text: '💔 Vous n\'êtes pas marié(e), Monsieur.'
        }, { quoted: message });

    const ex = p.conjoint;
    const pEx = profil(data, ex);

    p.conjoint  = null;
    pEx.conjoint = null;
    save(data);

    await sock.sendMessage(chatId, {
        text:
`${CADRE_TOP}
┃  💔  *DIVORCE — MAISON VALENHART*
${CADRE_BOT}

📜 *${tag(sender)}* et *${tag(ex)}* ont officiellement divorcé.

_Les enfants restent dans les deux familles._

> _"Alfred signe les papiers avec une discrétion remarquable."_ 🎩`,
        mentions: [sender, ex]
    }, { quoted: message });
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADOPTION / ENFANTS
// ═══════════════════════════════════════════════════════════════════════════════

async function adopterCommand(sock, chatId, message, senderId, mentionedJid) {
    const sender = norm(senderId);
    const cible  = mentionedJid?.[0] ? norm(mentionedJid[0]) : null;

    if (!cible || cible === sender)
        return sock.sendMessage(chatId, {
            text: '👶 Mentionnez la personne à adopter.\n*Usage :* .adopter @personne'
        }, { quoted: message });

    const data   = load();
    const pSender = profil(data, sender);
    const pCible  = profil(data, cible);

    if (pCible.parents.length >= 2)
        return sock.sendMessage(chatId, {
            text: `❌ ${tag(cible)} a déjà 2 parents enregistrés.`
        }, { quoted: message });

    if (pSender.enfants.includes(cible))
        return sock.sendMessage(chatId, {
            text: `❌ ${tag(cible)} est déjà votre enfant.`
        }, { quoted: message });

    if (sontParents(data, sender, cible))
        return sock.sendMessage(chatId, {
            text: '❌ Ce lien créerait une boucle familiale impossible.'
        }, { quoted: message });

    // Envoyer demande à la cible
    pCible.demande = { type: 'adoption', from: sender, ts: Date.now() };
    save(data);

    await sock.sendMessage(chatId, {
        text:
`${CADRE_TOP}
┃  👶  *DEMANDE D'ADOPTION*
${CADRE_BOT}

🏡 *${tag(sender)}* souhaite adopter *${tag(cible)}* !

${tag(cible)}, acceptez-vous ?
✅ *.accepter*
❌ *.refuser*

⏳ _Demande valable 10 minutes._

> _"Une famille peut toujours s'agrandir."_ — *Alfred* 🎩`,
        mentions: [sender, cible]
    }, { quoted: message });
}

// ─── DÉCLARER ENFANT ──────────────────────────────────────────────────────────
async function enfantCommand(sock, chatId, message, senderId, mentionedJid) {
    return adopterCommand(sock, chatId, message, senderId, mentionedJid);
}

// ═══════════════════════════════════════════════════════════════════════════════
// FRATRIE
// ═══════════════════════════════════════════════════════════════════════════════

function _ajouterFratrie(data, jid1, jid2, rel) {
    const p = profil(data, jid1);
    const arr = rel === 'frere' ? 'freres' : 'soeurs';
    if (!p[arr].includes(jid2)) p[arr].push(jid2);
}

async function _demanderFratrie(sock, chatId, message, senderId, mentionedJid, relSender, relCible) {
    const sender = norm(senderId);
    const cible  = mentionedJid?.[0] ? norm(mentionedJid[0]) : null;
    const label  = relSender === 'frere' ? 'frère' : 'sœur';

    if (!cible || cible === sender)
        return sock.sendMessage(chatId, {
            text: `👦 Mentionnez la personne.\n*Usage :* .${relSender} @personne`
        }, { quoted: message });

    const data   = load();
    const pCible  = profil(data, cible);

    if (sontDejaSiblings(data, sender, cible))
        return sock.sendMessage(chatId, {
            text: `❌ Vous êtes déjà frère/sœur avec ${tag(cible)}.`
        }, { quoted: message });

    // Envoyer demande
    pCible.demande = { type: 'fratrie', from: sender, rel: relSender, relFrom: relCible, ts: Date.now() };
    save(data);

    const emoji = relSender === 'frere' ? '👦' : '👧';
    await sock.sendMessage(chatId, {
        text:
`${CADRE_TOP}
┃  ${emoji}  *DEMANDE DE LIEN FRATERNEL*
${CADRE_BOT}

🤝 *${tag(sender)}* propose à *${tag(cible)}* de devenir ${label === 'frère' ? 'frères/sœurs' : 'sœurs/frère'} !

${tag(cible)}, acceptez-vous ?
✅ *.accepter*
❌ *.refuser*

⏳ _Demande valable 10 minutes._

> _"Les liens du cœur sont les plus solides."_ — *Alfred* 🎩`,
        mentions: [sender, cible]
    }, { quoted: message });
}

async function frereCommand(sock, chatId, message, senderId, mentionedJid) {
    return _demanderFratrie(sock, chatId, message, senderId, mentionedJid, 'frere', 'frere');
}

async function soeurCommand(sock, chatId, message, senderId, mentionedJid) {
    return _demanderFratrie(sock, chatId, message, senderId, mentionedJid, 'soeur', 'soeur');
}

// ─── QUITTER FRATRIE ──────────────────────────────────────────────────────────
async function quitterCommand(sock, chatId, message, senderId, mentionedJid) {
    const sender = norm(senderId);
    const cible  = mentionedJid?.[0] ? norm(mentionedJid[0]) : null;

    if (!cible)
        return sock.sendMessage(chatId, {
            text: '❌ Mentionnez la personne avec qui couper le lien fraternel.\n*Usage :* .quitter @personne'
        }, { quoted: message });

    const data    = load();
    const pSender = profil(data, sender);
    const pCible  = profil(data, norm(cible));

    // Retirer dans les deux sens
    pSender.freres = pSender.freres.filter(j => j !== norm(cible));
    pSender.soeurs = pSender.soeurs.filter(j => j !== norm(cible));
    pCible.freres  = pCible.freres.filter(j => j !== sender);
    pCible.soeurs  = pCible.soeurs.filter(j => j !== sender);
    save(data);

    await sock.sendMessage(chatId, {
        text: `🚶 *${tag(sender)}* a coupé le lien fraternel avec *${tag(cible)}*.\n\n> _"Alfred retire les noms du registre."_ 🎩`,
        mentions: [sender, norm(cible)]
    }, { quoted: message });
}

// ═══════════════════════════════════════════════════════════════════════════════
// AFFICHAGE FAMILLE
// ═══════════════════════════════════════════════════════════════════════════════

async function familleCommand(sock, chatId, message, senderId, mentionedJid) {
    const cible  = mentionedJid?.[0] ? norm(mentionedJid[0]) : norm(senderId);
    const data   = load();
    const p      = profil(data, cible);

    const sections = [];

    // Conjoint
    if (p.conjoint) {
        sections.push(`│ 💍 *Conjoint(e) :* ${tag(p.conjoint)}`);
    }

    // Parents
    if (p.parents.length > 0) {
        sections.push(`│ 👨‍👩‍👦 *Parents :*\n${p.parents.map(j => `│   • ${tag(j)}`).join('\n')}`);
    }

    // Enfants
    if (p.enfants.length > 0) {
        sections.push(`│ 👶 *Enfants :*\n${p.enfants.map(j => `│   • ${tag(j)}`).join('\n')}`);
    }

    // Frères
    if (p.freres.length > 0) {
        sections.push(`│ 👦 *Frères :*\n${p.freres.map(j => `│   • ${tag(j)}`).join('\n')}`);
    }

    // Sœurs
    if (p.soeurs.length > 0) {
        sections.push(`│ 👧 *Sœurs :*\n${p.soeurs.map(j => `│   • ${tag(j)}`).join('\n')}`);
    }

    // Beaux-parents (parents du conjoint)
    if (p.conjoint) {
        const pConj = profil(data, p.conjoint);
        if (pConj.parents.length > 0) {
            sections.push(`│ 👴 *Beaux-parents :*\n${pConj.parents.map(j => `│   • ${tag(j)}`).join('\n')}`);
        }
    }

    const allMentions = [
        cible,
        p.conjoint,
        ...p.parents,
        ...p.enfants,
        ...p.freres,
        ...p.soeurs,
    ].filter(Boolean).map(norm);

    if (sections.length === 0) {
        return sock.sendMessage(chatId, {
            text: `👤 *${tag(cible)}* n'a pas encore de famille enregistrée.\n\nCommencez avec *.mariage*, *.adopter*, *.frere* ou *.soeur* !`,
            mentions: [cible]
        }, { quoted: message });
    }

    await sock.sendMessage(chatId, {
        text:
`${CADRE_TOP}
┃  👨‍👩‍👧‍👦  *FAMILLE DE ${tag(cible).toUpperCase()}*
${CADRE_BOT}

╭────〔 ✦ LIENS FAMILIAUX 〕────
${sections.join('\n│\n')}
╰──────────────────────────

> _"La famille est le pilier de la Maison VALENHART."_
> — *Alfred* 🎩`,
        mentions: allMentions
    }, { quoted: message });
}

// ═══════════════════════════════════════════════════════════════════════════════
// ARBRE FAMILIAL
// ═══════════════════════════════════════════════════════════════════════════════

async function arbreCommand(sock, chatId, message, senderId, mentionedJid) {
    const racine = mentionedJid?.[0] ? norm(mentionedJid[0]) : norm(senderId);
    const data   = load();

    // Construire l'arbre à partir du membre + tous les liés
    const visited = new Set();
    const membres = [];

    function explorer(jid, profondeur) {
        const j = norm(jid);
        if (visited.has(j) || profondeur > 3) return;
        visited.add(j);
        const p = profil(data, j);
        membres.push({ jid: j, niveau: profondeur, p });
        if (p.conjoint)      explorer(p.conjoint, profondeur);
        for (const e of p.enfants)  explorer(e, profondeur + 1);
        for (const pa of p.parents) explorer(pa, profondeur - 1);
    }

    explorer(racine, 0);

    if (membres.length <= 1) {
        return sock.sendMessage(chatId, {
            text: `🌳 *${tag(racine)}* n'a pas encore de famille enregistrée.`,
            mentions: [racine]
        }, { quoted: message });
    }

    // Trier par niveau (grands-parents → parents → enfants)
    membres.sort((a, b) => a.niveau - b.niveau);

    // Construire l'affichage visuel
    const niveaux = {};
    for (const m of membres) {
        const n = m.niveau;
        if (!niveaux[n]) niveaux[n] = [];
        let label = tag(m.jid);
        if (m.p.conjoint && visited.has(m.p.conjoint)) label += ` 💍 ${tag(m.p.conjoint)}`;
        if (!niveaux[n].find(l => l.includes(num(m.jid)))) niveaux[n].push(label);
    }

    const arbreLines = [];
    const labelNiveau = { '-2':'👴 Arrière-grands-parents', '-1':'👨‍👩‍👦 Grands-parents', '0':'👤 Vous / Centre', '1':'👶 Enfants', '2':'🌱 Petits-enfants' };

    for (const [niv, membres] of Object.entries(niveaux)) {
        const label = labelNiveau[niv] || `Niveau ${niv}`;
        arbreLines.push(`│ ${label}`);
        for (const m of membres) arbreLines.push(`│   └ ${m}`);
    }

    const allMentions = membres.map(m => m.jid);

    await sock.sendMessage(chatId, {
        text:
`${CADRE_TOP}
┃  🌳  *ARBRE FAMILIAL*
${CADRE_BOT}

╭────〔 ✦ FAMILLE DE ${tag(racine).toUpperCase()} 〕────
${arbreLines.join('\n')}
╰──────────────────────────

> _"Les racines de la Maison VALENHART sont profondes."_
> — *Alfred* 🎩`,
        mentions: allMentions
    }, { quoted: message });
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS LOGIQUE
// ═══════════════════════════════════════════════════════════════════════════════

// Vérifie si deux personnes ont un lien de parenté direct (pour éviter mariages/incestes)
function sontParents(data, jid1, jid2) {
    const p1 = profil(data, jid1);
    const p2 = profil(data, jid2);
    return (
        p1.enfants.includes(jid2) ||
        p1.parents.includes(jid2) ||
        p2.enfants.includes(jid1) ||
        p2.parents.includes(jid1)
    );
}

function sontDejaSiblings(data, jid1, jid2) {
    const p = profil(data, jid1);
    return p.freres.includes(jid2) || p.soeurs.includes(jid2);
}

// ─── Commande .stats famille ──────────────────────────────────────────────────
async function statsCommand(sock, chatId, message) {
    const data   = load();
    const membres = Object.keys(data).length;
    const couples = Object.values(data).filter(p => p.conjoint).length / 2;
    const enfants = Object.values(data).filter(p => p.parents.length > 0).length;

    await sock.sendMessage(chatId, {
        text:
`${CADRE_TOP}
┃  📊  *STATISTIQUES FAMILLES*
${CADRE_BOT}

│ 👥 *Membres enregistrés :* ${membres}
│ 💍 *Couples mariés :* ${Math.floor(couples)}
│ 👶 *Personnes avec parents :* ${enfants}

> _"La Maison VALENHART grandit chaque jour."_
> — *Alfred* 🎩`
    }, { quoted: message });
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════
module.exports = {
    mariageCommand,
    accepterCommand,
    refuserCommand,
    divorceCommand,
    adopterCommand,
    enfantCommand,
    frereCommand,
    soeurCommand,
    quitterCommand,
    familleCommand,
    arbreCommand,
    statsCommand,
};
