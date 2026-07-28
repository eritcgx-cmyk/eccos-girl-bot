// src/events/ready.js
const { ActivityType, EmbedBuilder } = require('discord.js');

const SUPER_ADMIN_ID = '1105560420393156619';
const PRIMARY_GUILD_ID = '1468916727940382786';

let pingedOnStart = false;

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`[Bot] Logged in as ${client.user.tag}`);
        client.user.setPresence({
            activities: [{ name: 'ecco\'s girl 💕 | /status', type: ActivityType.Watching }],
            status: 'online',
        });

        // Ping owner on startup in the primary guild
        if (!pingedOnStart) {
            pingedOnStart = true;
            try {
                const guild = client.guilds.cache.get(PRIMARY_GUILD_ID) || await client.guilds.fetch(PRIMARY_GUILD_ID).catch(() => null);
                if (guild) {
                    const channel = guild.channels.cache.find(c => c.isTextBased() && c.permissionsFor(guild.members.me).has('SendMessages'));
                    if (channel) {
                        const embed = new EmbedBuilder()
                            .setTitle('💖 ecco\'s girl — 24/7 Cloud Host Online!')
                            .setDescription(`Hello <@${SUPER_ADMIN_ID}>! Your bot engine and website are fully updated, enhanced, and running **24/7 on the cloud**!`)
                            .addFields(
                                { name: '🌐 Web Dashboard', value: '[eccos-girl-bot.onrender.com](https://eccos-girl-bot.onrender.com/dashboard)', inline: true },
                                { name: '⚡ Bot Status', value: '🟢 Online & Ready', inline: true },
                                { name: '🛡️ Server Lock', value: `Guild \`${PRIMARY_GUILD_ID}\``, inline: true }
                            )
                            .setColor(0xc467ff)
                            .setThumbnail(client.user.displayAvatarURL())
                            .setFooter({ text: `ecco's girl v2.0 • 24/7 Cloud Host`, iconURL: client.user.displayAvatarURL() })
                            .setTimestamp();

                        await channel.send({ content: `<@${SUPER_ADMIN_ID}>`, embeds: [embed] });
                        console.log(`[Bot] ✅ Successfully pinged owner <@${SUPER_ADMIN_ID}> in channel ${channel.name}`);
                    }
                }
            } catch (err) {
                console.error('[Bot] Could not send startup ping to owner:', err.message);
            }
        }
    }
};
