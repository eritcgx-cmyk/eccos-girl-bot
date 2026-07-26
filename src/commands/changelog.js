const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embedBuilder = require('../utils/embedBuilder');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('changelog')
    .setDescription('Publish an official software / script update log')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addChannelOption(opt =>
      opt.setName('channel')
        .setDescription('Channel to post update log into')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('version')
        .setDescription('Version number (e.g., 1.2.0)')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('changes')
        .setDescription('List of changes / additions / fixes (Use \\n for line breaks)')
        .setRequired(true)
    ),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({ content: '❌ You lack permissions to publish update logs.', ephemeral: true });
    }

    const channel = interaction.options.getChannel('channel');
    const version = interaction.options.getString('version');
    const changes = interaction.options.getString('changes').replace(/\\n/g, '\n');

    const embed = embedBuilder.createChangelogEmbed(version, changes, interaction.user);
    await channel.send({ embeds: [embed] });

    return interaction.reply({
      content: `🚀 Update log v${version} posted into ${channel}!`,
      ephemeral: true
    });
  }
};
