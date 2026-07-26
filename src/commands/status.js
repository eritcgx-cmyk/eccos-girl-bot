// src/commands/status.js — check a single executor
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { fetchExploitStatuses, TRACKED } = require('../status');

const STATUS_EMOJI = { online: '🟢', offline: '🔴', partial: '🟡', unknown: '⚪' };
const STATUS_COLOR  = { online: 0x3ba55c, offline: 0xed4245, partial: 0xfaa61a, unknown: 0x808080 };

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Check the status of a specific executor')
        .addStringOption(opt =>
            opt.setName('executor')
               .setDescription('Which executor to check')
               .setRequired(true)
               .addChoices(
                   { name: 'Volt',      value: 'Volt'      },
                   { name: 'Synapse Z', value: 'Synapse Z' },
                   { name: 'Wave',      value: 'Wave'      },
                   { name: 'Delta',     value: 'Delta'     },
                   { name: 'Cosmic',    value: 'Cosmic'    },
                   { name: 'Potassium', value: 'Potassium' },
               )
        ),

    async execute(interaction) {
        await interaction.deferReply();
        const name = interaction.options.getString('executor');
        const all  = await fetchExploitStatuses();
        const item = all.find(s => s.name === name);

        if (!item) {
            return interaction.editReply(`❌ Could not find status for **${name}**`);
        }

        const embed = new EmbedBuilder()
            .setAuthor({ name: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
            .setTitle(`${STATUS_EMOJI[item.status]} ${item.name}`)
            .setDescription(item.note)
            .setColor(STATUS_COLOR[item.status] || 0x808080)
            .setFooter({ text: `ecco's girl • Live Status`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
};
