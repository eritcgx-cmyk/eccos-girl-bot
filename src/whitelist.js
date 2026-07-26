// src/whitelist.js — Discord User Whitelist Engine
const { readData, writeData } = require('./database/db');

const BOT_OWNER_ID = '1105560420393156619';

function getWhitelistedUsers() {
    const data = readData();
    data.whitelisted_users = data.whitelisted_users || [];
    if (!data.whitelisted_users.includes(BOT_OWNER_ID)) {
        data.whitelisted_users.push(BOT_OWNER_ID);
        writeData(data);
    }
    return data.whitelisted_users;
}

function isWhitelisted(userId, guildOwnerId = null) {
    if (!userId) return false;
    const idStr = String(userId).trim();

    // Owner is always whitelisted
    if (idStr === BOT_OWNER_ID) return true;
    if (process.env.OWNER_ID && idStr === process.env.OWNER_ID) return true;
    if (guildOwnerId && idStr === String(guildOwnerId)) return true;

    const list = getWhitelistedUsers();
    return list.includes(idStr);
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
    const idStr = String(userId).trim();
    // Cannot remove owner
    if (idStr === BOT_OWNER_ID) return false;

    const data = readData();
    data.whitelisted_users = data.whitelisted_users || [];
    data.whitelisted_users = data.whitelisted_users.filter(id => id !== idStr);
    writeData(data);
    return true;
}

module.exports = {
    BOT_OWNER_ID,
    getWhitelistedUsers,
    isWhitelisted,
    addWhitelist,
    removeWhitelist
};
