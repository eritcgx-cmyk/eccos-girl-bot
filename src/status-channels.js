// src/status-channels.js — Dynamic status channel manager
const { EmbedBuilder } = require('discord.js');
const { readData, writeData } = require('./database/db');
const { fetchExploitStatuses } = require('./status');

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

function addStatusChannel(guildId, executor, channelId) {
    const data = readData();
    data.status_channels = data.status_channels || {};
    data.status_channels[guildId] = data.status_channels[guildId] || [];

    data.status_channels[guildId] = data.status_channels[guildId].filter(c => c.channelId !== channelId);
    
    data.status_channels[guildId].push({
        executor,
        channelId,
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

function computeStatusFormatting(item, emojis) {
    let emoji = emojis.down;
    let statusText = 'Status';

    if (item.status === 'online') {
        if (!item.detected) {
            emoji = emojis.undetected;
        } else if (item.bypassing) {
            emoji = emojis.bypassing;
        } else {
            emoji = emojis.detected;
        }
    } else if (item.status === 'partial') {
        emoji = emojis.updating;
    } else {
        emoji = emojis.down;
    }

    return { emoji, statusText };
}

// Convert "cosmic" -> "𝐂𝐨𝐬𝐦𝐢𝐜"
function toBoldSerif(text) {
    const map = {
        'a':'𝐚','b':'𝐛','c':'𝐜','d':'𝐝','e':'𝐞','f':'𝐟','g':'𝐠','h':'𝐡','i':'𝐢','j':'𝐣','k':'𝐤','l':'𝐥','m':'𝐦','n':'𝐧','o':'𝐨','p':'𝐩','q':'𝐪','r':'𝐫','s':'𝐬','t':'𝐭','u':'𝐮','v':'𝐯','w':'𝐰','x':'𝐱','y':'𝐲','z':'𝐳',
        'A':'𝐂','B':'𝐁','C':'𝐂','D':'𝐃','E':'𝐄','F':'𝐅','G':'𝐆','H':'𝐇','I':'𝐈','J':'𝐉','K':'𝐊','L':'𝐋','M':'𝐌','N':'𝐍','O':'𝐎','P':'𝐏','Q':'𝐐','R':'𝐑','S':'𝐒','T':'𝐓','U':'𝐔','V':'𝐕','W':'𝐖','X':'𝐗','Y':'𝐘','Z':'𝐙'
    };
    return text.split('').map(c => map[c] || c).join('');
}

async function syncStatusChannels(client, force = false) {
    if (!client || !client.isReady()) return;

    try {
        const statuses = await fetchExploitStatuses();
        const statusMap = {};
        statuses.forEach(s => {
            statusMap[s.name.toLowerCase()] = s;
        });

        const data = readData();
        data.previous_statuses = data.previous_statuses || {};

        const allGuildChannels = data.status_channels || {};

        for (const [guildId, channels] of Object.entries(allGuildChannels)) {
            const emojis = getEmojiRules(guildId);
            const guild = client.guilds.cache.get(guildId);
            if (!guild) continue;

            for (const cfg of channels) {
                const item = statusMap[cfg.executor.toLowerCase()];
                if (!item) continue;

                const { emoji } = computeStatusFormatting(item, emojis);
                const serifName = toBoldSerif(cfg.executor);

                // User requested format: ╠➣〢🟢〢𝐂𝐨𝐬𝐦𝐢𝐜-𝐒𝐭𝐚𝐭𝐮𝐬
                const formattedName = `╠➣〢${emoji}〢${serifName}-𝐒𝐭𝐚𝐭𝐮𝐬`;

                const prevStatus = data.previous_statuses[cfg.executor.toLowerCase()];
                const statusChanged = prevStatus && (prevStatus.status !== item.status || prevStatus.detected !== item.detected);

                const channel = guild.channels.cache.get(cfg.channelId);
                if (channel) {
                    // Update channel name if changed
                    if (force || cfg.lastLastName !== formattedName) {
                        try {
                            await channel.setName(formattedName);
                            cfg.lastLastName = formattedName;
                            cfg.lastUpdated  = Date.now();
                            console.log(`[StatusChannel] Renamed ${cfg.channelId} -> ${formattedName}`);
                        } catch (err) {
                            console.warn(`[StatusChannel] Rename error on ${cfg.channelId}:`, err.message);
                        }
                    }

                    // Send announcement embed if executor status/update state changed
                    if (statusChanged && channel.isTextBased()) {
                        const embedColor = item.status === 'online' ? 0x3ba55c : item.status === 'partial' ? 0xfaa61a : 0xed4245;
                        const embed = new EmbedBuilder()
                            .setTitle(`🚨 ${cfg.executor} Status Updated!`)
                            .setDescription(`**${cfg.executor}** has changed status to **${item.status.toUpperCase()}**.`)
                            .addFields(
                                { name: 'Status', value: `${emoji} ${item.note}`, inline: true },
                                { name: 'Version', value: item.version || 'Latest', inline: true }
                            )
                            .setColor(embedColor)
                            .setFooter({ text: `ecco's girl • Live Update` })
                            .setTimestamp();

                        try {
                            await channel.send({ embeds: [embed] });
                        } catch (e) {}
                    }
                }

                data.previous_statuses[cfg.executor.toLowerCase()] = { status: item.status, detected: item.detected };
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
