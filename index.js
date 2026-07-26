// index.js — entry point, starts bot + web server together
require('dotenv').config();

const { startBot } = require('./src/bot');
const { startServer } = require('./src/server');

async function main() {
    console.log('[eccos-girl] Starting...');

    // Start web server
    await startServer();

    // Start Discord bot (only if token is set)
    if (process.env.DISCORD_TOKEN && process.env.DISCORD_TOKEN !== 'your_bot_token_here') {
        await startBot();
    } else {
        console.warn('[Bot] DISCORD_TOKEN not set — bot will not start. See .env.example');
    }
}

main().catch(err => {
    console.error('[Fatal]', err);
    process.exit(1);
});
