// src/whitelist.js — Discord User Whitelist Engine
const { readData, writeData } = require('./database/db');

function getWhitelistedUsers() {
    const data = readData();
    data.whitelisted_users = data.whitelisted_users || [];
    return data.whitelisted_users;
}

function isWhitelisted(userId, guildOwnerId = null) {
    if (!userId) return false;
    const list = getWhitelistedUsers();
    
    // Auto-allow configured bot owner or guild owner if provided
    if (process.env.OWNER_ID && userId === process.env.OWNER_ID) return true;
    if (guildOwnerId && userId === guildOwnerId) return true;

    return list.includes(String(userId));
}

function addWhitelist(userId) {
    if (!userId) return false;
    const data = readData();
    data.whitelisted_users = data.whitelisted_users || [];
    const idStr = String(userId).trim();
    if (!data.whitelisted_users.includes(idStr)) {
        data.whitelisted_users.push(idStr);
        writeData(data);
    }
    return true;
}

function removeWhitelist(userId) {
    if (!userId) return false;
    const data = readData();
    data.whitelisted_users = data.whitelisted_users || [];
    const idStr = String(userId).trim();
    data.whitelisted_users = data.whitelisted_users.filter(id => id !== idStr);
    writeData(data);
    return true;
}

module.exports = {
    getWhitelistedUsers,
    isWhitelisted,
    addWhitelist,
    removeWhitelist
};
