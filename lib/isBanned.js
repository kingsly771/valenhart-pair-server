const fs = require('fs');
const path = require('path');

const bannedPath = path.join(__dirname, '../data/banned.json');

function isBanned(userId) {
    try {
        const bannedUsers = JSON.parse(fs.readFileSync(bannedPath, 'utf8'));
        return bannedUsers.includes(userId);
    } catch {
        return false;
    }
}

module.exports = { isBanned };
