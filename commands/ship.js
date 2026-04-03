async function shipCommand(sock, chatId, msg, senderId, mentionedJid = []) {
    try {
        const participants = await sock.groupMetadata(chatId);
        const ps = participants.participants.map(v => v.id);

        if (ps.length < 2) {
            await sock.sendMessage(chatId, {
                text: '🎩 Il faut au moins deux personnes dans cette demeure pour que je puisse officier, Monsieur.'
            }, { quoted: msg });
            return;
        }

        let firstUser = senderId;
        let secondUser;

        // If the user tagged someone, ship them with the tagged person
        if (mentionedJid && mentionedJid.length > 0) {
            secondUser = mentionedJid[0];
            if (secondUser === firstUser) {
                await sock.sendMessage(chatId, {
                    text: `🎩 Vous ne pouvez pas vous shiper avec vous-même, Monsieur. Taguez quelqu'un d'autre.`
                }, { quoted: msg });
                return;
            }
        } else {
            // No tag — pick a random partner from the group
            const others = ps.filter(p => p !== firstUser);
            if (others.length === 0) {
                await sock.sendMessage(chatId, {
                    text: '🎩 Il n\'y a personne d\'autre dans ce groupe, Monsieur.'
                }, { quoted: msg });
                return;
            }
            secondUser = others[Math.floor(Math.random() * others.length)];
        }

        // Deterministic score — same pair always gets same result
        const combined = [firstUser, secondUser].sort().join('');
        let hash = 0;
        for (let i = 0; i < combined.length; i++) {
            hash = (hash << 5) - hash + combined.charCodeAt(i);
            hash |= 0;
        }
        const compatibility = Math.abs(hash % 101); // 0–100%

        // Verdict tiers
        let verdictLabel, verdictQuote, emoji;
        if (compatibility >= 90) {
            emoji = '💘';
            verdictLabel = 'Âmes sœurs ✨';
            verdictQuote = [
                'Alfred ne pouvait rêver meilleure alliance. C\'est le destin lui-même qui parle.',
                'Les étoiles ont tracé vos noms ensemble depuis la nuit des temps.',
                'Une union parfaite. La Maison VALENHART en est honorée.'
            ];
        } else if (compatibility >= 75) {
            emoji = '❤️';
            verdictLabel = 'Grande compatibilité';
            verdictQuote = [
                'Alfred bénit cette rencontre de tout son cœur.',
                'La Maison VALENHART sourit à cette belle alliance.',
                'Un mariage de raison et de sentiment. Alfred approuve.'
            ];
        } else if (compatibility >= 50) {
            emoji = '💛';
            verdictLabel = 'Compatibilité correcte';
            verdictQuote = [
                'Du potentiel, mais l\'effort sera nécessaire, Monsieur.',
                'Alfred voit une lueur d\'espoir. À cultiver avec soin.',
                'Pas parfait, mais rien n\'est impossible avec de la bonne volonté.'
            ];
        } else if (compatibility >= 25) {
            emoji = '🧡';
            verdictLabel = 'Compatibilité faible';
            verdictQuote = [
                'Alfred lève un sourcil dubitatif. La route sera longue.',
                'Les registres sont mitigés. Beaucoup de patience requise.',
                'Cette alliance n\'est pas sans espoir, mais elle défie la raison.'
            ];
        } else {
            emoji = '💔';
            verdictLabel = 'Incompatibilité totale';
            verdictQuote = [
                'Alfred secoue tristement la tête. Les registres sont catégoriques.',
                'La Maison VALENHART déconseille formellement cette union.',
                'Même avec la meilleure volonté du monde... non. Juste non.'
            ];
        }

        const chosenQuote = verdictQuote[Math.floor(Math.random() * verdictQuote.length)];

        // Heart progress bar
        const filled = Math.round(compatibility / 10);
        const empty = 10 - filled;
        const bar = '❤️'.repeat(filled) + '🖤'.repeat(empty);

        const user1 = firstUser.split('@')[0];
        const user2 = secondUser.split('@')[0];

        // Generate ship name from phone digits → fun syllable combo
        const digits1 = user1.replace(/\D/g, "");
        const digits2 = user2.replace(/\D/g, "");
        const part1 = digits1.slice(-4, -2);
        const part2 = digits2.slice(-2);
        const syllables = ["AL","VA","RI","SO","MA","KA","LI","NO","TE","ZE","MI","RO","SA","DA","NA","BO","CO","FE","LU","TO"];
        const syl1 = syllables[parseInt(part1 || "0") % syllables.length];
        const syl2 = syllables[parseInt(part2 || "0") % syllables.length];
        const shipName = syl1 + syl2;

        await sock.sendMessage(chatId, {
            text:
                `🎩 *Alfred — Test de Compatibilité*\n` +
                `┏━━━━━━━━━━━━━━━━━━━━━━━┓\n` +
                `┃  ${emoji}  *SHIP METER*\n` +
                `┗━━━━━━━━━━━━━━━━━━━━━━━┛\n` +
                `╭────〔 ✦ ANALYSE 〕────\n` +
                `│ 💑 @${user1}\n` +
                `│       ×\n` +
                `│ 💑 @${user2}\n` +
                `│\n` +
                `│ 🏷️ Ship Name : *${shipName}*\n` +
                `│ 📊 Score : *${compatibility}%*\n` +
                `│ ${bar}\n` +
                `│\n` +
                `│ 🎯 Verdict : *${verdictLabel}*\n` +
                `╰──────────────────────────\n` +
                `> _"${chosenQuote}"_\n` +
                `> — Alfred, Majordome de la Maison VALENHART 🎩`,
            mentions: [firstUser, secondUser]
        }, { quoted: msg });

    } catch (error) {
        console.error('Error in ship command:', error);
        await sock.sendMessage(chatId, {
            text: '🎩 Je suis dans l\'impossibilité de consulter les registres pour le moment. Assurez-vous que nous sommes bien dans un groupe, Monsieur.'
        }, { quoted: msg });
    }
}

module.exports = shipCommand;
