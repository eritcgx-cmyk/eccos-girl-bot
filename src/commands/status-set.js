// src/commands/status-set.js — Manually update or override an executor status
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { setExploitOverride, clearExploitOverride, TRACKED } = require('../status');
const { syncStatusChannels } = require('../status-channels');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status-set')
        .setDescription('Manually update or override an executor status and sync channels')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addStringOption(o =>
            o.setName('executor')
             .setDescription('Executor to update')
             .setRequired(true)
             .addChoices(...TRACKED.map(t => ({ name: t, value: t })))
        )
        .addStringOption(o =>
            o.setName('status')
             .setDescription('Select status')
             .setRequired(true)
             .addChoices(
                 { name: '🟢 Undetected / Working', value: 'online' },
                 { name: '🔵 Bypassing Ban Waves',   value: 'bypassing' },
                 { name: '🌕 Detected',              value: 'detected' },
                 { name: '🟣 Updating / Degraded',   value: 'partial' },
                 { name: '🔴 Down / Patched',        value: 'offline' },
                 { name: '🔄 Reset to Automatic API',value: 'reset' }
             )
        )
        .addStringOption(o => o.setName('note').setDescription('Custom status note (optional)')),

    async execute(interaction, client) {
        await interaction.deferReply();

        const executor = interaction.options.getString('executor');
        const statusType = interaction.options.getString('status');
        const customNote = interaction.options.getString('note');

        if (statusType === 'reset') {
            clearExploitOverride(executor);
            await syncStatusChannels(client, true);

            const embed = new EmbedBuilder()
                .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                .setTitle(`🔄 Reset Status for ${executor}`)
                .setDescription(`Cleared manual override for **${executor}**. Restored live API tracking.`)
                .setColor(0x3ba55c);

            return interaction.editReply({ embeds: [embed] });
        }

        let status = 'online';
        let detected = false;
        let bypassing = false;
        let emoji = '🟢';
        let color = 0x3ba55c;

        if (statusType === 'online') {
            status = 'online';
            detected = false;
            emoji = '🟢';
            color = 0x3ba55c;
        } else if (statusType === 'bypassing') {
            status = 'online';
            detected = true;
            bypassing = true;
            emoji = '🔵';
            color = 0x3b82f6;
        } else if (statusType === 'detected') {
            status = 'online';
            detected = true;
            emoji = '🌕';
            color = 0xeab308;
        } else if (statusType === 'partial') {
            status = 'partial';
            emoji = '🟣';
            color = 0xa855f7;
        } else if (statusType === 'offline') {
            status = 'offline';
            emoji = '🔴';
            color = 0xed4245;
        }

        const note = customNote || (statusType === 'offline' ? 'Patched / Down' : statusType === 'detected' ? 'Detected' : 'Updated & Working');

        setExploitOverride(executor, {
            status,
            detected,
            bypassing,
            note
        });

        // Trigger immediate channel sync
        await syncStatusChannels(client, true);

        const embed = new EmbedBuilder()
            .setAuthor({ name: `Updated by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
            .setTitle(`⚡ ${executor} Status Updated!`)
            .setDescription(`Manually set **${executor}** status to ${emoji} **${statusType.toUpperCase()}**.`)
            .addFields(
                { name: 'Status', value: `${emoji} ${note}`, inline: true },
                { name: 'Channel Name', value: `\`╠➣〢${emoji}〢${executor}-𝐒𝐭𝐚𝐭𝐮𝐬\``, inline: true }
            )
            .setColor(color)
            .setFooter({ text: `ecco's girl • Status Manager`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
};
