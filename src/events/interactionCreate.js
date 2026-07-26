// src/events/interactionCreate.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'interactionCreate',
    once: false,
    async execute(interaction, client) {
        if (!interaction.isChatInputCommand()) return;

        const command = client.commands.get(interaction.commandName);
        if (!command) {
            return interaction.reply({ content: 'Unknown command.', ephemeral: true });
        }

        try {
            await command.execute(interaction, client);
        } catch (err) {
            console.error(`[Command Error] /${interaction.commandName}:`, err);
            const errMsg = { content: '❌ Something went wrong. Try again later.', ephemeral: true };
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errMsg);
            } else {
                await interaction.reply(errMsg);
            }
        }
    }
};
