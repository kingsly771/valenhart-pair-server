const butlerInsults = [
    "Je dois admettre, avec tout le respect que cela implique, que votre intelligence est... *charmante dans sa simplicité*.",
    "The nature, in its infinite mystery, has seen fit to create... you. *How very original.*",
    "Permettez-moi de vous féliciter pour votre extraordinaire cohérence à être précisément tel que vous êtes. *Remarkable.*",
    "Votre contribution à cette conversation est, *how shall I put it*... mémorable dans son genre.",
    "I have served many a distinguished guest, Monsieur, but you are — *how to say this diplomatically* — singular.",
    "Votre logique est d'une originalité qui dépasse, *I must confess*, l'entendement commun.",
    "On dit que chacun a ses qualités. Les vôtres restent, pour l'instant, *discreetly concealed*.",
    "Votre sens des convenances est en développement. *We remain hopeful*, Monsieur.",
    "Si la médiocrité était un art, vous seriez — *and I say this with the utmost respect* — un grand maître.",
    "I cannot reproach you for your lack of refinement. *Not everyone has had the benefit of a proper upbringing.*",
    "Votre caractère reste, *if I may say*, difficile à décrire dans les termes que la bienséance m'autorise.",
    "The House of VALENHART has welcomed many characters. You are, *undoubtedly*, quite unique.",
    "Votre discernement est, *how shall one phrase this*, remarquablement constant dans son absence.",
    "Might I suggest, Monsieur, that les bibliothèques sont ouvertes à tous. *A visit might prove beneficial.*",
    "Permettez-moi de vous suggérer, *with all the goodwill at my disposal*, de méditer davantage avant de prendre la parole."
];

async function insultCommand(sock, chatId, message) {
    try {
        if (!message || !chatId) return;

        let userToInsult;
        if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            userToInsult = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            userToInsult = message.message.extendedTextMessage.contextInfo.participant;
        }
        
        if (!userToInsult) {
            await sock.sendMessage(chatId, { 
                text: '🎩 À qui dois-je adresser cette... *diplomatic observation*, Monsieur ? Veuillez mentionner la personne.'
            });
            return;
        }

        const insult = butlerInsults[Math.floor(Math.random() * butlerInsults.length)];
        await new Promise(resolve => setTimeout(resolve, 1000));

        await sock.sendMessage(chatId, { 
            text: `🎩 @${userToInsult.split('@')[0]} — ${insult}`,
            mentions: [userToInsult]
        });
    } catch (error) {
        console.error('Error in insult command:', error);
        await sock.sendMessage(chatId, { text: '🎩 A most regrettable interruption. *My sincerest apologies.*' });
    }
}

module.exports = { insultCommand };
