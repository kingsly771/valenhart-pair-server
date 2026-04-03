/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  📖 GUIDE ÉCONOMIE & HACK — MAISON VALENHART           ║
 * ╠══════════════════════════════════════════════════════════╣
 * ║  .guide           → guide complet économie             ║
 * ║  .guide hack      → guide système hack                 ║
 * ║  .guide gains     → meilleures stratégies de gains     ║
 * ║  .guide casino    → guide des jeux de casino           ║
 * ║  .guide marche    → guide du marché de luxe            ║
 * ╚══════════════════════════════════════════════════════════╝
 */
'use strict';

const C = '┏━━━━━━━━━━━━━━━━━━━━━━━┓';
const B = '┗━━━━━━━━━━━━━━━━━━━━━━━┛';
const COIN = '🪙';

// ═══════════════════════════════════════════════════════════════════════════════
// .guide  (menu principal)
// ═══════════════════════════════════════════════════════════════════════════════
const GUIDE_MENU = `${C}
┃  📖  *GUIDE — MAISON VALENHART*
${B}

_Bienvenue dans le manuel complet, Monsieur._
_Choisissez une section ci-dessous._

╭────〔 📚 SECTIONS 〕────
│ ➤ *.guide gains*    → Comment gagner des pièces
│ ➤ *.guide casino*   → Jeux et probabilités
│ ➤ *.guide hack*     → Système de hacking
│ ➤ *.guide marche*   → Marché de luxe & achats
╰──────────────────────────

> _"La connaissance est la première richesse, Monsieur."_
> — *Alfred* 🎩`;

// ═══════════════════════════════════════════════════════════════════════════════
// .guide gains
// ═══════════════════════════════════════════════════════════════════════════════
const GUIDE_GAINS = `${C}
┃  💰  *GUIDE — GAINS & REVENUS*
${B}

╭────〔 📅 GAINS QUOTIDIENS 〕────
│
│ *.daily* — Prime journalière
│   💰 Gain : *300 – 500 ${COIN}*
│   🔥 Streak bonus : *+50 ${COIN}* par jour consécutif
│   🏆 Bonus max streak : *+500 ${COIN}* (10 jours)
│   ⏳ Cooldown : *20 heures*
│   💡 *Astuce :* Connectez-vous chaque jour pour
│      maximiser votre streak ! (jusqu'à +1000 ${COIN}/jour)
│
│ *.travail* — Emplois de la Maison
│   💰 Gain : *80 – 500 ${COIN}* selon le poste
│   ⏳ Cooldown : *2 heures*
│   💡 *Astuce :* Le meilleur rapport temps/gain.
│      Faites *.travail* dès que le cooldown expire !
│
│ *.coffre* — Coffre bonus Alfred
│   💰 Gain : *50 – 1000 ${COIN}* (20% chance vide)
│   ⏳ Cooldown : *8 heures*
│   💡 *Astuce :* Faites-le 3× par jour sans y penser.
│
╰──────────────────────────

╭────〔 📈 INVESTISSEMENTS 〕────
│
│ *.investir <montant>* — Marchés financiers
│   💳 Source : *Banque uniquement*
│   📊 Rendement : Variable selon le secteur
│   ✅ Profit possible : *jusqu'à +50%*
│   ❌ Perte possible : *jusqu'à -20%*
│   ⏳ Cooldown : *12 heures*
│   💡 *Astuce :* Mettez une partie de vos gains
│      en banque et investissez régulièrement.
│
╰──────────────────────────

╭────〔 🧠 GAINS INTELLIGENTS 〕────
│
│ *.quizeco* — Quiz économie
│   💰 Gain : *100 – 200 ${COIN}* si bonne réponse
│   ⏳ Pas de cooldown !
│   💡 Répondez simplement A, B, C ou D
│
│ *.duel @pers <mise>* — Duel direct
│   💰 Gain : *×2 la mise* si victoire (50/50)
│   💡 Défiez les membres riches pour des gros gains
│
│ *.transfert @pers <montant>* — Envoyer des pièces
│   💡 Utile pour aider les membres de la famille
│
╰──────────────────────────

╭────〔 🏆 STRATÉGIE OPTIMALE 〕────
│
│ *Routine journalière recommandée :*
│  1️⃣  *.daily*    → dès l'ouverture (chaque 20h)
│  2️⃣  *.travail*  → toutes les 2 heures
│  3️⃣  *.coffre*   → matin / après-midi / soir
│  4️⃣  *.investir* → 2× par jour depuis la banque
│  5️⃣  *.quizeco*  → autant que vous voulez
│
│ 💡 *Protégez vos pièces :* gardez le max en
│    *.banque depot* pour éviter les vols et hacks !
│
╰──────────────────────────

> _"La fortune appartient à ceux qui la méritent."_
> — *Alfred* 🎩`;

// ═══════════════════════════════════════════════════════════════════════════════
// .guide casino
// ═══════════════════════════════════════════════════════════════════════════════
const GUIDE_CASINO = `${C}
┃  🎰  *GUIDE — CASINO & JEUX*
${B}

_⚠️ Les jeux de casino comportent des risques._
_Ne misez que ce que vous pouvez perdre, Monsieur._

╭────〔 🎡 ROULETTE 〕────
│ *.roulette <montant|tout>*
│   🎯 Chance de gagner : *47%*
│   💰 Gain : *×2 la mise*
│   ❌ Risque : *perte totale de la mise*
│   💡 Mieux que 50% ? Non. C'est la maison.
│      Misez petit et souvent pour limiter les pertes.
╰──────────────────────────

╭────〔 🃏 BLACKJACK 〕────
│ *.blackjack <montant>*
│   🎯 Jeu de cartes — arriver à 21 sans dépasser
│   💰 Gain : *×2 la mise* si victoire
│   💡 Règle d'or : demandez carte si < 17,
│      restez si ≥ 17.
╰──────────────────────────

╭────〔 ♠️ POKER 〕────
│ *.poker <montant>*
│   🎯 Main de cartes contre le bot
│   💰 Gain variable selon la main
│   💡 La Quinte Flush Royale = gain maximum !
╰──────────────────────────

╭────〔 🎰 BANDIT MANCHOT 〕────
│ *.bandit <montant>* / *.slot <montant>*
│   🎯 3 symboles identiques = jackpot
│   💰 Gain : *×10 à ×100* selon combinaison
│   ❌ Risque élevé — misez petit !
╰──────────────────────────

╭────〔 🪙 PILE OU FACE 〕────
│ *.pari <montant> pile|face*
│   🎯 Chance exacte : *50/50*
│   💰 Gain : *×2 la mise*
│   💡 Le jeu le plus équitable du casino.
╰──────────────────────────

╭────〔 💣 MINES 〕────
│ *.mines <montant>*
│   🎯 9 cases, 3 bombes cachées
│   💰 Gain si pas de bombe : *×1.5 à ×3*
│   ❌ Bombe = perte totale
│   💡 Jeu de chance pure — misez modérément.
╰──────────────────────────

╭────〔 🎟️ GRATTAGE 〕────
│ *.grattage <montant>*
│   🎯 Ticket à gratter instantané
│   💰 Gain : multiplicateur aléatoire
│   💡 Prix min : 50 ${COIN}. Faible mise = faible risque.
╰──────────────────────────

╭────〔 🎯 LOTERIE & JACKPOT 〕────
│
│ *.loto <mise>* — Loterie à 5 numéros
│   🏆 5/5 bons : *×100 la mise*
│   🥈 4/5 bons : *×20 la mise*
│   🥉 3/5 bons : *×5 la mise*
│   🎫 2/5 bons : *remboursé*
│   💡 Misez 100 ${COIN} minimum pour espérer un beau gain.
│
│ *.jackpot <mise>* — Jackpot communautaire
│   🏆 Le dernier joueur à payer remporte tout !
│   💡 Rejoignez quand le pool est déjà gros.
│
╰──────────────────────────

╭────〔 🏆 CONSEIL CASINO 〕────
│
│  ✅ *Jeux les + équitables :* .pari, .duel
│  💰 *Jeux hauts gains :*      .loto, .jackpot
│  ⚖️ *Jeux équilibrés :*       .blackjack, .poker
│  ⚠️  *Jeux risqués :*         .bandit, .mines
│  📌 *Règle d'or :* Ne misez jamais tout !
│     Gardez toujours du capital en banque.
│
╰──────────────────────────

> _"La Maison gagne toujours à long terme, Monsieur."_
> — *Alfred* 🎩`;

// ═══════════════════════════════════════════════════════════════════════════════
// .guide hack
// ═══════════════════════════════════════════════════════════════════════════════
const GUIDE_HACK = `${C}
┃  💻  *GUIDE — SYSTÈME HACK*
${B}

_Ce guide est confidentiel. Usage réservé aux agents_
_autorisés de la Maison VALENHART._

╭────〔 🔑 PRÉREQUIS 〕────
│
│ Pour utiliser *.hack*, vous devez d'abord obtenir
│ une *licence* de l'Owner du bot :
│
│ 👑 *Owner → vous :*  *.permit @votre_pseudo*
│ 🚫 *Owner → vous :*  *.permit del @vous* (révocation)
│ 📋 *Owner :*          *.permit list* (voir les agents)
│
│ ⚠️  Sans licence = accès refusé.
│
╰──────────────────────────

╭────〔 💻 UTILISATION 〕────
│
│ *.hack @cible*
│
│  • Taguez votre cible dans le groupe
│  • La cible doit avoir *au moins 500 ${COIN}* en banque
│  • Vous ne pouvez pas vous hacker vous-même
│  • ⏳ Cooldown : *8 heures* entre chaque hack
│
╰──────────────────────────

╭────〔 🎲 RÉSULTATS POSSIBLES 〕────
│
│ 🟢 *SUCCÈS* (55% de chance)
│    └ Vous siphonnez *10% à 35%* de la banque cible
│    └ Les pièces vont dans votre *portefeuille*
│    └ Ex : cible a 100k en banque → vous volez 10k–35k
│
│ 🔴 *ÉCHEC* (25% de chance)
│    └ Vous êtes tracé — *amende de 15%* de votre
│      portefeuille (pas de la banque !)
│    └ Conseil : gardez peu en portefeuille avant de hacker
│
│ 🔄 *CONTRE-HACK* (20% de chance)
│    └ La cible retourne le hack contre vous
│    └ Elle vous vole *20%* de votre portefeuille
│    └ Ses pièces augmentent, les vôtres diminuent
│
╰──────────────────────────

╭────〔 🛡️ SE PROTÉGER DU HACK 〕────
│
│ *.banque depot tout* — Déposer TOUT en banque
│
│ Le hack ne vole que la *banque* de la cible,
│ mais les *amendes/contre-hacks* prennent dans
│ le *portefeuille* du hacker.
│
│ 🔒 *Protection maximale :*
│    → Gardez 0 en portefeuille (tout en banque)
│    → Si quelqu'un hack et échoue = il paie l'amende
│    → Si contre-hack = il perd 20% de son portefeuille
│
│ 💡 *Stratégie défensive :*
│    *.banque depot tout* avant de dormir = intouchable !
│
╰──────────────────────────

╭────〔 ⚔️ STRATÉGIE OFFENSIVE 〕────
│
│ 💡 *Avant de hacker :*
│    1️⃣  Mettez vos pièces en banque (*.banque depot tout*)
│         → Si vous échouez, l'amende sera minimale
│    2️⃣  Visez des cibles avec une grosse banque
│         → *.rich* pour voir les joueurs les plus riches
│    3️⃣  Attendez le cooldown complet (8h)
│         → Ne perdez pas une tentative sur une cible pauvre
│
│ 🏆 *Rendement optimal :*
│    Hack d'une banque de 500k ${COIN} = vol potentiel
│    de 50k – 175k ${COIN} en cas de succès (55%)
│
╰──────────────────────────

╭────〔 📊 RÉSUMÉ HACK vs VOL 〕────
│
│              *.hack*      *.vol*
│  Cooldown  :  8h          6h
│  Cible     :  Banque      Portefeuille
│  Succès    :  55%         45%
│  Gain      :  10–35%      10–30%
│  Risque    :  15% amende  15% amende
│  Spécial   :  Contre-hack  —
│  Require   :  .permit     Aucun
│
╰──────────────────────────

> _"Un bon agent prépare sa retraite avant d'attaquer."_
> — *Alfred* 🎩`;

// ═══════════════════════════════════════════════════════════════════════════════
// .guide marche
// ═══════════════════════════════════════════════════════════════════════════════
const GUIDE_MARCHE = `${C}
┃  🛍️  *GUIDE — MARCHÉ DE LUXE*
${B}

╭────〔 📦 CATÉGORIES 〕────
│
│ 🚗 *.marche voitures*  → Toyota (50k) → Rolls-Royce (25M)
│ ⌚ *.marche montres*   → Casio (50k) → Patek Philippe (12M)
│ 🏠 *.marche maisons*   → Studio (200k) → Île Privée (1 Mrd)
│ 💍 *.marche bijoux*    → Bracelet (50k) → Diamant Hope (50M)
│ ✈️  *.marche jets*      → Bateau (1M) → Boeing 747 (400M)
│ 📱 *.marche tech*      → iPhone (50k) → Fusée SpaceX (500M)
│ 👔 *.marche mode*      → Zara (50k) → Chanel Couture (8M)
│ 👑 *.marche prestige*  → Gentleman (500k) → Couronne (999 Mrd)
│
╰──────────────────────────

╭────〔 💳 COMMENT ACHETER 〕────
│
│  1️⃣  Consultez une catégorie : *.marche voitures*
│  2️⃣  Notez l'ID de l'article : ex *v07* (Ferrari)
│  3️⃣  Achetez : *.acheter v07*
│      → Les pièces sont déduites (portefeuille d'abord,
│        puis banque si insuffisant)
│  4️⃣  Consultez votre collection : *.inventaire*
│  5️⃣  Revendez si besoin : *.revendre v07* (50% remboursé)
│
╰──────────────────────────

╭────〔 💡 CONSEILS 〕────
│
│ • Les articles n'ont pas de limite de quantité
│   (sauf la Couronne — unique !)
│ • La *valeur totale* de votre collection s'affiche
│   dans *.inventaire*
│ • La revente rembourse *50%* — pas d'investissement !
│ • Achetez d'abord les articles de *prestige* (titres)
│   pour afficher votre rang dans le groupe
│
╰──────────────────────────

> _"La richesse ne vaut rien sans l'art de la dépenser."_
> — *Alfred* 🎩`;

// ═══════════════════════════════════════════════════════════════════════════════
// Handler principal
// ═══════════════════════════════════════════════════════════════════════════════
async function guideCommand(sock, chatId, message, args) {
    const sub = args[0]?.toLowerCase();

    let text;
    switch (sub) {
        case 'hack':    text = GUIDE_HACK;    break;
        case 'gains':
        case 'gain':    text = GUIDE_GAINS;   break;
        case 'casino':
        case 'jeux':    text = GUIDE_CASINO;  break;
        case 'marche':
        case 'shop':    text = GUIDE_MARCHE;  break;
        default:        text = GUIDE_MENU;    break;
    }

    await sock.sendMessage(chatId, { text }, { quoted: message });
}

module.exports = { guideCommand };
