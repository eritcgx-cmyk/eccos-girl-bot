const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const queries = require('../database/queries');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('welcome-setup')
    .setDescription('Configure welcome channel and custom greeting message (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(opt =>
      opt.setName('channel')
        .setDescription('Channel where welcome embeds will be sent')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('custom-message')
        .setDescription('Custom greeting text (Use {user} and {guild} as placeholders)')
        .setRequired(false)
    ),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Administrator permission required.', ephemeral: true });
    }

    const channel = interaction.options.getChannel('channel');
    const customMessage = interaction.options.getString('custom-message') || null;

    queries.setWelcomeSettings(interaction.guildId, channel.id, customMessage);

    return interaction.reply({
      content: `✅ Welcome channel configured to ${channel}! ${customMessage ? `\nGreeting message set to: "${customMessage}"` : ''}`,
      ephemeral: true
    });
  }
};
