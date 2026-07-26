// src/status-channels.js — Dynamic status channel manager
const { readData, writeData } = require('./database/db');
const { fetchExploitStatuses } = require('./status');

// Default emoji rules requested by user:
// 🟢 = undetected-unaffected by ban waves
// 🔵 = detected-bypasses modified client bans
// 🌕 = detected
// 🟣 = updating
// 🔴 = down
const DEFAULT_EMOJIS = {
    undetected: '🟢',
    bypassing:  '🔵',
    detected:   '🌕',
    updating:   '🟣',
    down:       '🔴'
};

function getEmojiRules(guildId) {
    const data = readData();
    return data.emoji_rules?.[guildId] || DEFAULT_EMOJIS;
}

function setEmojiRules(guildId, rules) {
    const data = readData();
    data.emoji_rules = data.emoji_rules || {};
    data.emoji_rules[guildId] = { ...DEFAULT_EMOJIS, ...rules };
    writeData(data);
}

function getStatusChannels(guildId) {
    const data = readData();
    data.status_channels = data.status_channels || {};
    return data.status_channels[guildId] || [];
}

function addStatusChannel(guildId, executor, channelId, channelNameFormat = '{emoji}-{executor}-{status}') {
    const data = readData();
    data.status_channels = data.status_channels || {};
    data.status_channels[guildId] = data.status_channels[guildId] || [];

    // Remove existing entry for this channel if any
    data.status_channels[guildId] = data.status_channels[guildId].filter(c => c.channelId !== channelId);
    
    data.status_channels[guildId].push({
        executor,
        channelId,
        format: channelNameFormat,
        lastUpdated: 0,
        lastLastName: ''
    });

    writeData(data);
}

function removeStatusChannel(guildId, channelId) {
    const data = readData();
    data.status_channels = data.status_channels || {};
    if (data.status_channels[guildId]) {
        data.status_channels[guildId] = data.status_channels[guildId].filter(c => c.channelId !== channelId);
        writeData(data);
    }
}

// Compute the emoji & status text for a given exploit state object
function computeStatusFormatting(item, emojis) {
    let emoji = emojis.down;
    let statusText = 'down';

    if (item.status === 'online') {
        if (!item.detected) {
            emoji = emojis.undetected;
            statusText = 'undetected';
        } else if (item.bypassing) {
            emoji = emojis.bypassing;
            statusText = 'bypasses-bans';
        } else {
            emoji = emojis.detected;
            statusText = 'detected';
        }
    } else if (item.status === 'partial') {
        emoji = emojis.updating;
        statusText = 'updating';
    } else {
        emoji = emojis.down;
        statusText = 'down';
    }

    return { emoji, statusText };
}

// Sync all status channels for connected Discord client
async function syncStatusChannels(client, force = false) {
    if (!client || !client.isReady()) return;

    try {
        const statuses = await fetchExploitStatuses();
        const statusMap = {};
        statuses.forEach(s => {
            statusMap[s.name.toLowerCase()] = s;
        });

        const data = readData();
        const allGuildChannels = data.status_channels || {};

        for (const [guildId, channels] of Object.entries(allGuildChannels)) {
            const emojis = getEmojiRules(guildId);
            const guild = client.guilds.cache.get(guildId);
            if (!guild) continue;

            for (const cfg of channels) {
                const item = statusMap[cfg.executor.toLowerCase()];
                if (!item) continue;

                const { emoji, statusText } = computeStatusFormatting(item, emojis);
                const format = cfg.format || '{emoji}-{executor}-{status}';
                
                const formattedName = format
                    .replace('{emoji}', emoji)
                    .replace('{executor}', cfg.executor.toLowerCase().replace(/\s+/g, '-'))
                    .replace('{status}', statusText)
                    .replace(/[^a-zA-Z0-9\-\_🟢🔵🌕🟣🔴]/g, '-')
                    .replace(/-+/g, '-');

                // Avoid Discord 10 min channel rename rate limits if unchanged
                if (!force && cfg.lastLastName === formattedName) continue;

                const channel = guild.channels.cache.get(cfg.channelId);
                if (channel) {
                    try {
                        await channel.setName(formattedName);
                        cfg.lastLastName = formattedName;
                        cfg.lastUpdated  = Date.now();
                        console.log(`[StatusChannel] Renamed ${cfg.channelId} -> ${formattedName}`);
                    } catch (err) {
                        console.warn(`[StatusChannel] Failed to rename ${cfg.channelId}:`, err.message);
                    }
                }
            }
        }
        writeData(data);
    } catch (e) {
        console.error('[StatusChannel] Sync error:', e.message);
    }
}

module.exports = {
    DEFAULT_EMOJIS,
    getEmojiRules,
    setEmojiRules,
    getStatusChannels,
    addStatusChannel,
    removeStatusChannel,
    syncStatusChannels,
    computeStatusFormatting
};
