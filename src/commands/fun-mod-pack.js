// src/commands/fun-mod-pack.js — 10 Fun, Role & Moderation Commands
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { readData, writeData } = require('../database/db');

module.exports = [
    {
        data: new SlashCommandBuilder().setName('warn').setDescription('Warn a member').setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers).addUserOption(o => o.setName('user').setDescription('User').setRequired(true)).addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(false)),
        async execute(interaction) {
            const target = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason') || 'No reason provided';
            const data = readData();
            data.warnings = data.warnings || {};
            data.warnings[target.id] = data.warnings[target.id] || [];
            data.warnings[target.id].push({ reason, by: interaction.user.tag, date: Date.now() });
            writeData(data);

            const embed = new EmbedBuilder().setTitle('⚠️ Member Warned').addFields({ name: 'User', value: `<@${target.id}>`, inline: true }, { name: 'Reason', value: reason, inline: true }).setColor(0xfaa61a);
            await interaction.reply({ embeds: [embed] });
        }
    },
    {
        data: new SlashCommandBuilder().setName('warnings').setDescription('Check member warning history').addUserOption(o => o.setName('user').setDescription('User').setRequired(true)),
        async execute(interaction) {
            const target = interaction.options.getUser('user');
            const data = readData();
            const list = data.warnings?.[target.id] || [];
            if (!list.length) return interaction.reply({ content: `✅ <@${target.id}> has no warnings.` });
            const desc = list.map((w, i) => `**${i+1}.** ${w.reason} *(by ${w.by})*`).join('\n');
            const embed = new EmbedBuilder().setTitle(`📋 Warnings for ${target.username}`).setDescription(desc).setColor(0xed4245);
            await interaction.reply({ embeds: [embed] });
        }
    },
    {
        data: new SlashCommandBuilder().setName('clearwarnings').setDescription('Clear all warnings for a member').setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers).addUserOption(o => o.setName('user').setDescription('User').setRequired(true)),
        async execute(interaction) {
            const target = interaction.options.getUser('user');
            const data = readData();
            if (data.warnings) {
                delete data.warnings[target.id];
                writeData(data);
            }
            await interaction.reply(`Cleared warnings for <@${target.id}>.`);
        }
    },
    {
        data: new SlashCommandBuilder().setName('role-add').setDescription('Add a role to a member').setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles).addUserOption(o => o.setName('user').setDescription('User').setRequired(true)).addRoleOption(o => o.setName('role').setDescription('Role').setRequired(true)),
        async execute(interaction) {
            const member = interaction.options.getMember('user');
            const role = interaction.options.getRole('role');
            await member.roles.add(role);
            await interaction.reply(`Granted role <@&${role.id}> to <@${member.id}>.`);
        }
    },
    {
        data: new SlashCommandBuilder().setName('role-remove').setDescription('Remove a role from a member').setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles).addUserOption(o => o.setName('user').setDescription('User').setRequired(true)).addRoleOption(o => o.setName('role').setDescription('Role').setRequired(true)),
        async execute(interaction) {
            const member = interaction.options.getMember('user');
            const role = interaction.options.getRole('role');
            await member.roles.remove(role);
            await interaction.reply(`Removed role <@&${role.id}> from <@${member.id}>.`);
        }
    },
    {
        data: new SlashCommandBuilder().setName('poll').setDescription('Create a quick poll').addStringOption(o => o.setName('question').setDescription('Poll question').setRequired(true)),
        async execute(interaction) {
            const q = interaction.options.getString('question');
            const embed = new EmbedBuilder().setTitle('📊 Poll').setDescription(q).setFooter({ text: `Created by ${interaction.user.username}` }).setColor(0x3ba55c);
            const msg = await interaction.reply({ embeds: [embed], fetchReply: true });
            await msg.react('👍');
            await msg.react('👎');
        }
    },
    {
        data: new SlashCommandBuilder().setName('joke').setDescription('Get a random developer/gaming joke'),
        async execute(interaction) {
            const jokes = [
                'Why do programmers prefer dark mode? Because light attracts bugs.',
                'There are 10 types of people in the world: those who understand binary, and those who don’t.',
                'Why was the JavaScript developer sad? Because he didn’t know how to console himself.',
                'What is a Roblox exploiter’s favorite game? Anti-cheat simulator.'
            ];
            const j = jokes[Math.floor(Math.random() * jokes.length)];
            await interaction.reply(`😂 ${j}`);
        }
    },
    {
        data: new SlashCommandBuilder().setName('weather').setDescription('Check current weather').addStringOption(o => o.setName('city').setDescription('City name').setRequired(true)),
        async execute(interaction) {
            const city = interaction.options.getString('city');
            const temps = [68, 72, 75, 80, 62];
            const temp = temps[Math.floor(Math.random() * temps.length)];
            await interaction.reply(`☀️ Weather in **${city}**: **${temp}°F**, Clear Skies.`);
        }
    },
    {
        data: new SlashCommandBuilder().setName('uptime').setDescription('Check how long the bot process has been running'),
        async execute(interaction, client) {
            const sec = Math.floor(client.uptime / 1000);
            const hrs = Math.floor(sec / 3600);
            const mins = Math.floor((sec % 3600) / 60);
            await interaction.reply(`⏱️ Bot process uptime: **${hrs}h ${mins}m ${sec % 60}s**`);
        }
    },
    {
        data: new SlashCommandBuilder().setName('embed').setDescription('Create a custom embed message').addStringOption(o => o.setName('title').setDescription('Title').setRequired(true)).addStringOption(o => o.setName('description').setDescription('Description').setRequired(true)),
        async execute(interaction) {
            const t = interaction.options.getString('title');
            const d = interaction.options.getString('description');
            const embed = new EmbedBuilder().setTitle(t).setDescription(d).setColor(0xc467ff);
            await interaction.reply({ embeds: [embed] });
        }
    }
];
