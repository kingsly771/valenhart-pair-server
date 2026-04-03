async function groupInfoCommand(sock, chatId, msg) {
    try {
        const g = await sock.groupMetadata(chatId);
        let pp;
        try { pp = await sock.profilePictureUrl(chatId, 'image'); } catch { pp = null; }

        const admins = g.participants.filter(p => p.admin);
        const owner = g.owner || admins.find(p => p.admin === 'superadmin')?.id;
        const listAdmin = admins.map((v, i) => `│ ${i+1}. @${v.id.split('@')[0]}`).join('\n');

        const text =
`┏━━━━━━━━━━━━━━━━━━━━━━━┓
┃  🏛️  *REGISTRE DU GROUPE*
┗━━━━━━━━━━━━━━━━━━━━━━━┛

╭────〔 📋 INFORMATIONS 〕────
│ 🏷️ *Nom :* ${g.subject}
│ 👥 *Membres :* ${g.participants.length}
│ 👑 *Créateur :* @${owner?.split('@')[0] || 'N/A'}
╰──────────────────────────

╭────〔 🛡️ ADMINISTRATEURS 〕────
${listAdmin}
╰──────────────────────────

╭────〔 📜 DESCRIPTION 〕────
│ ${g.desc?.toString() || 'Aucune description.'}
╰──────────────────────────

┏━━━━━━━━━━━━━━━━━━━━━━━┓
┃ _"Alfred maintient les registres_
┃  _avec la plus grande rigueur."_ 🎩
┗━━━━━━━━━━━━━━━━━━━━━━━┛`;

        const opts = { mentions: [...admins.map(v => v.id), owner].filter(Boolean) };
        if (pp) {
            await sock.sendMessage(chatId, { image: { url: pp }, caption: text, ...opts }, { quoted: msg });
        } else {
            await sock.sendMessage(chatId, { text, ...opts }, { quoted: msg });
        }
    } catch (error) {
        await sock.sendMessage(chatId, { text: '🎩 Le registre du groupe est momentanément inaccessible, Monsieur.' }, { quoted: msg });
    }
}

module.exports = groupInfoCommand;
