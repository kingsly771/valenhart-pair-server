const axios = require('axios');
const fetch = require('node-fetch');

async function aiCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        if (!text) {
            return await sock.sendMessage(chatId, {
                text: '🎩 Monsieur, puis-je vous demander de formuler votre requête ?\n\nExemple : *.gpt écris-moi un sonnet* ou *.gemini explique la relativité*'
            }, { quoted: message });
        }

        const parts = text.split(' ');
        const command = parts[0].toLowerCase();
        const query = parts.slice(1).join(' ').trim();

        if (!query) {
            return await sock.sendMessage(chatId, {
                text: '🎩 Veuillez formuler votre demande après la commande, Monsieur. Alfred est à l\'écoute.'
            }, { quoted: message });
        }

        await sock.sendMessage(chatId, { react: { text: '🎩', key: message.key } });

        if (command === '.gpt') {
            const response = await axios.get(`https://zellapi.autos/ai/chatbot?text=${encodeURIComponent(query)}`);
            if (response.data?.status && response.data?.result) {
                await sock.sendMessage(chatId, {
                    text: `🎩 *Alfred transmet la réponse de l'Oracle GPT, Monsieur :*\n\n${response.data.result}`
                }, { quoted: message });
            } else throw new Error('Invalid response');
        } else if (command === '.gemini') {
            const response = await axios.get(`https://zellapi.autos/ai/gemini?text=${encodeURIComponent(query)}`);
            if (response.data?.status && response.data?.result) {
                await sock.sendMessage(chatId, {
                    text: `🎩 *Alfred transmet la réponse de Gemini, Monsieur :*\n\n${response.data.result}`
                }, { quoted: message });
            } else throw new Error('Invalid response');
        }
    } catch (error) {
        console.error('Error in AI command:', error);
        await sock.sendMessage(chatId, {
            text: '🎩 L\'Oracle est momentanément silencieux, Monsieur. Veuillez réessayer dans un instant.'
        }, { quoted: message });
    }
}

module.exports = aiCommand;
