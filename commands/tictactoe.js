const TicTacToe = require('../lib/tictactoe');

// ─── Games store — keyed by chatId ───────────────────────────────────────────
// Structure: games[chatId] = { playerX, playerO, game, chatId }
const games = {};

// ─── Board renderer ───────────────────────────────────────────────────────────
function renderBoard(game) {
    const cells = game.render();
    const rows = [0, 1, 2].map(row =>
        cells.slice(row * 3, row * 3 + 3)
            .map(c => c === 'X' ? '✖️' : c === 'O' ? '⭕' : `${c}⃣`)
            .join(' │ ')
    );
    return rows.join('\n──┼───┼──\n');
}

// ─── Start or join a game ─────────────────────────────────────────────────────
async function tictactoeCommand(sock, chatId, senderId, message) {
    try {
        const existing = games[chatId];

        // Already a full game in this chat
        if (existing && existing.playerX && existing.playerO) {
            if ([existing.playerX, existing.playerO].includes(senderId)) {
                await sock.sendMessage(chatId, {
                    text: `🎩 Une partie est déjà en cours, Monsieur. Jouez votre coup (1-9) ou tapez *.surrender* pour abandonner.`
                }, { quoted: message });
            } else {
                await sock.sendMessage(chatId, {
                    text: `🎩 Une partie est déjà en cours dans cette salle, Monsieur. Patientez la fin de la partie.`
                }, { quoted: message });
            }
            return;
        }

        // Waiting for an opponent — sender joins as playerO
        if (existing && existing.playerX && !existing.playerO) {
            if (existing.playerX === senderId) {
                await sock.sendMessage(chatId, {
                    text: `🎩 Vous attendez déjà un adversaire, Monsieur. Un autre membre doit taper *.tictactoe* pour rejoindre.`
                }, { quoted: message });
                return;
            }
            // Join as player O
            existing.playerO = senderId;
            existing.game.playerO = senderId;

            const board = renderBoard(existing.game);
            await sock.sendMessage(chatId, {
                text: `🎩 *La partie est lancée — Maison VALENHART !*\n\n` +
                      `✖️ @${existing.playerX.split('@')[0]}\n` +
                      `⭕ @${senderId.split('@')[0]}\n\n` +
                      `${board}\n\n` +
                      `> C'est à ✖️ @${existing.playerX.split('@')[0]} de jouer.\n` +
                      `> Tapez un chiffre *1-9* pour jouer. 🎩`,
                mentions: [existing.playerX, senderId]
            }, { quoted: message });
            return;
        }

        // No game in this chat — create one
        games[chatId] = {
            chatId,
            playerX: senderId,
            playerO: null,
            game: new TicTacToe(senderId, null)
        };

        await sock.sendMessage(chatId, {
            text: `🎩 *Alfred ouvre la salle de jeu — Maison VALENHART*\n\n` +
                  `♟️ @${senderId.split('@')[0]} (✖️) cherche un adversaire.\n\n` +
                  `> Qu'un autre membre tape *.tictactoe* pour relever le défi ! 🎩`,
            mentions: [senderId]
        }, { quoted: message });

    } catch (err) {
        console.error('TicTacToe command error:', err.message);
    }
}

// ─── Handle a move (1-9) or surrender ────────────────────────────────────────
async function handleTicTacToeMove(sock, chatId, senderId, input) {
    try {
        const room = games[chatId];
        if (!room) return; // no game in this chat — silently ignore

        // Must be a full game (both players present)
        if (!room.playerO) return;

        const game = room.game;
        const isPlayer = [room.playerX, room.playerO].includes(senderId);
        if (!isPlayer) return; // not a player in this game

        // ── Surrender ──
        if (input === 'surrender' || input === '.surrender') {
            const opponent = room.playerX === senderId ? room.playerO : room.playerX;
            delete games[chatId];
            await sock.sendMessage(chatId, {
                text: `🎩 @${senderId.split('@')[0]} abandonne la partie.\n` +
                      `🏆 @${opponent.split('@')[0]} remporte la victoire par forfait !\n\n` +
                      `> _"Alfred referme la salle de jeu."_ 🎩`,
                mentions: [senderId, opponent]
            });
            return;
        }

        // ── Validate it's this player's turn ──
        if (game.currentTurn !== senderId) {
            await sock.sendMessage(chatId, {
                text: `🎩 Ce n'est pas votre tour, Monsieur. Attendez votre adversaire. 🕯️`
            });
            return;
        }

        // ── Parse position 1-9 → 0-8 ──
        const pos = parseInt(input) - 1;
        if (isNaN(pos) || pos < 0 || pos > 8) {
            await sock.sendMessage(chatId, {
                text: `🎩 Position invalide, Monsieur. Choisissez un chiffre entre *1* et *9*.`
            });
            return;
        }

        const result = game.turn(senderId, pos);

        if (result === 0) {
            await sock.sendMessage(chatId, {
                text: `🎩 Cette case est déjà occupée, Monsieur. Choisissez-en une autre.`
            });
            return;
        }
        if (result === -1) {
            await sock.sendMessage(chatId, {
                text: `🎩 Coup invalide, Monsieur. Choisissez un chiffre entre *1* et *9*.`
            });
            return;
        }

        const board = renderBoard(game);
        const winner = game.winner;
        const isDraw = !winner && game.turns >= 9;

        if (winner) {
            delete games[chatId];
            await sock.sendMessage(chatId, {
                text: `🎩 *Partie terminée — Maison VALENHART*\n\n${board}\n\n` +
                      `🏆 @${winner.split('@')[0]} remporte la victoire !\n\n` +
                      `> _"La Maison VALENHART félicite le vainqueur."_ — Alfred 🎩`,
                mentions: [room.playerX, room.playerO]
            });

        } else if (isDraw) {
            delete games[chatId];
            await sock.sendMessage(chatId, {
                text: `🎩 *Match nul — Maison VALENHART*\n\n${board}\n\n` +
                      `> _"Un résultat équilibré, digne de deux joueurs d'égale valeur."_ — Alfred 🎩`,
                mentions: [room.playerX, room.playerO]
            });

        } else {
            const next = game.currentTurn;
            const nextSymbol = next === room.playerX ? '✖️' : '⭕';
            await sock.sendMessage(chatId, {
                text: `${board}\n\n` +
                      `> ${nextSymbol} @${next.split('@')[0]}, c'est votre tour. Tapez un chiffre *1-9*. 🎩`,
                mentions: [next]
            });
        }

    } catch (err) {
        console.error('TicTacToe move error:', err.message);
    }
}

module.exports = { tictactoeCommand, handleTicTacToeMove, games };
