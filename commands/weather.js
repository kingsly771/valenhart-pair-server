const axios = require('axios');

module.exports = async function (sock, chatId, message, city) {
    if (!city) {
        await sock.sendMessage(chatId, {
            text: '🎩 Monsieur, puis-je vous demander quelle ville souhaitez-vous que je consulte ? Exemple : *.weather Paris*'
        }, { quoted: message });
        return;
    }
    try {
        const apiKey = '4902c0f2550f58298ad4146a92b65e10';
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);
        const w = response.data;
        const desc = w.weather[0].description;
        const temp = w.main.temp;
        const feels = w.main.feels_like;
        const humidity = w.main.humidity;

        await sock.sendMessage(chatId, {
            text: `🎩 *Rapport météorologique — ${w.name}*\n*présenté par Alfred, Maison VALENHART*\n\n` +
                  `🌤️ *Conditions :* ${desc}\n` +
                  `🌡️ *Température :* ${temp}°C _(ressenti ${feels}°C)_\n` +
                  `💧 *Humidité :* ${humidity}%\n\n` +
                  `> _Je vous conseille de vous habiller en conséquence, Monsieur._ ✨`
        }, { quoted: message });
    } catch (error) {
        console.error('Error fetching weather:', error);
        await sock.sendMessage(chatId, {
            text: '🎩 Je suis au regret, Monsieur, de ne pouvoir vous communiquer les conditions météorologiques. Vérifiez le nom de la ville, je vous prie.'
        }, { quoted: message });
    }
};
