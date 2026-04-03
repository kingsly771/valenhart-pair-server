const compliments = [
    "Votre présence, si je puis me permettre, illumine cette demeure d'un éclat que même les plus grands lustres ne sauraient égaler. *Quite remarkable*, Monsieur.",
    "Your intelligence, if I may say so, is as sharp as the finest blade — and considerably more refined.",
    "La Maison VALENHART est honorée de compter quelqu'un d'aussi distingué dans son cercle. *Most distinguished*, indeed.",
    "Votre élégance naturelle ferait pâlir d'envie bien des membres de la noblesse britannique. *Rather impressive*.",
    "Il est rare, dans ma longue carrière, de croiser une âme d'une telle finesse. *I must say, extraordinary.*",
    "Votre sens du raffinement est, permettez-moi l'observation, absolument remarquable. *The House is honoured.*",
    "Vous portez la grâce avec une aisance qui force le respect, Madame. *Splendid*, truly.",
    "Votre sourire est, *if I may be so bold*, l'ornement le plus précieux de cette assemblée.",
    "Une telle sagesse mérite d'être consignée dans les archives de la Maison VALENHART. *Indeed.*",
    "Votre générosité d'esprit est une qualité que peu possèdent. *Quite commendable*, Monsieur.",
    "The House of VALENHART has rarely had the honour of welcoming someone quite so remarkable. Votre présence nous élève.",
    "Votre caractère est le reflet de ce que la noblesse du cœur peut produire de plus beau. *Most admirable.*",
    "Permettez-moi de vous dire, avec tout le respect que je vous dois — *you are exceptional*.",
    "Vos qualités dépassent largement ce que l'on peut espérer, *and I do not say that lightly*.",
    "C'est un privilège que de vous servir. *The finest kind of privilege*, Monsieur."
];

async function complimentCommand(sock, chatId, message) {
    try {
        if (!message || !chatId) return;

        let userToCompliment;
        if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            userToCompliment = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            userToCompliment = message.message.extendedTextMessage.contextInfo.participant;
        }
        
        if (!userToCompliment) {
            await sock.sendMessage(chatId, { 
                text: '🎩 Puis-je vous demander, Monsieur, à qui souhaitez-vous que j\'adresse cet éloge ? *Do mention the person*, if you please.'
            });
            return;
        }

        const compliment = compliments[Math.floor(Math.random() * compliments.length)];
        await new Promise(resolve => setTimeout(resolve, 1000));

        await sock.sendMessage(chatId, { 
            text: `🎩 @${userToCompliment.split('@')[0]} — ${compliment}`,
            mentions: [userToCompliment]
        });
    } catch (error) {
        console.error('Error in compliment command:', error);
        await sock.sendMessage(chatId, { 
            text: '🎩 A most regrettable contretemps. Veuillez m\'en excuser, Monsieur.'
        });
    }
}

module.exports = { complimentCommand };
