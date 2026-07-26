// src/commands/help.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show all available commands'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle("ecco's girl — Command List 💕")
            .setDescription("Here's everything I can do. Use `/` to browse commands in Discord.")
            .addFields(
                {
                    name: '💻 Roblox',
                    value: '`/status` • `/statusall`',
                },
                {
                    name: '🔧 Moderation',
                    value: '`/ban` • `/kick` • `/purge`',
                },
                {
                    name: '🎲 Fun',
                    value: '`/8ball` • `/coinflip` • `/rps`',
                },
                {
                    name: '🔗 Links',
                    value: '[Invite me](https://discord.com/oauth2/authorize) • [Website](https://yoursite.railway.app)',
                }
            )
            .setColor(0xc467ff)
            .setFooter({ text: "ecco's girl v2.0" })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
