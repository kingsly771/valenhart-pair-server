const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const settings = require('../settings');

async function pairCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const phone = text.split(' ')[1]?.trim().replace(/\D/g, '');

        if (!phone || phone.length < 7) {
            await sock.sendMessage(chatId, {
                text: `🎩 *Alfred — Jumelage de Compte*\n\n` +
                      `Pour jumeler un compte à la Maison VALENHART :\n\n` +
                      `📌 *.pair <numéro>*\n` +
                      `_Exemple : .pair 237600000000_\n\n` +
                      `> _"Alfred assure la sécurité de chaque connexion."_ 🔐`
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { text: '🎩 *Alfred génère votre code de jumelage, Monsieur...*\n_Un instant de patience._' }, { quoted: message });

        const code = await sock.requestPairingCode(phone);
        await sock.sendMessage(chatId, {
            text: `🎩 *Code de Jumelage — Maison VALENHART*\n\n` +
                  `📱 *Numéro :* +${phone}\n` +
                  `🔑 *Code :* *${code}*\n\n` +
                  `📋 *Instructions :*\n` +
                  `1. Ouvrez WhatsApp → Paramètres\n` +
                  `2. Appareils associés → Associer un appareil\n` +
                  `3. Entrez le code ci-dessus\n\n` +
                  `> _"Alfred vous garantit une connexion sécurisée à la Maison VALENHART."_ 🎩`
        }, { quoted: message });
    } catch (error) {
        console.error('Error in pair command:', error);
        await sock.sendMessage(chatId, { text: '🎩 Le jumelage a rencontré un contretemps, Monsieur. Vérifiez le numéro et réessayez.' }, { quoted: message });
    }
}

module.exports = pairCommand;
