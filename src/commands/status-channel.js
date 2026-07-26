// src/commands/status-channel.js — Manage status channels & emoji formatting
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const { addStatusChannel, removeStatusChannel, getStatusChannels, setEmojiRules, getEmojiRules, syncStatusChannels } = require('../status-channels');
const { TRACKED } = require('../status');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status-channel')
        .setDescription('Configure auto-updating status channels and custom emojis')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addSubcommand(sub =>
            sub.setName('add')
               .setDescription('Link or create a status channel for an executor')
               .addStringOption(o =>
                   o.setName('executor')
                    .setDescription('Executor to track')
                    .setRequired(true)
                    .addChoices(...TRACKED.map(t => ({ name: t, value: t })))
               )
               .addChannelOption(o =>
                   o.setName('channel')
                    .setDescription('Channel to rename automatically (Voice or Text)')
                    .addChannelTypes(ChannelType.GuildVoice, ChannelType.GuildText)
                    .setRequired(false)
               )
        )
        .addSubcommand(sub =>
            sub.setName('remove')
               .setDescription('Remove a status channel')
               .addChannelOption(o => o.setName('channel').setDescription('Channel to remove').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('list')
               .setDescription('List all configured status channels')
        )
        .addSubcommand(sub =>
            sub.setName('sync')
               .setDescription('Force an immediate status channel update')
        )
        .addSubcommand(sub =>
            sub.setName('emojis')
               .setDescription('Customize status emojis (🟢, 🔵, 🌕, 🟣, 🔴)')
               .addStringOption(o => o.setName('undetected').setDescription('Emoji for Undetected (default: 🟢)'))
               .addStringOption(o => o.setName('bypassing').setDescription('Emoji for Bypassing (default: 🔵)'))
               .addStringOption(o => o.setName('detected').setDescription('Emoji for Detected (default: 🌕)'))
               .addStringOption(o => o.setName('updating').setDescription('Emoji for Updating (default: 🟣)'))
               .addStringOption(o => o.setName('down').setDescription('Emoji for Down/Patched (default: 🔴)'))
        ),

    async execute(interaction, client) {
        const sub = interaction.options.getSubcommand();
        const guildId = interaction.guildId;

        if (sub === 'add') {
            const executor = interaction.options.getString('executor');
            let channel  = interaction.options.getChannel('channel');

            if (!channel) {
                // Auto-create a voice channel if none provided
                channel = await interaction.guild.channels.create({
                    name: `🟢-${executor.toLowerCase()}-undetected`,
                    type: ChannelType.GuildVoice,
                    reason: `Status channel for ${executor}`
                });
            }

            addStatusChannel(guildId, executor, channel.id);
            await syncStatusChannels(client, true);

            const embed = new EmbedBuilder()
                .setTitle('✅ Status Channel Added')
                .setDescription(`Linked <#${channel.id}> to track **${executor}**. Channel name will auto-update when status changes!`)
                .setColor(0x3ba55c);

            return interaction.reply({ embeds: [embed] });
        }

        if (sub === 'remove') {
            const channel = interaction.options.getChannel('channel');
            removeStatusChannel(guildId, channel.id);
            return interaction.reply({ content: `✅ Removed <#${channel.id}> from status channel tracking.` });
        }

        if (sub === 'list') {
            const list = getStatusChannels(guildId);
            if (!list.length) {
                return interaction.reply({ content: 'No status channels configured yet. Use `/status-channel add` to add one!' });
            }

            const emojis = getEmojiRules(guildId);
            const desc = list.map(c => `• **${c.executor}** → <#${c.channelId}>`).join('\n');
            
            const embed = new EmbedBuilder()
                .setTitle('📊 Active Status Channels')
                .setDescription(desc)
                .addFields({
                    name: 'Current Emoji Rules',
                    value: `🟢 Undetected: ${emojis.undetected}\n🔵 Bypassing: ${emojis.bypassing}\n🌕 Detected: ${emojis.detected}\n🟣 Updating: ${emojis.updating}\n🔴 Down: ${emojis.down}`
                })
                .setColor(0xc467ff);

            return interaction.reply({ embeds: [embed] });
        }

        if (sub === 'sync') {
            await interaction.deferReply();
            await syncStatusChannels(client, true);
            return interaction.editReply('🔄 All status channels have been forcibly synchronized!');
        }

        if (sub === 'emojis') {
            const current = getEmojiRules(guildId);
            const updated = {
                undetected: interaction.options.getString('undetected') || current.undetected,
                bypassing:  interaction.options.getString('bypassing')  || current.bypassing,
                detected:   interaction.options.getString('detected')   || current.detected,
                updating:   interaction.options.getString('updating')   || current.updating,
                down:       interaction.options.getString('down')       || current.down,
            };

            setEmojiRules(guildId, updated);
            await syncStatusChannels(client, true);

            const embed = new EmbedBuilder()
                .setTitle('🎨 Status Emojis Updated')
                .setDescription(`Updated emoji rules for this server:\n🟢 Undetected: ${updated.undetected}\n🔵 Bypassing: ${updated.bypassing}\n🌕 Detected: ${updated.detected}\n🟣 Updating: ${updated.updating}\n🔴 Down: ${updated.down}`)
                .setColor(0x3ba55c);

            return interaction.reply({ embeds: [embed] });
        }
    }
};
