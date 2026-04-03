const responses = [
    { en: "It is certain.", fr: "Cela est certain, Monsieur." },
    { en: "Without a doubt.", fr: "Sans le moindre doute, Monsieur." },
    { en: "Signs point to yes.", fr: "Tous les présages inclinent vers un oui, Monsieur." },
    { en: "Most likely.", fr: "Selon toute vraisemblance, oui, Monsieur." },
    { en: "Yes, definitely!", fr: "Absolument, Monsieur. Sans réserve." },
    { en: "Ask again later.", fr: "Permettez-moi de vous suggérer de reposer la question ultérieurement, Monsieur." },
    { en: "Cannot predict now.", fr: "Les étoiles restent muettes sur ce point pour l'instant, Monsieur." },
    { en: "Don't count on it.", fr: "Je me permettrai de vous déconseiller de fonder trop d'espoir sur cela, Monsieur." },
    { en: "Very doubtful.", fr: "J'émettrais les plus sérieuses réserves à ce sujet, Monsieur." },
    { en: "My reply is no.", fr: "Je crains que ma réponse soit non, Monsieur — avec tout le respect que je vous dois." },
];

async function eightBallCommand(sock, chatId, question, message) {
    if (!question) {
        await sock.sendMessage(chatId, {
            text: '🎩 Si vous me permettez, Monsieur — il me faudrait une question à soumettre à ma boule de cristal.'
        }, { quoted: message });
        return;
    }

    const r = responses[Math.floor(Math.random() * responses.length)];
    await sock.sendMessage(chatId, {
        text: `🎱 *La boule de cristal de la Maison VALENHART consulte les astres...*\n\n❓ _"${question}"_\n\n🎩 *Alfred répond :* ${r.fr}`
    }, { quoted: message });
}

module.exports = { eightBallCommand };
