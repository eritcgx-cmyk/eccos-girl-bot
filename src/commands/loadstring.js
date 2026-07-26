const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const queries = require('../database/queries');
const embedBuilder = require('../utils/embedBuilder');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('loadstring')
    .setDescription('Script loadstring management & retrieval')
    .addSubcommand(sub =>
      sub.setName('send')
        .setDescription('Send a formatted script loadstring')
        .addStringOption(opt =>
          opt.setName('name')
            .setDescription('Name of saved loadstring')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('Save a new loadstring script (Staff only)')
        .addStringOption(opt =>
          opt.setName('name')
            .setDescription('Script Identifier Name')
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('code')
            .setDescription('Loadstring URL or Lua script code')
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('description')
            .setDescription('Short description of the script')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('List all saved script loadstrings')
    )
    .addSubcommand(sub =>
      sub.setName('delete')
        .setDescription('Delete a saved loadstring (Staff only)')
        .addStringOption(opt =>
          opt.setName('name')
            .setDescription('Name of loadstring to delete')
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'send') {
      const name = interaction.options.getString('name');
      const item = queries.getLoadstring(name);

      if (!item) {
        return interaction.reply({
          content: `❌ Loadstring matching \`${name}\` was not found. Use \`/loadstring list\` to see available scripts.`,
          ephemeral: true
        });
      }

      const embed = embedBuilder.createLoadstringEmbed(
        item.name,
        item.code,
        item.description,
        interaction.user.username
      );

      return interaction.reply({ embeds: [embed] });
    }

    if (subcommand === 'add') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return interaction.reply({ content: '❌ You need Manage Messages permissions to add loadstrings.', ephemeral: true });
      }

      const name = interaction.options.getString('name');
      const code = interaction.options.getString('code');
      const description = interaction.options.getString('description') || '';

      queries.addLoadstring(name, code, description, interaction.user.id);

      return interaction.reply({
        content: `✅ Loadstring \`${name}\` successfully saved to database!`,
        ephemeral: true
      });
    }

    if (subcommand === 'list') {
      const list = queries.getAllLoadstrings();

      if (!list || list.length === 0) {
        return interaction.reply({
          content: '📜 No saved loadstrings found in database.',
          ephemeral: true
        });
      }

      const embed = embedBuilder.createBaseEmbed('📜 Saved Loadstrings Library', 'Here are the available script loadstrings:')
        .addFields(
          list.map(item => ({
            name: `🔹 ${item.name}`,
            value: item.description ? `*${item.description}*\n\`${item.code.substring(0, 60)}...\`` : `\`${item.code.substring(0, 60)}...\``,
            inline: true
          }))
        );

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (subcommand === 'delete') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return interaction.reply({ content: '❌ You lack permissions to delete loadstrings.', ephemeral: true });
      }

      const name = interaction.options.getString('name');
      const result = queries.deleteLoadstring(name);

      if (result.changes === 0) {
        return interaction.reply({ content: `❌ Loadstring \`${name}\` was not found.`, ephemeral: true });
      }

      return interaction.reply({ content: `🗑️ Loadstring \`${name}\` has been deleted.`, ephemeral: true });
    }
  }
};
