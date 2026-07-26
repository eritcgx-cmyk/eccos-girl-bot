// src/commands/kick.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a member from the server')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addUserOption(o => o.setName('user').setDescription('User to kick').setRequired(true))
        .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(false)),

    async execute(interaction) {
        const target = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        if (!target?.kickable) return interaction.reply({ content: '❌ Cannot kick this user.', ephemeral: true });

        await target.kick(reason);

        const embed = new EmbedBuilder()
            .setTitle('👢 Member Kicked')
            .addFields(
                { name: 'User', value: target.user.tag, inline: true },
                { name: 'Reason', value: reason, inline: true },
                { name: 'By', value: interaction.user.tag, inline: true },
            )
            .setColor(0xfaa61a)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
