// src/commands/ban.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a member from the server')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addUserOption(o => o.setName('user').setDescription('User to ban').setRequired(true))
        .addStringOption(o => o.setName('reason').setDescription('Ban reason').setRequired(false))
        .addIntegerOption(o => o.setName('days').setDescription('Delete messages from last X days (0-7)').setMinValue(0).setMaxValue(7)),

    async execute(interaction) {
        const target = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const days   = interaction.options.getInteger('days') ?? 0;

        if (!target) return interaction.reply({ content: '❌ Member not found.', ephemeral: true });
        if (!target.bannable) return interaction.reply({ content: '❌ I cannot ban this user.', ephemeral: true });

        await target.ban({ deleteMessageSeconds: days * 86400, reason });

        const embed = new EmbedBuilder()
            .setTitle('🔨 Member Banned')
            .addFields(
                { name: 'User', value: `${target.user.tag}`, inline: true },
                { name: 'Reason', value: reason, inline: true },
                { name: 'By', value: interaction.user.tag, inline: true },
            )
            .setColor(0xed4245)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
