const queries = require('../database/queries');
const embedBuilder = require('../utils/embedBuilder');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    try {
      const settings = queries.getGuildSettings(member.guild.id);
      if (!settings || !settings.welcome_channel_id) return;

      const welcomeChannel = await member.guild.channels.fetch(settings.welcome_channel_id).catch(() => null);
      if (!welcomeChannel) return;

      const embed = embedBuilder.createWelcomeEmbed(member, settings.welcome_message);
      await welcomeChannel.send({ content: `<@${member.id}>`, embeds: [embed] });
    } catch (err) {
      console.error(`Error sending welcome message for member ${member.user.tag}:`, err.message);
    }
  }
};
