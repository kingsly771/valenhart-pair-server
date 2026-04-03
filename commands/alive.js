const settings = require('../settings');
const fs = require('fs');
const path = require('path');

const ALFRED_IMAGES = [
    'alfred_1.jpg',
    'alfred_2.jpg',
    'alfred_3.jpg',
    'alfred_4.jpg'
];

let imgIndex = 0;

async function aliveCommand(sock, chatId, message) {
    const uptime = process.uptime();
    const d = Math.floor(uptime / 86400);
    const h = Math.floor((uptime % 86400) / 3600);
    const m = Math.floor((uptime % 3600) / 60);
    const s = Math.floor(uptime % 60);

    const text =
`┏━━━━━━━━━━━━━━━━━━━━━━━┓
┃  🎩  *MAISON VALENHART*  🎩
┗━━━━━━━━━━━━━━━━━━━━━━━┛

╭────〔 ✦ STATUT 〕────
│ 🟢 *Alfred est en service*
│ 🫡 *Majordome :* Alfred
│ 👑 *Maître :* ${settings.botOwner}
│ 📋 *Version :* v${settings.version}
╰──────────────────────────

╭────〔 ⏱️ TEMPS DE SERVICE 〕────
│ ${d}j ${h}h ${m}m ${s}s
╰──────────────────────────

┏━━━━━━━━━━━━━━━━━━━━━━━┓
┃ _"Je suis à votre service,_
┃  _Monsieur — comme toujours."_
┃              — *Alfred* 🎩
┗━━━━━━━━━━━━━━━━━━━━━━━┛`;

    // Rotate alfred images
    const imgName = ALFRED_IMAGES[imgIndex % ALFRED_IMAGES.length];
    imgIndex++;
    const imgPath = path.join(__dirname, '../assets', imgName);

    try {
        if (fs.existsSync(imgPath)) {
            await sock.sendMessage(chatId, {
                image: fs.readFileSync(imgPath),
                caption: text
            }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, { text }, { quoted: message });
        }
    } catch (error) {
        await sock.sendMessage(chatId, { text }, { quoted: message });
    }
}

module.exports = aliveCommand;
