const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embedBuilder = require('../utils/embedBuilder');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Post an official announcement in a specified channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addChannelOption(opt =>
      opt.setName('channel')
        .setDescription('Channel to post announcement into')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('title')
        .setDescription('Announcement Title')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('content')
        .setDescription('Announcement Body / Message Content')
        .setRequired(true)
    )
    .addRoleOption(opt =>
      opt.setName('ping-role')
        .setDescription('Optional role to ping (e.g. @everyone or Announcement Role)')
        .setRequired(false)
    ),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({ content: '❌ You need Manage Messages permission to run announcements.', ephemeral: true });
    }

    const channel = interaction.options.getChannel('channel');
    const title = interaction.options.getString('title');
    const content = interaction.options.getString('content').replace(/\\n/g, '\n');
    const pingRole = interaction.options.getRole('ping-role');

    const embed = embedBuilder.createAnnouncementEmbed(title, content, interaction.user);

    const messagePayload = { embeds: [embed] };
    if (pingRole) {
      messagePayload.content = `${pingRole}`;
    }

    await channel.send(messagePayload);

    return interaction.reply({
      content: `✅ Announcement successfully posted in ${channel}!`,
      ephemeral: true
    });
  }
};
