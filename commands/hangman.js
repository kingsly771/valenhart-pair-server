const words = ['javascript', 'butler', 'manor', 'valenhart', 'elegance', 'dignity', 'prestige', 'chateau', 'sterling'];
let hangmanGames = {};

function startHangman(sock, chatId, message) {
    const word = words[Math.floor(Math.random() * words.length)];
    const maskedWord = '_ '.repeat(word.length).trim();

    hangmanGames[chatId] = {
        word, maskedWord: maskedWord.split(' '),
        guessedLetters: [], wrongGuesses: 0, maxWrongGuesses: 6
    };

    sock.sendMessage(chatId, {
        text: `🎩 *Alfred vous invite à deviner le mot mystère, Monsieur :*\n\n` +
              `📜 Mot : *${maskedWord}*\n` +
              `❤️ Tentatives restantes : 6\n\n` +
              `> Répondez avec *.guess [lettre]* pour tenter votre chance. 🕯️`
    }, { quoted: message });
}

function guessLetter(sock, chatId, letter, message) {
    const game = hangmanGames[chatId];
    if (!game) {
        sock.sendMessage(chatId, { text: '🎩 Aucune partie en cours, Monsieur. Lancez-en une avec *.hangman*.' }, { quoted: message });
        return;
    }

    letter = letter.toLowerCase().trim();
    if (game.guessedLetters.includes(letter)) {
        sock.sendMessage(chatId, { text: `🎩 Vous avez déjà proposé la lettre *"${letter}"*, Monsieur. Alfred tient les registres.` }, { quoted: message });
        return;
    }

    game.guessedLetters.push(letter);
    let correct = false;

    if (game.word.includes(letter)) {
        correct = true;
        game.word.split('').forEach((l, i) => { if (l === letter) game.maskedWord[i] = letter; });
    } else {
        game.wrongGuesses++;
    }

    const remaining = game.maxWrongGuesses - game.wrongGuesses;
    const display = game.maskedWord.join(' ');
    const guessed = game.guessedLetters.join(', ');

    if (!game.maskedWord.includes('_')) {
        delete hangmanGames[chatId];
        sock.sendMessage(chatId, {
            text: `🎩 *Bravo, Monsieur !* ✨\n\nLe mot était : *${game.word}*\n\n> _"Une victoire méritée, digne de la Maison VALENHART."_ — Alfred 🎩`
        }, { quoted: message });
    } else if (game.wrongGuesses >= game.maxWrongGuesses) {
        delete hangmanGames[chatId];
        sock.sendMessage(chatId, {
            text: `🎩 *La partie est perdue, Monsieur.*\n\nLe mot était : *${game.word}*\n\n> _"La défaite, bien portée, est elle aussi une forme d'élégance."_ — Alfred 🎩`
        }, { quoted: message });
    } else {
        sock.sendMessage(chatId, {
            text: `🎩 ${correct ? '✅ Bonne lettre !' : `❌ *"${letter}"* n'y figure pas, Monsieur.`}\n\n` +
                  `📜 Mot : *${display}*\n` +
                  `❤️ Tentatives restantes : ${remaining}\n` +
                  `🔤 Lettres essayées : ${guessed}\n\n` +
                  `> Continuez avec *.guess [lettre]*. 🎩`
        }, { quoted: message });
    }
}

module.exports = { startHangman, guessLetter };
