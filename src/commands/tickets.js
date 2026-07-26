const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField } = require('discord.js');
const queries = require('../database/queries');
const embedBuilder = require('../utils/embedBuilder');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-setup')
    .setDescription('Deploy interactive support ticket creation panel (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(opt =>
      opt.setName('channel')
        .setDescription('Channel to place ticket setup button')
        .setRequired(true)
    )
    .addChannelOption(opt =>
      opt.setName('category')
        .setDescription('Category under which open tickets will be created')
        .addChannelTypes(ChannelType.GuildCategory)
        .setRequired(true)
    )
    .addChannelOption(opt =>
      opt.setName('log-channel')
        .setDescription('Channel where closed ticket logs are recorded')
        .setRequired(false)
    ),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Administrator permission required to deploy ticket panels.', ephemeral: true });
    }

    const channel = interaction.options.getChannel('channel');
    const category = interaction.options.getChannel('category');
    const logChannel = interaction.options.getChannel('log-channel');

    queries.setTicketSettings(interaction.guildId, category.id, logChannel ? logChannel.id : null);

    const embed = embedBuilder.createBaseEmbed(
      '🎟️ Support & Inquiries Panel',
      'Need assistance, script support, or have questions?\nClick the **Create Ticket** button below to start a private conversation with our staff.'
    );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('btn_create_ticket')
        .setLabel('Create Ticket')
        .setEmoji('🎟️')
        .setStyle(ButtonStyle.Primary)
    );

    await channel.send({ embeds: [embed], components: [row] });

    return interaction.reply({
      content: `✅ Support ticket panel successfully created in ${channel} under category **${category.name}**!`,
      ephemeral: true
    });
  }
};
