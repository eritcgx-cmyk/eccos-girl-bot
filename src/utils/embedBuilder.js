const { EmbedBuilder } = require('discord.js');
const config = require('../config');

const BOT_NAME = "ecco's girl";
const FOOTER_TEXT = `${BOT_NAME} • Status & Utility Assistant`;
const ICON_URL = 'https://i.imgur.com/8Q9Z8qE.png'; // Hot aesthetic avatar placeholder

module.exports = {
  createBaseEmbed(title, description, color = config.colors.primary) {
    return new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(color)
      .setFooter({ text: FOOTER_TEXT, iconURL: ICON_URL })
      .setTimestamp();
  },

  createAnnouncementEmbed(title, content, author, rolePing = null) {
    const embed = new EmbedBuilder()
      .setTitle(`📢 ${title}`)
      .setDescription(content)
      .setColor(config.colors.primary)
      .setAuthor({ name: `Announcement by ${author.username}`, iconURL: author.displayAvatarURL() })
      .setFooter({ text: `${BOT_NAME} Announcements`, iconURL: ICON_URL })
      .setTimestamp();

    return embed;
  },

  createChangelogEmbed(version, changes, author) {
    const embed = new EmbedBuilder()
      .setTitle(`🚀 Update Log - v${version}`)
      .setDescription(changes)
      .setColor(config.colors.secondary)
      .setAuthor({ name: `Logged by ${author.username}`, iconURL: author.displayAvatarURL() })
      .setFooter({ text: `${BOT_NAME} Version Control`, iconURL: ICON_URL })
      .setTimestamp();

    return embed;
  },

  createStatusEmbed(statusData) {
    const embed = new EmbedBuilder()
      .setTitle(`⚡ Software & Executor Status`)
      .setDescription(`Real-time updates powered by [whatexpsare.online](https://whatexpsare.online/)\nAuto-refreshed every 5 minutes.`)
      .setColor(config.colors.primary)
      .setFooter({ text: `Last checked`, iconURL: ICON_URL })
      .setTimestamp(statusData.timestamp);

    if (!statusData.categorized) {
      embed.addFields({ name: 'Status', value: '⚠️ Unable to fetch live software statuses at this moment.' });
      return embed;
    }

    const { windows, android, mac, ios, other } = statusData.categorized;

    const formatList = (list) => {
      if (!list || list.length === 0) return '_No entries available._';
      return list.map(item => `> **${item.name}**: ${item.status} | \`${item.version}\` | UNC: \`${item.unc}\``).join('\n');
    };

    if (windows && windows.length > 0) embed.addFields({ name: '💻 Windows Executors', value: formatList(windows), inline: false });
    if (android && android.length > 0) embed.addFields({ name: '📱 Android Executors', value: formatList(android), inline: false });
    if (mac && mac.length > 0) embed.addFields({ name: '🍎 MacOS Executors', value: formatList(mac), inline: false });
    if (ios && ios.length > 0) embed.addFields({ name: '📱 iOS Executors', value: formatList(ios), inline: false });
    if (other && other.length > 0) embed.addFields({ name: '🌐 Other Software', value: formatList(other), inline: false });

    if (embed.data.fields?.length === 0) {
      embed.addFields({ name: 'Status', value: '🟢 All primary executors operational.' });
    }

    return embed;
  },

  createLoadstringEmbed(name, code, description, authorTag) {
    const embed = new EmbedBuilder()
      .setTitle(`📜 Loadstring: ${name}`)
      .setDescription(description ? `*${description}*\n` : '')
      .setColor(config.colors.primary)
      .addFields({
        name: '💻 Copyable Loadstring Code',
        value: `\`\`\`lua\n${code}\n\`\`\``
      })
      .setFooter({ text: `Added by ${authorTag} • ${BOT_NAME}`, iconURL: ICON_URL })
      .setTimestamp();

    return embed;
  },

  createWelcomeEmbed(member, customMessage) {
    const messageText = customMessage 
      ? customMessage.replace('{user}', `<@${member.id}>`).replace('{guild}', member.guild.name)
      : `Welcome to **${member.guild.name}**, <@${member.id}>! We're glad to have you here 💕`;

    return new EmbedBuilder()
      .setTitle(`🌸 Welcome to ${member.guild.name}!`)
      .setDescription(messageText)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setColor(config.colors.primary)
      .addFields({
        name: '👥 Member Count',
        value: `You are member **#${member.guild.memberCount}**!`,
        inline: true
      })
      .setFooter({ text: FOOTER_TEXT, iconURL: ICON_URL })
      .setTimestamp();
  },

  createTicketEmbed(user) {
    return new EmbedBuilder()
      .setTitle(`🎟️ Support Ticket Created`)
      .setDescription(`Hello <@${user.id}>! Thank you for opening a support ticket.\nOur support team has been notified and will assist you shortly. Please describe your inquiry in detail below.`)
      .setColor(config.colors.primary)
      .setFooter({ text: `Click "Close Ticket" when your issue is resolved.`, iconURL: ICON_URL })
      .setTimestamp();
  }
};
