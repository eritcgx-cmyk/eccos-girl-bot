// src/events/ready.js
const { ActivityType } = require('discord.js');

module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log(`[Bot] Logged in as ${client.user.tag}`);
        client.user.setPresence({
            activities: [{ name: 'ecco\'s girl 💕 | /help', type: ActivityType.Playing }],
            status: 'online',
        });
    }
};
