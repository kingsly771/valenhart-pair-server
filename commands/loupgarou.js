'use strict';
/**
 * LOUP-GAROU — MAISON VALENHART
 * Règles spéciales :
 *   - Nuit 1 : observation uniquement, aucun meurtre
 *   - Les loups NE se connaissent PAS entre eux
 *   - Un loup peut voter n'importe qui
 *   - Vote par numéro de téléphone
 */

const ROLES = {
    LOUP:       { emoji:'🐺', name:'Loup-Garou',  team:'loup',    desc:"Chaque nuit (dès la nuit 2), votez pour dévorer un joueur. Vous jouez SEUL — les autres loups ne vous sont pas révélés. Restez discret le jour !" },
    VILLAGEOIS: { emoji:'🏘️', name:'Villageois',  team:'village', desc:"Aucun pouvoir spécial. Utilisez la discussion pour débusquer les loups et votez contre eux le jour." },
    VOYANTE:    { emoji:'👁️', name:'Voyante',      team:'village', desc:"Chaque nuit, envoyez 'voir [numéro]' pour révéler secrètement le rôle d'un joueur." },
    SORCIERE:   { emoji:'🧙', name:'Sorcière',     team:'village', desc:"Vous avez 1 potion de vie (sauver) et 1 potion de mort (tuer). Chaque potion n'est utilisable qu'une seule fois." },
    CHASSEUR:   { emoji:'🏹', name:'Chasseur',     team:'village', desc:"Quand vous mourez, vous pouvez immédiatement abattre un autre joueur avec 'chasser [numéro]'." },
};

function nbLoups(n) {
    if (n <= 7)  return 2;
    if (n <= 9)  return 3;
    if (n <= 12) return 4;
    return Math.floor(n / 3);
}
function buildRoles(n) {
    const list = [];
    for (let i = 0; i < nbLoups(n); i++) list.push('LOUP');
    list.push('VOYANTE');
    if (n >= 7) list.push('SORCIERE');
    if (n >= 8) list.push('CHASSEUR');
    while (list.length < n) list.push('VILLAGEOIS');
    return list;
}
function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length-1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
    return a;
}

function norm(jid) {
    if (!jid || typeof jid !== 'string') return jid;
    return jid.includes(':') ? jid.split(':')[0]+'@s.whatsapp.net' : jid;
}
function tag(jid)   { return '@'+norm(jid).split('@')[0]; }
function phone(jid) { return norm(jid).split('@')[0]; }

function findByPhone(g, query) {
    const q = (query||'').trim().replace(/\D/g,'');
    if (!q || q.length < 4) return 'tooshort';
    const matches = alive(g).filter(p => { const ph = phone(p); return ph===q || ph.endsWith(q); });
    if (matches.length === 1) return matches[0];
    if (matches.length === 0) return null;
    return 'ambiguous';
}

const GAMES = new Map();
function createGame(hostJid) {
    return { host:norm(hostJid), players:[norm(hostJid)], roles:{}, phase:'lobby', night:0,
             eliminated:new Set(), nightVotes:{}, dayVotes:{},
             witchLife:true, witchDeath:true, witchSave:false, witchKill:null,
             seerDone:false, hunterDying:null, nightTimer:null, dayTimer:null, hunterTimer:null };
}
function alive(g)          { return g.players.filter(p => !g.eliminated.has(p)); }
function loupsVivants(g)   { return alive(g).filter(p => g.roles[p]==='LOUP'); }
function villageVivants(g) { return alive(g).filter(p => g.roles[p]!=='LOUP'); }
function checkWin(g) {
    const nL=loupsVivants(g).length, nV=villageVivants(g).length;
    if (nL===0)   return {who:'village', msg:'🏘️ *LE VILLAGE GAGNE !*\nTous les loups-garous ont été éliminés !'};
    if (nL>=nV)   return {who:'loup',    msg:'🐺 *LES LOUPS-GAROUS GAGNENT !*\nIls sont en supériorité numérique !'};
    return null;
}
function clearTimers(g) {
    if (g.nightTimer)  { clearTimeout(g.nightTimer);  g.nightTimer  = null; }
    if (g.dayTimer)    { clearTimeout(g.dayTimer);    g.dayTimer    = null; }
    if (g.hunterTimer) { clearTimeout(g.hunterTimer); g.hunterTimer = null; }
}

async function dm(sock, jid, text) { try { await sock.sendMessage(norm(jid),{text}); } catch {} }
async function grp(sock, cid, text, mentions=[]) { await sock.sendMessage(cid,{text,mentions:mentions.map(norm)}); }
async function closeGrp(sock, cid)      { try { await sock.groupSettingUpdate(cid,'announcement');     } catch {} }
async function openGrp(sock, cid)       { try { await sock.groupSettingUpdate(cid,'not_announcement'); } catch {} }
async function promote(sock,cid,jids)   { if(jids.length) try{await sock.groupParticipantsUpdate(cid,jids.map(norm),'promote');}catch{} }
async function demote(sock,cid,jids)    { if(jids.length) try{await sock.groupParticipantsUpdate(cid,jids.map(norm),'demote'); }catch{} }

async function eliminate(sock, cid, jid, reason) {
    const g = GAMES.get(cid); if (!g) return;
    const j = norm(jid); if (g.eliminated.has(j)) return;
    g.eliminated.add(j); await demote(sock,cid,[j]);
    const r = ROLES[g.roles[j]]||ROLES.VILLAGEOIS;
    const why = {devore:'dévoré par les loups 🌙',poison:'empoisonné par la Sorcière ☠️',vote:'éliminé par le village 🗳️',chasseur:'abattu par le Chasseur 🏹'}[reason]||'éliminé';
    await grp(sock,cid,'⚰️ *'+tag(j)+'* a été '+why+'.\n🎭 Son rôle était : *'+r.emoji+' '+r.name+'*',[j]);
}

async function endGame(sock, cid, result) {
    const g = GAMES.get(cid); if (!g) return;
    clearTimers(g); g.phase='ended';
    await openGrp(sock,cid);
    try { await demote(sock,cid,g.players); } catch {}
    const reveal = g.players.map(p => {
        const r=ROLES[g.roles[p]]||ROLES.VILLAGEOIS;
        return '│ '+r.emoji+' *'+r.name+'* — '+tag(p)+(g.eliminated.has(p)?' ☠️':' ✅');
    }).join('\n');
    await grp(sock,cid,
        '┏━━━━━━━━━━━━━━━━━━━━━━━┓\n┃  🎭  *FIN DE PARTIE — LOUP-GAROU*\n┗━━━━━━━━━━━━━━━━━━━━━━━┛\n\n'
        +result.msg+'\n\n╭────〔 ✦ RÔLES RÉVÉLÉS 〕────\n'+reveal+'\n╰──────────────────────────\n\n'
        +'> _"Merci à tous les joueurs de la Maison."_\n> — *Alfred* 🎩',g.players);
    GAMES.delete(cid);
}

async function startNight(sock, cid) {
    const g = GAMES.get(cid); if (!g) return;
    g.phase='night'; g.night++;
    g.nightVotes={}; g.witchSave=false; g.witchKill=null; g.seerDone=false;
    await closeGrp(sock,cid);
    const vivants = alive(g);
    const nuit1Note = g.night===1 ? '\n⚠️ *Nuit 1 — Observation uniquement.* Aucun meurtre cette nuit.\n' : '';
    await grp(sock,cid,
        '┏━━━━━━━━━━━━━━━━━━━━━━━┓\n┃  🌙  *NUIT '+g.night+' — LOUP-GAROU*\n┗━━━━━━━━━━━━━━━━━━━━━━━┛\n'
        +nuit1Note+'\n😴 Le village s\'endort...\nGroupe fermé. Agissez en *message privé* avec le bot.\n\n'
        +'👥 *En vie :* '+vivants.length+'\n'+vivants.map(p=>'│ *'+phone(p)+'* — '+tag(p)).join('\n')+'\n\n'
        +'> _"La nuit cache bien des secrets..."_ — *Alfred* 🎩',vivants);

    const loups = loupsVivants(g);
    for (const loup of loups) {
        const cibles = alive(g).filter(p=>p!==loup).map(p=>'*'+phone(p)+'* — '+tag(p)).join('\n');
        if (g.night===1) {
            await dm(sock,loup,
                '🐺 *NUIT 1 — Loup-Garou*\n\nVous êtes un *Loup-Garou*. 🐺\n'
                +'⚠️ *Cette nuit est une nuit d\'observation.*\nAucune victime ne sera dévorée.\n'
                +'Utilisez ce temps pour repérer vos cibles.\n\n'
                +'👥 *Joueurs en jeu :*\n'+cibles+'\n\n> _"Observez, apprenez, frappez demain."_ 🐺');
        } else {
            const exemple = phone(alive(g).find(p=>p!==loup)||alive(g)[0]);
            await dm(sock,loup,
                '🐺 *NUIT '+g.night+' — Loup-Garou*\n\nVous êtes un *Loup-Garou*. 🐺\n'
                +'🎯 *Choisissez votre cible :*\n'+cibles+'\n\n'
                +'📩 Votez en DM :\n*vote [numéro de téléphone]*\n'
                +'Exemple : `vote '+exemple+'`\n\n⏳ 90 secondes pour voter.');
        }
    }

    const voyante = alive(g).find(p=>g.roles[p]==='VOYANTE');
    if (voyante) {
        const autres = alive(g).filter(p=>p!==voyante).map(p=>'*'+phone(p)+'* — '+tag(p)).join('\n');
        await dm(sock,voyante,'👁️ *NUIT '+g.night+' — Voyante*\n\nRévélez le rôle d\'un joueur :\n*voir [numéro de téléphone]*\n\nJoueurs disponibles :\n'+autres);
    }

    const sorciere = alive(g).find(p=>g.roles[p]==='SORCIERE');
    if (sorciere) {
        const potions = [];
        if (g.witchLife)  potions.push('💚 *sauver* — sauver la victime des loups');
        if (g.witchDeath) {
            const cibles = alive(g).filter(p=>p!==sorciere).map(p=>'*'+phone(p)+'* — '+tag(p)).join('\n');
            potions.push('☠️ *tuer [numéro]* — empoisonner\n'+cibles);
        }
        potions.push('⏭️ *passer* — ne rien faire');
        await dm(sock,sorciere,'🧙 *NUIT '+g.night+' — Sorcière*\n\nVos potions :\n'+potions.join('\n\n'));
    }

    clearTimers(g);
    g.nightTimer = setTimeout(()=>resolveNight(sock,cid), 90_000);
}

async function resolveNight(sock, cid) {
    const g = GAMES.get(cid); if (!g||g.phase!=='night') return;
    clearTimers(g); g.phase='resolving';
    if (g.night===1) {
        await grp(sock,cid,'🌙 *Fin de la Nuit 1*\n😴 _Les loups ont observé... mais n\'ont pas frappé._\n_La nuit 1 est réservée à l\'observation._');
        return startDay(sock,cid,[]);
    }
    let wolfTarget = null;
    const vc = {};
    for (const t of Object.values(g.nightVotes)) vc[t]=(vc[t]||0)+1;
    if (Object.keys(vc).length>0) wolfTarget=Object.entries(vc).sort(([,a],[,b])=>b-a)[0][0];
    if (wolfTarget&&g.witchSave) wolfTarget=null;
    const killed = [];
    if (wolfTarget) killed.push({jid:wolfTarget,       reason:'devore'});
    if (g.witchKill) killed.push({jid:norm(g.witchKill),reason:'poison'});
    for (const {jid,reason} of killed) if (!g.eliminated.has(norm(jid))) await eliminate(sock,cid,jid,reason);
    const win=checkWin(g); if (win) return endGame(sock,cid,win);
    for (const {jid} of killed) if (g.roles[norm(jid)]==='CHASSEUR') return triggerHunter(sock,cid,jid,killed);
    await startDay(sock,cid,killed);
}

async function triggerHunter(sock, cid, hunterJid, prev) {
    const g = GAMES.get(cid); if (!g) return;
    g.phase='hunter'; g.hunterDying=norm(hunterJid);
    const cibles = alive(g).map(p=>'*'+phone(p)+'* — '+tag(p)).join('\n');
    await dm(sock,hunterJid,'🏹 *Vous mourez ! Mais pas sans combattre !*\n\nEmportez quelqu\'un avec vous :\n*chasser [numéro de téléphone]*\n\nJoueurs disponibles :\n'+cibles+'\n\n⏳ *30 secondes.*');
    clearTimers(g);
    g.hunterTimer = setTimeout(async()=>{
        g.hunterDying=null; g.phase='resolving';
        const win=checkWin(g); if(win) return endGame(sock,cid,win);
        await startDay(sock,cid,prev);
    }, 30_000);
}

async function startDay(sock, cid, nightKilled=[]) {
    const g = GAMES.get(cid); if (!g) return;
    g.phase='day'; g.dayVotes={};
    await openGrp(sock,cid);
    const vivants = alive(g);
    let announce;
    if (nightKilled.length===0) {
        announce='😴 *Personne n\'a été tué cette nuit !*';
    } else {
        announce=nightKilled.map(({jid,reason})=>
            reason==='devore'
                ? '🐺 *'+tag(jid)+'* ('+phone(jid)+') dévoré par les loups.'
                : '☠️ *'+tag(jid)+'* ('+phone(jid)+') empoisonné.'
        ).join('\n');
    }
    await grp(sock,cid,
        '┏━━━━━━━━━━━━━━━━━━━━━━━┓\n┃  ☀️  *JOUR '+g.night+' — LOUP-GAROU*\n┗━━━━━━━━━━━━━━━━━━━━━━━┛\n\n'
        +announce+'\n\n'
        +'👥 *En vie :* '+vivants.length+'\n'+vivants.map(p=>'│ *'+phone(p)+'* — '+tag(p)).join('\n')+'\n\n'
        +'💬 *Discutez et débusquez les loups !*\n'
        +'📩 Votez en *DM avec le bot* :\n*vote [numéro de téléphone]*\n'
        +'⏳ Vote clôture dans *2 minutes.*\n\n'
        +'> _"La vérité finit toujours par éclater."_ — *Alfred* 🎩',vivants);
    for (const p of vivants) {
        const cibles = vivants.filter(x=>x!==p).map(x=>'*'+phone(x)+'* — '+tag(x)).join('\n');
        await dm(sock,p,'☀️ *JOUR '+g.night+' — Vote*\n\nQui éliminer ? Envoyez au bot :\n*vote [numéro de téléphone]*\n\nJoueurs en vie :\n'+cibles+'\n\n⏳ 2 minutes pour voter.');
    }
    clearTimers(g);
    g.dayTimer = setTimeout(()=>resolveDay(sock,cid), 120_000);
}

async function resolveDay(sock, cid) {
    const g = GAMES.get(cid); if (!g||g.phase!=='day') return;
    clearTimers(g); g.phase='resolving';
    if (Object.keys(g.dayVotes).length===0) {
        await grp(sock,cid,'🗳️ _Aucun vote reçu. Personne n\'est éliminé aujourd\'hui._');
        const win=checkWin(g); if(win) return endGame(sock,cid,win);
        return startNight(sock,cid);
    }
    const counts = {};
    for (const t of Object.values(g.dayVotes)) counts[t]=(counts[t]||0)+1;
    const sorted = Object.entries(counts).sort(([,a],[,b])=>b-a);
    const top=sorted[0][1], tied=sorted.filter(([,c])=>c===top);
    let target = tied.length>1 ? tied[Math.floor(Math.random()*tied.length)][0] : sorted[0][0];
    if (tied.length>1) await grp(sock,cid,'⚖️ _Égalité ! Le destin désigne *'+tag(target)+'*..._');
    const recap = sorted.map(([jid,c])=>'│ *'+phone(jid)+'* — '+tag(jid)+' : *'+c+'* vote'+(c>1?'s':'')).join('\n');
    await grp(sock,cid,'🗳️ *Résultat du vote :*\n╭──────────────────────\n'+recap+'\n╰──────────────────────\n☠️ *'+tag(target)+'* est éliminé !',sorted.map(([jid])=>jid));
    await eliminate(sock,cid,target,'vote');
    if (g.roles[norm(target)]==='CHASSEUR') return triggerHunter(sock,cid,target,[]);
    const win=checkWin(g); if(win) return endGame(sock,cid,win);
    return startNight(sock,cid);
}

// ══════════════════════════════════════════════════════════
// COMMANDES GROUPE
// ══════════════════════════════════════════════════════════

async function cmdGuide(sock, cid, message) {
    const texte =
        '┏━━━━━━━━━━━━━━━━━━━━━━━┓\n'
        +'┃  🐺  *GUIDE — LOUP-GAROU*\n'
        +'┃  _Maison VALENHART_\n'
        +'┗━━━━━━━━━━━━━━━━━━━━━━━┛\n\n'

        +'╭────〔 🎯 OBJECTIF 〕────\n'
        +'│ Deux camps s\'affrontent :\n'
        +'│ 🐺 *Loups-Garous* — éliminer les villageois\n'
        +'│ 🏘️ *Village* — éliminer tous les loups\n'
        +'╰──────────────────────────\n\n'

        +'╭────〔 📋 DÉMARRER UNE PARTIE 〕────\n'
        +'│ 1️⃣ Quelqu\'un écrit *!loup* dans le groupe\n'
        +'│ 2️⃣ Les autres écrivent *!join* pour rejoindre\n'
        +'│ 3️⃣ Minimum *6 joueurs* — pas de limite max\n'
        +'│ 4️⃣ L\'hôte écrit *!start* pour lancer\n'
        +'│ 5️⃣ Chacun reçoit son *rôle secret en DM*\n'
        +'╰──────────────────────────\n\n'

        +'╭────〔 🌙 NUIT 1 — SPÉCIALE 〕────\n'
        +'│ ⚠️ La première nuit est une *nuit d\'observation*.\n'
        +'│ Les loups NE peuvent PAS tuer la nuit 1.\n'
        +'│ Utilisez ce temps pour repérer les suspects.\n'
        +'│ Le meurtre commence à partir de la *nuit 2*.\n'
        +'╰──────────────────────────\n\n'

        +'╭────〔 🌙 PHASE NUIT (nuit 2+) 〕────\n'
        +'│ • Groupe *fermé* automatiquement\n'
        +'│ • Chaque joueur reçoit ses instructions en DM\n'
        +'│ • *Loups* : voter pour dévorer un joueur\n'
        +'│ • *Voyante* : espionner le rôle d\'un joueur\n'
        +'│ • *Sorcière* : sauver ou empoisonner\n'
        +'│ ⚠️ Toutes les actions se font en *DM avec le bot*\n'
        +'╰──────────────────────────\n\n'

        +'╭────〔 ☀️ PHASE JOUR 〕────\n'
        +'│ • Groupe *réouvert*\n'
        +'│ • Bot annonce les victimes de la nuit\n'
        +'│ • Tout le monde *discute librement*\n'
        +'│ • Chacun *vote en DM* contre un suspect\n'
        +'│ • Le plus voté est *éliminé*\n'
        +'│ • Son rôle est *révélé* à tous\n'
        +'╰──────────────────────────\n\n'

        +'╭────〔 🗳️ COMMENT VOTER 〕────\n'
        +'│ Le bot envoie la liste des joueurs\n'
        +'│ avec leur *numéro de téléphone*.\n'
        +'│\n'
        +'│ Envoyez en DM au bot :\n'
        +'│   *vote 237691234567*  ← numéro complet\n'
        +'│   *vote 4567*  ← les derniers chiffres suffisent\n'
        +'│\n'
        +'│ 📌 Tapez *!players* pour revoir la liste\n'
        +'╰──────────────────────────\n\n'

        +'╭────〔 🎭 LES 5 RÔLES 〕────\n'
        +'│\n'
        +'│ 🐺 *Loup-Garou*\n'
        +'│   Vote la nuit pour dévorer un joueur.\n'
        +'│   Vous jouez *SEUL* — les autres loups\n'
        +'│   ne vous sont pas révélés.\n'
        +'│   Vous pouvez voter contre n\'importe qui.\n'
        +'│   Faites semblant d\'être innocent le jour !\n'
        +'│\n'
        +'│ 🏘️ *Villageois*\n'
        +'│   Aucun pouvoir. Débusquez les loups\n'
        +'│   par la discussion et le vote.\n'
        +'│\n'
        +'│ 👁️ *Voyante*\n'
        +'│   Chaque nuit, envoyez en DM :\n'
        +'│   `voir [numéro de téléphone]`\n'
        +'│   Le bot révèle le rôle en secret.\n'
        +'│\n'
        +'│ 🧙 *Sorcière*\n'
        +'│   2 potions (une seule fois chacune) :\n'
        +'│   💚 `sauver` — ressuscite la victime des loups\n'
        +'│   ☠️ `tuer [numéro]` — empoisonne n\'importe qui\n'
        +'│   ⏭️ `passer` — ne rien faire\n'
        +'│\n'
        +'│ 🏹 *Chasseur*\n'
        +'│   À votre mort, tirez sur un autre joueur :\n'
        +'│   `chasser [numéro de téléphone]`\n'
        +'╰──────────────────────────\n\n'

        +'╭────〔 🏆 CONDITIONS DE VICTOIRE 〕────\n'
        +'│ 🏘️ *Village gagne* si tous les loups meurent\n'
        +'│ 🐺 *Loups gagnent* si loups ≥ villageois\n'
        +'╰──────────────────────────\n\n'

        +'╭────〔 📊 RÉPARTITION DES RÔLES 〕────\n'
        +'│ 6 joueurs     → 2 loups\n'
        +'│ 7 joueurs     → 2 loups + Sorcière\n'
        +'│ 8-9 joueurs   → 3 loups + Sorcière + Chasseur\n'
        +'│ 10-12 joueurs → 4 loups\n'
        +'│ 13+ joueurs   → 1 loup pour 3 joueurs\n'
        +'│ 👁️ Voyante toujours présente\n'
        +'╰──────────────────────────\n\n'

        +'╭────〔 ⚡ COMMANDES RAPIDES 〕────\n'
        +'│ Groupe : *!loup  !join  !start  !stop  !players*\n'
        +'│ DM bot : *vote N  voir N  sauver*\n'
        +'│          *tuer N  passer  chasser N*\n'
        +'│ _(N = numéro de téléphone)_\n'
        +'╰──────────────────────────\n\n'
        +'> _"Que le plus rusé l\'emporte."_ — *Alfred* 🎩';
    await sock.sendMessage(cid, { text: texte }, { quoted: message });
}

async function cmdLoup(sock, cid, senderId, message) {
    const host = norm(senderId);
    if (GAMES.has(cid)) return sock.sendMessage(cid,{text:'🐺 Une partie est déjà en cours !\nTapez *!join* pour rejoindre ou *!players* pour voir les inscrits.'},{ quoted:message });
    GAMES.set(cid, createGame(host));
    await grp(sock,cid,
        '┏━━━━━━━━━━━━━━━━━━━━━━━┓\n┃  🐺  *LOUP-GAROU — MAISON VALENHART*\n┗━━━━━━━━━━━━━━━━━━━━━━━┛\n\n'
        +'👑 *'+tag(host)+'* crée une partie de Loup-Garou !\n\n'
        +'📋 Rejoindre         : *!join*\n'
        +'👥 Voir les joueurs  : *!players*\n'
        +'🚀 Lancer _(hôte)_   : *!start* _(min. 6 joueurs)_\n'
        +'🛑 Annuler _(hôte)_  : *!stop*\n'
        +'📖 Tutoriel          : *!guide*\n\n'
        +'╭────〔 ✦ RÔLES 〕────\n│ 🐺 Loup-Garou  🏘️ Villageois\n│ 👁️ Voyante  🧙 Sorcière  🏹 Chasseur\n╰──────────────────────────\n\n'
        +'> _"Que le jeu commence, Messieurs."_ — *Alfred* 🎩',[host]);
}

async function cmdJoin(sock, cid, senderId, message) {
    const jid=norm(senderId), g=GAMES.get(cid);
    if (!g)                  return sock.sendMessage(cid,{text:'🐺 Aucune partie en cours. Tapez *!loup* pour en créer une !'},{ quoted:message });
    if (g.phase!=='lobby')   return sock.sendMessage(cid,{text:'🐺 La partie est déjà lancée !'},{ quoted:message });
    if (g.players.includes(jid)) return sock.sendMessage(cid,{text:'✅ '+tag(jid)+', vous êtes déjà inscrit(e) !'},{ quoted:message });
    g.players.push(jid);
    const n=g.players.length, need=Math.max(0,6-n);
    await grp(sock,cid,'✅ *'+tag(jid)+'* rejoint ! _('+n+' joueur'+(n>1?'s':'')+'_)\n'+(need>0?'⏳ Encore *'+need+'* joueur'+(need>1?'s':'')+' nécessaire'+(need>1?'s':'')+'...':'🎮 Assez de joueurs ! L\'hôte peut taper *!start* !'),[jid]);
}

async function cmdPlayers(sock, cid, message) {
    const g = GAMES.get(cid);
    if (!g) return sock.sendMessage(cid,{text:'🐺 Aucune partie en cours.'},{ quoted:message });
    const lines = g.players.map(p => {
        const marks=[]; if(p===g.host)marks.push('👑'); if(g.eliminated.has(p))marks.push('☠️');
        return '│ *'+phone(p)+'* — '+tag(p)+' '+marks.join('');
    }).join('\n');
    const phases={lobby:'⏳ Attente',night:'🌙 Nuit',day:'☀️ Jour',hunter:'🏹 Chasseur',ended:'🎭 Terminée'};
    await sock.sendMessage(cid,{
        text:'┏━━━━━━━━━━━━━━━━━━━━━━━┓\n┃  🐺  *JOUEURS — LOUP-GAROU*\n┗━━━━━━━━━━━━━━━━━━━━━━━┛\n\n'
            +'╭────〔 '+g.players.length+' inscrit'+(g.players.length>1?'s':'')+' 〕────\n'+lines+'\n╰──────────────────────────\n'
            +'Phase : *'+(phases[g.phase]||g.phase)+'*  │  En vie : *'+alive(g).length+'*\n👑 hôte  │  ☠️ éliminé\n\n'
            +'💡 _Pour voter, envoyez le numéro de téléphone en DM._\nExemple : `vote '+phone(g.players[0])+'`',
        mentions:g.players.map(norm)
    },{ quoted:message });
}

async function cmdStart(sock, cid, senderId, message) {
    const jid=norm(senderId), g=GAMES.get(cid);
    if (!g)                  return sock.sendMessage(cid,{text:'🐺 Aucune partie en cours.'},{ quoted:message });
    if (jid!==g.host)        return sock.sendMessage(cid,{text:'🐺 Seul l\'hôte *'+tag(g.host)+'* peut lancer !'},{ quoted:message });
    if (g.phase!=='lobby')   return sock.sendMessage(cid,{text:'🐺 La partie est déjà lancée !'},{ quoted:message });
    if (g.players.length<6)  return sock.sendMessage(cid,{text:'🐺 Il faut au moins *6 joueurs*. ('+g.players.length+'/6)'},{ quoted:message });

    const roleList=buildRoles(g.players.length), shuffRoles=shuffle(roleList), shuffPlayers=shuffle([...g.players]);
    for (let i=0;i<shuffPlayers.length;i++) g.roles[shuffPlayers[i]]=shuffRoles[i];
    await promote(sock,cid,g.players);

    const rc={};
    for (const r of shuffRoles) rc[r]=(rc[r]||0)+1;
    const summary=Object.entries(rc).map(([r,c])=>'│ '+ROLES[r].emoji+' *'+ROLES[r].name+'* × '+c).join('\n');
    const playerList=g.players.map(p=>'│ *'+phone(p)+'* — '+tag(p)).join('\n');

    await grp(sock,cid,
        '┏━━━━━━━━━━━━━━━━━━━━━━━┓\n┃  🐺  *PARTIE LANCÉE !*\n┗━━━━━━━━━━━━━━━━━━━━━━━┛\n\n'
        +'👥 *'+g.players.length+' joueurs :*\n'+playerList+'\n\n'
        +'╭────〔 ✦ COMPOSITION 〕────\n'+summary+'\n╰──────────────────────────\n\n'
        +'📩 *Vérifiez vos messages privés !*\n'
        +'🗳️ Votez avec le *numéro de téléphone*. Tapez *!players* pour la liste.\n'
        +'⚠️ *Nuit 1 = observation. Aucun meurtre.*\n\n'
        +'> _"Que Dieu protège les innocents..."_ — *Alfred* 🎩',g.players);

    for (const player of g.players) {
        const rk=g.roles[player], ri=ROLES[rk];
        let cmds='';
        if (rk==='VOYANTE')  cmds='\n• `voir [numéro]` — la nuit uniquement';
        if (rk==='SORCIERE') cmds='\n• `sauver` — sauver la victime\n• `tuer [numéro]` — empoisonner\n• `passer` — ne rien faire';
        if (rk==='CHASSEUR') cmds='\n• `chasser [numéro]` — à votre mort seulement';
        if (rk==='LOUP')     cmds='\n• `vote [numéro]` — voter la nuit (dès nuit 2)\n⚠️ Vous jouez SEUL — les autres loups ne vous sont pas révélés.';
        const allPlayers=g.players.map(p=>'*'+phone(p)+'* — '+tag(p)).join('\n');
        await dm(sock,player,
            '🎭 *VOTRE RÔLE SECRET — Loup-Garou*\n'
            +ri.emoji+' ════════════════════\n*'+ri.name+'*\n════════════════════\n'
            +'📖 '+ri.desc+'\n\n'
            +'🏆 Camp : '+(ri.team==='loup'?'🐺 Loups-Garous':'🏘️ Village')+'\n'
            +'🤫 *Gardez votre rôle absolument secret !*\n\n'
            +'╭────〔 📋 LISTE DES JOUEURS 〕────\n'+allPlayers+'\n╰──────────────────────────\n\n'
            +'*Vos commandes DM :*'+cmds+'\n\n'
            +'💡 _Utilisez le numéro de téléphone pour voter._\n> — *Alfred, Maître du Jeu* 🎩');
    }
    await startNight(sock,cid);
}

async function cmdStop(sock, cid, senderId, message, isAdmin) {
    const jid=norm(senderId), g=GAMES.get(cid);
    if (!g)                        return sock.sendMessage(cid,{text:'🐺 Aucune partie à arrêter.'},{ quoted:message });
    if (jid!==g.host && !isAdmin)  return sock.sendMessage(cid,{text:'🐺 Seul l\'hôte ou un admin peut annuler !'},{ quoted:message });
    clearTimers(g); await openGrp(sock,cid);
    try{await demote(sock,cid,g.players);}catch{}
    GAMES.delete(cid);
    await grp(sock,cid,'🛑 *Partie annulée* par *'+tag(jid)+'*.\n> — *Alfred* 🎩',[jid]);
}

// ══════════════════════════════════════════════════════════
// ACTIONS EN DM
// ══════════════════════════════════════════════════════════

async function handleDM(sock, senderJid, text) {
    const sender=norm(senderJid);
    const parts=text.trim().toLowerCase().split(/\s+/), cmd=parts[0], arg=parts.slice(1).join(' ').trim();
    let g=null, cid=null;
    for (const [c,game] of GAMES.entries()) { if(game.players.includes(sender)){g=game;cid=c;break;} }
    if (!g)                    return dm(sock,sender,'🐺 Aucune partie en cours pour vous.\nRejoignez un groupe et tapez *!join*.');
    if (g.eliminated.has(sender)) return dm(sock,sender,'☠️ Vous êtes éliminé et ne pouvez plus agir.');

    const showList  = ()=>g.players.map(p=>'*'+phone(p)+'* — '+tag(p)+(g.eliminated.has(p)?' ☠️':'')).join('\n');
    const aliveList = ()=>alive(g).map(p=>'*'+phone(p)+'* — '+tag(p)).join('\n');

    if (cmd==='vote') {
        const q=arg.replace(/\D/g,'');
        if (!q||q.length<4) return dm(sock,sender,'❓ Utilisez le *numéro de téléphone* du joueur :\n*vote [numéro]*\n\nJoueurs :\n'+showList());
        const result=findByPhone(g,q);
        if (result==='ambiguous') return dm(sock,sender,'⚠️ Plusieurs joueurs correspondent à *'+q+'*.\nPrécisez plus de chiffres.\n\nJoueurs en vie :\n'+aliveList());
        if (!result)              return dm(sock,sender,'❓ Numéro *'+q+'* introuvable ou éliminé.\n\nJoueurs en vie :\n'+aliveList());
        if (norm(result)===sender) return dm(sock,sender,'❌ Vous ne pouvez pas voter contre vous-même.');

        if (g.phase==='night') {
            if (g.roles[sender]!=='LOUP') return dm(sock,sender,'❌ Seuls les Loups-Garous votent la nuit.');
            if (g.night===1) {
                g.nightVotes[sender]=norm(result);
                return dm(sock,sender,'👁️ Vote noté. Mais *la Nuit 1 est une nuit d\'observation* — aucune victime ne sera dévorée.');
            }
            g.nightVotes[sender]=norm(result);
            await dm(sock,sender,'✅ Vote enregistré contre *'+phone(result)+'* — '+tag(result)+'.');
            const loups=loupsVivants(g);
            if (loups.length>0&&loups.every(l=>g.nightVotes[l])) {
                clearTimers(g);
                g.nightTimer=setTimeout(()=>resolveNight(sock,cid),15_000);
                await dm(sock,sender,'🐺 Tous les loups ont voté. Résolution dans 15s...');
            }
        } else if (g.phase==='day') {
            g.dayVotes[sender]=norm(result);
            await dm(sock,sender,'✅ Vote enregistré contre *'+phone(result)+'* — '+tag(result)+'.');
            if (alive(g).every(p=>g.dayVotes[p])){clearTimers(g);await resolveDay(sock,cid);}
        } else {
            return dm(sock,sender,'❌ Les votes ne sont pas ouverts actuellement.');
        }
        return;
    }

    if (cmd==='voir') {
        if (g.roles[sender]!=='VOYANTE') return dm(sock,sender,'❌ Seule la Voyante peut utiliser *voir*.');
        if (g.phase!=='night')           return dm(sock,sender,'❌ Cette action est disponible la nuit seulement.');
        if (g.seerDone)                  return dm(sock,sender,'❌ Vous avez déjà utilisé votre vision cette nuit.');
        const q=arg.replace(/\D/g,'');
        if (!q||q.length<4) return dm(sock,sender,'❓ Utilisez le numéro de téléphone :\n*voir [numéro]*\n\nJoueurs disponibles :\n'+alive(g).filter(p=>p!==sender).map(p=>'*'+phone(p)+'* — '+tag(p)).join('\n'));
        const result=findByPhone(g,q);
        if (result==='ambiguous') return dm(sock,sender,'⚠️ Ambiguïté sur *'+q+'*, précisez plus de chiffres.');
        if (!result||norm(result)===sender) return dm(sock,sender,'❓ Joueur *'+q+'* introuvable ou invalide.');
        g.seerDone=true;
        const ri=ROLES[g.roles[norm(result)]]||ROLES.VILLAGEOIS;
        await dm(sock,sender,'👁️ *Révélation de la Voyante*\n\n*'+phone(result)+'* — '+tag(result)+' est :\n'+ri.emoji+' *'+ri.name+'*\n\n🏆 Camp : '+(ri.team==='loup'?'🐺 Loup-Garou — ⚠️ *DANGER !*':'🏘️ Village — innocent'));
        return;
    }

    if (cmd==='sauver') {
        if (g.roles[sender]!=='SORCIERE') return dm(sock,sender,'❌ Seule la Sorcière peut utiliser *sauver*.');
        if (g.phase!=='night')             return dm(sock,sender,'❌ Cette action est disponible la nuit seulement.');
        if (!g.witchLife)                  return dm(sock,sender,'❌ Votre potion de vie a déjà été utilisée.');
        g.witchSave=true; g.witchLife=false;
        await dm(sock,sender,'💚 *Potion de vie utilisée !*\nLa victime des loups sera sauvée cette nuit.');
        return;
    }

    if (cmd==='tuer') {
        if (g.roles[sender]!=='SORCIERE') return dm(sock,sender,'❌ Seule la Sorcière peut utiliser *tuer*.');
        if (g.phase!=='night')             return dm(sock,sender,'❌ Cette action est disponible la nuit seulement.');
        if (!g.witchDeath)                 return dm(sock,sender,'❌ Votre potion de mort a déjà été utilisée.');
        const q=arg.replace(/\D/g,'');
        if (!q||q.length<4) return dm(sock,sender,'❓ Utilisez le numéro de téléphone :\n*tuer [numéro]*\n\nJoueurs disponibles :\n'+alive(g).filter(p=>p!==sender).map(p=>'*'+phone(p)+'* — '+tag(p)).join('\n'));
        const result=findByPhone(g,q);
        if (result==='ambiguous') return dm(sock,sender,'⚠️ Ambiguïté sur *'+q+'*, précisez plus de chiffres.');
        if (!result)              return dm(sock,sender,'❓ Joueur *'+q+'* introuvable ou éliminé.');
        g.witchKill=norm(result); g.witchDeath=false;
        await dm(sock,sender,'☠️ *Potion de mort utilisée !*\n*'+phone(result)+'* — '+tag(result)+' sera empoisonné cette nuit.');
        return;
    }

    if (cmd==='passer') { await dm(sock,sender,'⏭️ Action ignorée. Bonne nuit...'); return; }

    if (cmd==='chasser') {
        if (g.roles[sender]!=='CHASSEUR') return dm(sock,sender,'❌ Seul le Chasseur peut utiliser *chasser*.');
        if (g.phase!=='hunter')            return dm(sock,sender,'❌ Ce n\'est pas votre moment de chasser.');
        if (g.hunterDying!==sender)        return dm(sock,sender,'❌ Vous n\'êtes pas le chasseur désigné.');
        const q=arg.replace(/\D/g,'');
        if (!q||q.length<4) return dm(sock,sender,'❓ Utilisez le numéro de téléphone :\n*chasser [numéro]*\n\nJoueurs disponibles :\n'+aliveList());
        const result=findByPhone(g,q);
        if (result==='ambiguous') return dm(sock,sender,'⚠️ Ambiguïté sur *'+q+'*, précisez plus de chiffres.');
        if (!result)              return dm(sock,sender,'❓ Joueur *'+q+'* introuvable.');
        clearTimers(g); g.hunterDying=null; g.phase='resolving';
        await grp(sock,cid,'🏹 *Le Chasseur tire une dernière flèche !*\n*'+tag(result)+'* est abattu !',[norm(result)]);
        await eliminate(sock,cid,result,'chasseur');
        const win=checkWin(g); if(win) return endGame(sock,cid,win);
        return startNight(sock,cid);
    }

    await dm(sock,sender,
        '❓ *Commandes disponibles en DM :*\n\n'
        +'• *vote [numéro]* — voter\n• *voir [numéro]* — Voyante _(nuit)_\n'
        +'• *sauver* — Sorcière _(nuit)_\n• *tuer [numéro]* — Sorcière _(nuit)_\n'
        +'• *passer* — ne rien faire\n• *chasser [numéro]* — Chasseur _(à la mort)_\n\n'
        +'*Liste des joueurs :*\n'+showList()+'\n\n'
        +'💡 _Tapez !players dans le groupe pour la liste complète._');
}

module.exports = { cmdLoup, cmdJoin, cmdPlayers, cmdStart, cmdStop, cmdGuide, handleDM, GAMES };
