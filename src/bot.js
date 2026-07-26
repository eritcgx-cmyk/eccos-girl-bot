// src/bot.js — Discord bot core (discord.js v14)

const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

let client;

async function startBot() {
    client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildVoiceStates,
        ]
    });

    // Load commands
    client.commands = new Collection();
    const cmdDir = path.join(__dirname, 'commands');
    if (fs.existsSync(cmdDir)) {
        const files = fs.readdirSync(cmdDir).filter(f => f.endsWith('.js'));
        for (const file of files) {
            const cmd = require(path.join(cmdDir, file));
            if (cmd.data && cmd.execute) {
                client.commands.set(cmd.data.name, cmd);
                console.log(`[Bot] Loaded command: /${cmd.data.name}`);
            }
        }
    }

    // Load events
    const evtDir = path.join(__dirname, 'events');
    if (fs.existsSync(evtDir)) {
        const files = fs.readdirSync(evtDir).filter(f => f.endsWith('.js'));
        for (const file of files) {
            const event = require(path.join(evtDir, file));
            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args, client));
            } else {
                client.on(event.name, (...args) => event.execute(...args, client));
            }
        }
    }

    await client.login(process.env.DISCORD_TOKEN);
}

module.exports = { startBot, getClient: () => client };
