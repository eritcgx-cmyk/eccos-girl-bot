// src/commands/statusall.js — Show all 6 tracked exploit statuses
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { fetchExploitStatuses } = require('../status');

const STATUS_EMOJI = {
    online:  '🟢',
    offline: '🔴',
    partial: '🟡',
    unknown: '⚪',
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('statusall')
        .setDescription('Show live status of all tracked executors'),

    async execute(interaction) {
        await interaction.deferReply();

        const statuses = await fetchExploitStatuses();

        const fields = statuses.map(s => ({
            name: `${STATUS_EMOJI[s.status] || '⚪'} ${s.name}`,
            value: s.note,
            inline: true,
        }));

        const allOnline  = statuses.every(s => s.status === 'online');
        const allOffline = statuses.every(s => s.status === 'offline');
        const color = allOnline ? 0x3ba55c : allOffline ? 0xed4245 : 0xfaa61a;

        const embed = new EmbedBuilder()
            .setAuthor({ name: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
            .setTitle('💻 Executor Status')
            .setDescription('Live status for tracked Roblox executors. Updates every 60 seconds.')
            .addFields(fields)
            .setColor(color)
            .setFooter({ text: `ecco's girl • ${statuses[0]?.fromApi ? 'Live from WEAO API' : 'Cached data'}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
};
