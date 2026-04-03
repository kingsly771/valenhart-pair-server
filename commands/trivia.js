const axios = require('axios');

let triviaGames = {};

async function startTrivia(sock, chatId, message) {
    if (triviaGames[chatId]) {
        await sock.sendMessage(chatId, { text: '🎩 Un défi intellectuel est déjà en cours dans cette salle, Monsieur. Veuillez y répondre avant d\'en soumettre un nouveau.' }, { quoted: message });
        return;
    }
    try {
        const response = await axios.get('https://opentdb.com/api.php?amount=1&type=multiple');
        const questionData = response.data.results[0];
        const options = [...questionData.incorrect_answers, questionData.correct_answer].sort(() => Math.random() - 0.5);

        triviaGames[chatId] = {
            question: questionData.question,
            correctAnswer: questionData.correct_answer,
            options
        };

        const optionText = options.map((o, i) => `${['A', 'B', 'C', 'D'][i]}. ${o}`).join('\n');

        await sock.sendMessage(chatId, {
            text: `🎩 *Alfred vous soumet ce défi intellectuel, Monsieur :*\n\n` +
                  `📜 *Catégorie :* ${questionData.category}\n` +
                  `🎯 *Difficulté :* ${questionData.difficulty}\n\n` +
                  `❓ *Question :*\n_${questionData.question}_\n\n` +
                  `${optionText}\n\n` +
                  `> Répondez avec *.answer A/B/C/D* ou la réponse exacte. 🕯️`
        }, { quoted: message });
    } catch (error) {
        console.error('Error in trivia:', error);
        await sock.sendMessage(chatId, { text: '🎩 La bibliothèque de la Maison VALENHART est temporairement inaccessible, Monsieur. Mes excuses.' }, { quoted: message });
    }
}

async function answerTrivia(sock, chatId, userAnswer, message) {
    if (!triviaGames[chatId]) {
        await sock.sendMessage(chatId, { text: '🎩 Aucun défi n\'est en cours, Monsieur. Lancez-en un avec *.trivia*.' }, { quoted: message });
        return;
    }

    const game = triviaGames[chatId];
    const letterMap = { a: 0, b: 1, c: 2, d: 3 };
    let resolvedAnswer = userAnswer.trim();
    if (letterMap[resolvedAnswer.toLowerCase()] !== undefined) {
        resolvedAnswer = game.options[letterMap[resolvedAnswer.toLowerCase()]];
    }

    const isCorrect = resolvedAnswer.toLowerCase() === game.correctAnswer.toLowerCase();
    delete triviaGames[chatId];

    if (isCorrect) {
        await sock.sendMessage(chatId, {
            text: `🎩 *Excellent, Monsieur !*\n\n✅ La réponse *"${game.correctAnswer}"* est tout à fait correcte.\n\n> _"Un esprit vif est le plus bel ornement d'un gentleman."_ — Alfred 🎩`
        }, { quoted: message });
    } else {
        await sock.sendMessage(chatId, {
            text: `🎩 *Je suis au regret, Monsieur...*\n\n❌ La réponse *"${resolvedAnswer}"* est inexacte.\n✅ La réponse correcte était : *"${game.correctAnswer}"*\n\n> _"L'échec est le premier pas vers la connaissance, Monsieur."_ — Alfred 🎩`
        }, { quoted: message });
    }
}

module.exports = { startTrivia, answerTrivia };
