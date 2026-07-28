// index.js — entry point, starts bot + web server together
require('dotenv').config();

const { startBot } = require('./src/bot');
const { startServer } = require('./src/server');

// ── Keep-Alive: Prevent Render free-tier from sleeping ────────────────────────
// Pings /health every 10 minutes so the service never goes idle.
const SELF_URL = process.env.RENDER_EXTERNAL_URL
    ? `${process.env.RENDER_EXTERNAL_URL}/health`
    : 'https://eccos-girl-bot.onrender.com/health';

function startKeepAlive() {
    setInterval(async () => {
        try {
            const res = await fetch(SELF_URL);
            console.log(`[KeepAlive] Pinged ${SELF_URL} → ${res.status}`);
        } catch (err) {
            console.warn(`[KeepAlive] Self-ping failed (will retry):`, err.message);
        }
    }, 10 * 60 * 1000); // Every 10 minutes
    console.log(`[KeepAlive] Self-ping started → ${SELF_URL}`);
}

// ── Global Error Guards (prevent full process crash on unhandled errors) ──────
process.on('unhandledRejection', (reason, promise) => {
    console.error('[Process] Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('[Process] Uncaught Exception (recovered):', err.message);
});

// ── Graceful Shutdown ──────────────────────────────────────────────────────────
process.on('SIGTERM', () => {
    console.log('[Process] SIGTERM received — shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('[Process] SIGINT received — shutting down gracefully');
    process.exit(0);
});

async function main() {
    console.log('[eccos-girl] Starting...');

    // Start web server first (provides /health for keep-alive checks)
    await startServer();

    // Start Discord bot (only if token is set)
    if (process.env.DISCORD_TOKEN && process.env.DISCORD_TOKEN !== 'your_bot_token_here') {
        await startBot();
    } else {
        console.warn('[Bot] DISCORD_TOKEN not set — bot will not start. See .env.example');
    }

    // Start keep-alive pinger after everything is up
    startKeepAlive();

    console.log('[eccos-girl] ✅ Bot + web server fully started.');
}

main().catch(err => {
    console.error('[Fatal]', err);
    process.exit(1);
});
