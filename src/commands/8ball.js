// src/commands/8ball.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const RESPONSES = [
    'It is certain.', 'It is decidedly so.', 'Without a doubt.', 'Yes, definitely.',
    'You may rely on it.', 'As I see it, yes.', 'Most likely.', 'Outlook good.',
    'Yes.', 'Signs point to yes.', 'Reply hazy, try again.', 'Ask again later.',
    'Better not tell you now.', 'Cannot predict now.', 'Concentrate and ask again.',
    "Don't count on it.", 'My reply is no.', 'My sources say no.', 'Outlook not so good.', 'Very doubtful.',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('8ball')
        .setDescription('Ask the magic 8ball a yes/no question')
        .addStringOption(o => o.setName('question').setDescription('Your question').setRequired(true)),

    async execute(interaction) {
        const question = interaction.options.getString('question');
        const answer   = RESPONSES[Math.floor(Math.random() * RESPONSES.length)];
        const color    = RESPONSES.indexOf(answer) < 10 ? 0x3ba55c : RESPONSES.indexOf(answer) < 15 ? 0xfaa61a : 0xed4245;

        const embed = new EmbedBuilder()
            .setTitle('🎱 Magic 8-Ball')
            .addFields(
                { name: '❓ Question', value: question },
                { name: '🎱 Answer', value: `**${answer}**` },
            )
            .setColor(color)
            .setFooter({ text: `Asked by ${interaction.user.username}` });

        await interaction.reply({ embeds: [embed] });
    }
};
