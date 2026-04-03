const flirts = [
    "Si la beauté était une infraction, Madame, vous seriez condamnée à une peine considérable. *And I would say — quite justly so.* 🎩",
    "In many years of distinguished service, I had never observed time come to a standstill. *Until now.* ✨",
    "La Maison VALENHART est ornée de mille merveilles — mais aucune, *if I may be so bold*, ne vous égale.",
    "Permettez-moi de vous confier un secret de majordome : vous êtes *by far* le meilleur invité que cette demeure ait jamais reçu. 🕯️",
    "Votre présence, *if I may say*, perfume cette conversation d'une grâce que les plus grands parfumeurs n'auraient su créer.",
    "I have sworn an oath of discretion. Yet I find it increasingly difficult *not* to remark upon your exceptional distinction, Madame.",
    "La Maison VALENHART honore l'excellence sous toutes ses formes. Vous en êtes, *without question*, la plus remarquable expression. 🎩",
    "Mon devoir est de rester imperturbable. En votre présence cependant, *I must confess*, c'est un effort considérable. ✨"
];

async function flirtCommand(sock, chatId, message) {
    try {
        const flirt = flirts[Math.floor(Math.random() * flirts.length)];
        await sock.sendMessage(chatId, { text: flirt }, { quoted: message });
    } catch (error) {
        console.error('Error in flirt command:', error);
        await sock.sendMessage(chatId, { text: '🎩 *Most unusual* — a rare moment of hesitation from Alfred. Please do try again, Monsieur.' });
    }
}

module.exports = flirtCommand;
