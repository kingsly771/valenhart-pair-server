const fetch = require('node-fetch');

async function truthCommand(sock, chatId, message) {
    try {
        const res = await fetch(`https://shizoapi.onrender.com/api/texts/truth?apikey=shizo`);
        if (!res.ok) throw await res.text();
        const json = await res.json();
        await sock.sendMessage(chatId, {
            text: `🎩 *Alfred vous soumet cette question de vérité, Monsieur :*\n\n🕯️ _"${json.result}"_\n\n> _La vérité, bien que parfois inconfortable, est toujours de bon goût._ ✨`
        }, { quoted: message });
    } catch (error) {
        console.error('Error in truth command:', error);
        await sock.sendMessage(chatId, {
            text: '🎩 Les archives de la vérité me font défaut pour l\'instant, Monsieur. Un moment de patience, je vous prie.'
        }, { quoted: message });
    }
}

module.exports = { truthCommand };
