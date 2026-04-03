async function clearCommand(sock, chatId, message) {
    try {
        const sent = await sock.sendMessage(chatId, { text: '🎩 Alfred nettoie ses traces, Monsieur...' }, { quoted: message });
        await sock.sendMessage(chatId, { delete: sent.key });
    } catch (error) {
        console.error('Error clearing messages:', error);
        await sock.sendMessage(chatId, { text: '🎩 Un contretemps m\'a empêché d\'effacer ces messages, Monsieur.' }, { quoted: message });
    }
}
module.exports = { clearCommand };
