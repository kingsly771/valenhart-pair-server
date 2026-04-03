// 🧹 Fix for ENOSPC / temp overflow in hosted panels
const fs = require('fs');
const path = require('path');

// Redirect temp storage away from system /tmp
const customTemp = path.join(process.cwd(), 'temp');
if (!fs.existsSync(customTemp)) fs.mkdirSync(customTemp, { recursive: true });
process.env.TMPDIR = customTemp;
process.env.TEMP = customTemp;
process.env.TMP = customTemp;

// Auto-cleaner every 3 hours
setInterval(() => {
    fs.readdir(customTemp, (err, files) => {
        if (err) return;
        for (const file of files) {
            const filePath = path.join(customTemp, file);
            fs.stat(filePath, (err, stats) => {
                if (!err && Date.now() - stats.mtimeMs > 3 * 60 * 60 * 1000) {
                    fs.unlink(filePath, () => { });
                }
            });
        }
    });
    console.log('🧹 Temp folder auto-cleaned');
}, 3 * 60 * 60 * 1000);

const settings = require('./settings');
require('./config.js');
const { isBanned } = require('./lib/isBanned');
const { fetchBuffer } = require('./lib/myfunc');
const fetch = require('node-fetch');
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const { isSudo } = require('./lib/index');
const isOwnerOrSudo = require('./lib/isOwner');
const { autotypingCommand, isAutotypingEnabled, handleAutotypingForMessage, handleAutotypingForCommand, showTypingAfterCommand } = require('./commands/autotyping');
const { autoreadCommand, isAutoreadEnabled, handleAutoread } = require('./commands/autoread');

// Command imports
const tagAllCommand = require('./commands/tagall');
const helpCommand = require('./commands/help');
const banCommand = require('./commands/ban');
const { promoteCommand } = require('./commands/promote');
const { demoteCommand } = require('./commands/demote');
const muteCommand = require('./commands/mute');
const unmuteCommand = require('./commands/unmute');
const stickerCommand = require('./commands/sticker');
const isAdmin = require('./lib/isAdmin');
const warnCommand = require('./commands/warn');
const warningsCommand = require('./commands/warnings');
const ttsCommand = require('./commands/tts');
const { tictactoeCommand, handleTicTacToeMove } = require('./commands/tictactoe');
const { incrementMessageCount, topMembers } = require('./commands/topmembers');
const { rankCommand, classeCommand, classementCommand } = require('./commands/rank');
const { cmdLoup, cmdJoin, cmdPlayers, cmdStart, cmdStop, cmdGuide, handleDM: lgHandleDM } = require('./commands/loupgarou');
const {
    mariageCommand, accepterCommand, refuserCommand, divorceCommand,
    adopterCommand, enfantCommand, frereCommand, soeurCommand,
    quitterCommand, familleCommand, arbreCommand, statsCommand: familleStatsCommand
} = require('./commands/famille');
const {
    bfTresorCommand, bfDepotCommand, bfDonCommand,
    bfPayerCommand, bfHistoriqueCommand
} = require('./commands/banquefamiliale');
const {
    marcheCommand, acheterCommand, inventaireCommand, revendreCommand
} = require('./commands/marche');
const { permitCommand, hackCommand } = require('./commands/hack');
const { guideCommand } = require('./commands/guide');
const ownerCommand = require('./commands/owner');
const deleteCommand = require('./commands/delete');
const { handleAntilinkCommand, handleLinkDetection } = require('./commands/antilink');
const { handleAntitagCommand, handleTagDetection } = require('./commands/antitag');
const { handleBroadcast } = require('./commands/broadcast');
const { gstatusCommand } = require('./commands/gstatus');
const { newsletterCommand, initNewsletter, newsletterJidCommand } = require('./commands/newsletter');
const { handleMentionDetection, mentionToggleCommand, setMentionCommand } = require('./commands/mention');
const memeCommand = require('./commands/meme');
const tagCommand = require('./commands/tag');
const tagNotAdminCommand = require('./commands/tagnotadmin');
const hideTagCommand = require('./commands/hidetag');
const jokeCommand = require('./commands/joke');
const quoteCommand = require('./commands/quote');
const factCommand = require('./commands/fact');
const weatherCommand = require('./commands/weather');
const newsCommand = require('./commands/news');
const kickCommand = require('./commands/kick');
const { convertStickerToImage: simageCommand } = require("./commands/simage");
const attpCommand = require('./commands/attp');
const { startHangman, guessLetter } = require('./commands/hangman');
const { startTrivia, answerTrivia } = require('./commands/trivia');
const { complimentCommand } = require('./commands/compliment');
const { insultCommand } = require('./commands/insult');
const { eightBallCommand } = require('./commands/eightball');
const { lyricsCommand } = require('./commands/lyrics');
const { dareCommand } = require('./commands/dare');
const { truthCommand } = require('./commands/truth');
const { clearCommand } = require('./commands/clear');
const pingCommand = require('./commands/ping');
const aliveCommand = require('./commands/alive');
const blurCommand = require('./commands/img-blur');
const { welcomeCommand, goodbyeCommand, handleJoinEvent, handleLeaveEvent } = require('./commands/welcome');
// goodbye merged into welcome.js
const githubCommand = require('./commands/github');
const { handleAntiBadwordCommand, handleBadwordDetection } = require('./lib/antibadword');
const antibadwordCommand = require('./commands/antibadword');
const { handleChatbotCommand, handleChatbotResponse } = require('./commands/chatbot');
const takeCommand = require('./commands/take');
const { flirtCommand } = require('./commands/flirt');
const characterCommand = require('./commands/character');
const wastedCommand = require('./commands/wasted');
const shipCommand = require('./commands/ship');
const {
    soldeCommand, dailyCommand, rouletteCommand, travailCommand,
    crimeCommand, volCommand, pariCommand, minesCommand,
    duelCommand, banqueCommand, transfertCommand, richCommand, lotoCommand,
    blackjackCommand, pokerCommand, banditCommand, investirCommand,
    quizecoCommand, handleQuizAnswer, grattageCommand, coffreCommand,
    jackpotCommand, statistiquesCommand
} = require('./commands/economy');
const groupInfoCommand = require('./commands/groupinfo');
const resetlinkCommand = require('./commands/resetlink');
const staffCommand = require('./commands/staff');
const unbanCommand = require('./commands/unban');
const emojimixCommand = require('./commands/emojimix');
const { handlePromotionEvent } = require('./commands/promote');
const { handleDemotionEvent } = require('./commands/demote');
const viewOnceCommand = require('./commands/viewonce');
const clearSessionCommand = require('./commands/clearsession');
const { autoStatusCommand, handleStatusUpdate } = require('./commands/autostatus');
const { simpCommand } = require('./commands/simp');
const { stupidCommand } = require('./commands/stupid');
const stickerTelegramCommand = require('./commands/stickertelegram');
const textmakerCommand = require('./commands/textmaker');
const { handleAntideleteCommand, handleMessageRevocation, storeMessage } = require('./commands/antidelete');
const clearTmpCommand = require('./commands/cleartmp');
const setProfilePicture = require('./commands/setpp');
const groupManageCommand = require('./commands/groupmanage');
const setGroupDescription = (sock, chatId, senderId, text, message) => groupManageCommand(sock, chatId, senderId, 'setgdesc', text, message);
const setGroupName = (sock, chatId, senderId, text, message) => groupManageCommand(sock, chatId, senderId, 'setgname', text, message);
const setGroupPhoto = (sock, chatId, senderId, message) => groupManageCommand(sock, chatId, senderId, 'setgpp', null, message);
const instagramCommand = require('./commands/instagram');
const facebookCommand = require('./commands/facebook');
const spotifyCommand = require('./commands/spotify');
const playCommand = require('./commands/play');
const tiktokCommand = require('./commands/tiktok');
const songCommand = require('./commands/song');
const aiCommand = require('./commands/ai');
const urlCommand = require('./commands/url');
const { handleTranslateCommand } = require('./commands/translate');
const { handleSsCommand } = require('./commands/ss');
const { addCommandReaction, handleAreactCommand } = require('./lib/reactions');
const { goodnightCommand } = require('./commands/goodnight');
const { shayariCommand } = require('./commands/shayari');
const { rosedayCommand } = require('./commands/roseday');
const imagineCommand = require('./commands/imagine');
const videoCommand = require('./commands/video');
const sudoCommand = require('./commands/sudo');
const { miscCommand, handleHeart } = require('./commands/misc');
const { animeCommand } = require('./commands/anime');
const gifCommand = require('./commands/gif');
const { piesCommand, piesAlias } = require('./commands/pies');
const stickercropCommand = require('./commands/stickercrop');
const updateCommand = require('./commands/update');
const removebgCommand = require('./commands/removebg');
const { reminiCommand } = require('./commands/remini');
const { igsCommand } = require('./commands/igs');
const { anticallCommand, readState: readAnticallState } = require('./commands/anticall');
const { pmblockerCommand, readState: readPmBlockerState } = require('./commands/pmblocker');
const settingsCommand = require('./commands/settings');
const soraCommand = require('./commands/sora');

// Global settings
global.packname = settings.packname;
global.author = settings.author;
const channelInfo = {};

async function handleMessages(sock, messageUpdate, printLog) {
    try {
        const { messages, type } = messageUpdate;
        if (type !== 'notify') return;

        const message = messages[0];
        if (!message?.message) return;

        // Handle autoread functionality
        await handleAutoread(sock, message);

        // Store message for antidelete feature
        if (message.message) {
            storeMessage(sock, message);
        }

        // Handle message revocation
        if (message.message?.protocolMessage?.type === 0) {
            await handleMessageRevocation(sock, message);
            return;
        }

        const chatId = message.key.remoteJid;
        const senderId = message.key.participant || message.key.remoteJid;
        const isGroup = chatId.endsWith('@g.us');
        const senderIsSudo = await isSudo(senderId);
        const senderIsOwnerOrSudo = await isOwnerOrSudo(senderId, sock, chatId);

        // Handle button responses
        if (message.message?.buttonsResponseMessage) {
            const buttonId = message.message.buttonsResponseMessage.selectedButtonId;
            const chatId = message.key.remoteJid;

            if (buttonId === 'channel') {
                await sock.sendMessage(chatId, {
                    text: '🎩 La Maison VALENHART vous remercie, Monsieur.'
                }, { quoted: message });
                return;
            } else if (buttonId === 'owner') {
                const ownerCommand = require('./commands/owner');
                await ownerCommand(sock, chatId);
                return;
            } else if (buttonId === 'support') {
                await sock.sendMessage(chatId, {
                    text: '🎩 *Alfred — Support de la Maison VALENHART*\n\nContactez le Maître pour toute assistance, Monsieur.'
                }, { quoted: message });
                return;
            }
        }

        const userMessage = (
            message.message?.conversation?.trim() ||
            message.message?.extendedTextMessage?.text?.trim() ||
            message.message?.imageMessage?.caption?.trim() ||
            message.message?.videoMessage?.caption?.trim() ||
            message.message?.buttonsResponseMessage?.selectedButtonId?.trim() ||
            ''
        ).toLowerCase().replace(/\.\s+/g, '.').trim();

        // Preserve raw message for commands like .tag that need original casing
        const rawText = message.message?.conversation?.trim() ||
            message.message?.extendedTextMessage?.text?.trim() ||
            message.message?.imageMessage?.caption?.trim() ||
            message.message?.videoMessage?.caption?.trim() ||
            '';

        // Only log command usage
        if (userMessage.startsWith('.')) {
            console.log(`📝 Command used in ${isGroup ? 'group' : 'private'}: ${userMessage}`);
        }
        // Read bot mode once; don't early-return so moderation can still run in private mode
        let isPublic = true;
        try {
            const data = JSON.parse(fs.readFileSync('./data/messageCount.json'));
            if (typeof data.isPublic === 'boolean') isPublic = data.isPublic;
        } catch (error) {
            console.error('Error checking access mode:', error);
            // default isPublic=true on error
        }
        const isOwnerOrSudoCheck = message.key.fromMe || senderIsOwnerOrSudo;
        // Check if user is banned (skip ban check for unban command)
        if (isBanned(senderId) && !userMessage.startsWith('.unban')) {
            // Only respond occasionally to avoid spam
            if (Math.random() < 0.1) {
                await sock.sendMessage(chatId, {
                    text: '🎩 Vous êtes banni de la Maison VALENHART, Monsieur. Contactez un administrateur.'
                });
            }
            return;
        }

        // First check if it's a game move (only if active game exists in this chat)
        if (/^[1-9]$/.test(userMessage) || userMessage.toLowerCase() === 'surrender') {
            const { games: tttGames } = require('./commands/tictactoe');
            if (tttGames[chatId] && tttGames[chatId].playerO) {
                await handleTicTacToeMove(sock, chatId, senderId, userMessage);
                return;
            }
        }

        /*  // Basic message response in private chat
          if (!isGroup && (userMessage === 'hi' || userMessage === 'hello' || userMessage === 'bot' || userMessage === 'hlo' || userMessage === 'hey' || userMessage === 'bro')) {
              await sock.sendMessage(chatId, {
                  text: 'Hi, How can I help you?\nYou can use .menu for more info and commands.',
                  ...channelInfo
              });
              return;
          } */

        if (!message.key.fromMe) {
            // Normalize JID: strip device suffix (e.g. "phone@s.whatsapp.net:13" → "phone@s.whatsapp.net")
            const normalizedSender = senderId.includes(':') ? senderId.split(':')[0] + '@s.whatsapp.net' : senderId;
            incrementMessageCount(chatId, normalizedSender);
        }

        // Check for bad words and antilink FIRST, before ANY other processing
        // Always run moderation in groups, regardless of mode
        if (isGroup) {
            if (userMessage) {
                await handleBadwordDetection(sock, chatId, message, userMessage, senderId);
            }
            // Antilink: instant delete + kick on any link
            await handleLinkDetection(sock, chatId, message, senderId);
            // Antitag: instant delete + kick if owner/sudo is tagged (no admin exemption)
            await handleTagDetection(sock, chatId, message, senderId);
        }

        // PM blocker: block non-owner DMs when enabled (do not ban)
        // Exception: Loup-Garou players in active game can always send DM actions
        if (!isGroup && !message.key.fromMe && !senderIsSudo) {
            try {
                const pmState = readPmBlockerState();
                if (pmState.enabled) {
                    // Check if this sender is in an active LG game — exempt them
                    const { GAMES: lgGames } = require('./commands/loupgarou');
                    const normSenderDM = senderId.includes(':') ? senderId.split(':')[0] + '@s.whatsapp.net' : senderId;
                    const isLGPlayer = [...lgGames.values()].some(g => g.players.includes(normSenderDM));
                    if (!isLGPlayer) {
                        // Inform user, delay, then block without banning globally
                        await sock.sendMessage(chatId, { text: pmState.message || `🎩 *Bonsoir, Monsieur.*\n\nJe suis Alfred, majordome de la Maison VALENHART.\nLes messages privés ne sont pas acceptés pour le moment.\n\n> _"La Maison VALENHART vous remercie de votre compréhension."_ 🎩` }, { quoted: message }).catch(() => {});
                        return;
                    }
                }
            } catch (e) { }
        }

        // Then check for command prefix
        if (!userMessage.startsWith('.')) {
            // Show typing indicator if autotyping is enabled
            await handleAutotypingForMessage(sock, chatId, userMessage);

            // ── Loup-Garou : commandes groupe (! prefix) ──────────────────────
            if (isGroup) {
                const lgCmd = userMessage.trim().toLowerCase();
                if (lgCmd === '!loup') {
                    await cmdLoup(sock, chatId, senderId, message); return;
                }
                if (lgCmd === '!join') {
                    await cmdJoin(sock, chatId, senderId, message); return;
                }
                if (lgCmd === '!players') {
                    await cmdPlayers(sock, chatId, message); return;
                }
                if (lgCmd === '!start') {
                    await cmdStart(sock, chatId, senderId, message); return;
                }
                if (lgCmd === '!stop') {
                    const adminStatus = await isAdmin(sock, chatId, senderId);
                    await cmdStop(sock, chatId, senderId, message, adminStatus.isSenderAdmin); return;
                }
                if (lgCmd === '!guide') {
                    await cmdGuide(sock, chatId, message); return;
                }
            }

            // ── Loup-Garou : actions en DM (nuit/vote) ────────────────────────
            if (!isGroup && !message.key.fromMe) {
                const lgCmds = ['vote ', 'voir ', 'sauver', 'tuer ', 'passer', 'chasser '];
                if (lgCmds.some(c => userMessage.trim().toLowerCase().startsWith(c))) {
                    await lgHandleDM(sock, senderId, userMessage.trim()); return;
                }
            }

            if (isGroup) {
                // Antitag already runs in the early moderation block above
                await handleMentionDetection(sock, chatId, message);

                // Only run chatbot in public mode or for owner/sudo
                if (isPublic || isOwnerOrSudoCheck) {
                    await handleChatbotResponse(sock, chatId, message, userMessage, senderId);
                }
            }
            return;
        }
        // In private mode, only owner/sudo can run commands
        if (!isPublic && !isOwnerOrSudoCheck) {
            return;
        }

        // List of admin commands
        const adminCommands = ['.mute', '.unmute', '.ban', '.unban', '.promote', '.demote', '.kick', '.tagall', '.tagnotadmin', '.hidetag', '.antilink', '.antitag', '.setgdesc', '.setgname', '.setgpp'];
        const isAdminCommand = adminCommands.some(cmd => userMessage.startsWith(cmd));

        // List of owner commands
        const ownerCommands = ['.mode', '.autostatus', '.antidelete', '.cleartmp', '.setpp', '.clearsession', '.areact', '.autoreact', '.autotyping', '.autoread', '.pmblocker', '.broadcast', '.gstatus', '.newsletter'];
        const isOwnerCommand = ownerCommands.some(cmd => userMessage.startsWith(cmd));

        let isSenderAdmin = false;
        let isBotAdmin = false;

        // Check admin status only for admin commands in groups
        if (isGroup && isAdminCommand) {
            const adminStatus = await isAdmin(sock, chatId, senderId);
            isSenderAdmin = adminStatus.isSenderAdmin;
            isBotAdmin = adminStatus.isBotAdmin;

            if (!isBotAdmin) {
                await sock.sendMessage(chatId, { text: '🎩 Il me faudrait les prérogatives d\'administrateur pour exécuter cette commande, Monsieur.' }, { quoted: message });
                return;
            }

            if (
                userMessage.startsWith('.mute') ||
                userMessage === '.unmute' ||
                userMessage.startsWith('.ban') ||
                userMessage.startsWith('.unban') ||
                userMessage.startsWith('.promote') ||
                userMessage.startsWith('.demote')
            ) {
                if (!isSenderAdmin && !message.key.fromMe) {
                    await sock.sendMessage(chatId, { text: '🎩 Cette commande est réservée aux administrateurs de la Maison, Monsieur.' }, { quoted: message });
                    return;
                }
            }
        }

        // Check owner status for owner commands
        if (isOwnerCommand) {
            if (!message.key.fromMe && !senderIsOwnerOrSudo) {
                await sock.sendMessage(chatId, { text: '🎩 Cette commande est réservée au Maître de la Maison VALENHART, Monsieur.' }, { quoted: message });
                return;
            }
        }

        // Command handlers - Execute commands immediately without waiting for typing indicator
        // We'll show typing indicator after command execution if needed
        let commandExecuted = false;

        switch (true) {
            case userMessage === '.simage': {
                const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                if (quotedMessage?.stickerMessage) {
                    await simageCommand(sock, quotedMessage, chatId, message);
                } else {
                    await sock.sendMessage(chatId, { text: '🎩 Monsieur, veuillez répondre à un sticker avec *.simage* pour le convertir.' }, { quoted: message });
                }
                commandExecuted = true;
                break;
            }
            case userMessage === '.kickall':
                {
                    const kickallCommand = require('./commands/kickall');
                    await kickallCommand(sock, chatId, senderId, message);
                }
                break;
            case userMessage.startsWith('.kick'):
                const mentionedJidListKick = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await kickCommand(sock, chatId, senderId, mentionedJidListKick, message);
                break;
            case userMessage.startsWith('.mute'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const muteArg = parts[1];
                    const muteDuration = muteArg !== undefined ? parseInt(muteArg, 10) : undefined;
                    if (muteArg !== undefined && (isNaN(muteDuration) || muteDuration <= 0)) {
                        await sock.sendMessage(chatId, { text: '🎩 Veuillez préciser une durée valide en minutes, Monsieur. Exemple : *.mute 10*' }, { quoted: message });
                    } else {
                        await muteCommand(sock, chatId, senderId, message, muteDuration);
                    }
                }
                break;
            case userMessage === '.unmute':
                await unmuteCommand(sock, chatId, senderId, message);
                break;
            case userMessage.startsWith('.ban') && !userMessage.startsWith('.banque') && !userMessage.startsWith('.bank') && !userMessage.startsWith('.bandit'):
                if (!isGroup) {
                    if (!message.key.fromMe && !senderIsSudo) {
                        await sock.sendMessage(chatId, { text: '🎩 Seul le Maître peut utiliser .ban en message privé, Monsieur.' }, { quoted: message });
                        break;
                    }
                }
                await banCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.unban'):
                if (!isGroup) {
                    if (!message.key.fromMe && !senderIsSudo) {
                        await sock.sendMessage(chatId, { text: '🎩 Seul le Maître peut utiliser .unban en message privé, Monsieur.' }, { quoted: message });
                        break;
                    }
                }
                await unbanCommand(sock, chatId, message);
                break;
            case userMessage === '.alfred' || userMessage === '.Alfred':
                await helpCommand(sock, chatId, message, senderId);
                commandExecuted = true;
                break;
            case userMessage === '.sticker' || userMessage === '.s':
                await stickerCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.warnings'):
                const mentionedJidListWarnings = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await warningsCommand(sock, chatId, mentionedJidListWarnings, message);
                break;
            case userMessage.startsWith('.warn'):
                const mentionedJidListWarn = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await warnCommand(sock, chatId, senderId, mentionedJidListWarn, message);
                break;
            case userMessage.startsWith('.tts'):
                const text = userMessage.slice(4).trim();
                await ttsCommand(sock, chatId, text, message);
                break;
            case userMessage.startsWith('.delete') || userMessage.startsWith('.del'):
                await deleteCommand(sock, chatId, message, senderId);
                break;
            case userMessage.startsWith('.attp'):
                await attpCommand(sock, chatId, message);
                break;

            case userMessage === '.settings':
                await settingsCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.mode'):
                // Check if sender is the owner
                if (!message.key.fromMe && !senderIsOwnerOrSudo) {
                    await sock.sendMessage(chatId, { text: '🎩 Cette commande est réservée au Maître de la Maison VALENHART, Monsieur.' }, { quoted: message });
                    return;
                }
                // Read current data first
                let data;
                try {
                    data = JSON.parse(fs.readFileSync('./data/messageCount.json'));
                } catch (error) {
                    console.error('Error reading access mode:', error);
                    await sock.sendMessage(chatId, { text: '🎩 Alfred n\'a pu lire le mode actuel, Monsieur. Veuillez réessayer.' }, { quoted: message });
                    return;
                }

                const action = userMessage.split(' ')[1]?.toLowerCase();
                // If no argument provided, show current status
                if (!action) {
                    const currentMode = data.isPublic ? 'public' : 'private';
                    await sock.sendMessage(chatId, {
                        text: `🎩 *Mode actuel :* *${currentMode}*\n\n*.mode public* — Ouvrir la Maison à tous\n*.mode private* — Réserver la Maison au Maître`
                    }, { quoted: message });
                    return;
                }

                if (action !== 'public' && action !== 'private') {
                    await sock.sendMessage(chatId, {
                        text: 'Usage: .mode public/private\n\nExample:\n.mode public - Allow everyone to use bot\n.mode private - Restrict to owner only',
                        ...channelInfo
                    }, { quoted: message });
                    return;
                }

                try {
                    // Update access mode
                    data.isPublic = action === 'public';

                    // Save updated data
                    fs.writeFileSync('./data/messageCount.json', JSON.stringify(data, null, 2));

                    await sock.sendMessage(chatId, { text: `🎩 La Maison VALENHART est désormais en mode *${action}*, Monsieur.` });
                } catch (error) {
                    console.error('Error updating access mode:', error);
                    await sock.sendMessage(chatId, { text: '🎩 Alfred n\'a pu mettre à jour le mode, Monsieur. Veuillez réessayer.' }, { quoted: message });
                }
                break;
            case userMessage.startsWith('.anticall'):
                if (!message.key.fromMe && !senderIsOwnerOrSudo) {
                    await sock.sendMessage(chatId, { text: '🎩 Cette commande est réservée au Maître de la Maison VALENHART, Monsieur.' }, { quoted: message });
                    break;
                }
                {
                    const args = userMessage.split(' ').slice(1).join(' ');
                    await anticallCommand(sock, chatId, message, args);
                }
                break;
            case userMessage.startsWith('.pmblocker'):
                {
                    const args = userMessage.split(' ').slice(1).join(' ');
                    await pmblockerCommand(sock, chatId, message, args);
                }
                commandExecuted = true;
                break;
            case userMessage === '.owner':
                await ownerCommand(sock, chatId, message);
                break;
            case userMessage === '.tagall':
                await tagAllCommand(sock, chatId, senderId, message);
                break;
            case userMessage === '.tagnotadmin':
                await tagNotAdminCommand(sock, chatId, senderId, message);
                break;
            case userMessage.startsWith('.hidetag'):
                {
                    const messageText = rawText.slice(8).trim();
                    const replyMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage || null;
                    await hideTagCommand(sock, chatId, senderId, messageText, replyMessage, message);
                }
                break;
            case userMessage.startsWith('.tag'):
                const messageText = rawText.slice(4).trim();  // use rawText here, not userMessage
                const replyMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage || null;
                await tagCommand(sock, chatId, senderId, messageText, replyMessage, message);
                break;
            case userMessage.startsWith('.antilink'):
                if (!isGroup) {
                    await sock.sendMessage(chatId, {
                        text: '🎩 Cette commande est réservée aux groupes de la Maison VALENHART, Monsieur.'
                    }, { quoted: message });
                    return;
                }
                if (!isBotAdmin) {
                    await sock.sendMessage(chatId, {
                        text: '🎩 Il me faudrait les prérogatives d\'administrateur, Monsieur.'
                    }, { quoted: message });
                    return;
                }
                await handleAntilinkCommand(sock, chatId, userMessage, senderId, isSenderAdmin, message);
                break;
            case userMessage.startsWith('.antitag'):
                if (!isGroup) {
                    await sock.sendMessage(chatId, {
                        text: '🎩 Cette commande est réservée aux groupes de la Maison VALENHART, Monsieur.'
                    }, { quoted: message });
                    return;
                }
                if (!isBotAdmin) {
                    await sock.sendMessage(chatId, {
                        text: '🎩 Il me faudrait les prérogatives d\'administrateur, Monsieur.'
                    }, { quoted: message });
                    return;
                }
                await handleAntitagCommand(sock, chatId, userMessage, senderId, isSenderAdmin, message);
                break;
            case userMessage === '.meme':
                await memeCommand(sock, chatId, message);
                break;
            case userMessage === '.joke':
                await jokeCommand(sock, chatId, message);
                break;
            case userMessage === '.quote':
                await quoteCommand(sock, chatId, message);
                break;
            case userMessage === '.fact':
                await factCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.weather'):
                const city = userMessage.slice(9).trim();
                if (city) {
                    await weatherCommand(sock, chatId, message, city);
                } else {
                    await sock.sendMessage(chatId, { text: '🎩 Monsieur, veuillez préciser une ville. Exemple : *.weather Paris*' }, { quoted: message });
                }
                break;
            case userMessage === '.news':
                await newsCommand(sock, chatId);
                break;
            case userMessage.startsWith('.ttt') || userMessage.startsWith('.tictactoe'):
                const tttText = userMessage.split(' ').slice(1).join(' ');
                await tictactoeCommand(sock, chatId, senderId, message);
                break;
            case userMessage.startsWith('.move'):
                const position = parseInt(userMessage.split(' ')[1]);
                if (isNaN(position) || position < 1 || position > 9) {
                    await sock.sendMessage(chatId, { text: '🎩 Monsieur, veuillez préciser un numéro de position valide (1-9).' }, { quoted: message });
                } else {
                    await handleTicTacToeMove(sock, chatId, senderId, String(position));
                }
                break;
            case userMessage === '.topmembers':
                topMembers(sock, chatId, isGroup);
                break;
            case userMessage === '.rank':
            case userMessage.startsWith('.rank '):
                await rankCommand(sock, chatId, message, senderId, isGroup);
                break;
            case userMessage === '.classe' || userMessage.startsWith('.classe '): {
                const classeArgs = userMessage.split(' ').slice(1);
                await classeCommand(sock, chatId, message, senderId, classeArgs);
                break;
            }
            case userMessage === '.classement' || userMessage === '.leaderboard' || userMessage === '.top':
                await classementCommand(sock, chatId, message, isGroup);
                break;
            case userMessage.startsWith('.hangman'):
                await startHangman(sock, chatId, message);
                break;
            case userMessage.startsWith('.guess'):
                const guessedLetter = userMessage.split(' ')[1];
                if (guessedLetter) {
                    await guessLetter(sock, chatId, guessedLetter, message);
                } else {
                    await sock.sendMessage(chatId, { text: '🎩 Monsieur, veuillez deviner une lettre : *.guess <lettre>*' }, { quoted: message });
                }
                break;
            case userMessage.startsWith('.trivia'):
                await startTrivia(sock, chatId, message);
                break;
            case userMessage.startsWith('.answer'):
                const answer = userMessage.split(' ').slice(1).join(' ');
                if (answer) {
                    await answerTrivia(sock, chatId, answer, message);
                } else {
                    await sock.sendMessage(chatId, { text: '🎩 Monsieur, veuillez fournir une réponse : *.answer <réponse>*' }, { quoted: message });
                }
                break;
            case userMessage.startsWith('.compliment'):
                await complimentCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.insult'):
                await insultCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.8ball'):
                const question = userMessage.split(' ').slice(1).join(' ');
                await eightBallCommand(sock, chatId, question, message);
                break;
            case userMessage.startsWith('.lyrics'):
                const songTitle = userMessage.split(' ').slice(1).join(' ');
                await lyricsCommand(sock, chatId, songTitle, message);
                break;
            case userMessage.startsWith('.simp'):
                const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                const mentionedJid = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await simpCommand(sock, chatId, quotedMsg, mentionedJid, senderId);
                break;
            case userMessage.startsWith('.stupid') || userMessage.startsWith('.itssostupid') || userMessage.startsWith('.iss'):
                const stupidQuotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                const stupidMentionedJid = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                const stupidArgs = userMessage.split(' ').slice(1);
                await stupidCommand(sock, chatId, stupidQuotedMsg, stupidMentionedJid, senderId, stupidArgs);
                break;
            case userMessage === '.dare':
                await dareCommand(sock, chatId, message);
                break;
            case userMessage === '.truth':
                await truthCommand(sock, chatId, message);
                break;
            case userMessage === '.clear':
                if (isGroup) await clearCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.promote'):
                const mentionedJidListPromote = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await promoteCommand(sock, chatId, mentionedJidListPromote, message);
                break;
            case userMessage.startsWith('.demote'):
                const mentionedJidListDemote = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await demoteCommand(sock, chatId, mentionedJidListDemote, message);
                break;
            case userMessage === '.ping':
                await pingCommand(sock, chatId, message);
                break;
            case userMessage === '.alive':
                await aliveCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.mention '):
                {
                    const args = userMessage.split(' ').slice(1).join(' ');
                    const isOwner = message.key.fromMe || senderIsSudo;
                    await mentionToggleCommand(sock, chatId, message, args, isOwner);
                }
                break;
            case userMessage === '.setmention':
                {
                    const isOwner = message.key.fromMe || senderIsSudo;
                    await setMentionCommand(sock, chatId, message, isOwner);
                }
                break;
            case userMessage.startsWith('.blur'):
                const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                await blurCommand(sock, chatId, message, quotedMessage);
                break;
            case userMessage.startsWith('.welcome'):
                if (isGroup) {
                    // Check admin status if not already checked
                    if (!isSenderAdmin) {
                        const adminStatus = await isAdmin(sock, chatId, senderId);
                        isSenderAdmin = adminStatus.isSenderAdmin;
                    }

                    if (isSenderAdmin || message.key.fromMe) {
                        await welcomeCommand(sock, chatId, message, senderId, isSenderAdmin);
                    } else {
                        await sock.sendMessage(chatId, { text: '🎩 Cette commande est réservée aux administrateurs de la Maison, Monsieur.' }, { quoted: message });
                    }
                } else {
                    await sock.sendMessage(chatId, { text: '🎩 Cette commande est réservée aux groupes de la Maison VALENHART, Monsieur.' }, { quoted: message });
                }
                break;
            case userMessage.startsWith('.goodbye'):
                if (isGroup) {
                    // Check admin status if not already checked
                    if (!isSenderAdmin) {
                        const adminStatus = await isAdmin(sock, chatId, senderId);
                        isSenderAdmin = adminStatus.isSenderAdmin;
                    }

                    if (isSenderAdmin || message.key.fromMe) {
                        await goodbyeCommand(sock, chatId, message, senderId, isSenderAdmin);
                    } else {
                        await sock.sendMessage(chatId, { text: '🎩 Cette commande est réservée aux administrateurs de la Maison, Monsieur.' }, { quoted: message });
                    }
                } else {
                    await sock.sendMessage(chatId, { text: '🎩 Cette commande est réservée aux groupes de la Maison VALENHART, Monsieur.' }, { quoted: message });
                }
                break;
            case userMessage === '.git':
            case userMessage === '.github':
            case userMessage === '.sc':
            case userMessage === '.script':
            case userMessage === '.repo':
                await githubCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.antibadword'):
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: '🎩 Cette commande est réservée aux groupes de la Maison VALENHART, Monsieur.' }, { quoted: message });
                    return;
                }

                const adminStatus = await isAdmin(sock, chatId, senderId);
                isSenderAdmin = adminStatus.isSenderAdmin;
                isBotAdmin = adminStatus.isBotAdmin;

                if (!isBotAdmin) {
                    await sock.sendMessage(chatId, { text: '🎩 Il me faudrait les prérogatives d\'administrateur pour cette commande, Monsieur.' }, { quoted: message });
                    return;
                }

                await antibadwordCommand(sock, chatId, message, senderId, isSenderAdmin);
                break;
            case userMessage.startsWith('.chatbot'):
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: '🎩 Cette commande est réservée aux groupes de la Maison VALENHART, Monsieur.' }, { quoted: message });
                    return;
                }

                // Check if sender is admin or bot owner
                const chatbotAdminStatus = await isAdmin(sock, chatId, senderId);
                if (!chatbotAdminStatus.isSenderAdmin && !message.key.fromMe) {
                    await sock.sendMessage(chatId, { text: '🎩 Cette commande est réservée aux administrateurs de la Maison VALENHART, Monsieur.' }, { quoted: message });
                    return;
                }

                const match = userMessage.slice(8).trim();
                await handleChatbotCommand(sock, chatId, message, match);
                break;
            case userMessage.startsWith('.take') || userMessage.startsWith('.steal'):
                {
                    const isSteal = userMessage.startsWith('.steal');
                    const sliceLen = isSteal ? 6 : 5; // '.steal' vs '.take'
                    const takeArgs = rawText.slice(sliceLen).trim().split(' ');
                    await takeCommand(sock, chatId, message, takeArgs);
                }
                break;
            case userMessage.startsWith('.gif'):
                { const gifQuery = userMessage.slice(4).trim();
                  await gifCommand(sock, chatId, message, gifQuery); }
                break;
            case userMessage === '.flirt':
                await flirtCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.character'):
                await characterCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.waste'):
                await wastedCommand(sock, chatId, message);
                break;
            case userMessage === '.ship' || userMessage.startsWith('.ship '):
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: '🎩 Cette commande est réservée aux groupes de la Maison VALENHART, Monsieur.' }, { quoted: message });
                    return;
                }
                const shipMentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await shipCommand(sock, chatId, message, senderId, shipMentioned);
                break;

            // ─────────────────────────────────────────────────────────────
            // 💍  FAMILLE
            // ─────────────────────────────────────────────────────────────
            case userMessage === '.mariage' || userMessage.startsWith('.mariage '): {
                const mJids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await mariageCommand(sock, chatId, message, senderId, mJids);
                break;
            }
            case userMessage === '.accepter':
                await accepterCommand(sock, chatId, message, senderId);
                break;
            case userMessage === '.refuser':
                await refuserCommand(sock, chatId, message, senderId);
                break;
            case userMessage === '.divorce':
                await divorceCommand(sock, chatId, message, senderId);
                break;
            case userMessage === '.adopter' || userMessage.startsWith('.adopter '): {
                const adJids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await adopterCommand(sock, chatId, message, senderId, adJids);
                break;
            }
            case userMessage === '.enfant' || userMessage.startsWith('.enfant '): {
                const enJids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await enfantCommand(sock, chatId, message, senderId, enJids);
                break;
            }
            case userMessage === '.frere' || userMessage.startsWith('.frere '): {
                const frJids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await frereCommand(sock, chatId, message, senderId, frJids);
                break;
            }
            case userMessage === '.soeur' || userMessage.startsWith('.soeur '): {
                const soJids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await soeurCommand(sock, chatId, message, senderId, soJids);
                break;
            }
            case userMessage === '.quitter' || userMessage.startsWith('.quitter '): {
                const quJids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await quitterCommand(sock, chatId, message, senderId, quJids);
                break;
            }
            case userMessage === '.famille' || userMessage.startsWith('.famille '): {
                const faJids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await familleCommand(sock, chatId, message, senderId, faJids);
                break;
            }
            case userMessage === '.arbre' || userMessage.startsWith('.arbre '): {
                const arJids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await arbreCommand(sock, chatId, message, senderId, arJids);
                break;
            }
            case userMessage === '.statsfamille' || userMessage === '.famillestat':
                await familleStatsCommand(sock, chatId, message);
                break;

            // ─────────────────────────────────────────────────────────────
            // 🏰  BANQUE FAMILIALE — owner uniquement pour les transactions
            // ─────────────────────────────────────────────────────────────
            case userMessage === '.bftresor' || userMessage === '.bfsolde' || userMessage === '.tresor':
                await bfTresorCommand(sock, chatId, message);
                break;
            case userMessage === '.bfdepot' || userMessage.startsWith('.bfdepot '): {
                if (!message.key.fromMe && !senderIsOwnerOrSudo) {
                    await sock.sendMessage(chatId, { text: '🏰 Seul le Maître de la Maison VALENHART peut effectuer des transactions sur la trésorerie familiale.\n\n> _"Je suis le gardien de ces fonds, Monsieur."_ — *Alfred* 🎩' }, { quoted: message });
                    break;
                }
                const bfDepotArgs = userMessage.split(' ').slice(1);
                await bfDepotCommand(sock, chatId, message, senderId, bfDepotArgs);
                break;
            }
            case userMessage === '.bfdon' || userMessage.startsWith('.bfdon '): {
                if (!message.key.fromMe && !senderIsOwnerOrSudo) {
                    await sock.sendMessage(chatId, { text: '🏰 Seul le Maître de la Maison VALENHART peut effectuer des transactions sur la trésorerie familiale.\n\n> _"Je suis le gardien de ces fonds, Monsieur."_ — *Alfred* 🎩' }, { quoted: message });
                    break;
                }
                const bfDonJids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                const bfDonArgs = userMessage.split(' ').slice(1);
                await bfDonCommand(sock, chatId, message, senderId, bfDonArgs, bfDonJids);
                break;
            }
            case userMessage === '.bfpayer' || userMessage.startsWith('.bfpayer '): {
                if (!message.key.fromMe && !senderIsOwnerOrSudo) {
                    await sock.sendMessage(chatId, { text: '🏰 Seul le Maître de la Maison VALENHART peut effectuer des transactions sur la trésorerie familiale.\n\n> _"Je suis le gardien de ces fonds, Monsieur."_ — *Alfred* 🎩' }, { quoted: message });
                    break;
                }
                const bfPayerArgs = userMessage.split(' ').slice(1);
                await bfPayerCommand(sock, chatId, message, senderId, bfPayerArgs);
                break;
            }
            case userMessage === '.bfhistorique' || userMessage === '.bfhisto':
                await bfHistoriqueCommand(sock, chatId, message);
                break;
            case userMessage === '.groupinfo' || userMessage === '.infogp' || userMessage === '.infogrupo':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: '🎩 Cette commande est réservée aux groupes de la Maison VALENHART, Monsieur.' }, { quoted: message });
                    return;
                }
                await groupInfoCommand(sock, chatId, message);
                break;
            case userMessage === '.resetlink' || userMessage === '.revoke' || userMessage === '.anularlink':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: '🎩 Cette commande est réservée aux groupes de la Maison VALENHART, Monsieur.' }, { quoted: message });
                    return;
                }
                await resetlinkCommand(sock, chatId, senderId, message);
                break;
            case userMessage === '.staff' || userMessage === '.admins' || userMessage === '.listadmin':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: '🎩 Cette commande est réservée aux groupes de la Maison VALENHART, Monsieur.' }, { quoted: message });
                    return;
                }
                await staffCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.tourl') || userMessage.startsWith('.url'):
                await urlCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.emojimix') || userMessage.startsWith('.emix'):
                await emojimixCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.tg') || userMessage.startsWith('.stickertelegram') || userMessage.startsWith('.tgsticker') || userMessage.startsWith('.telesticker'):
                await stickerTelegramCommand(sock, chatId, message);
                break;

            case userMessage === '.vv':
                await viewOnceCommand(sock, chatId, message);
                break;
            case userMessage === '.clearsession' || userMessage === '.clearsesi':
                await clearSessionCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.autostatus'):
                const autoStatusArgs = userMessage.split(' ').slice(1);
                await autoStatusCommand(sock, chatId, message, autoStatusArgs);
                break;

            case userMessage.startsWith('.gstatus'): {
                const gStatusArgs = userMessage.slice('.gstatus'.length).trim();
                await gstatusCommand(sock, chatId, message, gStatusArgs);
                break;
            }

            case userMessage.startsWith('.metallic'):
                {
                    const tmText = rawText.slice(rawText.indexOf(' ')+1).trim();
                    await textmakerCommand(sock, chatId, message, 'metallic', tmText);
                }
                break;
            case userMessage.startsWith('.ice'):
                {
                    const tmText = rawText.slice(rawText.indexOf(' ')+1).trim();
                    await textmakerCommand(sock, chatId, message, 'ice', tmText);
                }
                break;
            case userMessage.startsWith('.snow'):
                {
                    const tmText = rawText.slice(rawText.indexOf(' ')+1).trim();
                    await textmakerCommand(sock, chatId, message, 'snow', tmText);
                }
                break;
            case userMessage.startsWith('.impressive'):
                {
                    const tmText = rawText.slice(rawText.indexOf(' ')+1).trim();
                    await textmakerCommand(sock, chatId, message, 'impressive', tmText);
                }
                break;
            case userMessage.startsWith('.matrix'):
                {
                    const tmText = rawText.slice(rawText.indexOf(' ')+1).trim();
                    await textmakerCommand(sock, chatId, message, 'matrix', tmText);
                }
                break;
            case userMessage.startsWith('.light'):
                {
                    const tmText = rawText.slice(rawText.indexOf(' ')+1).trim();
                    await textmakerCommand(sock, chatId, message, 'light', tmText);
                }
                break;
            case userMessage.startsWith('.neon'):
                {
                    const tmText = rawText.slice(rawText.indexOf(' ')+1).trim();
                    await textmakerCommand(sock, chatId, message, 'neon', tmText);
                }
                break;
            case userMessage.startsWith('.devil'):
                {
                    const tmText = rawText.slice(rawText.indexOf(' ')+1).trim();
                    await textmakerCommand(sock, chatId, message, 'devil', tmText);
                }
                break;
            case userMessage.startsWith('.purple'):
                {
                    const tmText = rawText.slice(rawText.indexOf(' ')+1).trim();
                    await textmakerCommand(sock, chatId, message, 'purple', tmText);
                }
                break;
            case userMessage.startsWith('.thunder'):
                {
                    const tmText = rawText.slice(rawText.indexOf(' ')+1).trim();
                    await textmakerCommand(sock, chatId, message, 'thunder', tmText);
                }
                break;
            case userMessage.startsWith('.leaves'):
                {
                    const tmText = rawText.slice(rawText.indexOf(' ')+1).trim();
                    await textmakerCommand(sock, chatId, message, 'leaves', tmText);
                }
                break;
            case userMessage.startsWith('.1917'):
                {
                    const tmText = rawText.slice(rawText.indexOf(' ')+1).trim();
                    await textmakerCommand(sock, chatId, message, '1917', tmText);
                }
                break;
            case userMessage.startsWith('.arena'):
                {
                    const tmText = rawText.slice(rawText.indexOf(' ')+1).trim();
                    await textmakerCommand(sock, chatId, message, 'arena', tmText);
                }
                break;
            case userMessage.startsWith('.hacker'):
                {
                    const tmText = rawText.slice(rawText.indexOf(' ')+1).trim();
                    await textmakerCommand(sock, chatId, message, 'hacker', tmText);
                }
                break;
            case userMessage.startsWith('.sand'):
                {
                    const tmText = rawText.slice(rawText.indexOf(' ')+1).trim();
                    await textmakerCommand(sock, chatId, message, 'sand', tmText);
                }
                break;
            case userMessage.startsWith('.blackpink'):
                {
                    const tmText = rawText.slice(rawText.indexOf(' ')+1).trim();
                    await textmakerCommand(sock, chatId, message, 'blackpink', tmText);
                }
                break;
            case userMessage.startsWith('.glitch'):
                {
                    const tmText = rawText.slice(rawText.indexOf(' ')+1).trim();
                    await textmakerCommand(sock, chatId, message, 'glitch', tmText);
                }
                break;
            case userMessage.startsWith('.fire'):
                {
                    const tmText = rawText.slice(rawText.indexOf(' ')+1).trim();
                    await textmakerCommand(sock, chatId, message, 'fire', tmText);
                }
                break;
            case userMessage.startsWith('.antidelete'):
                const antideleteMatch = userMessage.slice(11).trim();
                await handleAntideleteCommand(sock, chatId, message, antideleteMatch);
                break;
            case userMessage === '.surrender':
                // Handle surrender command for tictactoe game
                await handleTicTacToeMove(sock, chatId, senderId, 'surrender');
                break;
            case userMessage === '.cleartmp':
                await clearTmpCommand(sock, chatId, message);
                break;
            case userMessage === '.setpp':
                await setProfilePicture(sock, chatId, message);
                break;
            case userMessage.startsWith('.setgdesc'):
                {
                    const text = rawText.slice(9).trim();
                    await setGroupDescription(sock, chatId, senderId, text, message);
                }
                break;
            case userMessage.startsWith('.setgname'):
                {
                    const text = rawText.slice(9).trim();
                    await setGroupName(sock, chatId, senderId, text, message);
                }
                break;
            case userMessage.startsWith('.setgpp'):
                await setGroupPhoto(sock, chatId, senderId, message);
                break;
            case userMessage.startsWith('.instagram') || userMessage.startsWith('.insta') || (userMessage === '.ig' || userMessage.startsWith('.ig ')):
                await instagramCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.igsc'):
                await igsCommand(sock, chatId, message, true);
                break;
            case userMessage.startsWith('.igs'):
                await igsCommand(sock, chatId, message, false);
                break;
            case userMessage.startsWith('.fb') || userMessage.startsWith('.facebook'):
                await facebookCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.music'):
                await playCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.spotify'):
                await spotifyCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.play') || userMessage.startsWith('.mp3') || userMessage.startsWith('.ytmp3'):
                await playCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.song'):
                await songCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.video') || userMessage.startsWith('.ytmp4'):
                await videoCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.tiktok') || userMessage.startsWith('.tt'):
                await tiktokCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.gpt') || userMessage.startsWith('.gemini'):
                await aiCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.translate') || userMessage.startsWith('.trt'):
                const commandLength = userMessage.startsWith('.translate') ? 10 : 4;
                await handleTranslateCommand(sock, chatId, message, userMessage.slice(commandLength));
                return;
            case userMessage.startsWith('.ss') || userMessage.startsWith('.ssweb') || userMessage.startsWith('.screenshot'):
                const ssCommandLength = userMessage.startsWith('.screenshot') ? 11 : (userMessage.startsWith('.ssweb') ? 6 : 3);
                await handleSsCommand(sock, chatId, message, userMessage.slice(ssCommandLength).trim());
                break;
            case userMessage.startsWith('.areact') || userMessage.startsWith('.autoreact') || userMessage.startsWith('.autoreaction'):
                await handleAreactCommand(sock, chatId, message, isOwnerOrSudoCheck);
                break;
            case userMessage.startsWith('.sudo'):
                await sudoCommand(sock, chatId, message);
                break;
            case userMessage === '.goodnight' || userMessage === '.lovenight' || userMessage === '.gn':
                await goodnightCommand(sock, chatId, message);
                break;
            case userMessage === '.shayari' || userMessage === '.shayri':
                await shayariCommand(sock, chatId, message);
                break;
            case userMessage === '.roseday':
                await rosedayCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.imagine') || userMessage.startsWith('.flux') || userMessage.startsWith('.dalle'): await imagineCommand(sock, chatId, message);
                break;
            case userMessage === '.jid': await groupJidCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.autotyping'):
                await autotypingCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.autoread'):
                await autoreadCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.heart'):
                await handleHeart(sock, chatId, message);
                break;
            case userMessage.startsWith('.horny'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['horny', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;
            case userMessage.startsWith('.circle'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['circle', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;
            case userMessage.startsWith('.lgbt'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['lgbt', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;
            case userMessage.startsWith('.lolice'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['lolice', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;
            case userMessage.startsWith('.simpcard'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['simpcard', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;
            case userMessage.startsWith('.tonikawa'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['tonikawa', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;
            case userMessage.startsWith('.its-so-stupid'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['its-so-stupid', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;
            case userMessage.startsWith('.namecard'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['namecard', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;

            case userMessage.startsWith('.oogway2'):
            case userMessage.startsWith('.oogway'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const sub = userMessage.startsWith('.oogway2') ? 'oogway2' : 'oogway';
                    const args = [sub, ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;
            case userMessage.startsWith('.tweet'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['tweet', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;
            case userMessage.startsWith('.ytcomment'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const ytcArgs = ['ytcomment', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, ytcArgs);
                }
                break;
            case userMessage.startsWith('.comrade'):
            case userMessage.startsWith('.gay'):
            case userMessage.startsWith('.glass'):
            case userMessage.startsWith('.jail'):
            case userMessage.startsWith('.passed'):
            case userMessage.startsWith('.triggered'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const sub = userMessage.slice(1).split(/\s+/)[0];
                    const args = [sub, ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;
            case userMessage.startsWith('.animu'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = parts.slice(1);
                    await animeCommand(sock, chatId, message, args);
                }
                break;
            // ── Reaction aliases — all routed through animeCommand ──
            case userMessage.startsWith('.hug'):
            case userMessage.startsWith('.kiss'):
            case userMessage.startsWith('.slap'):
            case userMessage.startsWith('.pat'):
            case userMessage.startsWith('.poke') && !userMessage.startsWith('.poker'):
            case userMessage.startsWith('.wave'):
            case userMessage.startsWith('.cry'):
            case userMessage.startsWith('.dance'):
            case userMessage.startsWith('.blush'):
            case userMessage.startsWith('.smile'):
            case userMessage.startsWith('.happy'):
            case userMessage.startsWith('.wink'):
            case userMessage.startsWith('.nod'):
            case userMessage.startsWith('.nom'):
            case userMessage.startsWith('.cuddle'):
            case userMessage.startsWith('.handhold'):
            case userMessage.startsWith('.feed'):
            case userMessage.startsWith('.bite'):
            case userMessage.startsWith('.lick'):
            case userMessage.startsWith('.tickle'):
            case userMessage.startsWith('.highfive'):
            case userMessage.startsWith('.yeet'):
            case userMessage.startsWith('.bully'):
            case userMessage.startsWith('.hold'):
            case userMessage.startsWith('.pout'):
            case userMessage.startsWith('.shrug'):
            case userMessage.startsWith('.think'):
            case userMessage.startsWith('.facepalm'):
            case userMessage.startsWith('.run'):
            case userMessage.startsWith('.sleep'):
            case userMessage.startsWith('.thumbsup'):
            case userMessage.startsWith('.lurk'):
            case userMessage.startsWith('.punch'):
            case userMessage.startsWith('.kill'):
            case userMessage.startsWith('.shoot'):
            case userMessage.startsWith('.stab'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const sub = parts[0].slice(1).toLowerCase();
                    const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                    await animeCommand(sock, chatId, message, [sub], mentioned);
                }
                break;
            case userMessage === '.crop':
                await stickercropCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.pies'):
                {
                    const parts = rawText.trim().split(/\s+/);
                    const args = parts.slice(1);
                    await piesCommand(sock, chatId, message, args);
                    commandExecuted = true;
                }
                break;
            case userMessage === '.china':
                await piesAlias(sock, chatId, message, 'china');
                commandExecuted = true;
                break;
            case userMessage === '.indonesia':
                await piesAlias(sock, chatId, message, 'indonesia');
                commandExecuted = true;
                break;
            case userMessage === '.japan':
                await piesAlias(sock, chatId, message, 'japan');
                commandExecuted = true;
                break;
            case userMessage === '.korea':
                await piesAlias(sock, chatId, message, 'korea');
                commandExecuted = true;
                break;
            case userMessage === '.india':
                await piesAlias(sock, chatId, message, 'india');
                commandExecuted = true;
                break;
            case userMessage === '.malaysia':
                await piesAlias(sock, chatId, message, 'malaysia');
                commandExecuted = true;
                break;
            case userMessage === '.thailand':
                await piesAlias(sock, chatId, message, 'thailand');
                commandExecuted = true;
                break;
            case userMessage.startsWith('.update'):
                {
                    const parts = rawText.trim().split(/\s+/);
                    const zipArg = parts[1] && parts[1].startsWith('http') ? parts[1] : '';
                    await updateCommand(sock, chatId, message, zipArg);
                }
                commandExecuted = true;
                break;
            case userMessage.startsWith('.removebg') || userMessage.startsWith('.rmbg') || userMessage.startsWith('.nobg'):
                await removebgCommand.execute(sock, chatId, message);
                break;
            case userMessage.startsWith('.remini') || userMessage.startsWith('.enhance') || userMessage.startsWith('.upscale'):
                await reminiCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.sora'):
                await soraCommand(sock, chatId, message);
                break;

            // ── 💰 ECONOMY SYSTEM ──────────────────────────────────────────
            case userMessage === '.solde' || userMessage === '.wallet' || userMessage === '.coins':
                await soldeCommand(sock, chatId, message, senderId);
                break;
            case userMessage === '.daily' || userMessage === '.journalier':
                await dailyCommand(sock, chatId, message, senderId);
                break;
            case userMessage.startsWith('.roulette ') || userMessage === '.roulette':
                await rouletteCommand(sock, chatId, message, senderId, userMessage.split(' ').slice(1));
                break;
            case userMessage === '.travail' || userMessage === '.work' || userMessage === '.boulot':
                await travailCommand(sock, chatId, message, senderId);
                break;
            case userMessage === '.crime' || userMessage === '.criminel':
                await crimeCommand(sock, chatId, message, senderId);
                break;
            case userMessage === '.vol' || userMessage.startsWith('.vol '): {
                const volMentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await volCommand(sock, chatId, message, senderId, volMentioned);
                break;
            }
            case userMessage.startsWith('.pari '): {
                await pariCommand(sock, chatId, message, senderId, userMessage.split(' ').slice(1));
                break;
            }
            case userMessage.startsWith('.mines '): {
                await minesCommand(sock, chatId, message, senderId, userMessage.split(' ').slice(1));
                break;
            }
            case userMessage === '.duel' || userMessage.startsWith('.duel '): {
                const duelMentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await duelCommand(sock, chatId, message, senderId, duelMentioned, userMessage.split(' ').slice(1));
                break;
            }
            case userMessage === '.banque' || userMessage.startsWith('.banque ') || userMessage === '.bank' || userMessage.startsWith('.bank '):
                await banqueCommand(sock, chatId, message, senderId, userMessage.split(' ').slice(1));
                break;
            case userMessage === '.transfert' || userMessage.startsWith('.transfert ') || userMessage === '.transfer' || userMessage.startsWith('.transfer '): {
                const trfMentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await transfertCommand(sock, chatId, message, senderId, trfMentioned, userMessage.split(' ').slice(1));
                break;
            }
            case userMessage === '.rich' || userMessage === '.fortune' || userMessage === '.richesse':
                await richCommand(sock, chatId, message);
                break;
            case userMessage === '.loto' || userMessage.startsWith('.loto ') || userMessage === '.loterie' || userMessage.startsWith('.loterie '):
                await lotoCommand(sock, chatId, message, senderId, userMessage.split(' ').slice(1));
                break;
            case userMessage === '.blackjack' || userMessage.startsWith('.blackjack '):
                await blackjackCommand(sock, chatId, message, senderId, userMessage.split(' ').slice(1));
                break;
            case userMessage === '.poker' || userMessage.startsWith('.poker '):
                await pokerCommand(sock, chatId, message, senderId, userMessage.split(' ').slice(1));
                break;
            case userMessage === '.bandit' || userMessage.startsWith('.bandit ') || userMessage === '.slot' || userMessage.startsWith('.slot '):
                await banditCommand(sock, chatId, message, senderId, userMessage.split(' ').slice(1));
                break;
            case userMessage === '.investir' || userMessage.startsWith('.investir '):
                await investirCommand(sock, chatId, message, senderId, userMessage.split(' ').slice(1));
                break;
            case userMessage === '.quizeco' || userMessage === '.quiz':
                await quizecoCommand(sock, chatId, message, senderId);
                break;
            case userMessage === '.grattage' || userMessage.startsWith('.grattage ') || userMessage === '.scratch' || userMessage.startsWith('.scratch '):
                await grattageCommand(sock, chatId, message, senderId, userMessage.split(' ').slice(1));
                break;
            case userMessage === '.coffre' || userMessage === '.chest':
                await coffreCommand(sock, chatId, message, senderId);
                break;
            case userMessage === '.jackpot' || userMessage.startsWith('.jackpot '):
                await jackpotCommand(sock, chatId, message, senderId, userMessage.split(' ').slice(1));
                break;
            case userMessage === '.stats' || userMessage === '.statistiques' || userMessage === '.profil':
                await statistiquesCommand(sock, chatId, message, senderId);
                break;

            // ── 🛍️ MARCHÉ DE LUXE ──────────────────────────────────────────
            case userMessage === '.marche' || userMessage.startsWith('.marche '): {
                const marcheArgs = userMessage.split(' ').slice(1);
                await marcheCommand(sock, chatId, message, senderId, marcheArgs);
                break;
            }
            case userMessage.startsWith('.acheter '): {
                const acheterArgs = userMessage.split(' ').slice(1);
                await acheterCommand(sock, chatId, message, senderId, acheterArgs);
                break;
            }
            case userMessage === '.inventaire' || userMessage.startsWith('.inventaire '): {
                const invMentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await inventaireCommand(sock, chatId, message, senderId, invMentioned);
                break;
            }
            case userMessage.startsWith('.revendre '): {
                const revendreArgs = userMessage.split(' ').slice(1);
                await revendreCommand(sock, chatId, message, senderId, revendreArgs);
                break;
            }

            // ── 📖 GUIDE ───────────────────────────────────────────────────
            case userMessage === '.guide' || userMessage.startsWith('.guide '): {
                const guideArgs = userMessage.split(' ').slice(1);
                await guideCommand(sock, chatId, message, guideArgs);
                break;
            }

            // ── 💻 HACK SYSTEM ─────────────────────────────────────────────
            case userMessage === '.permit' || userMessage.startsWith('.permit '): {
                const permitMentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                const permitArgs = userMessage.split(' ').slice(1);
                await permitCommand(sock, chatId, message, senderId, permitArgs, permitMentioned);
                break;
            }
            case userMessage === '.hack' || userMessage.startsWith('.hack '): {
                const hackMentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await hackCommand(sock, chatId, message, senderId, hackMentioned);
                break;
            }
            case userMessage.startsWith('.broadcast'): {
                await handleBroadcast(sock, chatId, message, rawText);
                break;
            }

            case userMessage === '.newsletter' || userMessage.startsWith('.newsletter'): {
                await newsletterCommand(sock, chatId, message);
                break;
            }

            case userMessage === '.newsletterjid': {
                await newsletterJidCommand(sock, chatId, message);
                break;
            }
            default:
                if (isGroup) {
                    // Handle quiz answers (A, B, C, D)
                    if (/^[abcdABCD]$/.test(userMessage)) {
                        const handled = await handleQuizAnswer(sock, chatId, message, senderId, userMessage);
                        if (!handled) await handleChatbotResponse(sock, chatId, message, userMessage, senderId);
                    } else if (userMessage) {
                        await handleChatbotResponse(sock, chatId, message, userMessage, senderId);
                    }
                    await handleMentionDetection(sock, chatId, message);
                }
                commandExecuted = false;
                break;
        }

        // If a command was executed, show typing status after command execution
        if (commandExecuted !== false) {
            // Command was executed, now show typing status after command execution
            await showTypingAfterCommand(sock, chatId);
        }

        // Function to handle .groupjid command
        async function groupJidCommand(sock, chatId, message) {
            const groupJid = message.key.remoteJid;

            if (!groupJid.endsWith('@g.us')) {
                return await sock.sendMessage(chatId, {
                    text: '🎩 Cette commande est réservée aux groupes de la Maison VALENHART, Monsieur.'
                });
            }

            await sock.sendMessage(chatId, {
                text: `🎩 *Identifiant du groupe, Monsieur :*\n\n${groupJid}`
            }, {
                quoted: message
            });
        }

        if (userMessage.startsWith('.')) {
            // After command is processed successfully
            await addCommandReaction(sock, message);
        }
    } catch (error) {
        // Log only — never spam users with error messages
        console.error('❌ Error in message handler:', error.message);
    }
}

async function handleGroupParticipantUpdate(sock, update) {
    try {
        const { id, participants, action, author } = update;

        // Check if it's a group
        if (!id.endsWith('@g.us')) return;

        // Respect bot mode: only announce promote/demote in public mode
        let isPublic = true;
        try {
            const modeData = JSON.parse(fs.readFileSync('./data/messageCount.json'));
            if (typeof modeData.isPublic === 'boolean') isPublic = modeData.isPublic;
        } catch (e) {
            // If reading fails, default to public behavior
        }

        // Handle promotion events
        if (action === 'promote') {
            if (!isPublic) return;
            await handlePromotionEvent(sock, id, participants, author);
            return;
        }

        // Handle demotion events
        if (action === 'demote') {
            if (!isPublic) return;
            await handleDemotionEvent(sock, id, participants, author);
            return;
        }

        // Handle join events
        if (action === 'add') {
            await handleJoinEvent(sock, id, participants);
        }

        // Handle leave events
        if (action === 'remove') {
            await handleLeaveEvent(sock, id, participants);
        }
    } catch (error) {
        console.error('Error in handleGroupParticipantUpdate:', error);
    }
}

// Instead, export the handlers along with handleMessages
module.exports = {
    handleMessages,
    handleGroupParticipantUpdate,
    handleStatus: async (sock, status) => {
        await handleStatusUpdate(sock, status);
    }
};