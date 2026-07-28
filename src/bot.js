// src/bot.js — Discord bot core (discord.js v14) with Server Restriction

const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { syncStatusChannels } = require('./status-channels');

const ALLOWED_GUILD_ID = '1468916727940382786';

let client;

async function startBot() {
    client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.MessageContent,
        ]
    });

    // Load commands
    client.commands = new Collection();
    const cmdDir = path.join(__dirname, 'commands');
    if (fs.existsSync(cmdDir)) {
        const files = fs.readdirSync(cmdDir).filter(f => f.endsWith('.js'));
        for (const file of files) {
            const exported = require(path.join(cmdDir, file));
            const list = Array.isArray(exported) ? exported : [exported];
            for (const cmd of list) {
                if (cmd && cmd.data && cmd.execute) {
                    client.commands.set(cmd.data.name, cmd);
                    console.log(`[Bot] Loaded command: /${cmd.data.name}`);
                }
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

    // Enforce single-server restriction when joining guilds
    client.on('guildCreate', async (guild) => {
        if (guild.id !== ALLOWED_GUILD_ID) {
            console.log(`[Security] Leaving unauthorized guild: ${guild.name} (${guild.id})`);
            await guild.leave();
        }
    });

    // ── Gateway error / disconnect recovery ──────────────────────────────────
    client.on('error', (err) => {
        console.error('[Bot] Gateway error (recovering):', err.message);
    });

    client.on('shardError', (err) => {
        console.error('[Bot] Shard error (will auto-reconnect):', err.message);
    });

    client.on('shardDisconnect', (event, id) => {
        console.warn(`[Bot] Shard ${id} disconnected (code ${event.code}) — reconnecting...`);
    });

    client.on('shardReconnecting', (id) => {
        console.log(`[Bot] Shard ${id} reconnecting...`);
    });

    client.on('shardResume', (id, replayed) => {
        console.log(`[Bot] Shard ${id} resumed (${replayed} events replayed).`);
    });

    try {
        await client.login(process.env.DISCORD_TOKEN);
        console.log(`[Bot] ✅ Connected to Discord gateway as ${client.user?.tag || 'ecco\'s girl'}`);
    } catch (err) {
        if (err.code === 'DisallowedIntents' || err.message.includes('intent')) {
            console.warn('[Bot] Privileged intents not enabled in Discord Dev Portal — falling back to standard intents...');
            client = new Client({
                intents: [
                    GatewayIntentBits.Guilds,
                    GatewayIntentBits.GuildMessages,
                ]
            });
            try {
                await client.login(process.env.DISCORD_TOKEN);
                console.log(`[Bot] ✅ Connected to Discord gateway (standard intents) as ${client.user?.tag || 'ecco\'s girl'}`);
            } catch (fallbackErr) {
                console.error('[Bot] Login failed (fallback):', fallbackErr.message);
            }
        } else {
            console.error('[Bot] Could not log into Discord gateway:', err.message);
        }
    }

    // Initial status channel sync & periodic 60s ticker
    setTimeout(() => syncStatusChannels(client), 5000);
    setInterval(() => syncStatusChannels(client), 60_000);
}

module.exports = { startBot, getClient: () => client, ALLOWED_GUILD_ID };
