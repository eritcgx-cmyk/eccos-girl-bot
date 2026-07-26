// src/commands/utility-pack.js — 10 Utility & Server Commands
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = [
    {
        data: new SlashCommandBuilder().setName('ping').setDescription('Check bot latency and API ping'),
        async execute(interaction, client) {
            const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
            const latency = sent.createdTimestamp - interaction.createdTimestamp;
            const apiPing = Math.round(client.ws.ping);
            await interaction.editReply(`🏓 Pong! Latency: **${latency}ms** | API Ping: **${apiPing}ms**`);
        }
    },
    {
        data: new SlashCommandBuilder().setName('userinfo').setDescription('Get detailed information about a member').addUserOption(o => o.setName('target').setDescription('Target user')),
        async execute(interaction) {
            const user = interaction.options.getUser('target') || interaction.user;
            const member = await interaction.guild.members.fetch(user.id).catch(() => null);
            const roles = member ? member.roles.cache.filter(r => r.name !== '@everyone').map(r => `<@&${r.id}>`).join(' ') || 'None' : 'N/A';

            const embed = new EmbedBuilder()
                .setTitle(`👤 User Info — ${user.username}`)
                .setThumbnail(user.displayAvatarURL())
                .addFields(
                    { name: 'ID', value: user.id, inline: true },
                    { name: 'Created At', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:D>`, inline: true },
                    { name: 'Joined Guild', value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>` : 'N/A', inline: true },
                    { name: 'Roles', value: roles }
                )
                .setColor(0xc467ff);
            await interaction.reply({ embeds: [embed] });
        }
    },
    {
        data: new SlashCommandBuilder().setName('serverinfo').setDescription('Get detailed server information'),
        async execute(interaction) {
            const guild = interaction.guild;
            const embed = new EmbedBuilder()
                .setTitle(`🏰 ${guild.name}`)
                .setThumbnail(guild.iconURL())
                .addFields(
                    { name: 'Owner', value: `<@${guild.ownerId}>`, inline: true },
                    { name: 'Members', value: `${guild.memberCount}`, inline: true },
                    { name: 'Created At', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true },
                    { name: 'Boost Level', value: `Level ${guild.premiumTier} (${guild.premiumSubscriptionCount || 0} boosts)`, inline: true }
                )
                .setColor(0x3ba55c);
            await interaction.reply({ embeds: [embed] });
        }
    },
    {
        data: new SlashCommandBuilder().setName('avatar').setDescription('Display user avatar').addUserOption(o => o.setName('target').setDescription('Target user')),
        async execute(interaction) {
            const user = interaction.options.getUser('target') || interaction.user;
            const url = user.displayAvatarURL({ size: 1024, dynamic: true });
            const embed = new EmbedBuilder()
                .setTitle(`🖼️ Avatar for ${user.username}`)
                .setImage(url)
                .setColor(0xc467ff);
            await interaction.reply({ embeds: [embed] });
        }
    },
    {
        data: new SlashCommandBuilder().setName('lock').setDescription('Lock channel for @everyone').setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
        async execute(interaction) {
            await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
            await interaction.reply('🔒 Channel has been locked.');
        }
    },
    {
        data: new SlashCommandBuilder().setName('unlock').setDescription('Unlock channel for @everyone').setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
        async execute(interaction) {
            await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: true });
            await interaction.reply('🔓 Channel has been unlocked.');
        }
    },
    {
        data: new SlashCommandBuilder().setName('slowmode').setDescription('Set channel slowmode in seconds').setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels).addIntegerOption(o => o.setName('seconds').setDescription('Slowmode seconds (0 to disable)').setRequired(true)),
        async execute(interaction) {
            const sec = interaction.options.getInteger('seconds');
            await interaction.channel.setRateLimitPerUser(sec);
            await interaction.reply(`⏱️ Channel slowmode set to **${sec}s**.`);
        }
    },
    {
        data: new SlashCommandBuilder().setName('botstats').setDescription('Display live bot performance stats'),
        async execute(interaction, client) {
            const mem = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
            const uptime = Math.floor(client.uptime / 1000);
            const embed = new EmbedBuilder()
                .setTitle("📊 ecco's girl System Stats")
                .addFields(
                    { name: 'Memory Usage', value: `${mem} MB`, inline: true },
                    { name: 'Uptime', value: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`, inline: true },
                    { name: 'Servers', value: `${client.guilds.cache.size}`, inline: true },
                    { name: 'Node Version', value: process.version, inline: true }
                )
                .setColor(0xfaa61a);
            await interaction.reply({ embeds: [embed] });
        }
    },
    {
        data: new SlashCommandBuilder().setName('say').setDescription('Send message as bot').setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages).addStringOption(o => o.setName('text').setDescription('Text to send').setRequired(true)),
        async execute(interaction) {
            const text = interaction.options.getString('text');
            await interaction.channel.send(text);
            await interaction.reply({ content: 'Sent!', ephemeral: true });
        }
    },
    {
        data: new SlashCommandBuilder().setName('servericon').setDescription('Display guild icon'),
        async execute(interaction) {
            const icon = interaction.guild.iconURL({ size: 1024, dynamic: true });
            if (!icon) return interaction.reply({ content: 'This server has no icon set.', ephemeral: true });
            const embed = new EmbedBuilder().setTitle(`🏰 Icon for ${interaction.guild.name}`).setImage(icon).setColor(0xc467ff);
            await interaction.reply({ embeds: [embed] });
        }
    }
];
